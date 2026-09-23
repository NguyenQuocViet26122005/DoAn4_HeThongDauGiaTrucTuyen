# Nghiệp vụ và các quyết định triển khai

## Tài khoản, người bán và sản phẩm

Chỉ có `NGUOI_DUNG` và `QUAN_TRI`. Một người dùng có thể mua; muốn bán cần `trang_thai_nguoi_ban = DA_XAC_MINH` và tài khoản hoạt động. Admin xét duyệt hồ sơ có ảnh giấy tờ, selfie và thông tin ngân hàng. Giấy tờ thuộc phạm vi riêng tư của chủ hồ sơ và Admin.

Sản phẩm đi từ `BAN_NHAP` → `CHO_XU_LY` → `DA_DUYET` hoặc `TU_CHOI`. Chỉ sửa nháp/bị từ chối và chưa có lịch sử phiên. Gửi duyệt cần ít nhất một ảnh cùng đủ thuộc tính bắt buộc của danh mục. Các kiểu thuộc tính hỗ trợ: `VAN_BAN`, `SO`, `LUA_CHON`, `DUNG_SAI`, `NGAY`. Thuộc tính hiện áp dụng theo đúng danh mục của sản phẩm, chưa tự kế thừa từ danh mục cha.

Phiên chỉ được tạo cho sản phẩm đã duyệt, thuộc người bán. Backend không cung cấp API sửa giá/thời gian phiên sau khi tạo; hủy thông qua yêu cầu để Admin xét duyệt. Sản phẩm có phiên đang chờ/đang chạy/đã kết thúc thành công không được tạo thêm phiên để tránh bán trùng, kể cả khi đang chờ Second Chance.

## Giá tối đa bí mật và giá công khai

Người mua gửi `gia_toi_da` qua API POST đặt giá. Hệ thống lưu vào `tham_gia_phien` (chỉ bản ghi có mức cam kết); chỉ các lượt đáp trả công khai được lưu trong `luot_tra_gia`. Không có endpoint đọc mức tối đa, kể cả cho người bán hoặc Admin. API danh sách/chi tiết/lịch sử và sự kiện Socket.IO dùng danh sách trường được phép xuất.

Nếu B vượt mức tối đa của A, giá mới là `min(maxB, maxA + bước giá tại maxA)`. Ví dụ maxA 20 triệu, maxB 22 triệu và bước giá 200 nghìn: B dẫn đầu ở 20,2 triệu. Nếu bằng nhau, giữ người dẫn đầu đã được lưu trước giao dịch mới; cách này xử lý cả hai yêu cầu trong cùng giây và việc nâng mức tối đa.

Nếu người mới đặt thấp hơn, hệ thống ghi lượt của người mới rồi lượt tự động bảo vệ của người dẫn đầu. Giá công khai luôn nằm trong mức cam kết của người dẫn đầu. Một lượt công khai có thể bằng mức cam kết đã bị dùng hết, nhưng API không trả thêm trường tiết lộ mức cam kết còn lại. Không cho giảm hoặc tự rút mức tối đa.

Người đầu tiên trả giá khởi điểm; với giá sàn, hệ thống có thể tăng đến `min(mức cam kết, giá sàn)`. Chính sách này cũng áp dụng khi người dẫn đầu nâng mức cam kết để đạt sàn. Nếu đã đạt sàn hoặc không có sàn, việc người dẫn đầu chỉ nâng trần không tăng giá công khai và không tạo gia hạn giả. Mức giá sàn cụ thể không nằm trong dữ liệu phiên công khai, chỉ có `dat_gia_san`.

Bước giá đọc từ JSON tại khóa `BUOC_GIA` trong `cau_hinh_he_thong`, kiểm tra khoảng bị thiếu/chồng lấn. Tiền tính bằng BigInt ở đơn vị 1/100, trả ra chuỗi thập phân; không tính tiền bằng số thực JavaScript.

## Thời gian và chống đặt giá phút chót

Các mốc thời gian lấy từ MySQL theo giây, tương ứng độ chính xác DATETIME hiện có. Điều này tránh MySQL làm tròn mili giây sang giây kế tiếp khi lưu lượt đặt giá. `DB_TIMEZONE` mặc định `+07:00`; đầu vào ngày tạo phiên bắt buộc có múi giờ.

Khi có lượt giá công khai hợp lệ và `0 < thời gian còn lại <= 60 giây`, cộng 90 giây vào thời gian kết thúc trước đó. Một yêu cầu tạo nhiều lượt đáp trả chỉ gia hạn một lần; các yêu cầu hợp lệ tiếp theo có thể gia hạn nhiều lần. Lịch sử được lưu ở `nhat_ky_hoat_dong`, hành động `GIA_HAN_PHIEN`, có khóa ngoại phiên/lượt giá và JSON mốc cũ/mới. Giá trị ngưỡng/gia hạn được chụp từ cấu hình hệ thống khi tạo phiên.

Với giá sàn, Mua ngay còn hiệu lực đến khi đạt sàn. Không có sàn, Mua ngay tắt sau lượt giá hợp lệ đầu tiên. Mua ngay và trả giá dùng cùng khóa phiên, nên chỉ một nhánh phù hợp được thực hiện trước; phiên chốt xong không nhận thêm giá.

Tác vụ chốt phiên thất bại nếu không có lượt giá hoặc chưa đạt sàn; nếu thành công tạo đúng một đơn đang xử lý. Vì schema chỉ có nguồn `THANG_DAU_GIA` và `DE_NGHI_TIEP_THEO`, đơn Mua ngay dùng `THANG_DAU_GIA`; phân biệt bằng `ly_do_ket_thuc = MUA_NGAY` của phiên.

## Transaction và Socket.IO

Những thao tác nhiều bảng chạy trong transaction. Đấu giá khóa bản ghi phiên bằng `SELECT ... FOR UPDATE`. Thanh toán, chốt đơn, đề nghị mua tiếp, tranh chấp và giải ngân cùng tuân thủ thứ tự khóa phiên → đơn → bản ghi liên quan. Khi deadlock/lock timeout, lớp kết nối thử lại toàn bộ transaction, tối đa ba lần; hết lượt trả 409.

Sự kiện chỉ gửi sau commit; rollback không phát dữ liệu chưa được lưu. Phòng công khai là `auction:<id>`; phòng riêng `user:<id>` được server tự cấp theo token. Người dùng không tự chỉ định phòng của người khác. Socket có token được kiểm tra lúc kết nối, khi vào phòng và định kỳ 60 giây.

Các sự kiện đang dùng:

- Client gửi `auction:join` hoặc `auction:leave` với `{ auctionId: "..." }`; server trả acknowledgment `success` và dữ liệu phiên khi vào phòng thành công.
- Server gửi `auction:started`, `auction:bid-updated`, `auction:ended`. Dữ liệu gồm giá hiện tại, người dẫn đầu dạng `ND-<id>`, trạng thái, thời gian kết thúc mới và số lần gia hạn; không có mức tối đa.
- Server gửi `notification:new` vào phòng riêng đã xác thực.

Các request tham gia/gửi giá vẫn qua HTTP có JWT. Client nên đọc lại chi tiết và lịch sử qua API sau khi kết nối lại; không có hàng đợi lưu sự kiện Socket.IO đã bỏ lỡ.

## Đơn hàng, thanh toán và giao hàng

Người mua cần ít nhất một địa chỉ trước khi đặt giá/Mua ngay vì schema đơn bắt buộc địa chỉ nhận hàng. Khi chốt, hệ thống chụp địa chỉ mặc định; nếu không có cờ mặc định sẽ chọn địa chỉ đầu tiên còn lại. Không được xóa địa chỉ cuối cùng khi đang có cam kết. Đơn chưa thanh toán cho phép chọn lại địa chỉ thuộc mình.

Luồng thực tế: `CHO_THANH_TOAN` → `CHO_GUI_HANG` sau thanh toán mô phỏng → `DA_GUI_HANG` → `DANG_KIEM_TRA` khi xác nhận đã giao → `HOAN_THANH`. Các trạng thái `DA_THANH_TOAN`/`DA_GIAO` trong dữ liệu hiện có vẫn được xử lý ở những bước tương ứng. Phí vận chuyển bằng 0; tổng tiền lấy từ kết quả phiên hoặc đề nghị, không nhận số tiền do client tự gửi.

Thanh toán lặp lại không tạo trùng lần thu/giữ tiền. Tiền được giữ ở `DANG_GIU`; khi hoàn thành chuyển `DA_GIAI_NGAN`. Người bán nhập đơn vị vận chuyển và mã vận đơn. Người mua hoặc Admin được xác nhận đã giao; người bán không tự bắt đầu đồng hồ kiểm tra hàng.

Các hạn mặc định nếu chưa có bản ghi cấu hình: thanh toán 48 giờ, gửi hàng 3 ngày, kiểm tra hàng 3 ngày, Second Chance 24 giờ. Nếu có bản ghi cấu hình thì sử dụng giá trị trong MySQL. Thời hạn được chụp vào đối tượng tại bước tương ứng, không tự tính lại hạn cũ khi Admin sửa cấu hình.

## Tranh chấp và vi phạm

Người mua mở tranh chấp khi đang kiểm tra hàng và chưa hết hạn, hoặc chưa nhận hàng sau mốc 7 ngày từ lúc gửi. Admin có thể tiếp nhận sớm các đơn đã thanh toán còn giữ tiền. Mở tranh chấp giữ nguyên tiền; việc xác nhận hàng tốt/tự hoàn thành tranh chấp cùng khóa đơn nên không thể vừa giải ngân vừa mở tranh chấp thành công.

Admin có thể tiếp nhận, đọc phản hồi và bằng chứng, sau đó quyết định:

- Cho người bán: `ket_qua = NGUOI_BAN`, `so_tien_hoan = 0`; giải ngân và hoàn thành đơn.
- Hoàn toàn bộ: `NGUOI_MUA`, số tiền hoàn bằng tiền đang giữ; escrow `DA_HOAN_TIEN`, đơn `DA_HUY`, thanh toán `DA_HOAN_TIEN`.
- Không tạo hoàn tiền một phần mới. Dữ liệu lịch sử cũ vẫn được bảo toàn để đối chiếu.

Người mua/người bán chỉ đánh giá bên còn lại sau khi đơn hoàn thành, mỗi bên một lần, 1–5 sao. Vi phạm là từng bản ghi riêng; quá hạn thanh toán/gửi hàng tự tạo vi phạm đang mở để Admin xét. Admin chọn `hinh_thuc_xu_ly`: `CANH_CAO`, `TAM_NGUNG`, `KHOA_TAI_KHOAN`; hủy vi phạm dùng `KHONG_VI_PHAM`. Không tính điểm để tự tăng hình phạt.

## Second Chance

Đơn hết hạn thanh toán bị hủy với lý do `KHONG_THANH_TOAN`, tạo vi phạm một lần. Người bán chủ động gọi API tạo đề nghị khi chưa có đơn hoặc đề nghị đang chờ. Job không tự tạo đề nghị; Admin không thay người bán gửi đề nghị.

Ứng viên được xếp theo **lượt trả giá công khai hợp lệ cuối cùng của từng người**, giá giảm dần, rồi thời gian/ID tăng dần. Lượt phải nằm trong thời gian phiên và có số tiền dương. Loại người bán, tài khoản không hoạt động, người đã từng có đơn/đề nghị trong phiên và người chưa đạt sàn. Truy vấn không đọc bảng `muc_gia_toi_da`.

Chấp nhận đề nghị kiểm tra lại quyền, hạn, giá công khai và điều kiện người bán, rồi tạo đơn mới tại chính `gia_de_nghi`. Chấp nhận lặp không tạo trùng đơn. Từ chối hoặc hết hạn chỉ đóng đề nghị hiện tại; người bán phải yêu cầu lại để gửi cho người tiếp theo.

## Tác vụ và vận hành

Bộ lập lịch chạy mỗi 60 giây, mỗi nhóm lấy tối đa 100 bản ghi: phiên đến giờ, đơn đến hạn và đề nghị hết hạn. Không chạy các lịch nhắc nhiều mốc. Những lần nhắc cùng loại/đối tượng không tạo thông báo trùng. Gửi hàng muộn đã ghi nhận được loại khỏi lượt quét sau.

`GET /api/admin/jobs` trả trạng thái bật/tắt, đang chạy, thời gian gần nhất và số bản ghi xử lý/thất bại. Lỗi từng bản ghi được ghi bằng ID/mã lỗi để các bản ghi khác vẫn được xử lý.

Các giới hạn còn lại: giao hàng được cập nhật thủ công, không có theo dõi vận đơn thật; chưa có xử lý rút giá đặc biệt bởi Admin; chưa có quy trình đăng bán lại sau khi tất cả Second Chance thất bại; chưa có dọn tệp upload không được gắn vào dữ liệu. Giới hạn request và bộ lập lịch ở trong tiến trình; Socket.IO chưa có adapter chia sẻ giữa nhiều máy chủ. Đây là các phần mở rộng vận hành, cần triển khai riêng khi mở rộng phạm vi.
