const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { sanPhamBoSung } = require('./san-pham-bo-sung');
const { nhanDangLoaiTep } = require('../../dist/services/tai-tep');

const goc = path.resolve(__dirname, '../..');
const tepDanhSach = path.join(goc, 'demo-assets/du-lieu-chuan-vietbid.json');

function viTri(khoa, nhom, chuSoHuu, duoi) {
  const bam = crypto
    .createHash('sha256')
    .update('vietbid-chuan-50-v1-' + khoa)
    .digest('hex');
  const uuid = `${bam.slice(0, 8)}-${bam.slice(8, 12)}-${bam.slice(12, 16)}-${bam.slice(16, 20)}-${bam.slice(20, 32)}`;

  return `/api/uploads/files/${nhom}/${chuSoHuu}/${uuid}.${duoi}`;
}

function tepCucBo(url) {
  assert.match(
    url,
    /^\/api\/uploads\/files\/(product|inspection|evidence|verification)\/\d+\/[a-f0-9-]{36}\.(jpg|png|webp|pdf)$/,
  );

  return path.join(goc, 'uploads', url.slice('/api/uploads/files/'.length));
}

async function taiAnh(tenTep) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    titles: tenTep,
    prop: 'imageinfo',
    iiprop: 'url|mime|extmetadata',
    iiurlwidth: '1200',
  });
  const headers = { 'User-Agent': 'VietBidUniversityProject/1.0 (educational image attribution)' };
  const response = await fetch('https://commons.wikimedia.org/w/api.php?' + params, { headers });

  assert(response.ok, `Không đọc được nguồn ${tenTep}: ${response.status}`);

  const data = await response.json();
  const info = Object.values(data.query.pages)[0].imageinfo?.[0];

  assert(
    info && ['image/jpeg', 'image/png', 'image/webp'].includes(info.mime),
    `Nguồn không phải ảnh sản phẩm: ${tenTep}`,
  );

  const url = info.thumburl || info.url;
  const anh = await fetch(url, { headers });

  assert(anh.ok, `Không tải được ${tenTep}: ${anh.status}`);

  const buffer = Buffer.from(await anh.arrayBuffer());
  const loai = nhanDangLoaiTep(buffer);

  assert(loai && loai.ext !== 'pdf' && buffer.length > 1000, 'Ảnh sai định dạng');

  const boHTML = (value) =>
    String(value || '')
      .replace(/<[^>]*>/g, '')
      .trim();

  return {
    buffer,
    ext: loai.ext,
    nguon: {
      tieu_de_nguon: tenTep,
      trang_nguon: info.descriptionurl,
      tac_gia: boHTML(info.extmetadata?.Artist?.value),
      giay_phep: boHTML(info.extmetadata?.LicenseShortName?.value),
      mime: loai.mime,
      sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
    },
  };
}

async function chuanBi(c) {
  let danhSach;

  try {
    danhSach = JSON.parse(await fs.readFile(tepDanhSach, 'utf8'));
  } catch (loi) {
    if (loi.code !== 'ENOENT') {
      throw loi;
    }
    danhSach = {
      phien_ban: 1,
      anh: [],
      tep: {},
    };
  }

  const cu = JSON.parse(
    await fs.readFile(path.join(goc, 'demo-assets/du-lieu-mo-rong-bao-cao.json'), 'utf8'),
  );

  for (const p of sanPhamBoSung) {
    const [rows] = await c.execute('SELECT nguoi_ban_id FROM san_pham WHERE id=?', [p.id]);

    assert(rows[0], `Thiếu sản phẩm ${p.id}`);

    const owner = rows[0].nguoi_ban_id;

    if (danhSach.anh.some((a) => a.san_pham_id === p.id)) {
      continue;
    }

    let taiNguyen;

    if (p.tenTep) {
      taiNguyen = await taiAnh(p.tenTep);
    } else {
      const nguon = cu.anh.find((a) => a.san_pham_id === p.id);
      const buffer = await fs.readFile(tepCucBo(nguon.duong_dan));
      const loai = nhanDangLoaiTep(buffer);

      taiNguyen = {
        buffer,
        ext: loai.ext,
        nguon,
      };
    }

    const url = viTri('anh-' + p.id, 'product', owner, taiNguyen.ext);

    await fs.mkdir(path.dirname(tepCucBo(url)), { recursive: true });
    await fs.writeFile(tepCucBo(url), taiNguyen.buffer);
    danhSach.anh.push({
      ...taiNguyen.nguon,
      san_pham_id: p.id,
      tieu_de_san_pham: p.tieuDe,
      duong_dan: url,
    });
    await fs.writeFile(tepDanhSach, JSON.stringify(danhSach, null, 2) + '\n');
    console.log(`Đã chuẩn bị ảnh ${p.id}: ${p.tieuDe}`);
  }

  return danhSach;
}

module.exports = {
  chuanBi,
  tepDanhSach,
  viTri,
  tepCucBo,
};
