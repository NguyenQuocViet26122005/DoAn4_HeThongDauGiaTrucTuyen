# Danh sách API Backend

Đã đối chiếu 86 cặp phương thức/đường dẫn với các tệp thật trong src/routes và ung-dung.js. Bộ Postman có 90 yêu cầu, gồm các biến thể đăng nhập và đặt giá.

Địa chỉ gốc: `http://localhost:5000/api`. `GET /` ngoài tiền tố `/api` trả thông tin máy chủ.

Thành công: `{ "success": true, "message": "Thành công", "data": ... }`. Lỗi: `{ "success": false, "message": "..." }`. HTTP: 200/201, 400 dữ liệu sai, 401 chưa đăng nhập, 403 thiếu quyền, 404 không tìm thấy, 409 sai trạng thái/xung đột, 413 tệp lớn, 429 quá nhiều yêu cầu, 500 lỗi nội bộ, 503 kết nối/cấu hình chưa sẵn sàng.

Gửi `Authorization: Bearer <token>` cho API riêng tư. Tiền nên truyền bằng chuỗi số không dấu phân cách, ví dụ `"20200000.00"`; các ID BIGINT cũng là chuỗi. Ngày tạo phiên bắt buộc ISO có múi giờ (`Z` hoặc `+07:00`); ngày trả về theo `DB_TIMEZONE`, mặc định `+07:00`, dạng `YYYY-MM-DD HH:mm:ss`.

Các danh sách có phân trang dùng `page=1&limit=20` (limit tối đa 100); data là mảng, chưa có tổng số trang. Danh mục, thuộc tính, địa chỉ và bước giá là danh sách đầy đủ. Sản phẩm/phiên hỗ trợ `q`, `danh_muc_id`, `trang_thai`; trạng thái sản phẩm chỉ lọc ở phạm vi người bán/Admin. Người dùng Admin hỗ trợ `q`; hồ sơ xác minh hỗ trợ `trang_thai`; vi phạm Admin hỗ trợ `nguoi_dung_id`; thông báo hỗ trợ `unread=true`.

Body dưới đây là mẫu hợp lệ sau khi điền biến. `{}` là JSON rỗng; không tự thêm trường như vai trò, số tiền thanh toán hay người thắng. Các thao tác PUT sản phẩm/địa chỉ/danh mục nhận đủ trường bắt buộc như mẫu. HTTP GET tải tệp trả dữ liệu nhị phân.

## 01. Kết nối và đăng nhập

### GET /health — Kiểm tra backend và MySQL

Quyền: Công khai.

### POST /auth/login — Đăng nhập Admin

Quyền: Công khai.

```json
{
  "email": "admin@daugia.local",
  "mat_khau": "{{matKhauMau}}"
}
```

Postman tự lưu: `maQuanTri` ← `data.token`.

### POST /auth/login — Đăng nhập Người bán

Quyền: Công khai.

```json
{
  "email": "minh.nb@daugia.local",
  "mat_khau": "{{matKhauMau}}"
}
```

Postman tự lưu: `maNguoiBan` ← `data.token`.

### POST /auth/login — Đăng nhập Người mua A

Quyền: Công khai.

```json
{
  "email": "nam.nm@daugia.local",
  "mat_khau": "{{matKhauMau}}"
}
```

Postman tự lưu: `maNguoiMuaA` ← `data.token`, `maNguoiMua` ← `data.token`.

### POST /auth/login — Đăng nhập Người mua B

Quyền: Công khai.

```json
{
  "email": "hoanganh@daugia.local",
  "mat_khau": "{{matKhauMau}}"
}
```

Postman tự lưu: `maNguoiMuaB` ← `data.token`, `maNguoiMua` ← `data.token`.

### POST /auth/register — Đăng ký tài khoản mới

Quyền: Công khai.

```json
{
  "ho_ten": "Người dùng thử nghiệm",
  "email": "thu-nghiem-{{$timestamp}}@example.invalid",
  "mat_khau": "{{matKhauDangKy}}",
  "so_dien_thoai": "0900000000"
}
```

Postman tự lưu: `nguoiDungId` ← `data.id`.

## 02. Hồ sơ, địa chỉ và xác minh người bán

### GET /users/me — Hồ sơ của tôi

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

### PATCH /users/me — Cập nhật họ tên và số điện thoại

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

```json
{
  "ho_ten": "Tên cập nhật",
  "so_dien_thoai": "0900000000"
}
```

### GET /users/me/addresses — Danh sách địa chỉ

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

### POST /users/me/addresses — Thêm địa chỉ

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

```json
{
  "ten_nguoi_nhan": "Người nhận thử nghiệm",
  "sdt_nguoi_nhan": "0900000000",
  "tinh_thanh": "TP Hồ Chí Minh",
  "quan_huyen": "Khu vực thử nghiệm",
  "phuong_xa": "Phường thử nghiệm",
  "dia_chi_chi_tiet": "123 Đường thử nghiệm",
  "la_mac_dinh": true
}
```

Postman tự lưu: `diaChiId` ← `data.id`.

### PUT /users/me/addresses/:id — Sửa địa chỉ của mình

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

```json
{
  "ten_nguoi_nhan": "Người nhận thử nghiệm",
  "sdt_nguoi_nhan": "0900000000",
  "tinh_thanh": "TP Hồ Chí Minh",
  "quan_huyen": "Khu vực thử nghiệm",
  "phuong_xa": "Phường thử nghiệm",
  "dia_chi_chi_tiet": "123 Đường thử nghiệm",
  "la_mac_dinh": true
}
```

### DELETE /users/me/addresses/:id — Xóa địa chỉ của mình

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

### GET /seller-verifications/me — Hồ sơ xác minh của tôi

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

### POST /seller-verifications — Gửi hồ sơ xác minh sau khi tải ảnh

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

```json
{
  "loai_giay_to": "CCCD",
  "so_giay_to": "GIAY-TO-THU-NGHIEM",
  "anh_mat_truoc": "{{anhMatTruoc}}",
  "anh_mat_sau": "{{anhMatSau}}",
  "anh_selfie": "{{anhSelfie}}",
  "ten_ngan_hang": "Ngân hàng thử nghiệm",
  "so_tai_khoan": "TAI-KHOAN-THU-NGHIEM",
  "chu_tai_khoan": "NGUOI DUNG THU NGHIEM"
}
```

Postman tự lưu: `xacMinhId` ← `data.id`.

### GET /admin/users — Admin xem người dùng

Quyền: QUAN_TRI.

### PATCH /admin/users/:id/status — Admin đổi trạng thái tài khoản

Quyền: QUAN_TRI.

```json
{
  "trang_thai_tai_khoan": "TAM_NGUNG",
  "ly_do": "Lý do xử lý thử nghiệm"
}
```

### GET /admin/seller-verifications — Admin xem hồ sơ chờ duyệt

Quyền: QUAN_TRI.

### PATCH /admin/seller-verifications/:id/review — Admin duyệt xác minh

Quyền: QUAN_TRI.

```json
{
  "trang_thai": "DA_XAC_MINH"
}
```

## 03. Danh mục và sản phẩm

### GET /categories — Danh mục công khai

Quyền: Công khai.

### GET /categories/:id/attributes — Thuộc tính của danh mục

Quyền: Công khai.

### GET /products — Sản phẩm công khai

Quyền: Công khai.

### GET /products/mine — Sản phẩm của người bán

Quyền: Người bán của sản phẩm/đơn; thao tác bán cần xác minh.

### GET /products/:id — Chi tiết sản phẩm của người bán

Quyền: Người bán của sản phẩm/đơn; thao tác bán cần xác minh.

### POST /products — Tạo sản phẩm nháp

Quyền: Người bán của sản phẩm/đơn; thao tác bán cần xác minh.

```json
{
  "danh_muc_id": "{{danhMucId}}",
  "tieu_de": "Sản phẩm thử nghiệm",
  "mo_ta": "Mô tả tình trạng và phụ kiện đi kèm.",
  "tinh_trang_san_pham": "MOI",
  "thuong_hieu": "Thử nghiệm",
  "thuoc_tinh": []
}
```

Postman tự lưu: `sanPhamId` ← `data.id`.

### PUT /products/:id — Sửa sản phẩm nháp hoặc bị từ chối

Quyền: Người bán của sản phẩm/đơn; thao tác bán cần xác minh.

```json
{
  "danh_muc_id": "{{danhMucId}}",
  "tieu_de": "Sản phẩm thử nghiệm",
  "mo_ta": "Mô tả tình trạng và phụ kiện đi kèm.",
  "tinh_trang_san_pham": "MOI",
  "thuong_hieu": "Thử nghiệm",
  "thuoc_tinh": []
}
```

### POST /products/:id/images — Gắn ảnh đã tải lên vào sản phẩm

Quyền: Người bán của sản phẩm/đơn; thao tác bán cần xác minh.

```json
{
  "duong_dan_anh": "{{anhSanPham}}",
  "la_anh_chinh": true,
  "thu_tu": 0
}
```

Postman tự lưu: `anhId` ← `data.id`.

### DELETE /products/:id/images/:imageId — Bỏ ảnh khỏi sản phẩm nháp

Quyền: Người bán của sản phẩm/đơn; thao tác bán cần xác minh.

### POST /products/:id/submit — Gửi sản phẩm cho Admin duyệt

Quyền: Người bán của sản phẩm/đơn; thao tác bán cần xác minh.

```json
{}
```

### GET /admin/categories — Admin xem cả danh mục đã ngừng

Quyền: QUAN_TRI.

### POST /admin/categories — Tạo danh mục thử nghiệm

Quyền: QUAN_TRI.

```json
{
  "ten": "Danh mục thử nghiệm",
  "duong_dan": "thu-nghiem-{{$timestamp}}",
  "danh_muc_cha_id": null,
  "dang_hoat_dong": true
}
```

Postman tự lưu: `danhMucId` ← `data.id`.

### PUT /admin/categories/:id — Sửa danh mục

Quyền: QUAN_TRI.

```json
{
  "ten": "Danh mục thử nghiệm",
  "duong_dan": "thu-nghiem-{{$timestamp}}",
  "danh_muc_cha_id": null,
  "dang_hoat_dong": true
}
```

### POST /admin/categories/:id/attributes — Tạo thuộc tính động

Quyền: QUAN_TRI.

```json
{
  "ten_thuoc_tinh": "Thương hiệu",
  "khoa_thuoc_tinh": "thuong_hieu",
  "kieu_nhap": "VAN_BAN",
  "bat_buoc": false
}
```

Postman tự lưu: `thuocTinhId` ← `data.id`.

### PUT /admin/categories/:id/attributes/:attributeId — Sửa thuộc tính động

Quyền: QUAN_TRI.

```json
{
  "ten_thuoc_tinh": "Thương hiệu",
  "khoa_thuoc_tinh": "thuong_hieu",
  "kieu_nhap": "VAN_BAN",
  "bat_buoc": false
}
```

### GET /admin/products — Admin xem sản phẩm

Quyền: QUAN_TRI.

### PATCH /admin/products/:id/review — Admin duyệt sản phẩm

Quyền: QUAN_TRI.

```json
{
  "trang_thai_duyet": "DA_DUYET"
}
```

## 04. Đấu giá và theo dõi

### GET /auctions — Danh sách phiên đấu giá

Quyền: Công khai.

### GET /auctions/mine — Phiên do tôi bán

Quyền: Người bán của sản phẩm/đơn; thao tác bán cần xác minh.

### GET /auctions/my-bids — Các phiên đã tham gia

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

### GET /auctions/:id — Chi tiết phiên công khai

Quyền: Công khai.

### GET /auctions/:id/bids — Lịch sử giá công khai

Quyền: Công khai.

### POST /auctions — Tạo phiên hai phút cho sản phẩm đã duyệt

Quyền: Người bán của sản phẩm/đơn; thao tác bán cần xác minh.

```json
{
  "san_pham_id": "{{sanPhamId}}",
  "gia_khoi_diem": "18000000",
  "gia_san": null,
  "gia_mua_ngay": "25000000",
  "thoi_gian_bat_dau": "{{batDauISO}}",
  "thoi_gian_ket_thuc": "{{ketThucISO}}"
}
```

Postman tự lưu: `phienId` ← `data.id`.

### POST /auctions/:id/bids — A cam kết tối đa 20 triệu

Quyền: Người mua A.

```json
{
  "gia_toi_da": "20000000"
}
```

### POST /auctions/:id/bids — B cam kết tối đa 22 triệu

Quyền: Người mua B.

```json
{
  "gia_toi_da": "22000000"
}
```

### POST /auctions/:id/buy-now — Mua ngay khi còn hiệu lực

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

```json
{}
```

Postman tự lưu: `donHangId` ← `data.don_hang.id`.

### POST /auctions/:id/cancellation-requests — Người bán đề nghị hủy

Quyền: Người bán của sản phẩm/đơn; thao tác bán cần xác minh.

```json
{
  "ly_do": "Lý do xin hủy thử nghiệm"
}
```

Postman tự lưu: `yeuCauHuyId` ← `data.id`.

### GET /bid-increments — Đọc bước giá đang cấu hình

Quyền: Công khai.

### GET /watchlist — Danh sách đang theo dõi

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

### POST /watchlist/:id — Theo dõi phiên

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

```json
{}
```

### DELETE /watchlist/:id — Bỏ theo dõi phiên

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

### GET /admin/auctions — Admin xem phiên

Quyền: QUAN_TRI.

### GET /admin/cancellation-requests — Admin xem yêu cầu hủy

Quyền: QUAN_TRI.

### PATCH /admin/cancellation-requests/:id/review — Admin duyệt yêu cầu hủy

Quyền: QUAN_TRI.

```json
{
  "trang_thai": "DA_DUYET",
  "ghi_chu_duyet": "Kết quả xem xét thử nghiệm"
}
```

## 05. Đơn hàng, thanh toán và đề nghị mua tiếp

### GET /orders — Đơn của tôi; chọn ID đơn cần thao tác

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

### GET /orders/:id — Chi tiết đơn và tiền đang giữ

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

### PATCH /orders/:id/address — Chọn địa chỉ trước thanh toán

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

```json
{
  "dia_chi_id": "{{diaChiId}}"
}
```

### POST /orders/:id/payments/simulate — Thanh toán mô phỏng; số tiền do server tính

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

```json
{}
```

### POST /orders/:id/shipping — Người bán xác nhận đã gửi hàng

Quyền: Người bán của sản phẩm/đơn; thao tác bán cần xác minh.

```json
{
  "don_vi_van_chuyen": "Đơn vị thử nghiệm",
  "ma_van_don": "THU-NGHIEM-{{$timestamp}}"
}
```

### POST /orders/:id/delivered — Người mua xác nhận hàng đã giao

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

```json
{}
```

### POST /orders/:id/confirm — Người mua nhận hàng tốt và giải ngân

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

```json
{}
```

### POST /orders/:id/second-chance — Đề nghị mua tiếp từ đơn hủy do không thanh toán

Quyền: Người bán của sản phẩm/đơn; thao tác bán cần xác minh.

```json
{}
```

Postman tự lưu: `deNghiId` ← `data.id`.

### GET /second-chances — Các đề nghị liên quan đến tôi

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

### GET /second-chances/:id — Chi tiết đề nghị mua tiếp

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

### POST /second-chances/:id/respond — Người nhận chấp nhận; đổi false để từ chối

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

```json
{
  "chap_nhan": true
}
```

Postman tự lưu: `donHangId` ← `data.don_hang.id`.

### GET /admin/orders — Admin xem đơn hàng

Quyền: QUAN_TRI.

## 06. Tranh chấp và đánh giá

### POST /orders/:id/disputes — Mở tranh chấp trong thời gian kiểm tra

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

```json
{
  "ly_do": "KHONG_DUNG_MO_TA",
  "mo_ta": "Mô tả vấn đề của đơn thử nghiệm"
}
```

Postman tự lưu: `tranhChapId` ← `data.id`.

### GET /disputes — Tranh chấp liên quan đến tôi

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

### GET /disputes/:id — Chi tiết tranh chấp và bằng chứng

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

### POST /disputes/:id/response — Người bán phản hồi tranh chấp

Quyền: Người bán của sản phẩm/đơn; thao tác bán cần xác minh.

```json
{
  "phan_hoi_nguoi_ban": "Phản hồi và giải thích của người bán"
}
```

### POST /disputes/:id/evidence — Gắn bằng chứng đã tải lên

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

```json
{
  "duong_dan_tep": "{{tepBangChung}}",
  "mo_ta": "Ảnh hoặc tài liệu chứng minh"
}
```

### GET /admin/disputes — Admin xem tranh chấp

Quyền: QUAN_TRI.

### POST /admin/disputes/:id/take — Admin tiếp nhận tranh chấp

Quyền: QUAN_TRI.

```json
{}
```

### POST /admin/disputes/:id/resolve — Admin hoàn toàn bộ tiền mô phỏng

Quyền: QUAN_TRI.

```json
{
  "ket_qua": "NGUOI_MUA",
  "ket_qua_xu_ly": "Hoàn toàn bộ theo bằng chứng thử nghiệm"
}
```

### POST /orders/:id/reviews — Đánh giá bên còn lại sau hoàn thành

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

```json
{
  "so_sao": 5,
  "nhan_xet": "Nhận xét thử nghiệm"
}
```

### GET /users/:id/reviews — Đánh giá công khai của người dùng

Quyền: Công khai.

## 07. Thông báo, vi phạm và quản trị

### GET /notifications — Thông báo của tôi

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

### GET /notifications/unread-count — Số thông báo chưa đọc

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

### PATCH /notifications/read-all — Đánh dấu tất cả đã đọc

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

```json
{}
```

### PATCH /notifications/:id/read — Đánh dấu một thông báo đã đọc

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

```json
{}
```

### GET /violations/me — Vi phạm của tôi

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

### GET /admin/violations — Admin xem vi phạm

Quyền: QUAN_TRI.

### POST /admin/violations — Admin ghi nhận vi phạm

Quyền: QUAN_TRI.

```json
{
  "nguoi_dung_id": "{{nguoiDungId}}",
  "loai_vi_pham": "KHAC",
  "mo_ta": "Mô tả vi phạm thử nghiệm",
  "diem_vi_pham": 1
}
```

Postman tự lưu: `viPhamId` ← `data.id`.

### PATCH /admin/violations/:id/review — Admin xác nhận vi phạm

Quyền: QUAN_TRI.

```json
{
  "trang_thai": "DA_XAC_NHAN"
}
```

### GET /admin/statistics — Thống kê quản trị

Quyền: QUAN_TRI.

### GET /admin/activity-logs — Nhật ký hoạt động

Quyền: QUAN_TRI.

### GET /admin/jobs — Trạng thái tác vụ tự động

Quyền: QUAN_TRI.

### GET /admin/config — Đọc cấu hình nghiệp vụ

Quyền: QUAN_TRI.

### PUT /admin/config/:key — Cập nhật một cấu hình nghiệp vụ

Quyền: QUAN_TRI.

```json
{
  "gia_tri_cau_hinh": 48
}
```

### PUT /admin/bid-increments — Thay bộ bước giá đang hoạt động

Quyền: QUAN_TRI.

```json
{
  "buoc_gia": [
    {
      "gia_tu": "0",
      "gia_den": "999999.99",
      "muc_tang_gia": "50000"
    },
    {
      "gia_tu": "1000000",
      "gia_den": "9999999.99",
      "muc_tang_gia": "100000"
    },
    {
      "gia_tu": "10000000",
      "gia_den": "49999999.99",
      "muc_tang_gia": "200000"
    },
    {
      "gia_tu": "50000000",
      "gia_den": null,
      "muc_tang_gia": "500000"
    }
  ]
}
```

## 08. Tải và đọc tệp

### POST /uploads/:kind — Tải đúng một tệp; chọn nhóm và tệp trong Body

Quyền: Người bán của sản phẩm/đơn; thao tác bán cần xác minh.

Body `multipart/form-data`: đúng một trường `file` kiểu File. `kind`: `avatar`, `product`, `verification`, `evidence`. Product/avatar/verification nhận PNG/JPEG/WebP ≤ 5 MiB; evidence nhận ảnh/PDF ≤ 10 MiB. Lấy `data.duong_dan` để gắn vào hồ sơ/sản phẩm/tranh chấp.

Postman tự lưu: `tepVuaTai` ← `data.duong_dan`.

### GET /uploads/files/:kind/:owner/:name — Đọc tệp theo nhóm, chủ sở hữu và tên

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.
