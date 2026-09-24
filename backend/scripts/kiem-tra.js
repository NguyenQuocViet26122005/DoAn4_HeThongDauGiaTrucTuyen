const tepTin = require('node:fs');
const duongDan = require('node:path');
const vm = require('node:vm');

function danhSachTep(thuMuc) {
  return tepTin
    .readdirSync(thuMuc, { withFileTypes: true })
    .flatMap((muc) =>
      muc.isDirectory()
        ? danhSachTep(duongDan.join(thuMuc, muc.name))
        : muc.name.endsWith('.js')
          ? [duongDan.join(thuMuc, muc.name)]
          : [],
    );
}

const cacTepNguon = danhSachTep(duongDan.join(__dirname, '../src'));
const cacKiemThu = tepTin.existsSync(duongDan.join(__dirname, '../tests'))
  ? danhSachTep(duongDan.join(__dirname, '../tests'))
  : [];
for (const tep of [...cacTepNguon, ...cacKiemThu]) {
  new vm.Script(tepTin.readFileSync(tep, 'utf8'), { filename: tep });
}
for (const tep of cacTepNguon) {
  require(tep);
}
console.log(
  `Syntax và require: ${cacTepNguon.length} file nguồn, ${cacKiemThu.length} file kiểm thử đạt.`,
);
require('../src/config/co-so-du-lieu').end();
