const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { nguoiBan } = require('./ke-hoach');
const { nhanDangLoaiTep } = require('../../dist/services/tai-tep');
const banSao = require('../../../co-so-du-lieu/cong-cu/ban-sao-csdl.cjs');
const thuMuc = path.resolve(__dirname, '../..');

const anhChon = [
  [95, 'File:Rolex Submariner ref. 14060M, metà anni 2000.jpg', true],
  [96, 'File:Omega Speedmaster Schumacher Edition10 36 22 158000.jpeg'],
  [97, 'File:Rolex Datejust 16013 close-up.webp'],
  [99, 'File:Patek-Philippe-Nautilus-5711-1A-010-1.jpg'],
  [105, 'File:Painting Thieu nu va phong canh of Nguyen Gia Tri (back side).jpg'],
  [112, 'File:Leica M3 mg 3851.jpg'],
  [112, 'File:Leica M3 mg 3853.jpg'],
];

function uuid(ten) {
  const h = createHash('sha256').update(ten).digest('hex').slice(0, 32);

  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

async function chay() {
  const file = process.argv.find((a) => a.startsWith('--source='))?.slice(9);

  if (!file) {
    throw new Error('Cần bản sao nguồn đã xác minh.');
  }

  const nguon = banSao.docBanSao(path.resolve(file));
  const sanPham = nguon.bang.find((t) => t.ten === 'san_pham').dong;
  const manifestPath = path.join(thuMuc, 'demo-assets/bo-moi.json');
  const manifest = await fs
    .readFile(manifestPath, 'utf8')
    .then(JSON.parse)
    .catch(() => ({ anh: [], tep: {} }));
  const boHTML = (v) =>
    (v || '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  for (const [id, title, thayAnhChinh = false] of anhChon) {
    const daCo = manifest.anh.find((a) => a.sanPham === id && a.tieuDe === title);

    if (daCo) {
      await fs.access(
        path.join(thuMuc, 'uploads', daCo.duongDan.replace('/api/uploads/files/', '')),
      );
      continue;
    }

    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      titles: title,
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: '1000',
    });
    const r = await fetch('https://commons.wikimedia.org/w/api.php?' + params, {
      signal: AbortSignal.timeout(25000),
    });

    if (!r.ok) {
      throw new Error(`Không lấy được nguồn ảnh: ${r.status}`);
    }

    const j = await r.json();
    const info = Object.values(j.query.pages)[0].imageinfo?.[0];

    if (!info) {
      throw new Error(`Không tìm thấy ảnh ${title}`);
    }

    const license = boHTML(info.extmetadata.LicenseShortName?.value);

    if (!/^(CC0|CC BY|Public domain)/.test(license)) {
      throw new Error(`Giấy phép cần xem lại: ${title}`);
    }

    const hinh = await fetch(info.thumburl || info.url, { signal: AbortSignal.timeout(40000) });

    if (!hinh.ok) {
      throw new Error(`Tải ảnh thất bại: ${title} (${hinh.status})`);
    }

    const bytes = Buffer.from(await hinh.arrayBuffer());
    const loai = nhanDangLoaiTep(bytes);

    if (!loai || loai.ext === 'pdf' || bytes.length > 5 * 1024 * 1024) {
      throw new Error(`Nội dung ảnh không hợp lệ: ${title}`);
    }

    const chu = nguoiBan(sanPham.find((s) => Number(s.id) === id).danh_muc_id);
    const rel = `product/${chu}/${uuid(title)}.${loai.ext}`;

    await fs.mkdir(path.join(thuMuc, 'uploads', `product/${chu}`), { recursive: true });
    await fs.writeFile(path.join(thuMuc, 'uploads', rel), bytes, { flag: 'wx' }).catch((e) => {
      if (e.code !== 'EEXIST') {
        throw e;
      }
    });
    manifest.anh.push({
      sanPham: id,
      tieuDe: title,
      thayAnhChinh,
      duongDan: '/api/uploads/files/' + rel,
      tacGia: boHTML(info.extmetadata.Artist?.value),
      giayPhep: license,
      trangNguon: info.descriptionurl,
      lienKetGiayPhep: info.extmetadata.LicenseUrl?.value || null,
      mime: loai.mime,
      dungLuong: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    });
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`Đã tải ảnh đúng nguồn cho sản phẩm ${id}: ${title}`);
  }

  const python = process.env.PYTHON_VIETBID || 'python';
  const result = spawnSync(python, [path.join(__dirname, 'tao-ho-so.py'), path.resolve(file)], {
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error('Chưa tạo đủ hồ sơ PDF và hình xác minh.');
  }
}

chay().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
