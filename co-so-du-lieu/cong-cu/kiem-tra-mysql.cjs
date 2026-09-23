// Chỉ tạo/kiểm thử database THIẾT KẾ cố định, không chuyển dữ liệu hay đổi DB_NAME.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const thuMuc = path.resolve(__dirname, '..');
const pool = require('../../backend/dist/config/co-so-du-lieu');
const dich = 'doan4_daugia_thiet_ke_19';
const nguon = 'doan4_daugia';
const cheDo = process.argv[2];
if (!['--tao','--kiem-tra'].includes(cheDo)) {
  console.error('Dùng --tao cho database thiết kế chưa tồn tại, hoặc --kiem-tra để thử bằng transaction rollback.');
  process.exitCode = 1;
  pool.end();
} else main().catch(e=>{
  console.error('Không hoàn tất:', e.code || e.name, e.message?.startsWith('KIEM_TRA:') ? e.message : 'Xem vị trí bước ở trên; không in cấu hình kết nối.');
  process.exitCode=1;
}).finally(()=>pool.end());

function tachLenh(sql) {
  let ngan=';', khoi=''; const lenh=[];
  for(const dong of sql.split(/\r?\n/)) {
    if(dong.trim().startsWith('--')) continue;
    const doi=dong.match(/^DELIMITER\s+(\S+)/i);
    if(doi) {assert.equal(khoi.trim(),''); ngan=doi[1]; continue;}
    khoi+=dong+'\n';
    if(khoi.trimEnd().endsWith(ngan)) {lenh.push(khoi.trimEnd().slice(0,-ngan.length).trim()); khoi='';}
  }
  assert.equal(khoi.trim(),'');
  return lenh.filter(Boolean);
}
async function chupNguon(c) {
  const [cot]=await c.query('SELECT TABLE_NAME,COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME,ORDINAL_POSITION',[nguon]);
  const [bang]=await c.query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME",[nguon]);
  const dem=[];
  for(const b of bang){assert(/^\w+$/.test(b.TABLE_NAME));const [[r]]=await c.query('SELECT COUNT(*) AS so_dong FROM `'+nguon+'`.`'+b.TABLE_NAME+'`');dem.push({bang:b.TABLE_NAME,so_dong:String(r.so_dong)});}
  return {so_bang:bang.length,dem_dong:dem,ma_cau_truc:crypto.createHash('sha256').update(JSON.stringify(cot)).digest('hex')};
}
async function main() {
  const c=await pool.getConnection();
  const ketQua=[];
  try {
    const truoc=await chupNguon(c);
    if(cheDo==='--tao') {
      const [co]=await c.query('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?',[dich]);
      assert.equal(co.length,0,'KIEM_TRA: Database thiết kế đã tồn tại; không ghi đè.');
      let i=0;
      for(const tep of ['01-tao-csdl-19-bang.sql','02-du-lieu-cau-hinh.sql']) {
        for(const sql of tachLenh(fs.readFileSync(path.join(thuMuc,tep),'utf8'))) {
          assert(!/\b(?:DROP|TRUNCATE)\b/i.test(sql));
          try {await c.query(sql);} catch(e){console.error(`Lỗi DDL tại ${tep}, lệnh ${i+1}: ${e.code}`);throw e;}
          i++;
        }
      }
      console.log('Đã tạo database thiết kế riêng và cấu hình công khai.');
    }
    await c.query('USE `'+dich+'`');
    await c.query("SET time_zone='+07:00'");
    const [[current]]=await c.query('SELECT DATABASE() AS ten, VERSION() AS phien_ban');
    assert.equal(current.ten,dich);
    const [bang]=await c.query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE'",[dich]);
    assert.equal(bang.length,19);
    const moHinh=JSON.parse(fs.readFileSync(path.join(thuMuc,'mo-hinh.json'),'utf8')).flatMap(n=>n.bang);
    assert.deepEqual(bang.map(b=>b.TABLE_NAME).sort(),moHinh.map(b=>b.ten).sort());
    const [fk]=await c.query('SELECT TABLE_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND REFERENCED_TABLE_NAME IS NOT NULL',[dich]);
    assert.equal(fk.length,46);
    for(const b of moHinh)for(const l of b.lienKet)assert(fk.some(x=>x.TABLE_NAME===b.ten&&x.COLUMN_NAME===l.cot&&x.REFERENCED_TABLE_NAME===l.bangCha&&x.REFERENCED_COLUMN_NAME===l.cotCha));
    const [col]=await c.query('SELECT TABLE_NAME,COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=?',[dich]);
    for(const b of moHinh)for(const cot of b.cot)assert(col.some(x=>x.TABLE_NAME===b.ten&&x.COLUMN_NAME===cot.ten));
    const [[tr]]=await c.query('SELECT COUNT(*) AS so FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA=?',[dich]);
    assert.equal(Number(tr.so),6);
    assert(!col.some(x=>x.TABLE_NAME.startsWith('v_')&&x.COLUMN_NAME==='gia_toi_da'));

    await c.beginTransaction();
    try {
      const them=async(sql,params=[]) => String((await c.execute(sql,params))[0].insertId);
      const loi=async(sql,params,ma)=>{
        let biChan=false;
        try{await c.execute(sql,params);}catch(e){assert.equal(e.code,ma);biChan=true;}
        assert(biChan,'KIEM_TRA: Lệnh sai đã không bị chặn.');
      };
      const ca=async(ten,fn)=>{
        await c.query('SAVEPOINT ca_kiem_thu');
        try{await fn();ketQua.push({ten,dat:true});}
        catch(e){console.error('Ca không đạt:',ten);throw e;}
        finally{await c.query('ROLLBACK TO SAVEPOINT ca_kiem_thu');}
      };
      const nguoi=async(ten)=>them('INSERT INTO nguoi_dung (ho_ten,email,mat_khau_bam) VALUES (?,?,?)',[ten,crypto.randomUUID()+'@kiem-thu.invalid','KHONG_PHAI_MAT_KHAU_SU_DUNG']);
      const ban=await nguoi('Người bán kiểm thử'), mua=await nguoi('Người mua kiểm thử'), mua2=await nguoi('Người mua thứ hai');
      const dm=await them('INSERT INTO danh_muc (ten,duong_dan) VALUES (?,?)',['Danh mục kiểm thử',crypto.randomUUID()]);
      const sp=await them("INSERT INTO san_pham (nguoi_ban_id,danh_muc_id,tieu_de,duong_dan,mo_ta,tinh_trang_san_pham,trang_thai_duyet) VALUES (?,?,?,?,?,'MOI','DA_DUYET')",[ban,dm,'Sản phẩm kiểm thử',crypto.randomUUID(),'Chỉ tồn tại trong transaction rollback']);
      const phien=await them("INSERT INTO phien_dau_gia (san_pham_id,gia_khoi_diem,gia_hien_tai,thoi_gian_bat_dau,thoi_gian_ket_thuc_goc,thoi_gian_ket_thuc,trang_thai) VALUES (?,10000,100000,'2026-01-01','2099-01-01','2099-01-01','DA_KET_THUC')",[sp]);
      const tham=await them('INSERT INTO tham_gia_phien (phien_dau_gia_id,nguoi_dung_id,dang_theo_doi,gia_toi_da,thoi_gian_dat_gia_toi_da) VALUES (?,?,1,200000,NOW())',[phien,mua]);
      const luot=await them('INSERT INTO luot_tra_gia (phien_dau_gia_id,nguoi_tra_gia_id,so_tien) VALUES (?,?,100000)',[phien,mua]);
      const luot2=await them('INSERT INTO luot_tra_gia (phien_dau_gia_id,nguoi_tra_gia_id,so_tien) VALUES (?,?,90000)',[phien,mua2]);
      const taoDon=(trangThai='DA_HUY')=>them('INSERT INTO don_hang (ma_don_hang,phien_dau_gia_id,nguoi_mua_id,nguoi_ban_id,gia_san_pham,phi_van_chuyen,tong_tien,trang_thai,ten_nguoi_nhan,sdt_nguoi_nhan,dia_chi_giao_hang) VALUES (?,?,?,?,100000,10000,110000,?,?,?,?)',[crypto.randomUUID().slice(0,25),phien,mua2,ban,trangThai,'Kiểm thử','0000000000','Dữ liệu kiểm thử']);
      const don=await taoDon();
      const tranh=await them("INSERT INTO tranh_chap (don_hang_id,nguoi_mo_id,ly_do,mo_ta) VALUES (?,?,'KHAC','Bằng chứng kiểm thử')",[don,mua2]);
      const maCK='ER_CHECK_CONSTRAINT_VIOLATED';
      await ca('JSON thuộc tính đúng kiểu và giữ snapshot',async()=>{
        await c.execute('UPDATE danh_muc SET cau_hinh_thuoc_tinh=? WHERE id=?',[JSON.stringify([{khoa:'ram',ten:'RAM',kieu:'SO',don_vi:'GB',bat_buoc:true}]),dm]);
        await c.execute('UPDATE san_pham SET thuoc_tinh_json=? WHERE id=?',[JSON.stringify({ram:{gia_tri:16,ten:'RAM',kieu:'SO',don_vi:'GB'}}),sp]);
      });
      await ca('Chặn kiểu JSON thuộc tính sai',()=>loi("UPDATE san_pham SET thuoc_tinh_json='[]' WHERE id=?",[sp],maCK));
      await ca('Chặn cấu hình JSON hỏng',()=>loi("INSERT INTO cau_hinh_he_thong (khoa_cau_hinh,gia_tri_cau_hinh,kieu_du_lieu) VALUES ('THU_SAI','sai','JSON')",[],maCK));
      await ca('Theo dõi không tạo cam kết',async()=>{
        const id=await them('INSERT INTO tham_gia_phien (phien_dau_gia_id,nguoi_dung_id,dang_theo_doi) VALUES (?,?,1)',[phien,mua2]);
        const [[r]]=await c.execute('SELECT gia_toi_da FROM tham_gia_phien WHERE id=?',[id]);assert.equal(r.gia_toi_da,null);
      });
      await ca('Bỏ theo dõi giữ nguyên trần và thời điểm ưu tiên',async()=>{
        const [[truoc]]=await c.execute('SELECT gia_toi_da,thoi_gian_dat_gia_toi_da FROM tham_gia_phien WHERE id=?',[tham]);
        await c.execute('UPDATE tham_gia_phien SET dang_theo_doi=0 WHERE id=?',[tham]);
        const [[sau]]=await c.execute('SELECT gia_toi_da,thoi_gian_dat_gia_toi_da FROM tham_gia_phien WHERE id=?',[tham]);assert.deepEqual(sau,truoc);
      });
      await ca('Chặn tham gia trùng người/phiên',()=>loi('INSERT INTO tham_gia_phien (phien_dau_gia_id,nguoi_dung_id) VALUES (?,?)',[phien,mua],'ER_DUP_ENTRY'));
      await ca('Chặn người bán đặt trần',()=>loi('INSERT INTO tham_gia_phien (phien_dau_gia_id,nguoi_dung_id,gia_toi_da,thoi_gian_dat_gia_toi_da) VALUES (?,?,100000,NOW())',[phien,ban],'ER_SIGNAL_EXCEPTION'));
      await ca('Người bán có thể theo dõi nhưng không đổi thành đặt trần',async()=>{
        const id=await them('INSERT INTO tham_gia_phien (phien_dau_gia_id,nguoi_dung_id,dang_theo_doi) VALUES (?,?,1)',[phien,ban]);
        await loi('UPDATE tham_gia_phien SET gia_toi_da=100000,thoi_gian_dat_gia_toi_da=NOW() WHERE id=?',[id],'ER_SIGNAL_EXCEPTION');
      });
      await ca('Chặn người bán tự trả giá công khai',()=>loi('INSERT INTO luot_tra_gia (phien_dau_gia_id,nguoi_tra_gia_id,so_tien) VALUES (?,?,100000)',[phien,ban],'ER_SIGNAL_EXCEPTION'));
      await ca('Chặn đổi lượt công khai sang người bán',()=>loi('UPDATE luot_tra_gia SET nguoi_tra_gia_id=? WHERE id=?',[ban,luot],'ER_SIGNAL_EXCEPTION'));
      await ca('Chặn khóa ngoại mồ côi',()=>loi('INSERT INTO tham_gia_phien (phien_dau_gia_id,nguoi_dung_id) VALUES (18446744073709551614,?)',[mua],'ER_NO_REFERENCED_ROW_2'));
      await ca('Chặn cam kết thiếu thời điểm',()=>loi('INSERT INTO tham_gia_phien (phien_dau_gia_id,nguoi_dung_id,gia_toi_da) VALUES (?,?,50000)',[phien,mua2],maCK));
      await ca('Chặn tổng đơn sai',()=>loi('UPDATE don_hang SET tong_tien=1 WHERE id=?',[don],maCK));
      await ca('Một đơn còn nghĩa vụ trên mỗi phiên',async()=>{await taoDon('CHO_THANH_TOAN');let chan=false;try{await taoDon('CHO_THANH_TOAN');}catch(e){assert.equal(e.code,'ER_DUP_ENTRY');chan=true;}assert(chan);});
      const giu=()=>c.execute("UPDATE don_hang SET so_tien_da_thu=tong_tien,trang_thai_giu_tien='DANG_GIU' WHERE id=?",[don]);
      await ca('Giữ tiền và hoàn toàn bộ cân bằng',async()=>{await giu();await c.execute("UPDATE don_hang SET so_tien_da_hoan=so_tien_da_thu,trang_thai_giu_tien='DA_HOAN_TIEN' WHERE id=?",[don]);const [[r]]=await c.execute('SELECT so_tien_dang_giu,so_tien_da_hoan FROM don_hang WHERE id=?',[don]);assert.equal(r.so_tien_dang_giu,'0.00');assert.equal(r.so_tien_da_hoan,'110000.00');});
      await ca('Giải ngân toàn bộ cân bằng',async()=>{await giu();await c.execute("UPDATE don_hang SET so_tien_da_giai_ngan=so_tien_da_thu,trang_thai_giu_tien='DA_GIAI_NGAN' WHERE id=?",[don]);});
      await ca('Chặn hoàn vượt số đã thu',async()=>{await giu();await loi("UPDATE don_hang SET so_tien_da_hoan=200000,trang_thai_giu_tien='DA_HOAN_TIEN' WHERE id=?",[don],maCK);});
      await ca('Chặn hoàn một phần cho giao dịch mới',async()=>{await giu();await loi("UPDATE don_hang SET so_tien_da_hoan=10000,so_tien_da_giai_ngan=100000,trang_thai_giu_tien='HOAN_TIEN_MOT_PHAN' WHERE id=?",[don],maCK);});
      await ca('Tiếp nhận hoàn một phần lịch sử khi có cờ rõ ràng',async()=>{await giu();await c.execute("UPDATE don_hang SET du_lieu_lich_su=1,so_tien_da_hoan=10000,so_tien_da_giai_ngan=100000,trang_thai_giu_tien='HOAN_TIEN_MOT_PHAN' WHERE id=?",[don]);});
      await ca('Thanh toán thất bại không chiếm suất thu, chặn hai lần thu',async()=>{
        await c.execute("INSERT INTO thanh_toan (don_hang_id,so_tien,trang_thai,khoa_yeu_cau) VALUES (?,110000,'THAT_BAI','lan-1'),(?,110000,'DA_THANH_TOAN','lan-2')",[don,don]);
        await loi("INSERT INTO thanh_toan (don_hang_id,so_tien,trang_thai,khoa_yeu_cau) VALUES (?,110000,'DA_THANH_TOAN','lan-3')",[don],'ER_DUP_ENTRY');
      });
      await ca('Chặn gửi lại khóa thanh toán',async()=>{await c.execute("INSERT INTO thanh_toan (don_hang_id,so_tien,khoa_yeu_cau) VALUES (?,110000,'gui-lai')",[don]);await loi("INSERT INTO thanh_toan (don_hang_id,so_tien,khoa_yeu_cau) VALUES (?,110000,'gui-lai')",[don],'ER_DUP_ENTRY');});
      await ca('Một tranh chấp đang mở trên mỗi đơn',()=>loi("INSERT INTO tranh_chap (don_hang_id,nguoi_mo_id,ly_do,mo_ta) VALUES (?,?,'KHAC','trung')",[don,mua2],'ER_DUP_ENTRY'));
      await ca('Tệp gắn đúng sản phẩm hoặc tranh chấp',async()=>{
        await c.execute("INSERT INTO tep_dinh_kem (loai_tep,san_pham_id,duong_dan_tep,la_anh_chinh) VALUES ('ANH_SAN_PHAM',?,'kiem-thu/anh.jpg',1)",[sp]);
        await c.execute("INSERT INTO tep_dinh_kem (loai_tep,tranh_chap_id,nguoi_tai_len_id,duong_dan_tep) VALUES ('BANG_CHUNG_TRANH_CHAP',?,?,'kiem-thu/bang-chung.jpg')",[tranh,mua2]);
        await loi("INSERT INTO tep_dinh_kem (loai_tep,san_pham_id,tranh_chap_id,duong_dan_tep) VALUES ('ANH_SAN_PHAM',?,?,'sai.jpg')",[sp,tranh],maCK);
        await loi("INSERT INTO tep_dinh_kem (loai_tep,san_pham_id,duong_dan_tep,la_anh_chinh) VALUES ('ANH_SAN_PHAM',?,'trung.jpg',1)",[sp],'ER_DUP_ENTRY');
      });
      await ca('Yêu cầu xử lý đúng loại, chống hủy trùng đang mở',async()=>{
        await c.execute("INSERT INTO yeu_cau_xu_ly (loai_yeu_cau,phien_dau_gia_id,nguoi_yeu_cau_id,ly_do) VALUES ('HUY_PHIEN',?,?,'ly do')",[phien,ban]);
        await loi("INSERT INTO yeu_cau_xu_ly (loai_yeu_cau,phien_dau_gia_id,nguoi_yeu_cau_id,ly_do) VALUES ('HUY_PHIEN',?,?,'trung')",[phien,ban],'ER_DUP_ENTRY');
        await loi("INSERT INTO yeu_cau_xu_ly (loai_yeu_cau,san_pham_id,nguoi_yeu_cau_id,ly_do) VALUES ('HUY_PHIEN',?,?,'sai loai')",[sp,ban],maCK);
      });
      await ca('Báo cáo chống trùng theo người/sản phẩm, cho gửi lại sau kết luận',async()=>{
        const id=await them("INSERT INTO yeu_cau_xu_ly (loai_yeu_cau,san_pham_id,nguoi_yeu_cau_id,ly_do) VALUES ('BAO_CAO_SAN_PHAM',?,?,'kiem tra')",[sp,mua]);
        await loi("INSERT INTO yeu_cau_xu_ly (loai_yeu_cau,san_pham_id,nguoi_yeu_cau_id,ly_do) VALUES ('BAO_CAO_SAN_PHAM',?,?,'trung')",[sp,mua],'ER_DUP_ENTRY');
        await loi("UPDATE yeu_cau_xu_ly SET trang_thai='DA_DUYET' WHERE id=?",[id],maCK);
        await c.execute("UPDATE yeu_cau_xu_ly SET trang_thai='KHONG_CO_CO_SO' WHERE id=?",[id]);
        await c.execute("INSERT INTO yeu_cau_xu_ly (loai_yeu_cau,san_pham_id,nguoi_yeu_cau_id,ly_do) VALUES ('BAO_CAO_SAN_PHAM',?,?,'yeu cau moi')",[sp,mua]);
      });
      const taoDeNghi=(nguoi,nguonGia,gia)=>c.execute("INSERT INTO de_nghi_mua_tiep_theo (phien_dau_gia_id,don_hang_goc_id,nguoi_tra_gia_id,gia_de_nghi,het_han_luc,luot_tra_gia_nguon_id,nguoi_yeu_cau_id) VALUES (?,?,?,?,DATE_ADD(NOW(),INTERVAL 1 DAY),?,?)",[phien,don,nguoi,gia,nguonGia,ban]);
      await ca('Second Chance khớp giá công khai, chặn hai đề nghị đang chờ',async()=>{await taoDeNghi(mua,luot,100000);let chan=false;try{await taoDeNghi(mua2,luot2,90000);}catch(e){assert.equal(e.code,'ER_DUP_ENTRY');chan=true;}assert(chan);});
      await ca('Chặn dùng giá tối đa thay giá công khai',async()=>{let chan=false;try{await taoDeNghi(mua,luot,200000);}catch(e){assert.equal(e.code,'ER_SIGNAL_EXCEPTION');chan=true;}assert(chan);});
      await ca('Thông báo chống trùng sự kiện',async()=>{await c.execute("INSERT INTO thong_bao (nguoi_dung_id,loai,tieu_de,noi_dung,khoa_su_kien) VALUES (?,'THU','Thử','Thử','su-kien-1')",[mua]);await loi("INSERT INTO thong_bao (nguoi_dung_id,loai,tieu_de,noi_dung,khoa_su_kien) VALUES (?,'THU','Thử','Thử','su-kien-1')",[mua],'ER_DUP_ENTRY');});
      await ca('Gia hạn lưu có cấu trúc và FK',async()=>{await c.execute("INSERT INTO nhat_ky_hoat_dong (hanh_dong,loai_doi_tuong,doi_tuong_id,phien_dau_gia_id,luot_tra_gia_id,du_lieu_moi) VALUES ('GIA_HAN_PHIEN','phien_dau_gia',?,?,?,?)",[phien,phien,luot,JSON.stringify({thoi_gian_ket_thuc_cu:'2099-01-01 00:00:00',thoi_gian_ket_thuc_moi:'2099-01-01 00:01:30',so_giay_them:90})]);await loi("INSERT INTO nhat_ky_hoat_dong (hanh_dong,loai_doi_tuong) VALUES ('GIA_HAN_PHIEN','phien_dau_gia')",[],maCK);});
    } finally {await c.rollback();}
    const sau=await chupNguon(c);
    assert.deepEqual(sau,truoc,'KIEM_TRA: Số dòng/cấu trúc nguồn thay đổi, cần kiểm tra tác vụ khác đang chạy.');
    const report={thoi_diem:new Date().toISOString(),mysql:current.phien_ban,database_thiet_ke:dich,so_bang:19,so_khoa_ngoai:46,so_trigger:6,so_view:2,so_ca_dat:ketQua.length,cac_ca:ketQua,du_lieu_kiem_thu:'ROLLBACK',nguon_khong_doi_ve_cau_truc_va_so_dong:true,nguon:sau};
    fs.writeFileSync(path.join(thuMuc,'ket-qua-kiem-tra.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({bang:19,khoaNgoai:46,caDat:ketQua.length,duLieuThu:'rollback',nguon:'cấu trúc/số dòng không đổi'}));
  } finally {c.release();}
}
