# Nghiệp vụ và các quyết định triển khai

## Tài khoản, người bán và sản phẩm

Chỉ có `NGUOI_DUNG` và `QUAN_TRI`. Một người dùng có thể mua; muốn bán cần `trang_thai_nguoi_ban = DA_XAC_MINH` và tài khoản hoạt động. Admin xét duyệt hồ sơ có ảnh giấy tờ, selfie và thông tin ngân hàng. Giấy tờ thuộc phạm vi riêng tư của chủ hồ sơ và Admin.

Sản phẩm đi từ `BAN_NHAP` → `CHO_XU_LY` → `DA_DUYET` hoặc `TU_CHOI`. Chỉ sửa nháp/bị từ chối và chưa có lịch sử phiên. Gửi duyệt cần ít nhất một ảnh cùng đủ thuộc tính bắt buộc của danh mục. Các kiểu thuộc tính hỗ trợ: `VAN_BAN`, `SO`, `LUA_CHON`, `DUNG_SAI`, `NGAY`. Thuộc tính hiện áp dụng theo đúng danh mục của sản phẩm, chưa tự kế thừa từ danh mục cha.

Phiên chỉ được tạo cho sản phẩm đã duyệt, thuộc người bán. Backend không cung cấp API sửa giá/thời gian phiên sau khi tạo; hủy thông qua yêu cầu để Admin xét duyệt. Chặn phiên đang chờ/chạy và mọi đơn, đề nghị còn nghĩa vụ của cùng món hàng, kể cả hồ sơ đăng bán lại. Đơn hủy do không thanh toán có thể đăng lại; đơn hoàn tiền tranh chấp chỉ đăng lại sau thu hồi/kiểm kê, kiểm định lại và duyệt hàng đủ điều kiện theo phiên bản 3.1.

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

Luồng thực tế: `CHO_THANH_TOAN` → `CHO_GUI_HANG` sau thanh toán mô phỏng → `DA_GUI_HANG` → `DANG_KIEM_TRA` khi xác nhận đã giao → `HOAN_THANH`. Các trạng thái `DA_THANH_TOAN`/`DA_GIAO` trong dữ liệu hiện có vẫn được xử lý ở những bước tương ứng. Phí vận chuyển công bố từ phiên và chụp sang đơn. Tổng tiền bằng giá sản phẩm cộng phí; phần còn phải trả bằng tổng trừ tiền đã thu, gồm cọc chuyển vào đơn. Không nhận số tiền từ client.

Thanh toán lặp lại không tạo trùng lần thu/giữ tiền. Tiền được giữ ở `DANG_GIU`; khi hoàn thành chuyển `DA_GIAI_NGAN`. Đơn NGUOI_BAN do seller nhập vận chuyển; đơn TRUNG_TAM chỉ Admin ghi nhận trung tâm gửi khi hồ sơ đạt, hàng còn giữ và đơn đã thu đủ. Người mua hoặc Admin được xác nhận đã giao; người bán không tự bắt đầu đồng hồ kiểm tra hàng.

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

Ứng viên được xếp theo **lượt trả giá công khai hợp lệ cuối cùng của từng người**, giá giảm dần, rồi thời gian/ID tăng dần. Lượt phải nằm trong thời gian phiên và có số tiền dương. Loại người bán, tài khoản không hoạt động, người đã từng có đơn/đề nghị trong phiên và người chưa đạt sàn. Truy vấn không đọc mức tối đa trong `tham_gia_phien`.

Chấp nhận đề nghị kiểm tra quyền, hạn, giá công khai và seller; thanh toán đủ giá đề nghị cộng phí trong cùng transaction rồi mới hoàn tất việc nhận đề nghị/tạo đơn. Không cọc lại. Thanh toán lỗi không tạo đơn, giữ đề nghị đang chờ khi còn hạn. Chấp nhận lặp không tạo trùng đơn. Từ chối hoặc hết hạn chỉ đóng đề nghị hiện tại; người bán phải yêu cầu lại để gửi cho người tiếp theo.

## Tác vụ và vận hành

Bộ lập lịch chạy mỗi 60 giây, mỗi nhóm lấy tối đa 100 bản ghi: phiên đến giờ, đơn đến hạn và đề nghị hết hạn. Không chạy các lịch nhắc nhiều mốc. Những lần nhắc cùng loại/đối tượng không tạo thông báo trùng. Gửi hàng muộn đã ghi nhận được loại khỏi lượt quét sau.

`GET /api/admin/jobs` trả trạng thái bật/tắt, đang chạy, thời gian gần nhất và số bản ghi xử lý/thất bại. Lỗi từng bản ghi được ghi bằng ID/mã lỗi để các bản ghi khác vẫn được xử lý.

Các giới hạn còn lại: giao hàng được cập nhật thủ công, không có theo dõi vận đơn thật; chưa có xử lý rút giá đặc biệt bởi Admin; chưa có dọn tệp upload không được gắn vào dữ liệu. Người bán đã có thể đăng lại sản phẩm sau phiên không có người thắng hoặc đơn không thanh toán khi mọi Cơ hội mua tiếp đã bị từ chối/hết hạn; backend kiểm tra lại điều kiện lúc tạo phiên. Giới hạn request và bộ lập lịch ở trong tiến trình; Socket.IO chưa có adapter chia sẻ giữa nhiều máy chủ. Đây là các phần mở rộng vận hành, cần triển khai riêng khi mở rộng phạm vi.

## Kiểm định và cọc — phiên bản 3.0

Đặc tả chính ở `../../TAI-LIEU-NGHIEP-VU-VA-CONG-NGHE.md`. Admin nhập báo cáo chuyên gia bên ngoài, không có tài khoản chuyên gia. Hàng bắt buộc kiểm định cần báo cáo đạt và đang ở trung tâm trước khi duyệt/mở phiên. Khi có nghĩa vụ bán, không sửa hồ sơ hoặc đổi sản phẩm.

Admin cấu hình DEPOSIT_POLICY rồi bật; mặc định tắt, chỉ phiên mới lấy chính sách mới. Đặt giá cần cọc thành công khi phiên yêu cầu. Nộp cọc sớm không tạo ưu tiên trả giá. Người thua/phiên hủy/thất bại được hoàn; winner chuyển cọc vào đơn. Quá hạn phần còn lại ghi không hoàn cọc và cờ Admin, không tự trả cọc cho seller.

Mua ngay không yêu cầu cọc riêng: nếu có cọc thì trừ vào phần phải trả. Thanh toán đủ và chốt phiên cùng transaction; thất bại giữ phiên/cọc, không tạo đơn. Không áp dụng thanh toán sau cho Mua ngay hoặc Second Chance.

Nhận hàng chưa giải ngân; giải ngân cần đủ tiền, không tranh chấp/cờ Admin và tài khoản đủ điều kiện. Lý do tranh chấp mới hỗ trợ không khớp kiểm định, nghi ngờ tính xác thực và thiếu phụ kiện. API không nhận HANG_GIA mới; MySQL giữ giá trị lịch sử. Hoàn toàn bộ bao gồm cọc, phần trả thêm và phí; không hoàn một phần mới.

## Hàng hoàn và đăng bán lại — phiên bản 3.1 (17/10/2026)

Đặc tả và hướng dẫn kiểm thử tại mục 24.12 của tài liệu nghiệp vụ chính. Đã có API /orders/:id/returned-item và giao diện trong chi tiết đơn/tranh chấp cho đúng actor. Hủy do đổi ý là yêu cầu xét duyệt riêng, không tự hoàn tiền. Hoàn tiền tranh chấp mới cần thu hồi/kiểm kê hoặc kết luận thất lạc; tiền và vị trí hàng được quản lý riêng. Đơn đã hoàn trước đây bổ sung xử lý hàng mà không quyết toán lại.

Nhận hàng hoàn từ ngoài trung tâm tạo lần kiểm định mới; báo cáo lần giao cũ giữ nguyên. Nguyên vẹn cần kiểm định/duyệt trước khi cho đấu giá tiếp. Hàng lỗi trả seller; seller xác nhận nhận lại rồi tạo một hồ sơ bản nháp liên kết sản phẩm gốc để cập nhật và gửi duyệt. Hàng không khớp/đang vận chuyển/thất lạc không được bán tiếp. Khi tranh chấp không có căn cứ, có thể dừng thu hồi trước khi gửi; nếu đã nhận về, phải gửi lại và xác nhận giao buyer trước khi giải ngân.

Cùng món hàng khóa theo sản phẩm gốc khi tạo phiên, xử lý đơn và Second Chance. Đã có phiên mới thì đề nghị từ phiên cũ không còn được gửi/chấp nhận. Chữ DA_CHAP_NHAN trong lịch sử không tự khóa hàng vĩnh viễn khi đơn liên quan đã hủy và mọi điều kiện bán lại đã đạt.

Cấu hình cọc có thêm cho_phep_nguoi_ban_chon. Nếu Admin tắt cọc, seller không bật được; nếu bắt buộc, không tắt được; khi cho phép chọn, seller bật/tắt trước khi tạo. Snapshot số tiền và điều kiện phiên cũ giữ nguyên. Mua ngay có công tắc riêng, bỏ giá khi tắt và giải thích lý do bị khóa khi phiên đã BID/đạt sàn/kết thúc.

## Ngoại lệ đơn và trách nhiệm hàng hoàn — phiên bản 3.2

Hoàn cọc ngoại lệ không áp dụng việc buyer tự đổi ý, thiếu tiền hoặc quên thanh toán. Phải chọn lỗi hệ thống/lỗi bên bán/thông tin phiên sai và ghi tham chiếu chứng cứ đã xác minh. API kiểm tra bắt buộc các trường; Admin xác minh căn cứ thực tế, không có công cụ tự xác minh nội dung hồ sơ bên ngoài.

Chi tiết chính sách ở mục 24.13 tài liệu chính. Admin quyết toán toàn bộ cọc bỏ thanh toán cho seller hoặc hoàn buyer theo ngoại lệ có lý do, chỉ một lần; đơn vẫn hủy. Cọc vẫn giữ lịch sử chuyển vào đơn, kết quả cuối ở escrow và nhật ký QUYET_TOAN_COC_BO_THANH_TOAN. Không tự hủy vi phạm và không tính là bán thành công.

Admin giải tỏa cảnh báo sau khi đã gửi hàng, thu đủ, hai tài khoản hoạt động, không tranh chấp/thu hồi. Thao tác không giải ngân hoặc đổi hạn kiểm tra. Job bỏ qua đơn đã chờ Admin. Quyết định tranh chấp cho seller cũng chặn giải ngân khi có tài khoản bị hạn chế.

Trả hàng vẫn ở trung tâm cập nhật hồ sơ lưu giữ gốc, không tạo lần nhận giả; nội dung kiểm định cũ bất biến. Hồ sơ đã gắn đơn hiển thị chỉ đọc, bàn giao qua workflow hàng hoàn.

Admin ghi biên bản trách nhiệm/phí hoàn/bồi thường và xác nhận đối soát với mã chứng từ riêng; không ghi đè biên bản. Thu chi phát sinh do các bên đối soát thủ công, không tự khấu trừ escrow hay sửa tổng đơn. Hoàn tiền buyer không chờ đối tác bồi thường; món hàng thất lạc vẫn khóa bán. Chưa có tích hợp chi trả bồi thường qua cổng thanh toán hoặc tự xác minh vận đơn thật.
