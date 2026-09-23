// Sinh sơ đồ từ cùng mô hình với SQL; không đọc dữ liệu người dùng.
const fs = require('node:fs');
const path = require('node:path');
const thuMuc = path.resolve(__dirname, '..');
const nhom = JSON.parse(fs.readFileSync(path.join(thuMuc, 'mo-hinh.json'), 'utf8'));
const bang = new Map(nhom.flatMap(n => n.bang).map(b => [b.ten, b]));
const x = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const tomTat = {
  nguoi_dung:'Vai trò, trạng thái và tài khoản', xac_minh_nguoi_ban:'Hồ sơ riêng tư, Admin xét duyệt', dia_chi_nguoi_dung:'Sổ địa chỉ của người dùng',
  danh_muc:'Thuộc tính mẫu lưu bằng JSON', san_pham:'Thông tin và snapshot thuộc tính', phien_dau_gia:'Giá công khai, thời gian, phí',
  tham_gia_phien:'RIÊNG TƯ: theo dõi và cam kết', luot_tra_gia:'Lịch sử giá công khai', don_hang:'Gộp giữ tiền và vận chuyển',
  thanh_toan:'Từng lần thử / giao dịch mô phỏng', de_nghi_mua_tiep_theo:'Giá lấy từ lượt trả công khai', tranh_chap:'Admin chọn một kết quả cuối',
  tep_dinh_kem:'Ảnh công khai / bằng chứng riêng', danh_gia:'Đánh giá hai bên theo đơn', yeu_cau_xu_ly:'Hủy phiên hoặc báo cáo sản phẩm',
  vi_pham:'Admin xét, không tự tăng mức phạt', thong_bao:'Thông báo trong website', cau_hinh_he_thong:'Thời hạn và bộ bước giá JSON', nhat_ky_hoat_dong:'Dấu vết, gồm từng lần gia hạn',
};
const trang = [
  {id:'01-tai-khoan',ten:'Tài khoản',own:['nguoi_dung','xac_minh_nguoi_ban','dia_chi_nguoi_dung'],pos:{nguoi_dung:[50,250],xac_minh_nguoi_ban:[570,60],dia_chi_nguoi_dung:[570,470]},w:960,h:760},
  {id:'02-san-pham',ten:'Danh mục và sản phẩm',own:['danh_muc','san_pham'],pos:{danh_muc:[50,70],nguoi_dung:[50,470],san_pham:[570,260]},w:960,h:780},
  {id:'03-dau-gia',ten:'Đấu giá',own:['phien_dau_gia','tham_gia_phien','luot_tra_gia'],pos:{nguoi_dung:[40,50],san_pham:[510,50],phien_dau_gia:[510,370],tham_gia_phien:[40,720],luot_tra_gia:[930,720]},w:1310,h:1020},
  {id:'04-giao-dich',ten:'Đơn hàng và thanh toán',own:['don_hang','thanh_toan','de_nghi_mua_tiep_theo'],pos:{nguoi_dung:[40,50],phien_dau_gia:[490,50],luot_tra_gia:[930,50],don_hang:[60,420],thanh_toan:[60,790],de_nghi_mua_tiep_theo:[700,610]},w:1310,h:1090},
  {id:'05-hau-mai',ten:'Tranh chấp, tệp và đánh giá',own:['tranh_chap','tep_dinh_kem','danh_gia'],pos:{nguoi_dung:[40,50],don_hang:[490,50],san_pham:[930,50],tranh_chap:[490,400],tep_dinh_kem:[930,780],danh_gia:[40,780]},w:1310,h:1080},
  {id:'06-yeu-cau',ten:'Yêu cầu và vi phạm',own:['yeu_cau_xu_ly','vi_pham'],pos:{nguoi_dung:[30,50],san_pham:[460,50],phien_dau_gia:[890,50],yeu_cau_xu_ly:[460,420],don_hang:[30,770],vi_pham:[890,770]},w:1270,h:1080},
  {id:'07-ho-tro',ten:'Thông báo, cấu hình và nhật ký',own:['thong_bao','cau_hinh_he_thong','nhat_ky_hoat_dong'],pos:{nguoi_dung:[30,50],phien_dau_gia:[460,50],luot_tra_gia:[890,50],thong_bao:[30,420],cau_hinh_he_thong:[30,780],nhat_ky_hoat_dong:[750,590]},w:1270,h:1100},
];
const W=340,H=245;
function lienKet(p){
  const gom=new Map();
  for(const ten of p.own)for(const fk of bang.get(ten).lienKet){
    if(!p.pos[fk.bangCha]) throw new Error('Sơ đồ thiếu bảng tham chiếu '+fk.bangCha);
    const key=ten+'|'+fk.bangCha;
    if(!gom.has(key))gom.set(key,{con:ten,cha:fk.bangCha,cot:[]});
    gom.get(key).cot.push(fk.cot);
  }
  return [...gom.values()];
}
function cotHien(b){
  const uuTien=['id',...b.lienKet.map(l=>l.cot)];
  const them={danh_muc:['cau_hinh_thuoc_tinh'],san_pham:['thuoc_tinh_json','trang_thai_duyet'],tham_gia_phien:['dang_theo_doi','gia_toi_da','thoi_gian_dat_gia_toi_da'],don_hang:['tong_tien','trang_thai_giu_tien'],cau_hinh_he_thong:['khoa_cau_hinh','gia_tri_cau_hinh'],tep_dinh_kem:['loai_tep'],phien_dau_gia:['gia_hien_tai','thoi_gian_ket_thuc'],thanh_toan:['so_tien','trang_thai'],nhat_ky_hoat_dong:['hanh_dong','du_lieu_moi']};
  return [...new Set([...uuTien,...(them[b.ten]||['trang_thai'])])].filter(c=>b.cot.some(t=>t.ten===c)).slice(0,6);
}
function svg(p){
  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${p.w} ${p.h}" role="img" aria-label="${x(p.ten)}"><defs><marker id="mui-${p.id}" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,1 L8,4.5 L0,8" fill="none" stroke="#708193" stroke-width="1.3"/></marker></defs><rect width="100%" height="100%" fill="#fafbf9"/>`;
  for(const l of lienKet(p)){
    const [cx,cy]=p.pos[l.con], [px,py]=p.pos[l.cha];
    let d;
    if(l.con===l.cha)d=`M${cx+W-50},${cy} C${cx+W-50},${cy-40} ${cx+W+40},${cy-40} ${cx+W+40},${cy+80} L${cx+W},${cy+80}`;
    else if(Math.abs(cy-py)>280){const a=cx+W/2,b=cy,c=px+W/2,e=py+H,m=(b+e)/2;d=`M${a},${b} C${a},${m} ${c},${m} ${c},${e}`;}
    else {const right=cx>px,a=right?cx:cx+W,b=cy+H/2,c=right?px+W:px,e=py+H/2,m=(a+c)/2;d=`M${a},${b} C${m},${b} ${m},${e} ${c},${e}`;}
    const actor=l.cha==='nguoi_dung'&&!p.own.includes('nguoi_dung');
    s+=`<g class="edge${actor?' actor':''}" data-con="${l.con}" data-cha="${l.cha}"><title>${x(l.con+' → '+l.cha+'\n'+l.cot.join(', '))}</title><path d="${d}" fill="none" stroke="${actor?'#b5bdc6':'#708193'}" stroke-width="${actor?1.6:2}" ${actor?'stroke-dasharray="6 5"':''} marker-end="url(#mui-${p.id})"/></g>`;
  }
  for(const [ten,[a,b]]of Object.entries(p.pos)){
    const t=bang.get(ten),own=p.own.includes(ten),secret=ten==='tham_gia_phien';
    s+=`<g class="node" data-bang="${ten}" tabindex="0" role="button" aria-label="Xem bảng ${ten}" transform="translate(${a},${b})"><rect width="${W}" height="${H}" rx="9" fill="white" stroke="${own?'#a0b5b3':'#cbd0d4'}" stroke-width="1.5"/><path d="M9,0 H${W-9} Q${W},0 ${W},9 V52 H0 V9 Q0,0 9,0" fill="${own?'#183d3a':'#e9eeed'}"/><text x="16" y="24" fill="${own?'#fff':'#36413f'}" font-family="Segoe UI,Arial" font-size="16" font-weight="650">${x(ten)}</text><text x="16" y="42" fill="${own?'#cee0dd':'#65736f'}" font-family="Segoe UI,Arial" font-size="11">${own?'BẢNG CỦA NHÓM':'BẢNG THAM CHIẾU'}${secret?' · KHÔNG XUẤT TRẦN RA API':''}</text>`;
    const cot=cotHien(t);
    cot.forEach((c,i)=>{const role=c==='id'?'PK':t.lienKet.some(l=>l.cot===c)?'FK':'•';s+=`<text x="16" y="${78+i*21}" fill="${role==='FK'?'#59716e':'#303a38'}" font-family="Consolas,monospace" font-size="12"><tspan fill="#73827d">${role.padEnd(3,' ')}</tspan> ${x(c)}</text>`;});
    s+=`<line x1="16" y1="211" x2="324" y2="211" stroke="#e6ebe8"/><text x="16" y="232" fill="#687470" font-family="Segoe UI,Arial" font-size="11">${x(tomTat[ten])}</text></g>`;
  }
  return s+'</svg>';
}
fs.mkdirSync(path.join(thuMuc,'so-do'),{recursive:true});
let draw=`<mxfile host="app.diagrams.net" modified="2026-09-23T00:00:00.000Z" agent="DoAn4" version="24.7.17">`;
let mmdAll='# Sơ đồ quan hệ — 19 bảng\n\nMỗi hình chỉ vẽ quan hệ có bảng con thuộc nhóm. Bảng tham chiếu xuất hiện ở nhiều hình nhưng chỉ có một bảng vật lý. SQL giữ đủ 46 khóa ngoại. Các cột hiển thị được rút gọn, chi tiết ở SQL và trình xem HTML.\n\n';
const coverage=[];
for(const p of trang){
  p.svg=svg(p);p.edges=lienKet(p);
  fs.writeFileSync(path.join(thuMuc,'so-do',p.id+'.svg'),p.svg);
  let mmd='erDiagram\n';
  for(const ten of Object.keys(p.pos))mmd+=`    ${ten} {\n        bigint id PK\n    }\n`;
  for(const ten of p.own)for(const l of bang.get(ten).lienKet){
    mmd+=`    ${l.bangCha} ||--o{ ${ten} : "${l.cot}"\n`;
    coverage.push(`${ten}.${l.cot}->${l.bangCha}.${l.cotCha}`);
  }
  fs.writeFileSync(path.join(thuMuc,'so-do',p.id+'.mmd'),mmd);
  mmdAll+=`## ${p.ten}\n\n\`\`\`mermaid\n${mmd}\`\`\`\n\n`;
  draw+=`<diagram id="${p.id}" name="${x(p.ten)}"><mxGraphModel dx="1300" dy="1000" grid="1" page="1" pageScale="1" pageWidth="${p.w}" pageHeight="${p.h}"><root><mxCell id="0"/><mxCell id="1" parent="0"/>`;
  for(const [ten,[a,b]]of Object.entries(p.pos)){
    const own=p.own.includes(ten),value=`${ten}\n${own?'':'[THAM CHIẾU]\n'}${cotHien(bang.get(ten)).join('\n')}\n\n${tomTat[ten]}`;
    draw+=`<mxCell id="${ten}" value="${x(value)}" style="rounded=1;whiteSpace=wrap;html=0;align=left;verticalAlign=top;spacing=14;fontFamily=Helvetica;fontSize=14;fillColor=${own?'#f0f7f5':'#f5f5f5'};strokeColor=#9aaea8;" vertex="1" parent="1"><mxGeometry x="${a}" y="${b}" width="${W}" height="${H}" as="geometry"/></mxCell>`;
  }
  p.edges.forEach((l,i)=>{draw+=`<mxCell id="e${i}" value="${x(l.cot.join('\n'))}" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=0;endArrow=ERone;startArrow=ERmany;fontSize=10;fontColor=#536761;strokeColor=#81938c;labelBackgroundColor=#ffffff;" edge="1" parent="1" source="${l.con}" target="${l.cha}"><mxGeometry relative="1" as="geometry"/></mxCell>`;});
  draw+='</root></mxGraphModel></diagram>';
}
draw+='</mxfile>';
if(coverage.length!==46||new Set(coverage).size!==46)throw new Error('Sơ đồ thiếu/trùng FK');
fs.writeFileSync(path.join(thuMuc,'so-do-19-bang.drawio'),draw);
fs.writeFileSync(path.join(thuMuc,'SO-DO-QUAN-HE.md'),mmdAll);
const data=JSON.stringify({nhom,bang:[...bang.values()],trang,tomTat}).replace(/</g,'\\u003c');
const html=`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Cơ sở dữ liệu đấu giá · 19 bảng</title><style>
*{box-sizing:border-box}body{margin:0;background:#f3f5f2;color:#20302c;font:14px 'Segoe UI',Arial,sans-serif}button,a{font:inherit}button{cursor:pointer}header{padding:28px 34px 22px;background:#fff;border-bottom:1px solid #dce3de}header small{letter-spacing:2px;color:#77877e;font-size:11px}h1{font-size:28px;margin:9px 0 7px;font-weight:650}p{line-height:1.6}header p{margin:0;color:#65766c;max-width:1000px}.status{float:right;background:#eff5eb;color:#527245;border:1px solid #dce7d4;padding:7px 11px;border-radius:5px;font-size:12px}.layout{display:grid;grid-template-columns:238px minmax(0,1fr);min-height:calc(100vh - 152px)}nav{padding:20px 14px;background:#163a35;color:#c5d8d0}nav label{display:block;padding:12px 12px 8px;font-size:10px;letter-spacing:1.5px;color:#8faea3}nav button{width:100%;text-align:left;border:0;border-radius:5px;background:transparent;color:#dbe5df;padding:12px;margin:2px 0;font-size:13px}nav button.active{background:#e7efdc;color:#21392d;font-weight:650}nav a{display:block;padding:8px 12px;color:#c5d8d0;font-size:12px;text-decoration:none}main{min-width:0;padding:24px}.toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin-bottom:12px}.toolbar h2{font-size:19px;margin:0 auto 0 0}.toolbar button,.toolbar select,.download{background:white;color:#425b50;border:1px solid #ccd7cd;padding:7px 10px;border-radius:4px;text-decoration:none;font-size:12px}.note{font-size:12px;color:#63756a;margin:5px 0 15px}.board{border:1px solid #dce3de;background:#fafbf9;border-radius:7px;overflow:auto;min-height:440px}.board svg{display:block;width:100%;height:auto;min-width:760px}.board svg .node{cursor:pointer}.board svg .node:hover rect,.board svg .node:focus rect{stroke:#39795f;stroke-width:3;outline:0}.board svg .node.selected rect{stroke:#b68a3e;stroke-width:3}.board svg .edge{opacity:.9}.board svg .edge.dim{opacity:.12}.board svg .edge.selected path{stroke:#a27530;stroke-width:3}.board.hide-actors .actor{display:none}.details{margin-top:18px;padding:22px;background:white;border:1px solid #dce3de;border-radius:6px}.details h3{margin:0 0 10px;font-size:18px}.columns{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:5px 24px}.field{padding:8px 0;border-bottom:1px solid #eef1ed;font:12px Consolas,monospace;overflow-wrap:anywhere}.field span{color:#849084;font:11px 'Segoe UI',Arial;float:right}.link-list{padding-left:20px;color:#576b60;line-height:1.8;font-size:12px}.overview{padding:28px}.intro{font-size:21px;margin:0 0 8px}.flow{margin:26px 0;padding:16px 20px;border-left:3px solid #b5944b;background:#eef2e8;color:#456052;line-height:1.9}.groups{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.group{background:white;border:1px solid #d6e0d8;border-radius:7px;padding:20px}.group h3{margin:0 0 14px;font-size:15px;display:flex;justify-content:space-between}.group h3 span{font-weight:400;color:#7c8d81}.group button{display:block;border:0;background:none;color:#436859;padding:6px 0;text-align:left;font:12px Consolas,monospace;overflow-wrap:anywhere}.legend{display:flex;flex-wrap:wrap;gap:20px;font-size:12px;color:#748679;margin-top:14px}.legend b{color:#264b3a}code{font-family:Consolas,monospace}footer{padding:18px 0;color:#7b887f;font-size:11px}@media(max-width:1000px){.layout{grid-template-columns:195px minmax(0,1fr)}main{padding:16px}.groups{grid-template-columns:repeat(2,minmax(0,1fr))}header{padding:22px}.status{float:none;display:inline-block;margin-bottom:12px}}@media(max-width:650px){.layout{display:block}nav{display:flex;overflow:auto;padding:8px}nav label,nav a{display:none}nav button{width:auto;white-space:nowrap}h1{font-size:22px}.groups{grid-template-columns:1fr}.overview{padding:18px}.toolbar h2{width:100%}}@media print{nav,header,.toolbar button,.toolbar select,.download,footer{display:none}.layout{display:block}main{padding:0}.board{overflow:visible;border:0}.board svg{min-width:0}.details{break-before:page}.group{break-inside:avoid}}
</style></head><body><header><span class="status">Bản thiết kế riêng · chưa chuyển backend</span><small>ĐỒ ÁN 4 / THIẾT KẾ DỮ LIỆU</small><h1>Hệ thống đấu giá · 19 bảng</h1><p>Đọc từ tổng quan đến từng nhóm nghiệp vụ. Sơ đồ nhỏ giúp theo dõi quan hệ; SQL vẫn giữ đủ khóa ngoại cần thiết.</p></header><div class="layout"><nav id="menu"></nav><main><div class="toolbar"><h2 id="title">Tổng quan</h2><button id="actors" hidden>Hiện quan hệ tài khoản</button><select id="zoom" aria-label="Độ phóng đại"><option value="100">Vừa khung</option><option value="125">125%</option><option value="150">150%</option><option value="200">200%</option></select><a class="download" id="download" hidden>Tải SVG</a><button id="print">In sơ đồ</button></div><p class="note" id="note"></p><div class="board" id="board"></div><div id="details" class="details" hidden></div><footer>19 bảng vật lý · 46 khóa ngoại · 7 sơ đồ chi tiết. Mũi tên đi từ bảng con đến bảng được tham chiếu. Một đường có thể gộp nhiều FK giữa cùng hai bảng.</footer></main></div><script>
const DATA=${data};
const el=id=>document.getElementById(id);const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let active='overview',showActors=false;
el('menu').innerHTML='<label>THIẾT KẾ 19 BẢNG</label><button data-page="overview">Tổng quan</button><label>SƠ ĐỒ THEO NGHIỆP VỤ</label>'+DATA.trang.map((p,i)=>'<button data-page="'+p.id+'">0'+(i+1)+' &nbsp; '+esc(p.ten)+'</button>').join('')+'<label>TỆP THIẾT KẾ</label><a href="01-tao-csdl-19-bang.sql">SQL tạo cấu trúc</a><a href="so-do-19-bang.drawio">Sơ đồ chỉnh sửa bằng draw.io</a><a href="HUONG-DAN-CSDL.md">Hướng dẫn và chuyển đổi</a>';
function show(id){active=id;const p=DATA.trang.find(p=>p.id===id);document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===id));el('details').hidden=true;el('actors').hidden=!p||p.own.includes('nguoi_dung');el('download').hidden=!p;el('zoom').value='100';el('title').textContent=p?p.ten:'Tổng quan nghiệp vụ';el('board').classList.toggle('hide-actors',!showActors);if(p){el('board').innerHTML=p.svg;el('download').href='so-do/'+p.id+'.svg';el('download').download=p.id+'.svg';el('note').textContent='Bảng xanh thuộc nhóm, bảng xám là tham chiếu. Chọn một bảng để xem đầy đủ cột và khóa ngoại. Quan hệ tài khoản có thể bật riêng để hình gọn hơn.';}else{el('note').textContent='Database thiết kế: doan4_daugia_thiet_ke_19. Database gốc doan4_daugia được giữ nguyên.';el('board').innerHTML='<div class="overview"><h2 class="intro">Một luồng chính, sáu nhóm dữ liệu</h2><p>Gộp các phần phụ thuộc chặt chẽ; giữ tách biệt tiền, lịch sử giao dịch và cam kết bí mật.</p><div class="flow">Xác minh người bán → Duyệt sản phẩm → Đấu giá → Thanh toán mô phỏng → Giao và kiểm tra hàng → Hoàn tất / Admin xử lý tranh chấp</div><div class="groups">'+DATA.nhom.map(n=>'<section class="group"><h3>'+esc(n.ten)+'<span>'+n.bang.length+' bảng</span></h3>'+n.bang.map(b=>'<button data-bang="'+b.ten+'">'+esc(b.ten)+'</button>').join('')+'</section>').join('')+'</div><div class="legend"><span><b>JSON:</b> thuộc tính và bộ bước giá</span><span><b>Gộp vào đơn:</b> giữ tiền, vận chuyển</span><span><b>Riêng tư:</b> trần, hồ sơ, bằng chứng</span></div></div>';}}
function detail(ten){const b=DATA.bang.find(b=>b.ten===ten);if(!b)return;el('details').hidden=false;el('details').innerHTML='<h3>'+esc(ten)+'</h3><p class="note">'+esc(DATA.tomTat[ten])+'. '+b.cot.length+' cột; '+b.lienKet.length+' khóa ngoại. Kiểu/enum/ràng buộc đầy đủ xem tệp SQL.</p><div class="columns">'+b.cot.map(c=>'<div class="field">'+esc(c.ten)+'<span>'+esc(c.kieu)+'</span></div>').join('')+'</div><ul class="link-list">'+b.lienKet.map(l=>'<li><code>'+esc(l.cot)+'</code> → <code>'+esc(l.bangCha)+'.'+esc(l.cotCha)+'</code></li>').join('')+'</ul>';el('board').querySelectorAll('.node').forEach(n=>n.classList.toggle('selected',n.dataset.bang===ten));el('board').querySelectorAll('.edge').forEach(e=>{const yes=e.dataset.con===ten||e.dataset.cha===ten;e.classList.toggle('selected',yes);e.classList.toggle('dim',!yes);});}
document.addEventListener('click',e=>{const page=e.target.closest('[data-page]');if(page){show(page.dataset.page);return;}const b=e.target.closest('[data-bang]');if(b)detail(b.dataset.bang);});document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('[data-bang]'))detail(e.target.dataset.bang);});el('actors').onclick=()=>{showActors=!showActors;el('board').classList.toggle('hide-actors',!showActors);el('actors').textContent=showActors?'Ẩn quan hệ tài khoản':'Hiện quan hệ tài khoản';};el('zoom').onchange=()=>{const s=el('board').querySelector('svg');if(s)s.style.width=el('zoom').value+'%';};el('print').onclick=()=>window.print();show('overview');
</script></body></html>`;
fs.writeFileSync(path.join(thuMuc,'so-do-csdl.html'),html);
console.log(JSON.stringify({soTrang:trang.length,khoaNgoaiDuocVe:coverage.length,html:'so-do-csdl.html',drawio:'so-do-19-bang.drawio'}));
