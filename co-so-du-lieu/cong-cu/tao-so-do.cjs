// Sinh sơ đồ từ cùng mô hình với SQL; không đọc dữ liệu người dùng.
const fs = require('node:fs');
const path = require('node:path');
const thuMuc = path.resolve(__dirname, '..');
const nhom = JSON.parse(fs.readFileSync(path.join(thuMuc, 'mo-hinh.json'), 'utf8'));
const bang = new Map(nhom.flatMap((n) => n.bang).map((b) => [b.ten, b]));
const x = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      })[c],
  );
const tomTat = {
  nguoi_dung: 'Vai trò, trạng thái và tài khoản',
  xac_minh_nguoi_ban: 'Hồ sơ riêng tư, Admin xét duyệt',
  dia_chi_nguoi_dung: 'Sổ địa chỉ của người dùng',
  danh_muc: 'Thuộc tính mẫu lưu bằng JSON',
  san_pham: 'Thông tin và snapshot thuộc tính',
  kiem_dinh_san_pham: 'Tiếp nhận, báo cáo và lưu giữ thực tế',
  dat_coc_dau_gia: 'Cọc theo người/phiên; hoàn hoặc chuyển đơn',
  phien_dau_gia: 'Giá công khai, thời gian, phí',
  tham_gia_phien: 'RIÊNG TƯ: theo dõi và cam kết',
  luot_tra_gia: 'Lịch sử giá công khai',
  don_hang: 'Gộp giữ tiền và vận chuyển',
  thanh_toan: 'Từng lần thử / giao dịch mô phỏng',
  de_nghi_mua_tiep_theo: 'Giá lấy từ lượt trả công khai',
  tranh_chap: 'Admin chọn một kết quả cuối',
  tep_dinh_kem: 'Ảnh công khai / bằng chứng riêng',
  danh_gia: 'Đánh giá hai bên theo đơn',
  yeu_cau_xu_ly: 'Hủy phiên hoặc báo cáo sản phẩm',
  vi_pham: 'Admin xét, không tự tăng mức phạt',
  thong_bao: 'Thông báo trong website',
  cau_hinh_he_thong: 'Thời hạn và bộ bước giá JSON',
  nhat_ky_hoat_dong: 'Dấu vết, gồm từng lần gia hạn',
};
const trang = [
  {
    id: '01-tai-khoan',
    ten: 'Tài khoản',
    own: ['nguoi_dung', 'xac_minh_nguoi_ban', 'dia_chi_nguoi_dung'],
    pos: {
      nguoi_dung: [50, 250],
      xac_minh_nguoi_ban: [570, 60],
      dia_chi_nguoi_dung: [570, 470],
    },
    w: 960,
    h: 760,
  },
  {
    id: '02-san-pham',
    ten: 'Danh mục và sản phẩm',
    own: ['danh_muc', 'san_pham'],
    pos: {
      danh_muc: [50, 70],
      nguoi_dung: [50, 470],
      san_pham: [570, 260],
    },
    w: 960,
    h: 780,
  },
  {
    id: '03-dau-gia',
    ten: 'Đấu giá',
    own: ['phien_dau_gia', 'tham_gia_phien', 'luot_tra_gia'],
    pos: {
      nguoi_dung: [40, 50],
      san_pham: [510, 50],
      phien_dau_gia: [510, 370],
      tham_gia_phien: [40, 720],
      luot_tra_gia: [930, 720],
    },
    w: 1310,
    h: 1020,
  },
  {
    id: '04-giao-dich',
    ten: 'Đơn hàng và thanh toán',
    own: ['don_hang', 'thanh_toan', 'de_nghi_mua_tiep_theo'],
    pos: {
      nguoi_dung: [40, 50],
      phien_dau_gia: [490, 50],
      luot_tra_gia: [930, 50],
      don_hang: [60, 420],
      thanh_toan: [60, 790],
      de_nghi_mua_tiep_theo: [900, 420],
      kiem_dinh_san_pham: [490, 850],
    },
    w: 1310,
    h: 1150,
  },
  {
    id: '05-hau-mai',
    ten: 'Tranh chấp, tệp và đánh giá',
    own: ['tranh_chap', 'tep_dinh_kem', 'danh_gia'],
    pos: {
      nguoi_dung: [40, 50],
      don_hang: [490, 50],
      san_pham: [930, 50],
      tranh_chap: [490, 400],
      tep_dinh_kem: [930, 780],
      danh_gia: [40, 780],
      kiem_dinh_san_pham: [490, 780],
    },
    w: 1310,
    h: 1080,
  },
  {
    id: '06-yeu-cau',
    ten: 'Yêu cầu và vi phạm',
    own: ['yeu_cau_xu_ly', 'vi_pham'],
    pos: {
      nguoi_dung: [30, 50],
      san_pham: [530, 50],
      phien_dau_gia: [890, 50],
      yeu_cau_xu_ly: [530, 420],
      don_hang: [30, 770],
      vi_pham: [890, 770],
    },
    w: 1270,
    h: 1080,
  },
  {
    id: '07-ho-tro',
    ten: 'Thông báo, cấu hình và nhật ký',
    own: ['thong_bao', 'cau_hinh_he_thong', 'nhat_ky_hoat_dong'],
    pos: {
      nguoi_dung: [30, 50],
      phien_dau_gia: [530, 50],
      luot_tra_gia: [890, 50],
      thong_bao: [30, 420],
      cau_hinh_he_thong: [30, 780],
      nhat_ky_hoat_dong: [750, 590],
    },
    w: 1270,
    h: 1100,
  },
  {
    id: '08-kiem-dinh',
    ten: 'Kiểm định và trung tâm',
    own: ['kiem_dinh_san_pham'],
    pos: {
      san_pham: [40, 50],
      nguoi_dung: [930, 50],
      kiem_dinh_san_pham: [490, 430],
    },
    w: 1310,
    h: 740,
  },
  {
    id: '09-dat-coc',
    ten: 'Đăng ký và đặt cọc',
    own: ['dat_coc_dau_gia'],
    pos: {
      phien_dau_gia: [40, 50],
      nguoi_dung: [930, 50],
      dat_coc_dau_gia: [490, 430],
      don_hang: [490, 850],
    },
    w: 1310,
    h: 1150,
  },
];
const W = 340,
  H = 245;

function lienKet(p) {
  const gom = new Map();

  for (const ten of p.own) {
    for (const fk of bang.get(ten).lienKet) {
      if (!p.pos[fk.bangCha]) {
        throw new Error('Sơ đồ thiếu bảng tham chiếu ' + fk.bangCha);
      }

      const key = ten + '|' + fk.bangCha;

      if (!gom.has(key)) {
        gom.set(key, {
          con: ten,
          cha: fk.bangCha,
          cot: [],
        });
      }
      gom.get(key).cot.push(fk.cot);
    }
  }

  return [...gom.values()];
}

function cotHien(b) {
  const uuTien = ['id', ...b.lienKet.map((l) => l.cot)];
  const them = {
    danh_muc: ['cau_hinh_thuoc_tinh'],
    san_pham: ['thuoc_tinh_json', 'trang_thai_duyet'],
    tham_gia_phien: ['dang_theo_doi', 'gia_toi_da', 'thoi_gian_dat_gia_toi_da'],
    don_hang: ['tong_tien', 'trang_thai_giu_tien'],
    cau_hinh_he_thong: ['khoa_cau_hinh', 'gia_tri_cau_hinh'],
    tep_dinh_kem: ['loai_tep'],
    phien_dau_gia: ['gia_hien_tai', 'thoi_gian_ket_thuc'],
    thanh_toan: ['so_tien', 'trang_thai'],
    kiem_dinh_san_pham: ['lan_kiem_dinh', 'ket_qua', 'trang_thai'],
    dat_coc_dau_gia: ['so_tien', 'trang_thai'],
    nhat_ky_hoat_dong: ['hanh_dong', 'du_lieu_moi'],
  };

  return [...new Set([...uuTien, ...(them[b.ten] || ['trang_thai'])])]
    .filter((c) => b.cot.some((t) => t.ten === c))
    .slice(0, 6);
}

function svg(p) {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${p.w} ${p.h}" role="img" aria-label="${x(p.ten)}"><defs><marker id="mui-${p.id}" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,1 L8,4.5 L0,8" fill="none" stroke="#708193" stroke-width="1.3"/></marker></defs><rect width="100%" height="100%" fill="#fafbf9"/>`;

  for (const l of lienKet(p)) {
    const [cx, cy] = p.pos[l.con],
      [px, py] = p.pos[l.cha];
    let d;

    if (l.con === l.cha) {
      d = `M${cx + W - 50},${cy} C${cx + W - 50},${cy - 40} ${cx + W + 40},${cy - 40} ${cx + W + 40},${cy + 80} L${cx + W},${cy + 80}`;
    } else if (Math.abs(cy - py) > 280) {
      const a = cx + W / 2,
        b = cy,
        c = px + W / 2,
        e = py + H,
        m = (b + e) / 2;

      d = `M${a},${b} C${a},${m} ${c},${m} ${c},${e}`;
    } else {
      const right = cx > px,
        a = right ? cx : cx + W,
        b = cy + H / 2,
        c = right ? px + W : px,
        e = py + H / 2,
        m = (a + c) / 2;

      d = `M${a},${b} C${m},${b} ${m},${e} ${c},${e}`;
    }

    const actor = l.cha === 'nguoi_dung' && !p.own.includes('nguoi_dung');

    s += `<g class="edge${actor ? ' actor' : ''}" data-con="${l.con}" data-cha="${l.cha}"><title>${x(l.con + ' → ' + l.cha + '\n' + l.cot.join(', '))}</title><path d="${d}" fill="none" stroke="${actor ? '#b5bdc6' : '#708193'}" stroke-width="${actor ? 1.6 : 2}" ${actor ? 'stroke-dasharray="6 5"' : ''} marker-end="url(#mui-${p.id})"/></g>`;
  }
  for (const [ten, [a, b]] of Object.entries(p.pos)) {
    const t = bang.get(ten),
      own = p.own.includes(ten),
      secret = ten === 'tham_gia_phien';

    s += `<g class="node" data-bang="${ten}" tabindex="0" role="button" aria-label="Xem bảng ${ten}" transform="translate(${a},${b})"><rect width="${W}" height="${H}" rx="9" fill="white" stroke="${own ? '#a0b5b3' : '#cbd0d4'}" stroke-width="1.5"/><path d="M9,0 H${W - 9} Q${W},0 ${W},9 V52 H0 V9 Q0,0 9,0" fill="${own ? '#183d3a' : '#e9eeed'}"/><text x="16" y="24" fill="${own ? '#fff' : '#36413f'}" font-family="Segoe UI,Arial" font-size="16" font-weight="650">${x(ten)}</text><text x="16" y="42" fill="${own ? '#cee0dd' : '#65736f'}" font-family="Segoe UI,Arial" font-size="11">${own ? 'BẢNG CỦA NHÓM' : 'BẢNG THAM CHIẾU'}${secret ? ' · KHÔNG XUẤT TRẦN RA API' : ''}</text>`;

    const cot = cotHien(t);

    cot.forEach((c, i) => {
      const role = c === 'id' ? 'PK' : t.lienKet.some((l) => l.cot === c) ? 'FK' : '•';

      s += `<text x="16" y="${78 + i * 21}" fill="${role === 'FK' ? '#59716e' : '#303a38'}" font-family="Consolas,monospace" font-size="12"><tspan fill="#73827d">${role.padEnd(3, ' ')}</tspan> ${x(c)}</text>`;
    });
    s += `<line x1="16" y1="211" x2="324" y2="211" stroke="#e6ebe8"/><text x="16" y="232" fill="#687470" font-family="Segoe UI,Arial" font-size="11">${x(tomTat[ten])}</text></g>`;
  }

  return s + '</svg>';
}

fs.mkdirSync(path.join(thuMuc, 'so-do'), { recursive: true });
let draw = `<mxfile host="app.diagrams.net" modified="2026-09-25T00:00:00.000Z" agent="DoAn4" version="24.7.17">`;
let mmdAll =
  '# Sơ đồ quan hệ — 21 bảng\n\nMỗi hình chỉ vẽ quan hệ có bảng con thuộc nhóm. Bảng tham chiếu xuất hiện ở nhiều hình nhưng chỉ có một bảng vật lý. SQL giữ đủ 53 khóa ngoại. Các cột hiển thị được rút gọn, chi tiết ở SQL và trình xem HTML.\n\n';
const coverage = [];
for (const p of trang) {
  p.svg = svg(p);
  p.edges = lienKet(p);
  fs.writeFileSync(path.join(thuMuc, 'so-do', p.id + '.svg'), p.svg);

  let mmd = 'erDiagram\n';

  for (const ten of Object.keys(p.pos)) {
    mmd += `    ${ten} {\n        bigint id PK\n    }\n`;
  }
  for (const ten of p.own) {
    for (const l of bang.get(ten).lienKet) {
      mmd += `    ${l.bangCha} ||--o{ ${ten} : "${l.cot}"\n`;
      coverage.push(`${ten}.${l.cot}->${l.bangCha}.${l.cotCha}`);
    }
  }
  fs.writeFileSync(path.join(thuMuc, 'so-do', p.id + '.mmd'), mmd);
  mmdAll += `## ${p.ten}\n\n\`\`\`mermaid\n${mmd}\`\`\`\n\n`;
  draw += `<diagram id="${p.id}" name="${x(p.ten)}"><mxGraphModel dx="1300" dy="1000" grid="1" page="1" pageScale="1" pageWidth="${p.w}" pageHeight="${p.h}"><root><mxCell id="0"/><mxCell id="1" parent="0"/>`;
  for (const [ten, [a, b]] of Object.entries(p.pos)) {
    const own = p.own.includes(ten),
      value = `${ten}\n${own ? '' : '[THAM CHIẾU]\n'}${cotHien(bang.get(ten)).join('\n')}\n\n${tomTat[ten]}`;

    draw += `<mxCell id="${ten}" value="${x(value)}" style="rounded=1;whiteSpace=wrap;html=0;align=left;verticalAlign=top;spacing=14;fontFamily=Helvetica;fontSize=14;fillColor=${own ? '#f0f7f5' : '#f5f5f5'};strokeColor=#9aaea8;" vertex="1" parent="1"><mxGeometry x="${a}" y="${b}" width="${W}" height="${H}" as="geometry"/></mxCell>`;
  }
  p.edges.forEach((l, i) => {
    draw += `<mxCell id="e${i}" value="${x(l.cot.join('\n'))}" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=0;endArrow=ERone;startArrow=ERmany;fontSize=10;fontColor=#536761;strokeColor=#81938c;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="${l.con}" target="${l.cha}"><mxGeometry relative="1" as="geometry"/></mxCell>`;
  });
  draw += '</root></mxGraphModel></diagram>';
}
draw += '</mxfile>';
if (coverage.length !== 53 || new Set(coverage).size !== 53) {
  throw new Error('Sơ đồ thiếu/trùng FK');
}
fs.writeFileSync(path.join(thuMuc, 'so-do-21-bang.drawio'), draw);
fs.writeFileSync(path.join(thuMuc, 'SO-DO-QUAN-HE.md'), mmdAll);
const data = JSON.stringify({
  nhom,
  bang: [...bang.values()],
  trang,
  tomTat,
}).replace(/</g, '\\u003c');
const html = fs
  .readFileSync(path.join(thuMuc, 'mau-so-do.html'), 'utf8')
  .replace('/*DU_LIEU_SO_DO*/ null', data);
fs.writeFileSync(path.join(thuMuc, 'so-do-csdl.html'), html);
console.log(
  JSON.stringify({
    soTrang: trang.length,
    khoaNgoaiDuocVe: coverage.length,
    html: 'so-do-csdl.html',
    drawio: 'so-do-21-bang.drawio',
  }),
);
