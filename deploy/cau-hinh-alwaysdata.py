"""Nhập bí mật trực tiếp trong SSH; không nhận mật khẩu qua tham số hoặc log."""

import getpass
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import sys


def chay_node(root, args, config, **kwargs):
    return subprocess.run(
        ["node", *args], cwd=root, env={**os.environ, **config}, check=True, **kwargs
    )


def main():
    if os.name != "posix" or not sys.stdin.isatty():
        raise RuntimeError("Can chay trong terminal SSH Linux tuong tac.")
    account = sys.argv[1] if len(sys.argv) == 2 else ""
    if not re.fullmatch(r"[a-z][a-z0-9-]{1,40}", account):
        raise RuntimeError("Can ten tai khoan alwaysdata lam tham so.")

    root = Path(__file__).resolve().parent.parent
    os.umask(0o077)
    private_dir = root / "backend" / ".local"
    private_dir.mkdir(mode=0o700, exist_ok=True)
    config_path = private_dir / "alwaysdata.json"
    if config_path.exists():
        raise RuntimeError("Da co cau hinh rieng. Dung de khong ghi de bi mat/CSDL.")

    config = {
        "NODE_ENV": "production",
        "DB_HOST": f"mysql-{account}.alwaysdata.net",
        "DB_PORT": "3306",
        "DB_NAME": f"{account}_auction",
        "DB_USER": account,
        "DB_PASSWORD": getpass.getpass("Mat khau MySQL cua hosting: "),
        "DB_TIMEZONE": "+07:00",
        "FRONTEND_URL": f"https://{account}.alwaysdata.net",
        "JWT_SECRET": secrets.token_hex(48),
        "WEB_DIST": str(root / "frontend" / "dist"),
        "UPLOAD_ROOT": str(root / "backend" / "uploads"),
        "JOBS_ENABLED": "false",
        "AI_ENABLED": "false",
        "TRUST_PROXY_HOPS": "0",
    }
    # mysql2 dùng trực tiếp biến môi trường; không đưa mật khẩu lên dòng lệnh.
    preflight = """
const mysql = require('./backend/node_modules/mysql2/promise');
mysql.createConnection({host: process.env.DB_HOST, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, database: process.env.DB_NAME})
  .then(async c => {
    try {
      const [rows] = await c.query('SHOW FULL TABLES');
      if (rows.length) throw new Error('DATABASE_NOT_EMPTY');
    } finally { await c.end(); }
  }).catch(e => { console.error(e.code || 'DATABASE_NOT_EMPTY'); process.exitCode = 1; });
"""
    chay_node(root, ["-e", preflight], config)
    with config_path.open("x", encoding="utf-8") as file:
        json.dump(config, file)
    (root / "backend" / "uploads").mkdir(mode=0o700, exist_ok=True)
    chay_node(root, ["deploy/chay-alwaysdata.cjs", "--init"], config)
    chay_node(root, ["deploy/chay-alwaysdata.cjs", "--check-schema"], config)

    while True:
        password = getpass.getpass("Dat mat khau quan tri VietBid (8-72 byte): ")
        repeat = getpass.getpass("Nhap lai mat khau quan tri: ")
        if password == repeat and len(password) >= 8 and len(password.encode()) <= 72:
            break
        print("Mat khau chua khop hoac chua dung do dai. Hay nhap lai.")
    chay_node(
        root, ["deploy/chay-alwaysdata.cjs", "--admin"], config,
        input=json.dumps(password), text=True,
    )
    config["JOBS_ENABLED"] = "true"
    temporary = private_dir / "alwaysdata.pending.json"
    with temporary.open("x", encoding="utf-8") as file:
        json.dump(config, file)
    temporary.replace(config_path)
    print("ALWAYSDATA_CONFIG_READY. Quan tri: admin@vietbid.example")


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError:
        print("Buoc cai dat that bai. Khong xoa CSDL hay chay lai schema.", file=sys.stderr)
        sys.exit(1)
    except Exception as error:
        print(str(error) if isinstance(error, RuntimeError) else type(error).__name__, file=sys.stderr)
        sys.exit(1)
