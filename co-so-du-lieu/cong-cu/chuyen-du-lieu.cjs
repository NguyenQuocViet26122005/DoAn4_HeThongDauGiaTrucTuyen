// Chuyển đổi có bản sao và đối chiếu. Không có DROP DATABASE.
// --chuan-bi: sao lưu 27 bảng và chuyển thử vào database thiết kế.
// --ap-dung: chỉ sau khi backend/test đạt; thay bảng trong database gốc bằng bản đã đối chiếu.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const pool = require('../../backend/dist/config/co-so-du-lieu');
const thuMuc = path.resolve(__dirname, '..');
const tepTrangThai = path.join(thuMuc, 'trang-thai-chuyen-doi.json');
const nguon = 'doan4_daugia';
const dich = 'doan4_daugia_thiet_ke_19';
const moHinh = JSON.parse(fs.readFileSync(path.join(thuMuc, 'mo-hinh.json'), 'utf8')).flatMap(n=>n.bang);
const bangMoi = moHinh.map(b=>b.ten);
const q = s => {assert(/^[a-zA-Z0-9_]+$/.test(s));return '`'+s+'`';};
const full = (schema,table) => q(schema)+'.'+q(table);
const giaTriJSON = v => typeof v==='string' ? JSON.parse(v) : v;

async function cacBang(c,schema) {
  return (await c.execute("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME",[schema]))[0].map(r=>r.TABLE_NAME);
}
async function cacCot(c,schema,table) {
  return (await c.execute('SELECT COLUMN_NAME,EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? ORDER BY ORDINAL_POSITION',[schema,table]))[0]
    .filter(r=>!/(STORED|VIRTUAL) GENERATED/.test(r.EXTRA)).map(r=>r.COLUMN_NAME);
}
async function dauVan(c,schema) {
  const ketQua={};
  for(const table of await cacBang(c,schema)) {
    const cols=await cacCot(c,schema,table);
    const [rows]=await c.query(`SELECT SHA2(CAST(JSON_ARRAY(${cols.map(q).join(',')}) AS CHAR),256) AS ma FROM ${full(schema,table)} ORDER BY id`);
    // Chỉ dấu vân tay, không in/lưu các trường tài khoản hay mức giá bí mật.
    ketQua[table]={so_dong:rows.length,ma:crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex')};
  }
  return ketQua;
}
async function saoChepCauTruc(c,tu,sang) {
  await c.query('USE '+q(sang));
  await c.query('SET FOREIGN_KEY_CHECKS=0');
  try {
    for(const table of await cacBang(c,tu)) {
      const [[ddl]]=await c.query('SHOW CREATE TABLE '+full(tu,table));
      await c.query(ddl['Create Table'].replaceAll(q(tu)+'.',q(sang)+'.'));
    }
  } finally {await c.query('SET FOREIGN_KEY_CHECKS=1');}
}
async function saoChepDuLieu(c,tu,sang,thuTu) {
  for(const table of thuTu){const cols=await cacCot(c,tu,table);await c.query(`INSERT INTO ${full(sang,table)} (${cols.map(q).join(',')}) SELECT ${cols.map(q).join(',')} FROM ${full(tu,table)}`);}
}
async function saoChepViewTrigger(c,tu,sang) {
  await c.query('USE '+q(sang));
  const [views]=await c.execute('SELECT TABLE_NAME FROM information_schema.VIEWS WHERE TABLE_SCHEMA=?',[tu]);
  for(const v of views){const [[ddl]]=await c.query('SHOW CREATE VIEW '+full(tu,v.TABLE_NAME));await c.query(ddl['Create View'].replaceAll(q(tu)+'.',q(sang)+'.'));}
  const [trs]=await c.execute('SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA=?',[tu]);
  for(const t of trs){const [[ddl]]=await c.query('SHOW CREATE TRIGGER '+full(tu,t.TRIGGER_NAME));await c.query(ddl['SQL Original Statement'].replaceAll(q(tu)+'.',q(sang)+'.'));}
}
async function thuTuBangCu(){
  const sql=fs.readFileSync(path.join(thuMuc,'lich-su/cau-truc-27-bang.sql'),'utf8');
  return [...sql.matchAll(/CREATE TABLE (\w+) \(/g)].map(m=>m[1]);
}
async function chuanBi(c) {
  assert(!fs.existsSync(tepTrangThai),'KIEM_TRA: Đã có trạng thái chuyển đổi; không tạo thêm bản sao tự động.');
  assert.equal((await cacBang(c,nguon)).length,27);
  assert.equal((await cacBang(c,dich)).length,19);
  // Bản thiết kế phải chỉ có đúng dữ liệu khởi tạo do công cụ này sinh.
  const seed=await dauVan(c,dich);
  for(const [ten,r]of Object.entries(seed))assert.equal(r.so_dong,ten==='danh_muc'?5:ten==='cau_hinh_he_thong'?8:0,'KIEM_TRA: Database thiết kế có dữ liệu ngoài cấu hình mẫu.');
  const backup='doan4_daugia_sao_luu_'+new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);
  const truoc=await dauVan(c,nguon);
  const thuTu=await thuTuBangCu();assert.equal(thuTu.length,27);
  await c.query('CREATE DATABASE '+q(backup)+' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  await saoChepCauTruc(c,nguon,backup);
  await c.beginTransaction();
  try {await saoChepDuLieu(c,nguon,backup,thuTu);assert.deepEqual(await dauVan(c,backup),truoc);assert.deepEqual(await dauVan(c,nguon),truoc);await c.commit();}
  catch(e){await c.rollback();throw e;}
  await saoChepViewTrigger(c,nguon,backup);
  const trangThai={giai_doan:'DA_SAO_LUU',nguon,dich,backup,thu_tu_bang_cu:thuTu,dau_van_nguon:truoc,ngay_tao:new Date().toISOString()};
  fs.writeFileSync(tepTrangThai,JSON.stringify(trangThai,null,2)+'\n');
  console.log('Đã sao lưu và đối chiếu đủ 27 bảng; bắt đầu chuyển thử.');
  await chuyenThu(c,trangThai);
}
async function chuyenThu(c,t) {
  const b=t.backup;
  await c.query('USE '+q(dich));
  await c.beginTransaction();
  try {
    await c.query('DELETE FROM '+full(dich,'cau_hinh_he_thong'));
    await c.query('DELETE FROM '+full(dich,'danh_muc'));
    const moi=new Set(['tham_gia_phien','tep_dinh_kem','yeu_cau_xu_ly']);
    for(const ten of bangMoi) {
      if(moi.has(ten))continue;
      const cols=await cacCot(c,b,ten);
      let extra='',selectExtra='';
      if(ten==='de_nghi_mua_tiep_theo') {
        extra=',luot_tra_gia_nguon_id';
        selectExtra=`,(SELECT l.id FROM ${full(b,'luot_tra_gia')} l JOIN ${full(b,'phien_dau_gia')} p ON p.id=l.phien_dau_gia_id
          WHERE l.phien_dau_gia_id=o.phien_dau_gia_id AND l.nguoi_tra_gia_id=o.nguoi_tra_gia_id AND l.so_tien=o.gia_de_nghi
            AND l.ngay_tao>=p.thoi_gian_bat_dau AND l.ngay_tao<=p.thoi_gian_ket_thuc ORDER BY l.ngay_tao DESC,l.id DESC LIMIT 1)`;
      }
      await c.query(`INSERT INTO ${full(dich,ten)} (${cols.map(q).join(',')}${extra}) SELECT ${cols.map(k=>'o.'+q(k)).join(',')}${selectExtra} FROM ${full(b,ten)} o ORDER BY o.id`);
    }
    // Metadata thuộc tính: ID cũ nằm trong JSON; API vẫn nhận thuoc_tinh_id.
    const [dm]=await c.query('SELECT id FROM '+full(b,'danh_muc'));
    for(const d of dm){const [a]=await c.execute('SELECT * FROM '+full(b,'thuoc_tinh_danh_muc')+' WHERE danh_muc_id=? ORDER BY thu_tu,id',[d.id]);for(const x of a)if(x.lua_chon_json)x.lua_chon_json=giaTriJSON(x.lua_chon_json);await c.execute('UPDATE '+full(dich,'danh_muc')+' SET cau_hinh_thuoc_tinh=?,ngay_cap_nhat=ngay_cap_nhat WHERE id=?',[JSON.stringify(a),d.id]);}
    const [sp]=await c.query('SELECT id FROM '+full(b,'san_pham'));
    for(const p of sp){const [v]=await c.execute(`SELECT g.*,t.ten_thuoc_tinh,t.khoa_thuoc_tinh,t.kieu_nhap,t.don_vi,t.thu_tu FROM ${full(b,'gia_tri_thuoc_tinh_san_pham')} g JOIN ${full(b,'thuoc_tinh_danh_muc')} t ON t.id=g.thuoc_tinh_id WHERE g.san_pham_id=? ORDER BY t.thu_tu,t.id`,[p.id]);const obj=Object.fromEntries(v.map(x=>[x.khoa_thuoc_tinh,x]));await c.execute('UPDATE '+full(dich,'san_pham')+' SET thuoc_tinh_json=?,ngay_cap_nhat=ngay_cap_nhat WHERE id=?',[JSON.stringify(obj),p.id]);}
    const [buoc]=await c.query('SELECT * FROM '+full(b,'buoc_gia')+' ORDER BY gia_tu,id');
    await c.execute(`INSERT INTO ${full(dich,'cau_hinh_he_thong')} (khoa_cau_hinh,gia_tri_cau_hinh,kieu_du_lieu,mo_ta) VALUES ('BUOC_GIA',?,'JSON','Bộ bước giá chuyển nguyên từ bảng cũ')`,[JSON.stringify(buoc)]);
    await c.query(`INSERT INTO ${full(dich,'cau_hinh_he_thong')} (khoa_cau_hinh,gia_tri_cau_hinh,kieu_du_lieu,mo_ta) VALUES ('BUYER_NON_RECEIPT_DAYS','7','SO','Mốc khiếu nại chưa nhận từ ngày khai báo gửi')`);
    await c.query(`INSERT INTO ${full(dich,'tham_gia_phien')} (id,phien_dau_gia_id,nguoi_dung_id,gia_toi_da,thoi_gian_dat_gia_toi_da,ngay_tao,ngay_cap_nhat)
      SELECT id,phien_dau_gia_id,nguoi_tra_gia_id,gia_toi_da,thoi_gian_dat_gia_toi_da,ngay_tao,ngay_cap_nhat FROM ${full(b,'muc_gia_toi_da')}`);
    await c.query(`UPDATE ${full(dich,'tham_gia_phien')} t JOIN ${full(b,'danh_sach_theo_doi')} w ON w.phien_dau_gia_id=t.phien_dau_gia_id AND w.nguoi_dung_id=t.nguoi_dung_id SET t.dang_theo_doi=1,t.ngay_theo_doi=w.ngay_tao,t.ngay_cap_nhat=t.ngay_cap_nhat`);
    await c.query(`INSERT INTO ${full(dich,'tham_gia_phien')} (phien_dau_gia_id,nguoi_dung_id,dang_theo_doi,ngay_theo_doi,ngay_tao,ngay_cap_nhat)
      SELECT w.phien_dau_gia_id,w.nguoi_dung_id,1,w.ngay_tao,w.ngay_tao,w.ngay_tao FROM ${full(b,'danh_sach_theo_doi')} w WHERE NOT EXISTS
      (SELECT 1 FROM ${full(dich,'tham_gia_phien')} t WHERE t.phien_dau_gia_id=w.phien_dau_gia_id AND t.nguoi_dung_id=w.nguoi_dung_id)`);
    await c.query(`INSERT INTO ${full(dich,'tep_dinh_kem')} (id,loai_tep,san_pham_id,duong_dan_tep,la_anh_chinh,thu_tu,ngay_tao)
      SELECT id,'ANH_SAN_PHAM',san_pham_id,duong_dan_anh,la_anh_chinh,thu_tu,ngay_tao FROM ${full(b,'hinh_anh_san_pham')}`);
    const [[maxAnh]]=await c.query('SELECT COALESCE(MAX(id),0) AS id FROM '+full(b,'hinh_anh_san_pham'));
    await c.execute(`INSERT INTO ${full(dich,'tep_dinh_kem')} (id,loai_tep,tranh_chap_id,nguoi_tai_len_id,duong_dan_tep,loai_noi_dung,mo_ta,ngay_tao)
      SELECT id+?,'BANG_CHUNG_TRANH_CHAP',tranh_chap_id,nguoi_tai_len_id,duong_dan_tep,loai_bang_chung,mo_ta,ngay_tao FROM ${full(b,'bang_chung_tranh_chap')}`,[maxAnh.id]);
    await c.query(`INSERT INTO ${full(dich,'yeu_cau_xu_ly')} (id,loai_yeu_cau,phien_dau_gia_id,nguoi_yeu_cau_id,ly_do,trang_thai,nguoi_duyet_id,ghi_chu_duyet,ngay_duyet,ngay_tao,ngay_cap_nhat)
      SELECT id,'HUY_PHIEN',phien_dau_gia_id,nguoi_yeu_cau_id,ly_do,trang_thai,nguoi_duyet_id,ghi_chu_duyet,ngay_duyet,ngay_tao,ngay_tao FROM ${full(b,'yeu_cau_huy_phien')}`);
    await c.query(`UPDATE ${full(dich,'don_hang')} d JOIN ${full(b,'giu_tien_trung_gian')} g ON g.don_hang_id=d.id SET
      d.giu_tien_id_cu=g.id,d.trang_thai_giu_tien=g.trang_thai,d.so_tien_da_thu=IF(g.trang_thai='CHO_GIU_TIEN',0,g.so_tien),
      d.so_tien_da_hoan=CASE WHEN g.trang_thai='DA_HOAN_TIEN' THEN g.so_tien WHEN g.trang_thai='HOAN_TIEN_MOT_PHAN' THEN
        (SELECT SUM(t.so_tien_hoan) FROM ${full(b,'tranh_chap')} t WHERE t.don_hang_id=d.id AND t.trang_thai='GIAI_QUYET_CHO_NGUOI_MUA') ELSE 0 END,
      d.so_tien_da_giai_ngan=CASE WHEN g.trang_thai='DA_GIAI_NGAN' THEN g.so_tien WHEN g.trang_thai='HOAN_TIEN_MOT_PHAN' THEN
        g.so_tien-(SELECT SUM(t.so_tien_hoan) FROM ${full(b,'tranh_chap')} t WHERE t.don_hang_id=d.id AND t.trang_thai='GIAI_QUYET_CHO_NGUOI_MUA') ELSE 0 END,
      d.du_lieu_lich_su=1,d.ngay_bat_dau_giu=g.ngay_bat_dau_giu,d.ngay_giai_ngan=g.ngay_giai_ngan,d.ngay_hoan_tien=g.ngay_hoan_tien,
      d.ghi_chu_giu_tien=g.ghi_chu,d.giu_tien_ngay_tao=g.ngay_tao,d.giu_tien_ngay_cap_nhat=g.ngay_cap_nhat,d.ngay_cap_nhat=d.ngay_cap_nhat`);
    await c.query(`UPDATE ${full(dich,'don_hang')} d JOIN ${full(b,'van_chuyen')} v ON v.don_hang_id=d.id SET
      d.van_chuyen_id_cu=v.id,d.don_vi_van_chuyen=v.don_vi_van_chuyen,d.ma_van_don=v.ma_van_don,d.trang_thai_van_chuyen=v.trang_thai,
      d.ngay_gui_hang=v.ngay_gui_hang,d.ngay_giao_van_chuyen=v.ngay_giao_hang,d.van_chuyen_ngay_tao=v.ngay_tao,d.van_chuyen_ngay_cap_nhat=v.ngay_cap_nhat,
      d.moc_khieu_nai_chua_nhan=IF(v.ngay_gui_hang IS NULL,NULL,DATE_ADD(v.ngay_gui_hang,INTERVAL 7 DAY)),d.ngay_cap_nhat=d.ngay_cap_nhat`);
    await c.query(`UPDATE ${full(dich,'phien_dau_gia')} p JOIN (SELECT phien_dau_gia_id,MIN(phi_van_chuyen) AS phi FROM ${full(b,'don_hang')} GROUP BY phien_dau_gia_id) d ON d.phien_dau_gia_id=p.id SET p.phi_van_chuyen=d.phi,p.ngay_cap_nhat=p.ngay_cap_nhat`);
    await c.query(`INSERT INTO ${full(dich,'nhat_ky_hoat_dong')} (hanh_dong,loai_doi_tuong,doi_tuong_id,phien_dau_gia_id,luot_tra_gia_id,du_lieu_moi,ngay_tao)
      SELECT 'GIA_HAN_PHIEN','phien_dau_gia',phien_dau_gia_id,phien_dau_gia_id,luot_tra_gia_kich_hoat_id,
        JSON_OBJECT('gia_han_id_cu',id,'thoi_gian_ket_thuc_cu',thoi_gian_ket_thuc_cu,'thoi_gian_ket_thuc_moi',thoi_gian_ket_thuc_moi,'so_giay_them',so_giay_them),ngay_tao FROM ${full(b,'gia_han_phien_dau_gia')}`);
    // Cột cũ của tất cả bảng còn lại phải giữ nguyên từng trường.
    for(const ten of bangMoi){if(moi.has(ten))continue;const cols=await cacCot(c,b,ten);const [khac]=await c.query(`SELECT s.id FROM ${full(b,ten)} s LEFT JOIN ${full(dich,ten)} d ON d.id=s.id WHERE d.id IS NULL OR NOT (${cols.map(k=>`s.${q(k)} <=> d.${q(k)}`).join(' AND ')})`);assert.equal(khac.length,0,'KIEM_TRA: Cột lịch sử thay đổi ở '+ten);}
    const [[camKet]]=await c.query(`SELECT COUNT(*) AS sai FROM ${full(b,'muc_gia_toi_da')} m LEFT JOIN ${full(dich,'tham_gia_phien')} t ON t.phien_dau_gia_id=m.phien_dau_gia_id AND t.nguoi_dung_id=m.nguoi_tra_gia_id WHERE t.id IS NULL OR t.gia_toi_da<>m.gia_toi_da OR t.thoi_gian_dat_gia_toi_da<>m.thoi_gian_dat_gia_toi_da`);assert.equal(Number(camKet.sai),0);
    await c.commit();
    t.giai_doan='DA_CHUYEN_THU';t.dich_sau_chuyen=await dauVan(c,dich);t.anh_id_bang_chung_cong_them=String(maxAnh.id);t.ngay_chuyen_thu=new Date().toISOString();
    fs.writeFileSync(tepTrangThai,JSON.stringify(t,null,2)+'\n');
    console.log('Chuyển thử 27 → 19 bảng đạt; giữ nguyên các cột lịch sử và mức cam kết.');
  }catch(e){await c.rollback();throw e;}
}
async function xoaCauTrucDeThay(c,schema,expected) {
  assert.equal(schema,nguon,'KIEM_TRA: Chỉ được thay schema gốc đã sao lưu.');
  const ds=await cacBang(c,schema);
  assert(ds.every(t=>expected.includes(t)),'KIEM_TRA: Có bảng ngoài phạm vi đã sao lưu.');
  const [v]=await c.execute('SELECT TABLE_NAME FROM information_schema.VIEWS WHERE TABLE_SCHEMA=?',[schema]);
  for(const x of v)await c.query('DROP VIEW '+full(schema,x.TABLE_NAME));
  await c.query('SET FOREIGN_KEY_CHECKS=0');
  try{for(const ten of ds)await c.query('DROP TABLE '+full(schema,ten));}
  finally{await c.query('SET FOREIGN_KEY_CHECKS=1');}
}
async function apDung(c) {
  const t=JSON.parse(fs.readFileSync(tepTrangThai,'utf8'));
  assert.equal(t.giai_doan,'DA_CHUYEN_THU');
  assert.deepEqual(await dauVan(c,nguon),t.dau_van_nguon,'KIEM_TRA: Nguồn thay đổi sau sao lưu; dừng chuyển.');
  assert.deepEqual(await dauVan(c,t.backup),t.dau_van_nguon,'KIEM_TRA: Bản sao không còn khớp.');
  assert.deepEqual(await dauVan(c,dich),t.dich_sau_chuyen,'KIEM_TRA: Bản chuyển thử có thay đổi dữ liệu chưa đối chiếu.');
  try{
    await xoaCauTrucDeThay(c,nguon,t.thu_tu_bang_cu);
    await saoChepCauTruc(c,dich,nguon);
    await c.beginTransaction();await saoChepDuLieu(c,dich,nguon,bangMoi);await c.commit();
    await saoChepViewTrigger(c,dich,nguon);
    assert.deepEqual(await dauVan(c,nguon),t.dich_sau_chuyen);
    t.giai_doan='DA_AP_DUNG';t.ngay_ap_dung=new Date().toISOString();fs.writeFileSync(tepTrangThai,JSON.stringify(t,null,2)+'\n');
    console.log(JSON.stringify({daChuyen:nguon,soBang:19,banSaoGiuLai:t.backup}));
  }catch(e){
    await c.rollback();
    console.error('Chuyển chính thức lỗi, đang phục hồi bản 27 bảng đã đối chiếu.');
    await xoaCauTrucDeThay(c,nguon,[...new Set([...t.thu_tu_bang_cu,...bangMoi])]);
    await saoChepCauTruc(c,t.backup,nguon);await c.beginTransaction();await saoChepDuLieu(c,t.backup,nguon,t.thu_tu_bang_cu);await c.commit();await saoChepViewTrigger(c,t.backup,nguon);
    assert.deepEqual(await dauVan(c,nguon),t.dau_van_nguon);throw e;
  }
}
(async()=>{
  const c=await pool.getConnection();
  try{
    await c.query("SET time_zone='+07:00'");
    if(process.argv[2]==='--chuan-bi')await chuanBi(c);
    else if(process.argv[2]==='--thu-lai') {const t=JSON.parse(fs.readFileSync(tepTrangThai,'utf8'));assert.equal(t.giai_doan,'DA_SAO_LUU');await chuyenThu(c,t);}
    else if(process.argv[2]==='--ap-dung')await apDung(c);
    else throw new Error('KIEM_TRA: Dùng --chuan-bi, --thu-lai hoặc --ap-dung.');
  }finally{c.release();}
})().catch(e=>{console.error(e.code||e.name,e.message?.startsWith('KIEM_TRA:')?e.message:'Chi tiết dữ liệu không được in.');process.exitCode=1;}).finally(()=>pool.end());
