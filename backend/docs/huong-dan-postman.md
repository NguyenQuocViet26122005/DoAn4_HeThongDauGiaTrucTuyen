# Thử Backend bằng Postman

Nếu muốn kiểm tra tự động trước khi dùng Postman, chạy `npm run test:api` trong `backend`. Hai bộ HTTP chạy trên cổng riêng, bao phủ 107 API, dùng tài khoản ngẫu nhiên rồi rollback và dọn tệp. Không cần khởi động server riêng hoặc lấy token thủ công. Dừng backend đang chạy tác vụ định kỳ trước khi chạy bộ tích hợp để tránh tiến trình khác cùng xử lý dữ liệu kiểm thử.

Trong nhóm sản phẩm có yêu cầu **Chọn ảnh đại diện**. Sau khi tải và gắn ảnh, chọn đúng `sanPhamId` và `anhId` rồi gửi PATCH; phản hồi là danh sách ảnh với một ảnh chính. Sản phẩm chờ duyệt/đang kiểm định/đã có phiên không được đổi ảnh.

Trong nhóm đấu giá có **Chi tiết phiên của tôi**: dùng token người bán và `phienId` để xem trạng thái phiên cùng yêu cầu hủy mới nhất. Luồng thử: lấy **Sản phẩm đủ điều kiện tạo phiên** → tạo phiên → xem chi tiết riêng → gửi yêu cầu hủy → xem lại chi tiết. Yêu cầu hủy còn chờ không tự dừng phiên; thử bằng dữ liệu riêng.

## Chuẩn bị

1. Chạy MySQL hiện có và `npm run dev` trong `backend`.
2. Import `docs/doan4-dau-gia.postman_collection.json`. Collection đã chứa địa chỉ `http://localhost:5000/api`, body và các biến; không cần environment riêng.
3. Gửi yêu cầu “Kiểm tra backend và MySQL”. Kết quả mong đợi: 200.
4. Gửi bốn yêu cầu đăng nhập có sẵn. Mã đăng nhập được lưu trong các biến collection; không ghi token ra console.

Bộ dữ liệu thực hành hiện tại dùng mật khẩu chung `VietBid@2026`:

- `admin@vietbid.test`: Admin.
- `hoang@vietbid.test`: người bán dùng cho ví dụ.
- `ha@vietbid.test`: người bán khác.
- `duc.anh@vietbid.test`: người mua A.
- `bao.ngoc@vietbid.test`: người mua B.

Xem đủ 16 tài khoản và các tình huống tại [Bộ dữ liệu thực hành](DU-LIEU-DEMO-VIETBID.md). Bộ mới có 5 người bán đã xác minh; để thử duyệt xác minh mới, đăng ký một tài khoản riêng qua API.

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

1. Tạo phiên còn Mua ngay. Gửi kết quả mô phỏng và khóa yêu cầu; thành công trả đơn CHO_GUI_HANG đã thu đủ, Postman lưu donHangId.
2. Mua ngay đã thanh toán trong bước trên. Thử THAT_BAI trên phiên khác: không có đơn, phiên/cọc không đổi. Giữ khóa khi retry cùng lần thử; đổi khóa cho lần thử mới. API thanh toán đơn riêng dành cho đơn thắng đấu giá thường còn thiếu tiền.
3. Đọc chi tiết đơn: tiền trung gian `DANG_GIU`, đơn chờ gửi hàng.
4. Gửi shipping cùng mã vận đơn: token Admin cho đơn TRUNG_TAM; token seller cho đơn NGUOI_BAN.
5. Người mua gửi “Người mua xác nhận hàng đã giao”. Bắt đầu thời gian kiểm tra hàng.
6. Với nhánh hàng tốt, gửi “Người mua nhận hàng tốt và giải ngân”: đơn `HOAN_THANH`, tiền `DA_GIAI_NGAN`. Sau đó mới đánh giá được.

Mua ngay tắt sau giá đầu tiên ở phiên không có sàn. Nếu có sàn, còn Mua ngay trước khi đạt sàn. Sau Mua ngay, đặt giá hoặc buyer khác mua tiếp bị từ chối; buyer cũ gửi lặp nhận lại đơn cũ, không thu thêm.

## Tranh chấp

Dùng một đơn khác đã trả tiền, gửi hàng và xác nhận giao, đang trong hạn kiểm tra. Bỏ qua bước xác nhận hàng tốt.

1. Người mua mở tranh chấp; Postman lưu `tranhChapId`.
2. Đặt `nhomTep = evidence`, đổi Authorization của request tải tệp sang `maNguoiMua`, chọn ảnh/PDF. Sao chép đường dẫn trả về vào `tepBangChung`, sau đó gửi “Gắn bằng chứng đã tải lên”.
3. Người bán gửi phản hồi. Admin tiếp nhận và giải quyết.
4. Mẫu giải quyết hoàn toàn bộ. Bỏ so_tien_hoan để server lấy đủ tiền (cả cọc và phí); nếu gửi thì phải khớp. Giải ngân seller dùng ket_qua = NGUOI_BAN. Không hỗ trợ hoàn một phần mới.
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

## Báo cáo sản phẩm và đăng lại

1. Đăng nhập bằng tài khoản người mua, lấy một `phienId` công khai và gửi `POST /auctions/{{phienId}}/reports` với `ly_do` và `mo_ta`. Không dùng tài khoản người bán của sản phẩm đó; mỗi tài khoản chỉ gửi một báo cáo cho cùng sản phẩm, kể cả khi sản phẩm được đăng lại.
2. Dùng `GET /product-reports/me` để xem trạng thái báo cáo của tài khoản gửi. Danh tính người gửi không được trả cho tài khoản bị báo cáo.
3. Admin dùng `GET /admin/violations` để xem hồ sơ, rồi `PATCH /admin/violations/{{viPhamId}}/review` với trạng thái, hình thức xử lý và lý do. Kết luận không vi phạm dùng `trang_thai: "DA_HUY"` và `hinh_thuc_xu_ly: "KHONG_VI_PHAM"`.
4. Để đăng lại, người bán đã xác minh lấy danh sách `GET /products/mine?du_dieu_kien_dau_gia=1`. Sản phẩm đủ điều kiện xuất hiện trong danh sách này; tạo phiên mới bằng `POST /auctions` với cùng `san_pham_id` và thông tin giá/lịch mới. Không có API đăng lại riêng. Phiên chưa có người thắng được đăng lại; đơn cũ phải đã hủy do không thanh toán và mọi Cơ hội mua tiếp trước đó phải bị từ chối/hết hạn. API tạo phiên kiểm tra lại các điều kiện trong transaction.

Các thao tác trên ghi dữ liệu thật trong CSDL đang cấu hình. Chỉ thực hiện với tài khoản, phiên và sản phẩm thử nghiệm phù hợp; không dùng API ghi để thử trên dữ liệu giao dịch thật.

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

## Kiểm định, trung tâm và cọc

1. Admin đặt yeu_cau_kiem_dinh = true cho danh mục. Seller tạo sản phẩm có ảnh/thuộc tính và gửi duyệt.
2. Admin tạo hồ sơ kiểm định; seller khai báo gửi. Admin ghi tình trạng/serial/số kiện rồi bắt đầu kiểm định.
3. Upload bằng token Admin, nhomTep = inspection, chọn ảnh/PDF. Chép tepVuaTai sang tepKiemDinh, gắn loại BAO_CAO_KIEM_DINH.
4. Đặt ngayKiemDinh đúng thời gian báo cáo, ISO có múi giờ, từ lúc nhận đến hiện tại. Admin ghi DAT rồi duyệt sản phẩm. Nếu KHONG_DAT/CAN_BO_SUNG thì có thể ghi trả; không chạy bước trả cho hàng DAT đang giữ.
5. Muốn thử cọc: Admin chọn chính sách rồi đặt bat = true trước khi seller tạo phiên mới. Phiên cũ không đổi.
6. Buyer đăng ký, trả cọc rồi đặt giá. khoaDatCoc giữ cố định cho cùng lần thử; lần thử mới đổi khóa. HTTP 200 có thể là THAT_BAI, phải đọc thêm trạng thái.
7. Chốt phiên: cọc winner chuyển vào đơn, loser được hoàn; winner chỉ trả phần thiếu. Hàng ở trung tâm dùng Admin gọi shipping. Nhận hàng chưa giải ngân.
8. Second Chance: seller tạo từ đơn hủy vì quá hạn; ứng viên chấp nhận kèm thanh toán đủ ngay, không cọc lại. Kiểm tra thất bại giữ đề nghị đang chờ và retry không tạo đơn trùng.

Bộ Postman không tự tạo tài khoản hoặc bật cọc. Điền thông tin thử nghiệm thực tế và chạy từng nhánh. Đổi khóa khi chuyển sang giao dịch mới.
