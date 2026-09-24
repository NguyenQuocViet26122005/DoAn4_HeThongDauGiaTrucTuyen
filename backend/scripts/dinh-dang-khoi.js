const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const gocDuAn = path.resolve(__dirname, '../..');
const cacThuMuc = [
  'backend/src',
  'backend/scripts',
  'backend/tests',
  'frontend/src',
  'co-so-du-lieu/cong-cu',
];
const chiKiemTra = process.argv.includes('--check');

function danhSachTep(thuMuc) {
  return fs.readdirSync(thuMuc, { withFileTypes: true }).flatMap((muc) => {
    const tep = path.join(thuMuc, muc.name);

    return muc.isDirectory() ? danhSachTep(tep) : /\.(?:ts|tsx|js|cjs)$/.test(tep) ? [tep] : [];
  });
}

function nhomBuoc(cauLenh, nguon) {
  const chuoi = cauLenh.getText(nguon);

  if (ts.isReturnStatement(cauLenh)) {
    return 'tra-ket-qua';
  }
  if (/^(await )?(ghiNhatKy|taoThongBao|thongBaoMotLan|cacSuKien\.)/.test(chuoi)) {
    return 'nhat-ky';
  }
  if (
    /^(await )?(baoDam|batBuocTonTai|kiemTra\.|kiemTraQuyen|nguoiMua\(|nguoiBan\(|dichVuDonHang\.nguoi)/.test(
      chuoi,
    )
  ) {
    return 'kiem-tra';
  }
  if (/^(await khoBanGhi\.(capNhat|them|xoa)|const \w+ = await khoBanGhi\.them)/.test(chuoi)) {
    return 'ghi-du-lieu';
  }
  if (ts.isVariableStatement(cauLenh)) {
    return 'lay-va-tinh-du-lieu';
  }

  return 'xu-ly';
}

let soTepThayDoi = 0;
let soKhoiThieu = 0;
for (const tep of cacThuMuc.flatMap((thuMuc) => danhSachTep(path.join(gocDuAn, thuMuc)))) {
  let noiDung = fs.readFileSync(tep, 'utf8');
  const banDau = noiDung;
  let nguon = ts.createSourceFile(tep, noiDung, ts.ScriptTarget.Latest, true);
  const chen = [];

  function bocKhoi(cauLenh) {
    if (!cauLenh || ts.isBlock(cauLenh) || ts.isIfStatement(cauLenh)) {
      return;
    }
    chen.push({ viTri: cauLenh.getStart(nguon), chuoi: '{\n' });
    chen.push({ viTri: cauLenh.end, chuoi: '\n}' });
    soKhoiThieu++;
  }

  function duyet(cauLenh) {
    if (
      !chiKiemTra &&
      ts.isObjectLiteralExpression(cauLenh) &&
      cauLenh.properties.length >= 3 &&
      !cauLenh.getText(nguon).includes('\n')
    ) {
      chen.push({ viTri: cauLenh.getStart(nguon) + 1, chuoi: '\n' });
      chen.push({ viTri: cauLenh.end - 1, chuoi: '\n' });
    }
    if (ts.isIfStatement(cauLenh)) {
      // Nhánh then chứa if cũng cần bọc để giữ rõ phạm vi else.
      if (ts.isIfStatement(cauLenh.thenStatement)) {
        chen.push({ viTri: cauLenh.thenStatement.getStart(nguon), chuoi: '{\n' });
        chen.push({ viTri: cauLenh.thenStatement.end, chuoi: '\n}' });
        soKhoiThieu++;
      } else {
        bocKhoi(cauLenh.thenStatement);
      }
      bocKhoi(cauLenh.elseStatement);
    }
    if (
      ts.isForStatement(cauLenh) ||
      ts.isForOfStatement(cauLenh) ||
      ts.isForInStatement(cauLenh) ||
      ts.isWhileStatement(cauLenh) ||
      ts.isDoStatement(cauLenh)
    ) {
      bocKhoi(cauLenh.statement);
    }
    ts.forEachChild(cauLenh, duyet);
  }

  duyet(nguon);

  if (chiKiemTra) {
    continue;
  }
  for (const muc of chen.sort((a, b) => b.viTri - a.viTri)) {
    noiDung = noiDung.slice(0, muc.viTri) + muc.chuoi + noiDung.slice(muc.viTri);
  }

  nguon = ts.createSourceFile(tep, noiDung, ts.ScriptTarget.Latest, true);

  const dongTrong = new Set();

  function tachBuoc(cauLenh) {
    if (ts.isBlock(cauLenh) || ts.isSourceFile(cauLenh)) {
      const ds = cauLenh.statements;

      for (let i = 1; i < ds.length; i++) {
        const truoc = ds[i - 1];
        const sau = ds[i];
        const laCapHam = ts.isFunctionDeclaration(sau) || ts.isFunctionDeclaration(truoc);
        const trongHam = ts.isBlock(cauLenh) && nhomBuoc(truoc, nguon) !== nhomBuoc(sau, nguon);
        const khoang = noiDung.slice(truoc.end, sau.getStart(nguon));

        if ((laCapHam || trongHam) && !/\n\s*\n/.test(khoang)) {
          dongTrong.add(truoc.end);
        }
      }
    }
    ts.forEachChild(cauLenh, tachBuoc);
  }

  tachBuoc(nguon);
  for (const viTri of [...dongTrong].sort((a, b) => b - a)) {
    noiDung = noiDung.slice(0, viTri) + '\n\n' + noiDung.slice(viTri);
  }
  if (noiDung !== banDau) {
    fs.writeFileSync(tep, noiDung);
    soTepThayDoi++;
  }
}

if (chiKiemTra && soKhoiThieu) {
  console.error(`Còn ${soKhoiThieu} khối điều kiện/vòng lặp thiếu ngoặc nhọn.`);
  process.exitCode = 1;
} else {
  console.log(
    chiKiemTra
      ? 'Khối điều kiện/vòng lặp đã có ngoặc nhọn.'
      : `Đã sắp xếp khối và khoảng cách trong ${soTepThayDoi} tệp.`,
  );
}
