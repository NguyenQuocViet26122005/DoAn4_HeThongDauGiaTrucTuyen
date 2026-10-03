# Danh sách API Backend

Đã đối chiếu 104 cặp phương thức/đường dẫn với các tệp thật trong src/routes và ung-dung.ts. Bộ Postman có các biến thể đăng nhập, đặt giá và cấu hình để chạy từng kịch bản. Nghiệp vụ 3.0 dùng 21 bảng.

Địa chỉ gốc: `http://localhost:5000/api`. `GET /` ngoài tiền tố `/api` trả thông tin máy chủ.

Thành công: `{ "success": true, "message": "Thành công", "data": ... }`. Lỗi: `{ "success": false, "message": "..." }`. HTTP: 200/201, 400 dữ liệu sai, 401 chưa đăng nhập, 403 thiếu quyền, 404 không tìm thấy, 409 sai trạng thái/xung đột, 413 tệp lớn, 429 quá nhiều yêu cầu, 500 lỗi nội bộ, 503 kết nối/cấu hình chưa sẵn sàng.

Gửi `Authorization: Bearer <token>` cho API riêng tư. Tiền nên truyền bằng chuỗi số không dấu phân cách, ví dụ `"20200000.00"`; các ID BIGINT cũng là chuỗi. Ngày tạo phiên bắt buộc ISO có múi giờ (`Z` hoặc `+07:00`); ngày trả về theo `DB_TIMEZONE`, mặc định `+07:00`, dạng `YYYY-MM-DD HH:mm:ss`.

Các danh sách có phân trang dùng `page=1&limit=20` (limit tối đa 100); data là mảng, chưa có tổng số trang. Danh mục, thuộc tính, địa chỉ và bước giá là danh sách đầy đủ. Sản phẩm/phiên hỗ trợ `q`, `danh_muc_id`, `trang_thai`; trạng thái sản phẩm chỉ lọc ở phạm vi người bán/Admin. Người dùng Admin hỗ trợ `q`; hồ sơ xác minh hỗ trợ `trang_thai`; vi phạm Admin hỗ trợ `nguoi_dung_id`; thông báo hỗ trợ `unread=true`.

Body dưới đây là mẫu hợp lệ sau khi điền biến. `{}` là JSON rỗng; không tự thêm trường như vai trò, số tiền thanh toán hay người thắng. Các thao tác PUT sản phẩm/địa chỉ/danh mục nhận đủ trường bắt buộc như mẫu. HTTP GET tải tệp trả dữ liệu nhị phân.

Giao diện người mua ngày 02/10/2026 dùng các API hiện có: `/users/me/addresses`, `/auctions/:id/deposit`, `/auctions/:id/deposit/register`, `/auctions/:id/deposit/pay`, `/auctions/:id/bids`, `/auctions/:id/buy-now` và `GET /orders/:id`. Khi thanh toán mô phỏng trả HTTP 200, client phải đọc `ket_qua_mo_phong`; `THAT_BAI` không có nghĩa đã thu tiền. Nếu chưa nhận đủ phản hồi, giữ nguyên `khoa_yeu_cau` và kết quả mô phỏng đã gửi để lấy lại lần xử lý trước. Không tự sinh khóa mới khi chưa rõ kết quả. Không có API đọc lại mức tối đa bí mật.

## 01. Kết nối và đăng nhập

Các thay đổi của bản 19 bảng:

- `POST /auctions` nhận thêm `phi_van_chuyen`, mặc định 0; chỉ nhận số tiền VND nguyên cho giao dịch mới. Phí được công bố trên phiên và chụp sang đơn.
- `POST /orders/:id/payments/simulate` nhận `{ "ket_qua_mo_phong": "THANH_CONG", "khoa_yeu_cau": "ma-yeu-cau-01" }`. Kết quả có thể là `THAT_BAI`; cùng khóa sẽ trả lần xử lý cũ. Lần thử mới cần khóa mới. Không truyền tổng tiền từ client.
- Khóa yêu cầu tùy chọn dài 8–100 ký tự chữ/số/gạch ngang/gạch dưới. Nếu không truyền, backend tạo mã; client nên giữ khóa khi thử lại sau lỗi mạng.
- Khiếu nại `CHUA_NHAN_HANG` của người mua chỉ mở sau mốc 7 ngày từ khai báo gửi và còn đúng trạng thái. Admin có thể tiếp nhận trường hợp hàng đã thanh toán cần can thiệp.
- Quyết định tranh chấp chỉ có `NGUOI_MUA` (hoàn toàn bộ, gồm phí) hoặc `NGUOI_BAN` (giải ngân toàn bộ). Nên bỏ `so_tien_hoan` để backend lấy từ đơn; nếu gửi thì phải khớp toàn bộ số tiền tương ứng.
- Second Chance phải do người bán yêu cầu từng lần; từ chối/hết hạn không tự tạo đề nghị tiếp theo. Giá lấy từ lượt công khai hợp lệ.
- `PATCH /admin/violations/:id/review` nhận `trang_thai`, `hinh_thuc_xu_ly` và `ly_do_xu_ly`. Hình thức gồm `CANH_CAO`, `TAM_NGUNG`, `KHOA_TAI_KHOAN`, `KHONG_VI_PHAM`; Admin phải nêu lý do quyết định.

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

Thêm query `du_dieu_kien_dau_gia=1` để chỉ lấy sản phẩm đã duyệt và chưa có phiên `DA_LEN_LICH`, `HOAT_DONG` hoặc `DA_KET_THUC`. Nếu bắt buộc kiểm định, hồ sơ mới nhất phải đạt, đang lưu giữ, chưa rời trung tâm và có báo cáo. Bộ lọc chạy trước phân trang; `0` hoặc bỏ qua giữ danh sách thông thường. Giá trị khác hoặc dùng tham số này trên danh sách công khai/Admin trả 400. Điều kiện được kiểm tra lại trong transaction khi tạo phiên.

### GET /products/:id — Chi tiết sản phẩm của người bán

Quyền: Người bán của sản phẩm/đơn; thao tác bán cần xác minh.

Chính chủ/Admin nhận thêm `kiem_dinh_moi_nhat` (object/null) gồm ID, mã, lần, trạng thái, kết quả, ngày rời trung tâm và `co_bao_cao`. Khách không nhận trường này; dùng API tóm tắt công khai riêng.

Chính chủ nhận thêm `co_the_sua` (boolean) và `ly_do_khong_the_sua` (string/null). Chỉ bản nháp/bị từ chối, chưa có phiên và không có hồ sơ kiểm định đang xử lý/giữ hàng mới được sửa. Thông tin này chỉ hỗ trợ giao diện; mỗi thao tác ghi kiểm tra lại trong transaction. Khách chỉ đọc sản phẩm đã duyệt, không nhận hai trường hỗ trợ sửa này.

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

Tối đa 12 ảnh/sản phẩm. Gắn lại cùng đường dẫn tệp vào cùng sản phẩm trả ảnh đã có (HTTP 201), không nhân bản hoặc tự đổi ảnh chính; để đổi ảnh chính dùng API bên dưới. Tệp phải tồn tại, thuộc tài khoản và đúng nhóm `product`.

### PATCH /products/:id/images/:imageId/primary — Chọn ảnh đại diện

Quyền: chính chủ là người bán đã xác minh; sản phẩm còn được sửa. Body `{}`. Trả danh sách ảnh sau cập nhật. Khóa sản phẩm, kiểm tra ảnh thuộc sản phẩm rồi đổi ảnh chính trong cùng transaction và ghi nhật ký. Ảnh không thuộc sản phẩm trả 404, sản phẩm khóa sửa trả 409; yêu cầu sai không làm mất ảnh chính hiện tại.

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

### GET /auctions/mine/:id — Chi tiết phiên của tôi

Quyền: chính chủ phiên, người bán đã xác minh. Không đăng nhập trả 401; người bán khác hoặc Admin trả 403. Trả các trường công khai của phiên cùng `yeu_cau_huy_moi_nhat` (object/null), `co_the_yeu_cau_huy` (boolean) và `ly_do_khong_the_huy` (string/null).

Yêu cầu mới nhất gồm `id`, `ly_do`, `trang_thai`, `ghi_chu_duyet`, `ngay_tao`, `ngay_duyet`. Không thể gửi yêu cầu mới khi đang chờ xét/xử lý hoặc phiên đã hết hạn/kết thúc. Thông tin này phục vụ hiển thị; API gửi yêu cầu kiểm tra lại trong transaction. Không trả giá sàn hoặc mức tối đa bí mật. API chi tiết công khai không trả thông tin yêu cầu hủy riêng tư.

### GET /auctions/my-bids — Các phiên đã tham gia

Quyền: Đăng nhập; kiểm tra quyền sở hữu theo thao tác.

### GET /auctions/:id — Chi tiết phiên công khai

Quyền: Công khai.

### GET /auctions/:id/bids — Lịch sử giá công khai

Quyền: Công khai.

### POST /auctions — Tạo phiên cho sản phẩm đã duyệt

Quyền: Người bán của sản phẩm/đơn; thao tác bán cần xác minh.

```json
{
  "san_pham_id": "{{sanPhamId}}",
  "gia_khoi_diem": "18000000",
  "gia_san": null,
  "gia_mua_ngay": "25000000",
  "phi_van_chuyen": "50000",
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
{
  "ket_qua_mo_phong": "THANH_CONG",
  "khoa_yeu_cau": "mua-ngay-yeu-cau-0001"
}
```

Thành công chốt phiên và tạo đơn đã thu đủ trong cùng transaction, trạng thái `CHO_GUI_HANG`. Nếu có cọc hợp lệ của chính người mua, chỉ thu phần còn lại. Không bắt buộc cọc riêng để Mua ngay. `THAT_BAI` trả HTTP 200 với `data.ket_qua_mo_phong = THAT_BAI`, `don_hang = null`, giữ nguyên phiên và cọc. HTTP thành công không đồng nghĩa thanh toán thành công. Giữ cùng khóa khi gửi lại yêu cầu bị mất phản hồi; một lần thử thanh toán mới cần khóa mới.

Postman tự lưu: `donHangId` ← `data.don_hang.id`.

### POST /auctions/:id/cancellation-requests — Người bán đề nghị hủy

Quyền: Người bán của sản phẩm/đơn; thao tác bán cần xác minh.

```json
{
  "ly_do": "Lý do xin hủy thử nghiệm"
}
```

Postman tự lưu: `yeuCauHuyId` ← `data.id`.

Lý do bắt buộc, tối đa 1.000 ký tự. Thành công chỉ tạo yêu cầu chờ xét, không dừng phiên. Yêu cầu trùng khi đang chờ hoặc phiên đã hết hạn/kết thúc trả 409. Đọc lại `GET /auctions/mine/:id` để xem yêu cầu đã lưu và phản hồi của Admin.

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

Tùy chọn `vai_tro=NGUOI_MUA` hoặc `vai_tro=NGUOI_BAN` lọc đúng tài khoản trước phân trang. Bỏ tham số trả cả đơn mua và bán như trước; giá trị khác trả 400. Không cấp quyền đọc đơn của người khác qua bộ lọc.

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

Trả chi tiết đơn, bao gồm mảng `thanh_toan`; không trả trực tiếp `ket_qua_mo_phong` như API Mua ngay. HTTP 200 có thể chứa lần thanh toán `THAT_BAI`. Client đọc giao dịch theo khóa yêu cầu và trạng thái thu tiền của đơn; nếu chưa xác định được kết quả thì giữ mã để kiểm tra lại. Web dùng cùng khóa sau lỗi mạng/tải lại, không tự truyền số tiền cần thu.

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
  "chap_nhan": true,
  "ket_qua_mo_phong": "THANH_CONG",
  "khoa_yeu_cau": "second-chance-yeu-cau-0001"
}
```

Postman tự lưu: `donHangId` ← `data.don_hang.id`.

Chấp nhận chỉ hoàn tất cùng thanh toán đủ giá đề nghị và phí vận chuyển. Không yêu cầu cọc mới hoặc dùng cọc đã hoàn. `THAT_BAI` giữ đề nghị `CHO_XU_LY` khi còn hạn, không tạo đơn. `chap_nhan = false` từ chối mà không thanh toán. Cùng khóa trả kết quả lần xử lý cũ; đổi khóa cho lần thử mới.

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

Gửi lại cùng đường dẫn của chính người tải trong cùng hồ sơ trả bằng chứng đã lưu (201), không thêm bản ghi hoặc ghi đè mô tả. Vẫn kiểm tra quyền xem đơn và sở hữu tệp trước khi trả. Tệp mới chỉ được gắn khi hồ sơ còn mở và dưới 30 bằng chứng.

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

## 10. Kiểm định, trung tâm và đặt cọc — phiên bản 3.0

Danh mục nhận thêm `yeu_cau_kiem_dinh` (boolean) khi tạo/sửa. Yêu cầu được chụp lên sản phẩm lúc gửi duyệt, không áp ngược lên sản phẩm cũ. Chỉ Admin nhận hàng/ghi kết quả; báo cáo do chuyên gia bên ngoài cung cấp. Tạo hồ sơ không tự duyệt sản phẩm. Sau kết quả đạt và đang giữ hàng, Admin mới dùng API review sản phẩm hiện có.

### GET /products/:id/inspection — Thông tin kiểm định công khai

Quyền: công khai, sản phẩm đã duyệt.

### GET /inspections — Hồ sơ kiểm định của tôi

Quyền: đã đăng nhập; người dùng chỉ thấy hồ sơ của sản phẩm mình sở hữu, Admin xem tất cả. Tham số: `page`, `limit`, `q` (tên sản phẩm hoặc mã kiểm định, tối đa 100 ký tự), `trang_thai`, `san_pham_id`. Lọc vẫn giữ điều kiện chính chủ; trạng thái hoặc ID không hợp lệ trả 400.

### GET /inspections/:id — Chi tiết hồ sơ riêng

Quyền: Admin, chủ sản phẩm hoặc người mua có đơn gắn hồ sơ. Trả thêm `tieu_de`, `nguoi_ban_id`, `co_the_cap_nhat`, `ly_do_khong_the_cap_nhat` và `tep_dinh_kem`. Có phiên/nghĩa vụ bán hoặc đã trả hàng thì chỉ xem; người mua không cập nhật. Đây là thông tin hỗ trợ giao diện, không thay kiểm tra quyền/trạng thái tại API ghi.

### POST /admin/products/:id/inspections — Admin tạo hồ sơ kiểm định

Quyền: Admin.

```json
{}
```

### POST /inspections/:id/shipping — Seller khai báo gửi trung tâm

Quyền: người bán chính chủ (Admin xem được hồ sơ/thống kê).

```json
{
  "don_vi_van_chuyen": "Đơn vị vận chuyển thử",
  "ma_van_don": "KD-DEN-001"
}
```

### GET /admin/inspections — Admin xem hàng đợi kiểm định

Quyền: Admin. Hỗ trợ cùng bộ lọc `page`, `limit`, `q`, `trang_thai`, `san_pham_id` như `/inspections`.

### POST /admin/inspections/:id/received — Admin ghi nhận trung tâm nhận hàng

Quyền: Admin.

```json
{
  "tinh_trang_khi_nhan": "Nguyên niêm phong",
  "serial_khi_nhan": "SERIAL-001",
  "so_kien": 1,
  "ghi_chu": "Đối chiếu biên bản và ảnh tiếp nhận"
}
```

### POST /admin/inspections/:id/start — Admin bắt đầu ghi hồ sơ kiểm định

Quyền: Admin.

```json
{}
```

### POST /admin/inspections/:id/files — Gắn báo cáo chuyên gia đã tải lên

Quyền: Admin. Cùng đường dẫn đã gắn vào cùng hồ sơ và cùng loại trả bản ghi hiện có (201), không tạo trùng. Cùng đường dẫn nhưng đổi loại trả 409. Chỉ gắn sau tiếp nhận và khi hồ sơ còn được cập nhật.

```json
{
  "loai_tep": "BAO_CAO_KIEM_DINH",
  "duong_dan_tep": "{{tepKiemDinh}}",
  "mo_ta": "Báo cáo trung tâm cung cấp"
}
```

### PATCH /admin/inspections/:id/result — Admin nhập kết quả từ báo cáo chuyên gia

Quyền: Admin.

```json
{
  "ket_qua": "DAT",
  "ten_chuyen_gia": "Tên trên báo cáo",
  "don_vi_kiem_dinh": "Đơn vị trên báo cáo",
  "ngay_kiem_dinh": "{{ngayKiemDinh}}",
  "nhan_xet": "Nội dung kết luận trong báo cáo",
  "ma_chung_nhan": "CERT-001"
}
```

### POST /admin/inspections/:id/return — Admin trả hàng không đạt hoặc cần bổ sung

Quyền: Admin.

```json
{
  "ly_do": "Không đạt theo báo cáo; đã bàn giao trả người bán"
}
```

### POST /auctions/:id/deposit/register — Đăng ký tham gia phiên cần cọc

Quyền: người mua đăng nhập, chỉ dữ liệu của mình.

```json
{}
```

### GET /auctions/:id/deposit — Xem cọc của chính tôi

Quyền: người mua đăng nhập, chỉ dữ liệu của mình.

### POST /auctions/:id/deposit/pay — Thanh toán cọc mô phỏng

Quyền: người mua đăng nhập, chỉ dữ liệu của mình.

```json
{
  "ket_qua_mo_phong": "THANH_CONG",
  "khoa_yeu_cau": "{{khoaDatCoc}}"
}
```

### GET /auctions/:id/participants/summary — Seller xem số lượng tham gia

Quyền: người bán chính chủ (Admin xem được hồ sơ/thống kê).

### GET /admin/deposits — Admin quản lý các khoản cọc

Quyền: Admin.

### Chính sách cọc và kết quả trả về

`PUT /admin/config/DEPOSIT_POLICY` chỉ Admin; body:

```json
{
  "gia_tri_cau_hinh": {
    "bat": false,
    "kieu": "TY_LE",
    "gia_tri": 10
  }
}
```

Admin tự chọn tỷ lệ/số tiền rồi đặt `bat = true`. `TY_LE`: số nguyên 1–100%; `CO_DINH`: số tiền VND nguyên dương không vượt giá khởi điểm. Số tiền cọc được chụp vào phiên khi tạo, không thay các phiên trước đó. Mặc định đang tắt.

`deposit/register` trả bản ghi cọc, HTTP 201; đăng ký lặp trả cùng bản ghi. `deposit` trả bản ghi của chính người gọi hoặc null. `deposit/pay` trả `{ket_qua_mo_phong, dat_coc}`; thanh toán thất bại vẫn HTTP 200, trạng thái `THAT_BAI`. Không truyền số tiền; server lấy từ phiên. Khóa yêu cầu 8–100 ký tự, giữ nguyên khi gửi lại cùng lần thử; lần thử mới đổi khóa. Phiên không yêu cầu cọc trả 409 ở API đăng ký/thanh toán cọc.

Thống kê seller chỉ có `da_dang_ky`, `da_coc` (đang có cọc hợp lệ), `du_dieu_kien` (cọc hợp lệ, tài khoản hoạt động, vai trò người dùng và có địa chỉ). Không trả danh sách người cọc hoặc mức giá tối đa. Admin xem danh sách cọc phân trang qua `/admin/deposits`.

Hồ sơ riêng trả biên bản, serial và tệp cho Admin, chủ sản phẩm hoặc buyer có đơn gắn hồ sơ. Bản công khai chỉ có mã kiểm định, kết quả, ngày, chuyên gia/đơn vị và mã chứng nhận. Upload `/uploads/inspection` chỉ Admin, ảnh/PDF tối đa 10 MB; lưu `data.duong_dan` vào `tepKiemDinh`. Ngày kiểm định phải là ISO có múi giờ, từ thời điểm trung tâm nhận hàng đến hiện tại.

Đơn trả thêm `tien_coc_da_chuyen`, `so_tien_con_phai_thanh_toan`, `nguon_gui_hang`, `kiem_dinh_san_pham_id` và hồ sơ `kiem_dinh` khi có quyền. Đơn `TRUNG_TAM` dùng API shipping hiện có bằng token Admin; đơn `NGUOI_BAN` dùng token seller. Không gửi hàng khi chưa thu đủ.

Lý do tranh chấp mới gồm `KHONG_KHOP_HO_SO_KIEM_DINH`, `NGHI_NGO_TINH_XAC_THUC`, `THIEU_PHU_KIEN` cùng các lý do thông thường đang hỗ trợ. Không nhận `HANG_GIA` mới; vẫn giữ/đọc dữ liệu lịch sử. Chi tiết tranh chấp có `ho_so_kiem_dinh` để đối chiếu, vẫn kiểm tra quyền theo đơn.
