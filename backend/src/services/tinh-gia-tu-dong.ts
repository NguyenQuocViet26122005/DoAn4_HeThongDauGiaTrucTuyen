import type {
  PhienDauGia,
  MucCamKet,
  DinhDanh,
  TienNhap,
  BuocGia,
  LuotGiaTinhToan,
} from '../types/nghiep-vu';
import { donViTienNho, nhoHon, lonHon } from '../utils/tien';
import { baoDam, cungId } from '../utils/loi';
import { buocGiaTaiMuc } from './cau-hinh';


// Hàm chỉ tính toán. Service giữ khóa phiên và ghi toàn bộ kết quả trong transaction.
function tinhKetQuaDauGia(
  phienDauGia: PhienDauGia,
  cacMucToiDa: MucCamKet[],
  nguoiTraGiaId: DinhDanh,
  mucToiDaMoi: TienNhap,
  cacBuocGia: BuocGia[],
) {
  const mucToiDa = donViTienNho(mucToiDaMoi);
  const hienTai = donViTienNho(phienDauGia.gia_hien_tai);
  const batDau = donViTienNho(phienDauGia.gia_khoi_diem);
  const truocDo = cacMucToiDa.find((x) => cungId(x.nguoi_tra_gia_id, nguoiTraGiaId));


  if (truocDo)
    {
baoDam(
      mucToiDa > donViTienNho(truocDo.gia_toi_da),
      409,
      'Chỉ được tăng mức giá tối đa đã cam kết',
    );
}


  const dangDanDau = cungId(phienDauGia.nguoi_dan_dau_id, nguoiTraGiaId);
  const dauTien = !phienDauGia.nguoi_dan_dau_id;


  baoDam(mucToiDa > 0n, 400, 'Mức tối đa phải lớn hơn 0');
  baoDam(
    dangDanDau ||
      mucToiDa >= (dauTien ? lonHon(batDau, 1n) : hienTai + buocGiaTaiMuc(hienTai, cacBuocGia)),
    400,
    'Mức tối đa chưa đạt giá tối thiểu hợp lệ',
  );


  if (dangDanDau) {
    baoDam(truocDo, 409, 'Thiếu mức giá của người dẫn đầu, cần quản trị kiểm tra');


    // Tăng trần của chính mình không tự nâng giá, trừ phần còn thiếu để đạt giá sàn.
    const gia =
      phienDauGia.gia_san == null
        ? hienTai
        : lonHon(hienTai, nhoHon(mucToiDa, donViTienNho(phienDauGia.gia_san)));
    const daThayDoi = gia > hienTai;


    return {
      winnerId: String(nguoiTraGiaId),
      price: gia,
      publicBids: daThayDoi
        ? [{
 bidderId: String(nguoiTraGiaId), price: gia, type: 'TU_DONG' 
}]
        : [],
      validPublicBid: daThayDoi,
    };
  }


  const nguoiDanDauCu = cacMucToiDa.find((x) =>
    cungId(x.nguoi_tra_gia_id, phienDauGia.nguoi_dan_dau_id),
  );


  baoDam(dauTien || nguoiDanDauCu, 409, 'Thiếu mức giá của người dẫn đầu, cần quản trị kiểm tra');


  let nguoiThangId: string;
  let gia: bigint;
  const cacLuotGiaCongKhai: LuotGiaTinhToan[] = [];


  if (dauTien) {
    nguoiThangId = String(nguoiTraGiaId);
    gia = lonHon(batDau, 1n);
    cacLuotGiaCongKhai.push({
 bidderId: String(nguoiTraGiaId), price: gia, type: 'TRUC_TIEP' 
});
  } else {
    const mucToiDaCu = donViTienNho(nguoiDanDauCu.gia_toi_da);


    if (mucToiDa > mucToiDaCu) {
      nguoiThangId = String(nguoiTraGiaId);
      gia = lonHon(hienTai, nhoHon(mucToiDa, mucToiDaCu + buocGiaTaiMuc(mucToiDaCu, cacBuocGia)));
      // Ghi nhận giá đáp trả tự động thực sự đã được đưa ra công khai.
      // Đề nghị mua tiếp chỉ đọc lịch sử này, không đọc hoặc sao chép mức tối đa bí mật.
      if (mucToiDaCu > hienTai)
        {
cacLuotGiaCongKhai.push({
          bidderId: String(nguoiDanDauCu.nguoi_tra_gia_id),
          price: mucToiDaCu,
          type: 'TU_DONG',
        });
}
      cacLuotGiaCongKhai.push({
 bidderId: String(nguoiTraGiaId), price: gia, type: 'TU_DONG' 
});
    } else {
      // Hai mức tối đa bằng nhau: giữ người đang dẫn đầu đã được lưu trong database.
      // Quy tắc này xử lý được cả các yêu cầu trong cùng giây hoặc khi nâng mức tối đa.
      nguoiThangId = String(nguoiDanDauCu.nguoi_tra_gia_id);
      gia = lonHon(
        hienTai,
        mucToiDa === mucToiDaCu
          ? mucToiDaCu
          : nhoHon(mucToiDaCu, mucToiDa + buocGiaTaiMuc(mucToiDa, cacBuocGia)),
      );
      cacLuotGiaCongKhai.push({
        bidderId: String(nguoiTraGiaId),
        price: mucToiDa,
        type: 'TRUC_TIEP',
      });
      cacLuotGiaCongKhai.push({
 bidderId: nguoiThangId, price: gia, type: 'TU_DONG' 
});
    }
  }


  const tranNguoiThang = cungId(nguoiThangId, nguoiTraGiaId)
    ? mucToiDa
    : donViTienNho(nguoiDanDauCu.gia_toi_da);


  // Giá có thể tăng đến giá sàn, nhưng không vượt mức cam kết của người dẫn đầu.
  if (phienDauGia.gia_san != null)
    {
gia = lonHon(gia, nhoHon(tranNguoiThang, donViTienNho(phienDauGia.gia_san)));
}
  if (cacLuotGiaCongKhai.length) {
cacLuotGiaCongKhai[cacLuotGiaCongKhai.length - 1].price = gia;
}


  baoDam(gia <= tranNguoiThang, 500, 'Giá công khai vượt giới hạn hợp lệ');


  return {
    winnerId: nguoiThangId,
    price: gia,
    publicBids: cacLuotGiaCongKhai,
    validPublicBid: true,
  };
}


function choPhepMuaNgay(phienDauGia: PhienDauGia) {
  return (
    Boolean(phienDauGia.cho_phep_mua_ngay) &&
    phienDauGia.gia_mua_ngay != null &&
    (phienDauGia.gia_san != null
      ? !phienDauGia.dat_gia_san
      : Number(phienDauGia.tong_luot_tra_gia) === 0)
  );
}


export { tinhKetQuaDauGia, choPhepMuaNgay };
