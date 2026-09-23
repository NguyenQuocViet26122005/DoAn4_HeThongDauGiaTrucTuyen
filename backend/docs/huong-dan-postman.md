# Thử Backend bằng Postman

Nếu muốn kiểm tra tự động trước khi dùng Postman, chạy `npm run test:api` trong `backend`. Bộ test gửi 155 yêu cầu HTTP đến cổng riêng, bao phủ 86 API, dùng tài khoản ngẫu nhiên rồi rollback và dọn tệp. Không cần khởi động server riêng hoặc lấy token thủ công. Dừng backend đang chạy tác vụ định kỳ trước khi chạy bộ tích hợp để tránh tiến trình khác cùng xử lý dữ liệu kiểm thử.

## Chuẩn bị

1. Chạy MySQL hiện có và `npm run dev` trong `backend`.
2. Import `docs/doan4-dau-gia.postman_collection.json`. Collection đã chứa địa chỉ `http://localhost:5000/api`, body và các biến; không cần environment riêng.
3. Gửi yêu cầu “Kiểm tra backend và MySQL”. Kết quả mong đợi: 200.
4. Gửi bốn yêu cầu đăng nhập có sẵn. Mã đăng nhập được lưu trong các biến collection; không ghi token ra console.

Các tài khoản mẫu đã xác nhận đăng nhập được với mật khẩu mẫu công khai trong SQL là `123456`:

- `admin@daugia.local`: Admin.
- `minh.nb@daugia.local`: người bán đã xác minh, dùng cho ví dụ.
- `ha.nb@daugia.local`: một người bán đã xác minh khác.
- `nam.nm@daugia.local`: người mua A.
- `hoanganh@daugia.local`: người mua B.
- `long.pending@daugia.local`: hồ sơ người bán đang chờ duyệt.

Đây là tài khoản/dữ liệu mẫu của SQL, không lấy mật khẩu từ `.env`. Nếu đã tự đổi mật khẩu tài khoản mẫu, sửa biến `matKhauMau` trên máy. Đăng ký mới yêu cầu mật khẩu ít nhất 8 ký tự; điền biến `matKhauDangKy` trước khi gửi yêu cầu đăng ký.

Collection lưu `maQuanTri`, `maNguoiBan`, `maNguoiMuaA`, `maNguoiMuaB`. Biến `maNguoiMua` là tài khoản người mua vừa đăng nhập gần nhất và dùng cho đơn hàng, hồ sơ, thông báo. Hai yêu cầu đặt giá A/B luôn dùng token riêng. Để đổi người mua đang thao tác, gửi lại yêu cầu đăng nhập A hoặc B tương ứng.

Gửi từng kịch bản dưới đây. Không chạy toàn bộ collection liên tiếp: các nhánh Mua ngay, hủy, xác nhận hàng tốt và mở tranh chấp không thể áp dụng tuần tự cho cùng một phiên/đơn.

## Tạo dữ liệu mới qua API

1. Admin gửi “Tạo danh mục thử nghiệm”; Postman lưu `danhMucId`. Có thể thêm thuộc tính động; mẫu hiện không bắt buộc nên sản phẩm có thể gửi `thuoc_tinh: []`.
2. Người bán gửi “Tạo sản phẩm nháp”; Postman lưu `sanPhamId`.
3. Mở “Tải đúng một tệp”, đặt `nhomTep = product`, Authorization dùng `maNguoiBan`. Trong Body → form-data, chọn một ảnh PNG/JPEG/WebP ở trường `file` kiểu File; không tự đặt Content-Type multipart.
4. Sao chép `data.duong_dan` từ kết quả hoặc biến `tepVuaTai` vào biến `anhSanPham`. Gửi “Gắn ảnh đã tải lên vào sản phẩm”.
5. Gửi “Gửi sản phẩm cho Admin duyệt”, sau đó Admin gửi “Admin duyệt sản phẩm”. Mỗi bước dùng đúng tài khoản tự thiết lập trong request.
6. Gửi “Tạo phiên hai phút cho sản phẩm đã duyệt”; Postman tạo thời gian ISO theo lúc gửi, lưu `phienId`. Nếu muốn trình diễn lâu hơn, thay thời gian kết thúc trong Body.

Với danh mục đã có sẵn, đọc `/categories/:id/attributes`, điền các thuộc tính bắt buộc trước khi gửi duyệt. Mẫu `thuoc_tinh`:

```json
{
  "thuoc_tinh": [{ "thuoc_tinh_id": "ID_THUOC_TINH_THAT", "gia_tri": "Giá trị hợp lệ" }]
}
```

Đây là phần body cần ghép vào yêu cầu tạo/sửa sản phẩm đầy đủ, không phải body độc lập. ID có thể được trả dạng chuỗi; không tự đoán ID từ số lần đã chạy thử.

## Đấu giá tự động và gia hạn

1. Đăng nhập A, xem địa chỉ; nếu chưa có thì thêm. Làm tương tự cho B.
2. Với phiên mới khởi điểm 18 triệu, không có sàn, gửi “A cam kết tối đa 20 triệu”. Giá công khai ban đầu là 18 triệu.
3. Gửi “B cam kết tối đa 22 triệu”. Nếu bảng bước giá vẫn cấu hình 200 nghìn ở khoảng này, B dẫn đầu tại 20,2 triệu.
4. Đọc chi tiết phiên và lịch sử: không có trường `gia_toi_da` hoặc mật khẩu. Các lượt đáp trả công khai có thể bao gồm giá mà A đã bị dùng hết cam kết.
5. Để thử bằng mức tối đa, tạo phiên mới rồi cho A và B cùng đặt 20 triệu: A giữ vị trí dẫn đầu vì đặt trước.
6. Để thử chống phút chót, gửi một mức hợp lệ làm thay đổi giá công khai trong 60 giây cuối. `thoi_gian_ket_thuc` tăng 90 giây so với mốc trước đó và `so_lan_gia_han` tăng 1. Khi tiếp tục rơi vào 60 giây cuối mới, có thể thử lại.

Không sửa giá trị `gia_toi_da` xuống thấp hơn lần trước. Người dẫn đầu chỉ nâng cam kết khi không cần đạt thêm sàn sẽ không làm tăng giá hoặc gia hạn. Chờ tác vụ sau giờ kết thúc để thấy đơn của người thắng; đọc `/orders`, chọn đúng `donHangId` từ danh sách. Collection không tự chọn ngẫu nhiên đơn cũ.

## Mua ngay và luồng đơn hàng

1. Tạo sản phẩm/phiên mới chưa có giá trả để thử Mua ngay. Thành công trả `{ phien, don_hang }` và tự lưu `donHangId`.
2. Với token người mua đúng đơn, gửi “Thanh toán mô phỏng”. Body chỉ `{}`; server lấy tổng tiền trong đơn. Gửi lại không tạo khoản thanh toán mới.
3. Đọc chi tiết đơn: tiền trung gian `DANG_GIU`, đơn chờ gửi hàng.
4. Người bán gửi “Người bán xác nhận đã gửi hàng” cùng mã vận đơn.
5. Người mua gửi “Người mua xác nhận hàng đã giao”. Bắt đầu thời gian kiểm tra hàng.
6. Với nhánh hàng tốt, gửi “Người mua nhận hàng tốt và giải ngân”: đơn `HOAN_THANH`, tiền `DA_GIAI_NGAN`. Sau đó mới đánh giá được.

Mua ngay tắt sau giá đầu tiên ở phiên không có sàn. Nếu có sàn, còn Mua ngay trước khi đạt sàn. Sau Mua ngay, đặt giá hoặc mua tiếp phải bị từ chối.

## Tranh chấp

Dùng một đơn khác đã trả tiền, gửi hàng và xác nhận giao, đang trong hạn kiểm tra. Bỏ qua bước xác nhận hàng tốt.

1. Người mua mở tranh chấp; Postman lưu `tranhChapId`.
2. Đặt `nhomTep = evidence`, đổi Authorization của request tải tệp sang `maNguoiMua`, chọn ảnh/PDF. Sao chép đường dẫn trả về vào `tepBangChung`, sau đó gửi “Gắn bằng chứng đã tải lên”.
3. Người bán gửi phản hồi. Admin tiếp nhận và giải quyết.
4. Mẫu giải quyết hiện hoàn 1 triệu. Muốn hoàn toàn bộ, đặt `so_tien_hoan` bằng tiền đang giữ. Muốn giải ngân cho người bán, dùng `ket_qua = NGUOI_BAN`, `so_tien_hoan = "0"`.
5. Đọc lại chi tiết đơn/tranh chấp để kiểm tra tiền và trạng thái. Gửi lại quyết định giải quyết phải trả 409.

Nếu cùng gửi yêu cầu mở tranh chấp và xác nhận hàng tốt, chỉ một nhánh được thành công. Khi tranh chấp đã mở, tác vụ hết hạn kiểm tra không được giải ngân.

## Xác minh người bán và avatar

Với tài khoản người dùng chưa xác minh, dùng token của chính tài khoản đó để tải ba ảnh ở nhóm `verification`. Chép đường dẫn vào `anhMatTruoc`, `anhMatSau`, `anhSelfie`, điền thông tin thử nghiệm và gửi hồ sơ. Admin duyệt `DA_XAC_MINH` hoặc `TU_CHOI` kèm `ly_do_tu_choi`.

Tài khoản `long.pending@daugia.local` đã có hồ sơ chờ; dùng Admin xem danh sách để lấy đúng ID trước khi duyệt. Không gửi lại hồ sơ chờ của cùng tài khoản.

Avatar tải ở nhóm `avatar`, sau đó cập nhật `/users/me` với `anh_dai_dien` bằng đường dẫn trả về. Tải tệp chỉ lưu tệp; phải gửi API liên kết đường dẫn vào đối tượng nghiệp vụ.

## Second Chance và tác vụ

Second Chance chỉ có sau khi đơn bị hủy do không thanh toán. Hệ thống tự tìm người phù hợp, dùng giá trả công khai cuối cùng và bỏ qua người chưa đạt sàn. Người được đề nghị xem `/second-chances`, chọn `deNghiId`, rồi chấp nhận hoặc từ chối bằng token của mình.

Để kiểm tra nhanh các hạn 48 giờ/3 ngày/24 giờ mà không sửa dữ liệu mẫu bằng tay, chạy `npm run test:integration` khi dừng backend đang chạy tác vụ. Bộ kiểm thử tạo dữ liệu riêng với các mốc đến hạn, kiểm tra đóng phiên, hủy đơn, Second Chance chủ động, quá hạn và giải ngân rồi hoàn tác/dọn đúng dữ liệu đó. Không cần nhập lại SQL hoặc đổi cấu hình chung để tăng tốc thử nghiệm.

API `/admin/jobs` chỉ đọc trạng thái, không kích hoạt tác vụ bằng HTTP. Khi chạy backend bình thường, chu kỳ đầu bắt đầu sau 60 giây.

## Kiểm tra quyền và lỗi mong đợi

- Bỏ Authorization khi đọc `/orders`: 401.
- Token người mua gọi `/admin/users`: 403.
- Người bán tự đặt giá phiên của mình: 403.
- Người ngoài xem đơn/tranh chấp riêng tư: 403.
- Tạo phiên cho sản phẩm chưa duyệt hoặc trả giá khi hết giờ: 409.
- Trả JSON có trường tự nâng quyền hoặc số tiền thanh toán tự đặt: 400.
- Đọc giấy tờ xác minh bằng khách: 401; bằng tài khoản không có quyền: 403.

Các assertion có sẵn trong Postman mặc định chờ thành công 2xx. Khi chủ động thử trường hợp sai ở trên, đổi assertion của request sang mã mong đợi hoặc chỉ đọc status/response; không xem dấu đỏ đó là lỗi của backend.

## Socket.IO từ frontend hiện có

Frontend đã có thư viện `socket.io-client`; đoạn dưới chỉ là ví dụ kết nối, chưa được thêm vào frontend:

```javascript
import { io } from 'socket.io-client';

const ketNoi = io('http://localhost:5000', {
  auth: { token: maDangNhap }, // Có thể bỏ auth để chỉ xem phòng công khai.
});

ketNoi.emit('auction:join', { auctionId: phienId }, (ketQua) => {
  console.log(ketQua.success);
});
ketNoi.on('auction:bid-updated', capNhatPhien);
ketNoi.on('auction:ended', capNhatPhien);
ketNoi.on('notification:new', themThongBao);
```

`maDangNhap`, `phienId`, `capNhatPhien`, `themThongBao` lấy từ phần ứng dụng frontend sẽ triển khai. Khi mất rồi nối lại kết nối, đọc API để đồng bộ trạng thái mới nhất.
