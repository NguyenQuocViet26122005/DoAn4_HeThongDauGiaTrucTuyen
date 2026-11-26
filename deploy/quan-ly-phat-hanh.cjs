const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const mauBan = /^([0-9a-f]{40})-[0-9]{1,20}-[0-9]{1,5}$/;

function docBan(root) {
  const tep = path.join(root, 'backend/.local/current-release.json');
  let duLieu;
  try {
    duLieu = JSON.parse(fs.readFileSync(tep, 'utf8'));
  } catch (loi) {
    if (loi.code === 'ENOENT') {
      return { id: 'legacy', sha: '', root };
    }
    throw loi;
  }
  const khop = typeof duLieu?.release === 'string' && duLieu.release.match(mauBan);
  if (!khop || duLieu.sha !== khop[1]) {
    throw new Error('INVALID_RELEASE');
  }
  const dich = path.join(root, '.releases', duLieu.release);
  if (!fs.existsSync(path.join(dich, 'backend/dist/may-chu.js'))) {
    throw new Error('MISSING_RELEASE');
  }
  return { id: duLieu.release, sha: duLieu.sha, root: dich };
}

function giamSat(root, deps = {}) {
  const taoTienTrinh = deps.spawn || spawn;
  const doc = deps.readRelease || (() => docBan(root));
  const hen = deps.setInterval || setInterval;
  const huyHen = deps.clearInterval || clearInterval;
  const baoLoi = deps.log || ((ma) => console.error(ma));
  const gio = deps.now || Date.now;
  let con = null;
  let ban = null;
  let dangDoi = false;
  let daDung = false;
  let soLanLoi = 0;
  let thuLaiSau = 0;
  let boDemDung;

  const mo = (moi) => {
    ban = moi;
    con = taoTienTrinh(
      process.execPath,
      [path.join(moi.root, 'deploy/chay-alwaysdata.cjs'), '--worker'],
      {
        cwd: moi.root,
        env: {
          ...process.env,
          VIETBID_SHARED_ROOT: root,
          VIETBID_RELEASE_ROOT: moi.root,
          RELEASE_SHA: moi.sha,
        },
        stdio: ['ignore', 'inherit', 'inherit'],
      },
    );
    const hienTai = con;
    con.once('error', () => baoLoi('RELEASE_WORKER_ERROR'));
    con.once('close', () => {
      if (con !== hienTai) {
        return;
      }
      clearTimeout(boDemDung);
      con = null;
      if (dangDoi) {
        dangDoi = false;
        return;
      }
      if (!daDung) {
        soLanLoi++;
        thuLaiSau = gio() + 3000;
        baoLoi('RELEASE_WORKER_EXIT');
      }
    });
  };

  const dungCon = () => {
    if (!con || dangDoi) {
      return;
    }
    dangDoi = true;
    const hienTai = con;
    boDemDung = setTimeout(() => {
      if (con === hienTai) {
        hienTai.kill('SIGKILL');
      }
    }, 15000);
    boDemDung.unref();
    hienTai.kill('SIGTERM');
  };

  const quet = () => {
    if (daDung) {
      return;
    }
    try {
      const moi = doc();
      if (ban && moi.id !== ban.id) {
        soLanLoi = 0;
        thuLaiSau = 0;
        if (con) {
          dungCon();
          return;
        }
      }
      if (!con && soLanLoi < 3 && gio() >= thuLaiSau) {
        mo(moi);
      }
    } catch {
      baoLoi('INVALID_RELEASE_POINTER');
    }
  };

  quet();
  const boHenGio = hen(quet, 1000);
  return {
    stop() {
      daDung = true;
      huyHen(boHenGio);
      dungCon();
    },
  };
}

module.exports = { docBan, giamSat };
