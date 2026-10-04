# ĐỒ ÁN 4 — HỆ THỐNG ĐẤU GIÁ TRỰC TUYẾN

**Tên website: VietBid.** Ưu tiên trải nghiệm web trên máy tính; giao diện tự điều chỉnh theo màn hình nhỏ, không tạo ứng dụng điện thoại riêng.

**Tài liệu nghiệp vụ chi tiết và công nghệ — phiên bản 3.0, ngày 25/09/2026.**

Cập nhật giao diện người dùng, quản trị và kiểm tra luồng mua tiếp ngày 05/10/2026; giữ phạm vi nghiệp vụ phiên bản 3.0 và cấu trúc 21 bảng.

Đây là đặc tả chính của project. Phiên bản này thay thế các mô tả cũ về phạm vi hàng phổ thông, đặt cọc ngoài phạm vi, Mua ngay tạo đơn chưa thanh toán và Second Chance thanh toán sau. Khi triển khai phải đồng bộ tài liệu, SQL, backend, hợp đồng API và kiểm thử.

**Trạng thái triển khai:** SQL và backend dùng 21 bảng; CSDL chính không đổi trong đợt hoàn thiện giao diện. Bộ kiểm thử trước đợt này đạt 57/57 kiểm thử tích hợp, có kịch bản HTTP cho 105 API; frontend đạt build, lint và 13 kiểm thử. Ngày 05/10/2026 đã kiểm tra trên trình duyệt các nhánh chính của Cơ hội mua tiếp trong CSDL kiểm thử riêng. Toàn bộ giao diện chưa được nghiệm thu; chi tiết phạm vi kiểm tra nằm ở mục 3.1.4.

## 1. Mục tiêu và phạm vi

Xây dựng nền tảng đấu giá dành cho hàng hiếm, hàng sưu tầm và tài sản có giá trị cao. Hệ thống hỗ trợ xác minh danh tính người bán, kiểm định vật lý tại trung tâm, đấu giá tự động với mức tối đa bí mật, cọc tham gia, thanh toán mô phỏng và giữ tiền trung gian.

Nhóm sản phẩm định hướng: đồ cổ/cổ vật, đồ sưu tầm, tranh/nghệ thuật, đồng hồ cao cấp, trang sức, hàng hiệu hiếm hoặc limited, xe cổ/đặc biệt, sách/bản thảo/tài liệu hiếm, kỷ vật và nhạc cụ vintage. Việc thuộc danh mục không tự chứng minh tính xác thực hoặc quyền sở hữu hàng hóa.

Bản đồ án mô phỏng tiền và vận chuyển. Không tích hợp cổng thanh toán thật, eKYC thật hoặc hãng vận chuyển thật; không có ví nội bộ, nạp/rút/chuyển số dư. Không xây quy trình trả hàng nhiều chặng trên website trong bản đầu. Việc gửi trả/tái kiểm định nếu cần được xử lý ngoài website; website lưu bằng chứng và quyết định cuối.

## 2. Tác nhân và quyền hạn

1. **Khách:** xem danh mục, sản phẩm đã duyệt, phiên, lịch sử giá công khai, thông tin kiểm định công khai; đăng ký/đăng nhập.
2. **Người dùng/người mua:** quản lý hồ sơ và địa chỉ, theo dõi phiên, đăng ký/cọc, đặt giá, Mua ngay, thanh toán, quản lý đơn mua, Second Chance, tranh chấp, đánh giá và thông báo.
3. **Người bán đã xác minh:** là tài khoản người dùng có trạng thái được Admin duyệt, không phải tài khoản tách biệt. Được tạo hồ sơ sản phẩm, gửi kiểm định, tạo phiên, yêu cầu hủy, xem đơn bán và chủ động gửi Second Chance.
4. **Quản trị viên:** xét xác minh, quản lý danh mục/chính sách, kiểm tra sơ bộ sản phẩm, ghi nhận trung tâm nhận hàng, nhập kết quả từ báo cáo chuyên gia, duyệt sản phẩm, quản lý giao dịch/cọc/tranh chấp/vi phạm/cấu hình/nhật ký.
5. **Tác vụ hệ thống:** mở/đóng phiên, tính giá tự động, gia hạn, hoàn/chuyển cọc, xử lý quá hạn và gửi thông báo theo sự kiện.

**Không có actor chuyên gia thẩm định hoặc nhân viên trung tâm riêng trên website.** Chuyên gia làm việc ngoài hệ thống và cung cấp báo cáo cho Admin. Admin ghi nhận kết quả, không tự kết luận hàng thật/giả. Các thao tác của trung tâm trên website được Admin ghi nhận.

Một tài khoản có thể vừa mua vừa bán khi đã được xác minh bán. Không cho người bán tự đặt giá, cọc hoặc mua sản phẩm của mình. Admin không tham gia mua/bán bằng quyền quản trị và không được xem mức tối đa bí mật qua API.

## 3. Công nghệ và cấu trúc code

### 3.1. Frontend

- **React + TypeScript + Vite:** dựng ứng dụng web và kiểm tra kiểu.
- **React Router:** điều hướng các màn hình.
- **Ant Design:** thành phần giao diện và biểu mẫu hiện có.
- **Axios:** gọi HTTP API; **TanStack Query:** tải, lưu tạm và làm mới dữ liệu máy chủ.
- **Zustand:** trạng thái phiên đăng nhập dùng chung.
- **Socket.IO Client:** đã nối nhận biến động phiên và thông báo; sự kiện kích hoạt đọc lại API, không dùng dữ liệu sự kiện để tự xác định kết quả giao dịch.
- **Day.js:** hiển thị thời gian; **Framer Motion:** chuyển động giao diện.
- **React Hook Form + Zod:** đã cài, định hướng dùng cho biểu mẫu nghiệp vụ; không để hai thư viện cùng quản lý một bộ giá trị biểu mẫu.
- **ESLint, TypeScript, Prettier:** kiểm tra và thống nhất cách trình bày.

Các thư mục hiện có gồm `pages`, `components`, `services`, `socket`, `store`, `hooks`, `routes`, `types`, `utils`, `constants`, `styles`. Không mặc định mọi thư viện hoặc thư mục đã có chức năng hoàn chỉnh. Điểm khởi động đã nối React Router, giao diện Ant Design tiếng Việt với màu đen–vàng, TanStack Query và khôi phục phiên đăng nhập. Biểu mẫu đăng nhập/đăng ký hiện dùng Ant Design Form; chưa dùng React Hook Form để quản lý cùng biểu mẫu.

### 3.1.1. Phạm vi giao diện nền VietBid

- Trang chủ: ảnh bìa, bốn phiên mới nhất từ API, danh mục, hướng dẫn ngắn và liên kết xác minh người bán.
- Khám phá: tìm tên, lọc danh mục/trạng thái và phân trang theo hợp đồng API. Thứ tự hiện tại là phiên mới nhất trước; chưa đưa lên giao diện các kiểu sắp xếp chưa được backend hỗ trợ.
- Chi tiết phiên: xem ảnh, mô tả, thuộc tính, giá công khai, thời gian, phí vận chuyển, yêu cầu cọc, tóm tắt kiểm định và lịch sử giá. Người mua có địa chỉ được đăng ký/thanh toán cọc, đặt mức giá tối đa bí mật và Mua ngay qua API thật. Hiển thị điều kiện còn thiếu, trạng thái đang gửi, lỗi và xác nhận trước khi giao dịch; người bán không thao tác mua trên phiên của mình, Admin không tham gia mua.
- Đăng nhập/đăng ký: kiểm tra đầu vào, báo lỗi từng trường, nút đang xử lý, gọi API thật và quay lại trang cần đăng nhập. Đăng ký thành công chuyển về đăng nhập. Không thêm đăng nhập mạng xã hội, quên mật khẩu hoặc ví khi chưa có trong đặc tả/API.
- Tài khoản: xem/sửa hồ sơ, nộp xác minh người bán, danh sách theo dõi, phiên đã tham gia; sổ địa chỉ cho phép thêm/sửa/chọn mặc định/xóa theo điều kiện API. Danh sách đơn có phân trang, phân biệt bạn mua/bạn bán theo API hiện có; chi tiết hiển thị số tiền, giữ/hoàn/giải ngân, địa chỉ chụp, vận đơn, hạn và lịch sử thanh toán. Người mua đổi địa chỉ đơn khi còn chờ thanh toán và còn hạn; thanh toán phần còn lại; xác nhận nhận hàng rồi hoàn tất qua hai bước riêng. Đã có giao diện gửi hàng, tranh chấp và thông báo theo mục 3.1.3. Second Chance và đánh giá đã có giao diện theo mục 3.1.4; chưa nghiệm thu toàn bộ luồng trên trình duyệt. Phạm vi đã có của người bán và Admin được liệt kê riêng bên dưới.
- Người bán — sản phẩm: đã có danh sách riêng, tìm kiếm/lọc/phân trang, tạo/sửa bản nháp, thuộc tính theo danh mục, tải nhiều ảnh, chọn ảnh đại diện, bỏ ảnh và gửi duyệt qua API thật. Chỉ người bán đã xác minh, tài khoản hoạt động mới vào luồng này. Màn hình hiển thị lý do từ chối và lý do khóa sửa; không tự mở khóa sản phẩm đã kiểm định hoặc có phiên.
- Người bán — phiên đấu giá: danh sách riêng có tìm kiếm/lọc/phân trang; tạo phiên từ sản phẩm đủ điều kiện với giá khởi điểm, giá sàn/Mua ngay tùy chọn, phí vận chuyển và lịch giờ Việt Nam. Có kiểm tra biểu mẫu và xác nhận trước khi tạo. Chi tiết hiển thị giá công khai, lịch, kết quả, cọc đã chụp theo cấu hình và yêu cầu hủy mới nhất. Gửi yêu cầu hủy phải có lý do; phiên tiếp tục cho đến khi Admin duyệt hoặc có kết quả. Chưa có thao tác sửa giá/lịch sau khi tạo. Có làm mới qua API và tham gia phòng Socket.IO khi mở chi tiết phiên.
- Admin — duyệt sản phẩm: danh sách mặc định chờ xử lý, tìm tên/lọc trạng thái/danh mục/phân trang; xem ảnh, mô tả, thuộc tính; duyệt hoặc từ chối có lý do. Sản phẩm bắt buộc kiểm định chưa đạt/không còn được trung tâm giữ/thiếu báo cáo bị khóa nút duyệt. Admin mở hồ sơ kiểm định từ sản phẩm và quay lại duyệt nội dung khi đủ điều kiện.
- Kiểm định — Admin: danh sách tìm theo mã hoặc tên sản phẩm, lọc trạng thái và phân trang; ghi tiếp nhận (tình trạng, serial, số kiện, ghi chú), bắt đầu kiểm định, đính kèm ảnh/PDF, ghi kết quả chuyên gia và ghi nhận trả hàng khi được phép. Kết quả đạt chuyển sang lưu giữ, không tự duyệt nội dung. Màn hình hiển thị riêng thời điểm hàng rời trung tâm để không hiểu nhầm trạng thái lưu giữ cũ.
- Kiểm định — người bán: xem hồ sơ của chính mình, khai báo đơn vị/mã vận đơn gửi đến trung tâm khi đang chờ gửi; xem biên bản, báo cáo và kết quả theo quyền. Không có nút ghi kết quả hoặc tải báo cáo của Admin.
- Hướng dẫn: diễn giải đúng quy tắc kiểm định, cọc theo phiên, mức tối đa bí mật, gia hạn, Mua ngay, Second Chance, thời gian kiểm tra hàng và tranh chấp trong tài liệu này.
- Thành phần dùng chung: thanh điều hướng/chân trang, biểu mẫu, trạng thái tải, lỗi có nút thử lại, danh sách rỗng, ảnh không tải được, trang 404 và chặn khu vực Admin theo vai trò. Backend vẫn là lớp quyết định quyền và nghiệp vụ.
- Nếu đồng hồ phía trình duyệt cho thấy phiên đã hết giờ nhưng backend còn trạng thái lên lịch/hoạt động, giao diện ghi “Chờ kết quả”. Đây chỉ là nhãn hiển thị; không thêm trạng thái MySQL, không tự xác định người thắng và không thay tác vụ đóng phiên của backend.
- Ảnh trang trí không thay thế ảnh sản phẩm thật. Không tạo số lượt trả, giá, kết quả kiểm định hoặc danh sách giao dịch giả để làm đầy giao diện.

Màu sắc, thụt lề, thông báo lỗi và trạng thái xử lý thống nhất trên toàn bộ màn hình. Bố cục PC được ưu tiên; màn hình nhỏ có menu thu gọn và lưới một/hai cột. Khi bổ sung nghiệp vụ phải cập nhật tài liệu này cùng code, API và kiểm thử liên quan; thay đổi trình bày không được tự đổi quy tắc giao dịch.

Luồng người mua trên web: bổ sung địa chỉ nếu thiếu → đăng ký và thanh toán cọc nếu phiên yêu cầu → nhập mức tối đa → xác nhận đặt giá. Mức tối đa chỉ nằm trong biểu mẫu đang nhập, được xóa sau khi gửi thành công; không lưu vào bộ nhớ trình duyệt, lịch sử công khai hoặc thông báo. Giá và bước giá được backend quyết định; giao diện không tự tính người thắng. Phiên chưa có lượt hợp lệ không bị mô tả thành chưa đạt giá sàn. Giá/trạng thái và lịch sử được làm mới mỗi 10 giây khi phiên còn lên lịch/hoạt động, có nút làm mới thủ công; Socket.IO bổ sung cập nhật theo sự kiện, giữ chu kỳ này làm phương án dự phòng.

Mua ngay hiển thị giá sản phẩm + phí vận chuyển − cọc được chuyển (nếu đã có), không bắt buộc cọc trước. Thanh toán hoàn toàn mô phỏng, có lựa chọn thành công/thất bại. HTTP 200 kèm kết quả `THAT_BAI` vẫn hiển thị thất bại, không được báo đã thu tiền. Trước khi gửi, giao diện giữ khóa yêu cầu và kết quả mô phỏng theo người dùng/phiên/loại thanh toán trong `sessionStorage`. Khi mất phản hồi, người mua chủ động kiểm tra lại cùng khóa, kể cả sau tải lại trang và phiên đã kết thúc; không tự gửi lại hoặc tạo lần thu mới. Sau khi nhận kết quả chắc chắn thì xóa khóa. Cơ chế này giới hạn trong tab còn lưu phiên trình duyệt; biên nhận đọc lại từ API đơn hàng là dữ liệu chính thức.

Luồng ảnh trên web: lưu bản nháp → chọn ảnh trên máy → tải các ảnh đã chọn → chọn ảnh đại diện → gửi duyệt. Tối đa 12 ảnh/sản phẩm, JPG/PNG/WebP không quá 5 MiB/ảnh. Lỗi từng ảnh giữ trong hàng đợi để thử lại hoặc bỏ chọn; ảnh đã gắn thành công không bị mất khi ảnh khác lỗi. Khi thử lại bước gắn cùng một đường dẫn tệp vào cùng sản phẩm, backend trả ảnh đã có, không tạo bản ghi trùng. Đổi ảnh đại diện thực hiện trong một transaction; khi bỏ ảnh đại diện, ảnh còn lại đầu tiên được chọn. Các thao tác ảnh ghi nhật ký. Bỏ ảnh chỉ bỏ liên kết với sản phẩm; không tự xóa tệp vật lý dùng chung.

Gửi duyệt dùng thông tin đã lưu, có ảnh và đầy đủ thuộc tính bắt buộc. Nút gửi duyệt tạm khóa khi đang lưu/tải ảnh, còn thay đổi chưa lưu hoặc ảnh chưa tải; có bước xác nhận trước khi gửi. Bản nháp cho phép thiếu thuộc tính bắt buộc để hoàn thiện sau. Nếu sản phẩm chỉ xem, giao diện ẩn thao tác sửa/ảnh/gửi duyệt; backend vẫn kiểm tra lại điều kiện trong transaction của mỗi yêu cầu.

Luồng tệp kiểm định trên web: Admin chọn loại hồ sơ → chọn ảnh/PDF không quá 10 MiB → tải và gắn vào hồ sơ sau tiếp nhận. Khi gắn thất bại, giao diện giữ đường dẫn đã tải để thử lại. Backend trả lại bản ghi đã có nếu cùng hồ sơ/đường dẫn/loại tệp; nếu cùng đường dẫn nhưng khác loại thì báo xung đột. Tệp được xem qua API có xác thực, không dùng đường dẫn công khai trực tiếp.

Chi tiết sản phẩm chỉ trả thêm thông tin kiểm định mới nhất cho chính chủ/Admin. Chi tiết hồ sơ trả trạng thái có thể cập nhật và lý do khóa để giao diện giải thích; các API ghi vẫn kiểm tra quyền, trạng thái và nghĩa vụ giao dịch trong transaction. Không thêm bảng, cột hay vai trò cho đợt giao diện này.

Kiểm tra lại ngày 01/10/2026: 18 kiểm thử cơ bản và 55 kiểm thử tích hợp đạt, bao phủ 104 API; build frontend, lint và định dạng đạt. Đã thử trực tiếp luồng Admin duyệt/kiểm định, người bán khai báo gửi hàng, tạo phiên, kiểm tra giá/lịch, tìm kiếm và gửi yêu cầu hủy còn hiển thị sau tải lại. Toàn bộ dữ liệu thử dùng CSDL riêng và được hoàn tác.

Kiểm tra luồng người mua ngày 02/10/2026: bộ HTTP đối chiếu 104 API và ba kiểm thử frontend về tiền/khôi phục thanh toán đạt. Trên trình duyệt đã thử thiếu địa chỉ, lưu địa chỉ và quay về phiên, cọc thất bại/thành công, trả giá và xóa ô nhập, hai mức tối đa bằng nhau ưu tiên người đặt trước, Mua ngay thất bại/thành công, khấu trừ cọc, xem biên nhận, mất phản hồi rồi tải lại để lấy đúng đơn đã xử lý. Phiên có cọc nhưng không có Mua ngay vẫn hiển thị bình thường sau thanh toán cọc. Người bán ở phiên của mình và Admin không có thao tác mua. Đã sửa tràn ngang menu tài khoản; sổ địa chỉ và chi tiết phiên không tràn ngang ở chiều rộng thực tế 444 px. Dữ liệu thử nằm trong transaction riêng, không sửa schema hoặc dữ liệu chính. Chưa nghiệm thu toàn bộ quy trình đơn hàng và realtime.

### 3.1.2. Giao diện đơn hàng

Giao diện đơn hàng ngày 03/10/2026: dùng `/tai-khoan/don-hang` và `/tai-khoan/don-hang/:id`; danh sách gồm cả đơn mua/bán đúng phạm vi API, không tự lọc trên một trang rồi trình bày thành tổng dữ liệu. Chỉ người mua hoạt động có nút thanh toán/nhận/hoàn tất; các quyền vẫn kiểm tra lại ở backend. Tiền cần thanh toán lấy từ đơn, không gửi số tiền tùy chọn. API thanh toán đơn trả chi tiết đơn và lịch sử giao dịch, khác phản hồi Mua ngay: giao diện đối chiếu kết quả đã lưu, không suy thành công chỉ vì HTTP 200. Mã yêu cầu được lưu theo tài khoản/đơn/loại; mất phản hồi có thể lấy lại cùng lần xử lý sau tải lại.

Đơn quá hạn thanh toán khóa thanh toán và đổi địa chỉ. “Tôi đã nhận hàng” mở thời gian kiểm tra, không giải ngân. “Hàng phù hợp — hoàn tất” có xác nhận riêng; khóa khi thiếu tiền, có tranh chấp đang mở, cờ Admin hoặc tiền không còn đang giữ. Nếu backend trả cờ cần Admin mà chưa hoàn tất, giao diện không thông báo đã giải ngân. Các mốc vận chuyển chỉ đọc từ API; không đánh dấu giao chỉ vì đã có vận đơn. Đơn làm mới thủ công/sau thao tác; chưa nối realtime. Chế độ `dev:local` tắt tác vụ nền nên không dùng để nghiệm thu tự đóng đơn theo hạn.

Kiểm tra ngày 03/10/2026: sáu kiểm thử frontend đạt, bao gồm ba kiểm thử mới về kết quả thanh toán đơn và điều kiện hoàn tất. Trình duyệt đã thử danh sách đúng quyền, đổi địa chỉ đơn, thanh toán có cọc, mất phản hồi rồi tải lại (chỉ một lần thu trong lịch sử), thất bại giữ tiền/hạn, nhận hàng vẫn giữ tiền, hoàn tất mới giải ngân; khóa đơn quá hạn/cờ Admin và chặn đọc đơn người khác. Danh sách và chi tiết không tràn ngang tại chiều rộng thực tế 444 px. Dữ liệu thử ở CSDL riêng; không đổi schema hoặc transaction nghiệp vụ backend.

### 3.1.3. Giao hàng, tranh chấp và hồ sơ tài khoản

Ngày 03/10/2026 bổ sung các luồng web sau, thay thế những ghi chú “chưa có giao diện” tương ứng ở các đợt trước:

- Đơn người bán tại `/nguoi-ban/don-hang`; đơn Admin tại `/quan-tri/don-hang`, có trang chi tiết theo ID. Danh sách người bán lọc ở backend trước phân trang qua `GET /orders?vai_tro=NGUOI_BAN`, không lọc một trang dữ liệu hỗn hợp ở frontend. API cũng hỗ trợ `NGUOI_MUA`; bỏ tham số giữ hành vi cũ, giá trị khác trả 400, không dùng tham số này để mở quyền Admin.
- Người bán khai báo đơn vị vận chuyển và mã vận đơn cho đơn nguồn `NGUOI_BAN`; Admin ghi nhận gửi cho nguồn `TRUNG_TAM`. Có bước xem lại và xác nhận. Gửi muộn vẫn theo xử lý backend hiện có; không khóa gửi chỉ vì quá hạn. Admin có thể ghi nhận đã giao khi có xác nhận thực tế; người bán không tự bắt đầu thời gian kiểm tra. Gửi hàng không đồng nghĩa đã nhận hoặc đã giải ngân.
- Người mua mở tranh chấp từ chi tiết đơn trong thời gian kiểm tra, hoặc khi chưa nhận hàng từ mốc cho phép; Admin mở hồ sơ can thiệp với đơn thuộc trạng thái được phép. Trang danh sách/chi tiết ở `/tai-khoan/tranh-chap` và `/quan-tri/tranh-chap`. Người bán phản hồi, các bên bổ sung bằng chứng, Admin tiếp nhận và ra quyết định có căn cứ và bước xác nhận. Chỉ hoàn toàn bộ hoặc giải ngân toàn bộ; không nhận số tiền tự nhập hoặc quyết định xác thực hàng hóa tự động.
- Bằng chứng là JPG/PNG/WebP/PDF tối đa 10 MiB, tối đa 30 tệp/hồ sơ; đọc qua API có xác thực. Gửi lại cùng đường dẫn trong cùng hồ sơ trả bản ghi đã lưu, không ghi đè mô tả hoặc tạo trùng kể cả hồ sơ vừa đóng. Tệp mới vẫn bị chặn khi hồ sơ đã kết thúc. Hồ sơ kiểm định liên quan được đọc theo quyền API hiện có.
- Thông báo: danh sách có phân trang, lọc chưa đọc, đánh dấu một/tất cả đã đọc; nút làm mới cập nhật cả danh sách và số chưa đọc. Đánh dấu tất cả đưa về trang đầu, giữ bộ lọc đang chọn; trạng thái rỗng phân biệt đã đọc hết với chưa có thông báo. Đường dẫn thông báo được ánh xạ tới các trang nghiệp vụ đã biết, không mở URL tùy ý. Thông báo Second Chance mở đúng chi tiết đề nghị để xem và phản hồi theo quyền.
- Hồ sơ cá nhân: sửa họ tên và số điện thoại. Xác minh người bán: nộp giấy tờ/ảnh chân dung và thông tin ngân hàng, xem lịch sử/lý do từ chối; Admin lọc danh sách, xem tệp riêng, duyệt/từ chối có lý do. Chờ duyệt/đã xác minh không được gửi hồ sơ mới; từ chối cho phép nộp lại. Giao diện không lưu giấy tờ hoặc thông tin ngân hàng vào bộ nhớ bền vững của trình duyệt.

Theo yêu cầu trình bày, các nhãn trên web dùng “Thanh toán”, “Gửi hàng”, “Hoàn tiền”, không kèm chữ “mô phỏng”. Phạm vi kỹ thuật không đổi: chưa có cổng thanh toán hoặc vận chuyển thật. Chế độ thông thường không hiển thị lựa chọn thành công/thất bại; công cụ kiểm thử có thể bật `VITE_CHE_DO_KIEM_THU=true` để chọn tình huống. Không thay đổi tên trường API, trạng thái CSDL hoặc cơ chế chống xử lý trùng.

Kiểm tra giao diện ngày 03–04/10/2026 trên CSDL riêng: người bán gửi hàng, Admin gửi từ trung tâm; mở tranh chấp, tải/xem bằng chứng riêng, phản hồi và tiếp nhận; hai quyết định hoàn toàn bộ/giải ngân toàn bộ đưa tiền đang giữ về 0 và khóa hồ sơ đã đóng. Hồ sơ cá nhân lưu được họ tên/điện thoại. Xác minh kiểm tra trường bắt buộc, ba ảnh CCCD, hộ chiếu không bắt buộc mặt sau; từ chối có lý do, nộp lại, duyệt thành công và cập nhật quyền trên hồ sơ. Thông báo đã kiểm tra đánh dấu một/tất cả, lọc chưa đọc, phân trang, liên kết xác minh và trạng thái rỗng. Bố cục PC đã được quan sát; chưa xác nhận lại màn hình nhỏ cho các trang mới vì công cụ đổi viewport không áp dụng kích thước yêu cầu trong phiên kiểm tra 04/10. Các dữ liệu giấy tờ, ngân hàng và ảnh trong kiểm thử đều là dữ liệu thử, không phải hồ sơ người dùng thật.

### 3.1.4. Hoàn thiện chức năng người dùng và quản trị — 05/10/2026

Ưu tiên hoàn thiện các chức năng theo đặc tả trước khi chỉnh đẹp. Ngày 05/10/2026, tiếp tục kiểm tra luồng Cơ hội mua tiếp trên trình duyệt bằng CSDL kiểm thử riêng và hoàn tác toàn bộ dữ liệu khi kết thúc. Các màn hình còn lại chưa được nghiệm thu toàn bộ trên trình duyệt.

- **Cơ hội mua tiếp:** người bán gửi từ đơn bị hủy do không thanh toán; hệ thống chọn ứng viên và giá công khai hợp lệ. Danh sách phân biệt đề nghị nhận/gửi, có hạn và trạng thái; chi tiết cho phép người nhận từ chối hoặc thanh toán ngay giá đề nghị cộng phí. Không đặt lại cọc và không dùng cọc đã hoàn. Yêu cầu chưa rõ kết quả giữ nguyên khóa để người dùng chủ động lấy lại; không cho từ chối khi còn lần thanh toán chưa xác định.
- **Đánh giá:** người mua/người bán đánh giá đối tác từ đơn hoàn tất, 1–5 sao và nhận xét tối đa 1.000 ký tự. Chi tiết đơn hiển thị đánh giá đã gửi của người đang xem; trang công khai theo người nhận có phân trang. Có liên kết từ phiên, đơn và hồ sơ cá nhân. Backend giữ quyền đối tác và giới hạn một lần mỗi bên.
- **Theo dõi:** thêm/bỏ theo dõi trên chi tiết phiên, bỏ theo dõi từ danh sách cá nhân. Trạng thái được đọc theo tài khoản đang đăng nhập; thao tác theo dõi không tạo cam kết giá hoặc ưu tiên đấu giá.
- **Người dùng:** Admin tìm tên/email, xem quyền bán và trạng thái, chuyển hoạt động/tạm ngừng/khóa có lý do và xác nhận. Không cho đổi trạng thái tài khoản Admin qua chức năng này. Có liên kết tới vi phạm và đánh giá của tài khoản.
- **Vi phạm:** người dùng xem hồ sơ của mình; Admin xem toàn bộ hoặc lọc theo tài khoản, ghi nhận hồ sơ có liên kết phiên/đơn và xét cảnh cáo/tạm ngừng/khóa hoặc hủy vi phạm. Quyết định yêu cầu lý do và xác nhận; điểm không tự khóa tài khoản.
- **Phiên quản trị:** tìm và lọc phiên theo trạng thái; xem yêu cầu hủy của người bán, duyệt/từ chối có lý do. Backend kiểm tra lại trạng thái trong transaction và hoàn cọc theo quy tắc khi hủy hợp lệ.
- **Danh mục và thuộc tính:** thêm/sửa danh mục, danh mục cha, thứ tự, trạng thái sử dụng và yêu cầu kiểm định; thêm/sửa thuộc tính văn bản/số/lựa chọn/đúng-sai/ngày, đơn vị và bắt buộc nhập. Backend bảo vệ cây danh mục và thuộc tính đã sử dụng. Không thêm xóa cứng danh mục hoặc thuộc tính.
- **Cấu hình:** Admin sửa các thời hạn, chính sách cọc và toàn bộ khoảng bước giá qua biểu mẫu có xác nhận. Cọc chỉ chụp vào phiên tạo sau khi lưu; bước giá chỉ sửa khi không còn phiên chờ/đang chạy. Biểu mẫu dùng số tiền dạng chuỗi cho các khoảng để giữ chính xác phần thập phân lịch sử.
- **Theo dõi vận hành:** bảng cọc hiển thị trạng thái, số tiền, các mốc xử lý và đơn liên quan; nhật ký có phân trang; tổng quan dùng số liệu thật từ API theo trạng thái, phân biệt giá trị đơn, tổng thu và tiền đang giữ. Admin xem trạng thái tác vụ nền, lượt chạy cuối và số lỗi; không có nút tự bật tác vụ hoặc quét dữ liệu chính từ trình duyệt.
- **Cập nhật thời gian thực:** một kết nối Socket.IO theo phiên đăng nhập; vào/rời phòng khi mở chi tiết phiên công khai hoặc phiên của người bán, vào lại khi kết nối lại, đóng khi đổi tài khoản/rời ứng dụng. Sự kiện giá/bắt đầu/kết thúc/thông báo làm mới dữ liệu API; không lưu mức tối đa bí mật. Giá công khai vẫn làm mới định kỳ, số thông báo chưa đọc có chu kỳ dự phòng 30 giây.

Trên trình duyệt đã kiểm tra: người bán gửi đề nghị theo giá công khai; người nhận xem đúng số tiền và địa chỉ; thanh toán thành công nhưng mất phản hồi vẫn khôi phục được sau khi tải lại bằng cùng mã giao dịch; đơn tạo đúng 21.050.000 đồng, không thu cọc và chỉ ghi nhận một khoản thanh toán. Đã kiểm tra thêm thanh toán thất bại rồi thử lại thành công, người nhận từ chối và đề nghị hết hạn bị khóa thanh toán. Các thao tác dùng môi trường kiểm thử riêng; CSDL chính không đổi cấu trúc hoặc dữ liệu.

Trước lượt kiểm tra trình duyệt này, backend đạt 57/57 kiểm thử tích hợp và bộ HTTP bao phủ 105 API; frontend đạt build, lint và 13 kiểm thử. Những kết quả tự động đó được giữ làm mốc, không đại diện cho kiểm thử lại sau mọi chỉnh sửa. Các trang quản trị, danh sách theo dõi và sự kiện thời gian thực chưa được nghiệm thu đầy đủ qua trình duyệt.

### 3.2. Backend

**Node.js + Express + TypeScript**, biên dịch sang CommonJS. **Zod** kiểm tra cấu trúc và kiểu đầu vào ở máy chủ. **mysql2** chạy SQL có tham số và transaction trực tiếp, không dùng ORM. **bcrypt** băm mật khẩu; **jsonwebtoken/JWT** xác thực; **Socket.IO** phát sự kiện; **Multer** nhận tệp; **dotenv** nạp cấu hình runtime. **tsx** phục vụ phát triển; **TypeScript** tạo bản build trong `dist`.

Luồng tổ chức: Route → Controller → Service → Repository → MySQL. Service giữ nghiệp vụ, quyền, transaction, nhật ký và thông báo. Repository chứa truy vấn; controller nhận/trả HTTP. `validations` chứa schema, `types` chứa kiểu chung, `jobs` chứa tác vụ và `sockets` chứa realtime.

Backend đang chuyển dần sang kiểu chặt hơn; không coi việc dùng TypeScript là đã loại bỏ mọi `any` hoặc bật đầy đủ kiểm tra null của code cũ. Chỉ chỉnh mã nguồn trong `src`, không sửa trực tiếp `dist`.

### 3.3. MySQL và quy tắc code

MySQL 8, InnoDB, UTF-8; CSDL chính duy nhất cho ứng dụng là **`doan4_daugia`**. BIGINT/DECIMAL trả về chuỗi để tránh mất chính xác. Tiền mới dùng VND nguyên; phép tính tiền ở backend dùng `bigint` theo đơn vị nhỏ. Dữ liệu thập phân lịch sử vẫn được giữ.

Giữ tên tệp/hàm/biến nghiệp vụ tiếng Việt không dấu và cấu trúc hiện có. Thụt lề 2 khoảng trắng, luôn có ngoặc cho `if`, xuống dòng điều kiện/lời gọi/object dài. Chèn dòng trống giữa các bước lấy dữ liệu → kiểm tra → cập nhật → nhật ký/thông báo → trả kết quả. Tách hàm theo trách nhiệm, không tách vụn. Chỉ thêm comment để giải thích quy tắc hoặc lý do xử lý. Chỉnh trình bày phải giữ hành vi và phạm vi transaction.

Lệnh `npm run format`, `npm run format:check`, `npm run check` ở gốc áp dụng chuẩn chung cho code dự án. Không định dạng thư viện, bản build, bản sao riêng hoặc SQL lịch sử. Không đọc/hiển thị mật khẩu trong `.env`.

## 4. Tài khoản, đăng nhập và xác minh người bán

Người dùng đăng ký bằng thông tin hợp lệ; email duy nhất, mật khẩu được băm. Không nhận vai trò/quyền Admin từ body đăng ký. JWT hết hạn theo cấu hình; máy chủ kiểm tra trạng thái tài khoản khi thực hiện thao tác riêng tư. Tài khoản bị khóa/tạm ngưng không được tiếp tục hoạt động mua bán mới.

Người mua cần địa chỉ giao hàng trước khi tham gia. Đơn chụp thông tin người nhận tại thời điểm tạo; sửa hồ sơ sau đó không làm thay đổi lịch sử đơn. Chỉ được đổi địa chỉ đơn khi còn chờ thanh toán và chưa quá hạn.

Luồng xác minh: người dùng gửi giấy tờ, selfie và thông tin ngân hàng → Admin xét → trạng thái người bán `DA_XAC_MINH` hoặc bị từ chối có lý do. Tài liệu danh tính/ngân hàng là riêng tư. Chỉ người bán đã xác minh và tài khoản hoạt động mới được đăng sản phẩm.

**Xác minh danh tính không phải chứng nhận sản phẩm chính hãng.** Không dùng huy hiệu người bán đã xác minh để thay thế kết quả kiểm định.

## 5. Danh mục, sản phẩm và chính sách kiểm định

Admin quản lý danh mục, thuộc tính động, trạng thái hoạt động và `yeu_cau_kiem_dinh`. Chính sách dựa vào loại hàng, không chỉ dựa trên giá seller tự khai. Ví dụ đồ cổ, tranh, đồng hồ cao cấp và trang sức có thể được Admin đặt bắt buộc kiểm định.

Seller tạo sản phẩm nháp với danh mục, tên, mô tả, tình trạng, thương hiệu, thuộc tính và ảnh. Gửi duyệt phải có ảnh và đủ thuộc tính bắt buộc. Backend kiểm tra thuộc tính thuộc đúng danh mục và đúng kiểu.

`GET /products/:id` trả thêm `co_the_sua` và `ly_do_khong_the_sua` cho chính chủ để giao diện giải thích điều kiện hiện tại. Đây là thông tin hỗ trợ hiển thị, không thay quyền kiểm tra ở máy chủ. `PATCH /products/:id/images/:imageId/primary` chọn ảnh đã gắn làm đại diện; chỉ chính chủ đã xác minh, sản phẩm còn được sửa. Không thêm bảng/cột cho hai thay đổi này.

Khi gửi duyệt, hệ thống chụp `bat_buoc_kiem_dinh` cùng thời điểm vào sản phẩm. Thay chính sách danh mục không sửa ngược sản phẩm/phiên đang xử lý. Khi sửa và gửi lại hồ sơ, không được tự hạ yêu cầu kiểm định đã có để né quy trình. Seller không nhập trực tiếp snapshot hoặc kết quả kiểm định.

Sản phẩm dùng trạng thái `BAN_NHAP`, `CHO_XU_LY`, `DA_DUYET`, `TU_CHOI`, `LUU_TRU`. Admin xét nội dung; hàng bắt buộc kiểm định chỉ được duyệt khi đã đạt và còn được trung tâm giữ. Không cho seller tự duyệt. Không sửa nội dung/ảnh làm thay đổi đối tượng đang kiểm định hoặc đã đưa vào phiên.

## 6. Kiểm định vật lý và lưu giữ

Luồng hàng bắt buộc kiểm định:

Seller gửi hồ sơ → Admin kiểm tra sơ bộ và mở hồ sơ kiểm định → seller gửi hàng thật → Admin ghi nhận trung tâm nhận → chuyên gia kiểm định ngoài website → Admin đính kèm báo cáo, nhập kết quả → nếu đạt thì trung tâm tiếp tục giữ → duyệt sản phẩm → đấu giá → người mua thanh toán đủ → trung tâm gửi thẳng người mua.

Không trả hàng đạt cho seller giữa kiểm định và giao cho buyer, nhằm tránh tráo sản phẩm đã kiểm định.

### 6.1. Hồ sơ và trạng thái

Một sản phẩm có thể có nhiều lần kiểm định; cặp `(san_pham_id, lan_kiem_dinh)` duy nhất. Lần mới không ghi đè lần cũ. Mã hồ sơ duy nhất, có người cập nhật và các mốc thời gian.

Trạng thái: `CHO_GUI_TRUNG_TAM` → `DANG_VAN_CHUYEN_DEN_TRUNG_TAM` → `DA_NHAN_TAI_TRUNG_TAM` → `DANG_KIEM_DINH`. Kết quả có thể yêu cầu `CAN_BO_SUNG`, không đạt `KIEM_DINH_KHONG_DAT`, hoặc đạt và chuyển sang `DANG_LUU_GIU`. Giá trị `DA_KIEM_DINH_DAT` thể hiện bước đạt; API có thể ghi nhận đạt và lưu giữ trong cùng transaction. Hàng không đạt/không hoàn tất được ghi nhận `DA_TRA_NGUOI_BAN` với ngày và lý do.

Không dùng trạng thái hoặc nhãn “Hàng thật 100%”. Nhãn công khai là “Đã kiểm định”, kèm đơn vị, chuyên gia, thời gian và mã chứng nhận nếu có.

### 6.2. Biên bản nhận và báo cáo

Biên bản tiếp nhận gồm mã kiểm định, sản phẩm/seller, ngày nhận, tình trạng khi nhận, serial/mã nhận dạng nếu có, số kiện, ghi chú và ảnh/tệp tiếp nhận. Đây là căn cứ đối chiếu tình trạng, hỏng hóc, serial và việc lưu giữ.

Kết quả gồm ngày kiểm định, chuyên gia, đơn vị, kết quả `DAT`/`KHONG_DAT`/`CAN_BO_SUNG`, nhận xét, mã chứng nhận và báo cáo. Chỉ ghi đạt khi có báo cáo được tải đúng nhóm bởi Admin; ngày kiểm định không trước tiếp nhận hoặc ở tương lai. Mọi thay đổi kết quả phải ghi nhật ký.

Kết quả đạt không tự duyệt nội dung sản phẩm. Thay kết quả trước khi mở phiên cần xét duyệt lại; không sửa hồ sơ khi đã có phiên hoặc nghĩa vụ giao dịch. Hàng đã gửi người mua không còn được xem là đang ở trung tâm.

Biên bản, serial và tệp nội bộ chỉ cho Admin, seller liên quan hoặc buyer của đơn liên quan xem. Khách chỉ xem bản tóm tắt công khai; không công khai hồ sơ danh tính hoặc tài chính thông qua tệp kiểm định.

## 7. Tạo và vận hành phiên đấu giá

Điều kiện tạo: seller hoạt động và đã xác minh; sở hữu sản phẩm; sản phẩm đã duyệt; không có phiên hoặc nghĩa vụ bán trùng. Nếu bắt buộc kiểm định, lần kiểm định hợp lệ phải có kết quả đạt và trung tâm vẫn giữ đúng sản phẩm.

Phiên có giá khởi điểm, giá sàn tùy chọn, Mua ngay tùy chọn, phí vận chuyển cố định, thời gian bắt đầu/kết thúc. Giá sàn không thấp hơn giá khởi điểm; Mua ngay không thấp hơn giá sàn hoặc khởi điểm. Không hard-code tỷ lệ chênh lệch giá Mua ngay.

Bước giá do Admin cấu hình thành các khoảng liên tục, không chồng lấn. Không đổi bộ bước giá khi còn phiên chờ hoặc đang chạy. Cửa sổ gia hạn và số giây gia hạn được chụp vào phiên.

Trạng thái chính: `DA_LEN_LICH`, `HOAT_DONG`, `DA_KET_THUC`, `THAT_BAI`, `DA_HUY`. Tác vụ mở/đóng theo giờ MySQL; API tự kiểm tra hạn ngay khi nhận yêu cầu, không chờ tác vụ quét.

Giao diện chọn sản phẩm dùng `GET /products/mine?du_dieu_kien_dau_gia=1`: lọc trước phân trang, chỉ lấy sản phẩm của chính chủ đã duyệt, không có phiên chờ/chạy/đã kết thúc thành công. Nếu bắt buộc kiểm định, hồ sơ mới nhất phải đạt, còn lưu giữ, chưa rời trung tâm và có báo cáo. Kết quả chỉ phản ánh lúc đọc; API tạo vẫn kiểm tra lại điều kiện và khóa dữ liệu trong transaction.

`GET /auctions/mine/:id` dành riêng cho người bán đã xác minh sở hữu phiên; trả thông tin công khai cùng yêu cầu hủy mới nhất, khả năng gửi yêu cầu và lý do bị khóa. Không trả giá sàn hoặc mức tối đa bí mật. Giao diện nhập lịch theo UTC+7 và gửi ISO có múi giờ; không tự chốt phiên theo đồng hồ trình duyệt. Đợt bổ sung giao diện này không đổi cấu trúc CSDL.

## 8. Chính sách cọc và đăng ký tham gia

**Lựa chọn đã chốt: Admin cấu hình rồi bật cọc.** Ban đầu chính sách tắt; không tự áp 10% hoặc một số tiền cho phiên đang có. Cấu hình `DEPOSIT_POLICY` gồm bật/tắt, kiểu `TY_LE` hoặc `CO_DINH`, giá trị. Tỷ lệ tính theo giá khởi điểm, làm tròn lên một đồng. Tiền cọc dương và không vượt giá khởi điểm. Chính sách mới chỉ áp dụng khi tạo phiên mới; phiên lưu số tiền cuối cùng làm snapshot.

Phiên yêu cầu cọc: người mua đăng ký → kiểm tra tài khoản hoạt động, địa chỉ, không phải seller, phiên còn hiệu lực → hiển thị số tiền cọc → thanh toán mô phỏng → thành công mới được BID. Có thể đăng ký/cọc khi phiên đã lên lịch; BID chỉ mở khi bắt đầu.

Một người chỉ có một hồ sơ cọc chính cho một phiên. Theo dõi phiên là thao tác riêng, không thay thế đăng ký/cọc và không tạo ưu tiên bằng trần. Backend kiểm tra cọc trước khi ghi `gia_toi_da`, không chỉ ẩn nút ở frontend.

Trạng thái cọc: `CHO_THANH_TOAN`, `DA_DAT_COC`, `THAT_BAI`, `DA_HOAN_COC`, `DA_CHUYEN_VAO_DON`, `KHONG_HOAN_COC`, `HET_HAN`. Retry cùng khóa nhận lại kết quả đã xử lý; thử lại thực sự sau thất bại dùng khóa mới. Nhật ký giữ kết quả các lần thử, không tạo thêm bảng ví.

Seller chỉ xem số lượng đăng ký, đã cọc, đủ điều kiện. Không được xem mức tối đa, mã giao dịch cọc chi tiết, thông tin tài chính hoặc CCCD buyer. Buyer xem khoản cọc của mình; Admin xem nghiệp vụ cọc nhưng vẫn không đọc trần bí mật.

## 9. Đấu giá tự động và bảo mật mức tối đa

Người mua đặt mức tối đa bí mật. Hệ thống chỉ nâng giá công khai theo mức cần thiết, bước giá và khả năng của các bên. Không nhảy thẳng lên trần người dẫn đầu. Không cho giảm/rút trần trong bản đầu. Nếu hai trần bằng nhau, người đặt trước được ưu tiên; nếu cùng dấu thời gian thì dùng thứ tự ghi nhận ổn định.

Chỉ lượt giá công khai hợp lệ trong 60 giây cuối mới kích hoạt cộng thêm 90 giây vào giờ kết thúc hiện tại. Người đang dẫn đầu tăng trần nhưng không làm đổi giá công khai không tạo lượt giả hoặc gia hạn giả.

Trần không được xuất qua API, Socket.IO, thông báo hoặc nhật ký, kể cả API Admin. Giá sàn cũng không được suy ra bằng cách xuất dữ liệu nội bộ. API dùng danh sách trường công khai và lớp kiểm tra đầu ra.

Đặt giá, Mua ngay, kết thúc và hủy phiên dùng transaction với khóa phiên để chỉ có một kết quả hợp lệ. Sự kiện realtime chỉ gửi sau commit.

## 10. Kết thúc, hủy phiên và xử lý cọc

Không có lượt hợp lệ hoặc chưa đạt sàn → phiên thất bại, không tạo đơn; hoàn cọc đã thu. Nếu có người thắng hợp lệ → đơn lấy **giá công khai cuối cùng**, không lấy trần; cọc của winner chuyển vào đơn. Các bidder còn lại được hoàn cọc; hồ sơ chưa trả cọc hết hạn.

Seller chỉ gửi yêu cầu hủy, Admin xét với lý do. Khi hủy hợp lệ, dừng phiên và hoàn cọc người tham gia trong cùng transaction. Không cho hủy phiên đã phát sinh kết quả giao dịch qua luồng này.

Sau khi cọc chuyển vào đơn, cọc là một phần tiền của đơn. Không hoàn cọc riêng thêm lần nữa. Ví dụ giá trúng 100 triệu, cọc 10 triệu, phí 200 nghìn: còn phải trả 90,2 triệu.

## 11. Mua ngay và thanh toán tức thời

Mua ngay không yêu cầu đăng ký hoặc đặt cọc trước. Seller có thể không bật tính năng này. Quy tắc hiện có về tắt Mua ngay khi có giá hợp lệ/đạt sàn vẫn được áp dụng; không tự đặt tỷ lệ giá mới.

Buyer xác nhận giá và phí → mô phỏng thanh toán đủ → chỉ khi thành công mới chốt phiên, xác định winner và tạo/finalize đơn. Nếu đã có cọc hợp lệ, chỉ thu phần còn thiếu và chuyển cọc vào đơn. Nếu chưa cọc, thu toàn bộ giá + phí.

Thất bại: ghi nhận kết quả và nhật ký, không chốt phiên, không tạo đơn thành công, không chuyển cọc. Phiên vẫn tiếp tục nếu còn hiệu lực. Retry cùng khóa không thay đổi thất bại cũ thành thành công; yêu cầu thanh toán mới dùng khóa mới.

Buy Now và BID/kết thúc cùng cạnh tranh trên khóa phiên. Không được tạo hai người thắng hoặc hai đơn còn nghĩa vụ. Nếu phiên kết thúc hoặc Mua ngay tắt trước khi yêu cầu lấy được khóa, yêu cầu phải bị từ chối.

## 12. Đơn hàng, thanh toán phần còn lại và giữ tiền

Đơn lưu giá sản phẩm, phí, tổng tiền, cọc chuyển, đã thu, đang giữ, đã hoàn, đã giải ngân, địa chỉ chụp và các hạn. Số tiền từ đơn đã khóa; client không được tự nhập tổng cần thu hoặc số cần hoàn.

Các bất biến:

```text
tổng đơn = giá sản phẩm + phí vận chuyển
tổng đơn = cọc chuyển + số tiền đơn cần thanh toán ngoài cọc
số tiền còn thiếu hiện tại = tổng đơn − tổng đã thu
tổng đã thu = đang giữ + đã hoàn + đã giải ngân
```

Winner đấu giá thông thường có hạn mặc định 48 giờ để trả phần còn lại. Thất bại giữ nguyên hạn và số đã thu; thành công ghi giao dịch cho phần thu thêm, giữ tổng tiền gồm cọc và chuyển sang chờ gửi. Nếu cọc đã đủ toàn bộ đơn thì không thu thêm tiền, nhưng vẫn cần ghi nhận trạng thái thanh toán đủ.

Quá hạn chưa đủ tiền: hủy đơn, cọc chuyển thành `KHONG_HOAN_COC`, tạo vi phạm chờ Admin xét và thông báo. Cọc bị giữ trong mô phỏng, không tự trả seller. Khoản đã thuộc đơn tiếp tục được đối soát trong tiền đang giữ, không xóa khỏi lịch sử thu. Người bán có thể yêu cầu Second Chance.

Trạng thái đơn chính: `CHO_THANH_TOAN`, `CHO_GUI_HANG`, `DA_GUI_HANG`, `DANG_KIEM_TRA`, `DANG_TRANH_CHAP`, `HOAN_THANH`, `DA_HUY`. Các giá trị cũ còn trong schema được giữ để đọc lịch sử.

## 13. Second Chance

Chỉ mở khi người thắng trước không thanh toán. Người bán chủ động yêu cầu **từng lần**, không tự tạo nối tiếp sau từ chối/hết hạn. Không mở đề nghị nếu có đơn còn nghĩa vụ hoặc đề nghị đang chờ.

Ứng viên lấy từ lượt trả giá công khai hợp lệ của phiên; giá đề nghị khớp lượt nguồn, đúng người, đúng phiên, trong thời gian phiên và đạt sàn nếu có. Không dùng trần bí mật. Bỏ người đã nhận đề nghị hoặc không đủ điều kiện theo quy tắc lựa chọn hiện có.

Người không thắng đã được hoàn cọc. Ứng viên Second Chance **không đặt cọc lại và không dùng lại cọc đã hoàn**. Chấp nhận đồng nghĩa thanh toán ngay toàn bộ giá đề nghị + phí. Thành công mới tạo/finalize đơn và đánh dấu chấp nhận. Thất bại không tạo đơn thành công, đề nghị còn có thể thử lại nếu chưa hết hạn. Mặc định đề nghị có hạn 24 giờ.

Từ chối hoặc hết hạn chỉ kết thúc đề nghị đó. Người bán chọn có tiếp tục đề nghị ứng viên khác hay không.

## 14. Nguồn gửi hàng, nhận và kiểm tra

Đơn có `nguon_gui_hang`: `NGUOI_BAN` cho dữ liệu cũ/hàng không kiểm định; `TRUNG_TAM` cho hàng đã kiểm định và đang được giữ. Đơn trung tâm giữ tham chiếu hồ sơ kiểm định đã dùng, không thay bằng một hồ sơ mới tùy ý.

Đã thanh toán đủ mới được gửi hàng. Đơn trung tâm do Admin ghi nhận đóng gói/gửi: đơn vị vận chuyển, mã vận đơn, thời gian, ngày hàng rời trung tâm. Seller không được tự khai báo gửi thay trung tâm. Đơn từ seller do seller khai báo.

Giữ tên cột `han_nguoi_ban_gui_hang` để tương thích code/dữ liệu; trong nghiệp vụ mới nó là hạn gửi của nguồn tương ứng. Hạn mặc định 3 ngày. Gửi muộn từ trung tâm cần cờ Admin, không tự quy lỗi seller.

Buyer bấm “Đã nhận hàng” → bắt đầu thời gian kiểm tra mặc định 3 ngày. **Nhận hàng không giải ngân.** Buyer bấm “Hàng phù hợp/Hoàn tất” mới giải ngân sớm. Khi hết hạn chỉ tự hoàn tất nếu không tranh chấp, không cờ Admin, tài khoản đủ điều kiện và tiền đang giữ hợp lệ, đã thu đủ.

Sau 7 ngày từ khai báo gửi, buyer có thể khiếu nại chưa nhận khi đơn vẫn ở trạng thái phù hợp. Các trường hợp trung tâm/seller chưa gửi hoặc cần can thiệp khác do Admin tiếp nhận; không tự đánh dấu giao hàng chỉ theo mã vận đơn.

## 15. Tranh chấp, tái kiểm định và quyết toán

Lý do mới: `CHUA_NHAN_HANG`, `KHONG_DUNG_MO_TA`, `HONG_HOC`, `KHONG_KHOP_HO_SO_KIEM_DINH`, `NGHI_NGO_TINH_XAC_THUC`, `THIEU_PHU_KIEN`, `KHAC`. Giữ `HANG_GIA` trong MySQL để đọc bản ghi cũ; API mới không tạo lý do này.

Mở tranh chấp → tiền tiếp tục giữ → buyer gửi bằng chứng → seller phản hồi → Admin xem hồ sơ sản phẩm, tiếp nhận, báo cáo, serial/ảnh, vận đơn và bằng chứng hai bên → ghi quyết định. Không mặc định seller có lỗi vì có nghi ngờ xác thực đối với hàng do trung tâm giữ.

Tái kiểm định và vận chuyển trở lại nếu cần được xử lý ngoài workflow website bản đầu. Website lưu trạng thái tranh chấp, tệp kết quả cuối và quyết định; không thêm actor chuyên gia.

Chỉ hai kết quả tiền mới:

1. **Hoàn toàn bộ buyer:** hoàn toàn bộ tiền đơn đã thu, gồm cọc và phí.
2. **Giải ngân toàn bộ seller:** giải ngân toàn bộ tiền đơn theo phạm vi mô phỏng.

Không hoàn một phần và không “hoàn tiền nhưng giữ riêng cọc” sau khi đã thanh toán đủ. Admin không tùy ý chọn số tiền hoàn. Lịch sử hoàn một phần cũ được bảo toàn, không tạo mới. Mọi quyết toán khóa đơn/tiền và ghi nhật ký; gọi lại không quyết toán lần hai.

## 16. Đánh giá, vi phạm, thông báo và theo dõi

Hai bên chỉ đánh giá đúng đối tác trong đơn đã hoàn tất, một lần mỗi bên, 1–5 sao và nhận xét hợp lệ. Không sửa lịch sử giao dịch để tăng uy tín.

Quá hạn thanh toán/gửi hàng có thể tạo vi phạm chờ xét một lần. Admin xác nhận hoặc bác bỏ, nêu lý do và quyết định cảnh cáo/tạm ngưng/khóa. Không tự tăng hình phạt theo tổng điểm; các cột điểm cũ còn giữ để tra cứu.

Thông báo theo sự kiện: kết quả xác minh/duyệt/kiểm định; cọc thành công/hoàn/không hoàn; bị vượt giá, dẫn đầu, kết thúc/hủy; cần trả tiền/gửi hàng; đã nhận/hoàn tất; tranh chấp, Second Chance và vi phạm. Không có lịch nhắc trước hạn nhiều mốc trong bản đầu. Thông báo riêng chỉ thuộc người nhận và không chứa trần bí mật.

Theo dõi là quan hệ người dùng–phiên, độc lập quyền BID. Bỏ theo dõi không rút cam kết tối đa hoặc hủy cọc đã thu.

## 17. Thiết kế 21 bảng

Giữ 19 bảng hiện tại và bổ sung đúng hai bảng cho hai vòng đời độc lập:

1. `nguoi_dung`: tài khoản, vai trò và trạng thái.
2. `xac_minh_nguoi_ban`: hồ sơ và kết quả xác minh danh tính.
3. `dia_chi_nguoi_dung`: địa chỉ.
4. `danh_muc`: danh mục, thuộc tính JSON và chính sách kiểm định.
5. `san_pham`: nội dung, thuộc tính JSON, snapshot kiểm định và duyệt.
6. **`kiem_dinh_san_pham` (mới):** các lần tiếp nhận, kiểm định, lưu giữ/trả hàng.
7. `phien_dau_gia`: giá, thời gian, trạng thái, snapshot cọc.
8. `tham_gia_phien`: theo dõi và cam kết tối đa bí mật; không chứa lịch sử tiền cọc.
9. `luot_tra_gia`: lịch sử công khai bất biến.
10. **`dat_coc_dau_gia` (mới):** hồ sơ cọc người dùng–phiên, thanh toán, hoàn/chuyển/không hoàn.
11. `don_hang`: địa chỉ, tiền, nguồn gửi, giữ tiền và vận chuyển.
12. `thanh_toan`: các lần thanh toán **đơn**; không ép khoản cọc trước đơn vào bảng này.
13. `de_nghi_mua_tiep_theo`: Second Chance và lượt giá công khai nguồn.
14. `tranh_chap`: lý do, phản hồi, quyết định.
15. `tep_dinh_kem`: ảnh sản phẩm, bằng chứng và tài liệu kiểm định; mỗi loại gắn đúng một đối tượng.
16. `danh_gia`: đánh giá hai chiều.
17. `yeu_cau_xu_ly`: yêu cầu hủy và cấu trúc hỗ trợ báo cáo.
18. `vi_pham`: hồ sơ chờ xét/quyết định.
19. `thong_bao`: thông báo riêng.
20. `cau_hinh_he_thong`: thời hạn, bước giá, chính sách cọc.
21. `nhat_ky_hoat_dong`: nhật ký và kết quả các yêu cầu tiền có khóa chống lặp.

Các gộp từ bản 19 vẫn giữ: giữ tiền/vận chuyển trong đơn; thuộc tính danh mục/sản phẩm trong JSON có kiểm tra; ảnh/bằng chứng trong tệp chung; gia hạn trong nhật ký có FK.

Sơ đồ nên tách trang tài khoản, sản phẩm–kiểm định, đấu giá–cọc, đơn–thanh toán, hậu mãi và hỗ trợ. Bảng xuất hiện tham chiếu ở nhiều diagram vẫn chỉ là một bảng trong MySQL. Không bỏ FK chỉ để giảm đường nối.

## 18. Ràng buộc dữ liệu, tiền và cạnh tranh

- Unique mã hồ sơ; unique sản phẩm–lần kiểm định; unique người dùng–phiên cọc; unique cọc gắn đơn.
- FK từ kiểm định tới sản phẩm/người cập nhật, cọc tới phiên/người/đơn, tệp tới kiểm định, đơn tới hồ sơ kiểm định đã dùng.
- CHECK tiền không âm, cọc dương/không vượt giá, trạng thái có mốc tương ứng và đối soát giữ tiền.
- CHECK tệp đúng loại/đối tượng; không gắn cùng tệp vừa vào sản phẩm vừa tranh chấp/kiểm định.
- Index hàng đợi kiểm định, cọc theo phiên/trạng thái, các hạn và các FK.
- Unique khóa yêu cầu ngăn lặp; unique đơn còn nghĩa vụ/người thắng tiếp tục bảo vệ cạnh tranh.
- Trigger và kiểm tra backend bổ trợ nhau; không coi trigger là thay thế transaction/phân quyền.

Mọi thao tác ảnh hưởng hàng/tiền phải ở transaction và có audit. Thứ tự khóa thống nhất: khóa phiên trước các thao tác tiền/đơn liên quan; nghiệp vụ kiểm định khóa sản phẩm và hồ sơ, không sửa khi có nghĩa vụ bán. Khi xung đột khóa, lớp transaction thử lại có giới hạn. Không gửi realtime hoặc thông báo ngoài giao dịch trước commit.

## 19. HTTP, tệp và realtime

API gốc `http://localhost:5000/api`. Phản hồi có `success`, `message`, `data`; dùng đúng HTTP 400/401/403/404/409/413/429/500/503. Danh sách phân trang không dựng tổng giả nếu API chưa trả tổng. Ngày tạo/kiểm định nhập ISO có múi giờ; MySQL dùng múi giờ đã cấu hình.

Ngoài API tài khoản/sản phẩm/phiên/đơn/tranh chấp hiện có, bổ sung nhóm kiểm định, đăng ký/cọc, thống kê tham gia và quản lý cọc. Mua ngay và chấp nhận Second Chance nhận kết quả thanh toán mô phỏng cùng khóa yêu cầu; hợp đồng chi tiết cập nhật trong `backend/docs/danh-sach-api.md`.

Upload kiểm tra cả nội dung, MIME, kích thước, đường dẫn và quyền sở hữu. Hồ sơ kiểm định hỗ trợ ảnh/PDF, Admin tải lên. Tệp riêng không được mở công khai bằng cách đoán URL. Không dùng tên tệp do client để ghi tùy ý ngoài thư mục uploads.

Socket.IO xác thực phòng riêng; phòng phiên chỉ phát giá/trạng thái công khai, tuyệt đối không phát trần hoặc thông tin tài chính riêng. Có thể tải lại API khi mất kết nối; không dựa riêng vào sự kiện client để xác định người thắng.

## 20. Tác vụ hệ thống

Mở phiên đến giờ, đóng phiên đến hạn, hoàn cọc không thắng, chuyển cọc winner, hủy đơn thiếu tiền quá hạn, hết hạn đề nghị, ghi cờ gửi muộn và hoàn tất sau thời gian kiểm tra khi đủ điều kiện. Không tự nối tiếp Second Chance, không nhắc nhiều mốc hoặc tự xử phạt theo điểm.

Lịch quét mặc định mỗi 60 giây. Trạng thái hiển thị có thể trễ đến chu kỳ tiếp theo nhưng API vẫn kiểm tra thời hạn tức thời. Trong kiểm thử phải tắt jobs ngoài transaction để không tác động dữ liệu thật.

## 21. Migration, bản sao và tương thích

Không reset database hoặc xóa lịch sử 19 bảng. Migration thêm hai bảng và cột mặc định, mở rộng enum/ràng buộc có kiểm soát. Sản phẩm cũ mặc định không bắt buộc kiểm định; phiên cũ không yêu cầu cọc; đơn cũ cọc 0 và gửi từ seller. Không tự chứng nhận kiểm định cho sản phẩm cũ.

Giữ `HANG_GIA`, trạng thái lịch sử, ID, tiền và thời gian cũ. So sánh dấu vân tay toàn bộ cột cũ trước/sau, không chỉ đếm dòng. MySQL DDL tự commit; không tuyên bố rollback DDL bằng `ROLLBACK`.

Sao lưu ra `co-so-du-lieu/ban-sao-rieng`, có SHA-256 và loại khỏi Git. Phục hồi vào CSDL mới để đối chiếu, không ghi đè CSDL chính. Không tự hạ schema sau khi đã có giao dịch mới. CSDL phụ kiểm thử/khôi phục chỉ dùng tạm, dọn sau khi xác minh; ứng dụng vẫn dùng `doan4_daugia`.

Chi tiết thực hiện ở `co-so-du-lieu/KE-HOACH-21-BANG.md`, SQL trong `co-so-du-lieu/migrations`, hướng dẫn vận hành trong `co-so-du-lieu/HUONG-DAN-CSDL.md`.

## 22. Kiểm thử bắt buộc

1. Hàng cần kiểm định chưa đạt/không được giữ không tạo phiên.
2. Seller không tự BID/cọc/mua hàng mình.
3. Phiên yêu cầu cọc chặn BID khi chưa trả hoặc cọc thất bại.
4. Cọc thành công cho phép BID; retry không thu lại.
5. Người thua/hủy/không đạt sàn được hoàn cọc một lần.
6. Winner chuyển cọc vào đơn, trả đúng phần còn thiếu.
7. Winner không trả phần còn lại đúng hạn: cọc không hoàn, không tự trả seller.
8. Mua ngay không cần cọc và tính đúng cọc đã có.
9. Mua ngay thất bại không chốt phiên hoặc chuyển cọc.
10. Mua ngay thành công chỉ có một winner/đơn.
11. BID và Mua ngay cạnh tranh nhiều kết nối không tạo hai đơn.
12. Second Chance không cọc lại hoặc dùng cọc đã hoàn.
13. Second Chance chỉ chấp nhận khi trả đủ; thất bại giữ đề nghị còn hạn.
14. Hàng kiểm định gửi từ trung tâm, seller không được gửi thay.
15. Đã nhận hàng chưa giải ngân.
16. Tranh chấp/cờ Admin chặn tự giải ngân.
17. Hoàn buyer gồm toàn bộ cọc + phần trả thêm + phí.
18. Giải ngân seller toàn bộ một lần.
19. API không tạo hoàn một phần hoặc `HANG_GIA` mới; lịch sử cũ vẫn đọc được.
20. Migration không mất dữ liệu 19 bảng cũ.
21. API/Socket/Admin không lộ trần; seller chỉ thấy thống kê cọc, không danh sách tài chính buyer.
22. Báo cáo thiếu, sai quyền, trạng thái sai hoặc tệp giả bị chặn.

## 23. Giới hạn và việc tiếp theo

Hoàn thiện các màn hình công khai, tài khoản, seller và Admin theo API thật; kiểm thử đầu cuối trên trình duyệt và thiết bị nhỏ. Không coi bản build frontend thành công là giao diện đã hoàn tất.

Các phần ngoài đợt này: tiền/vận chuyển/eKYC thật, ví nội bộ, quy trình trả hàng nhiều chặng, actor chuyên gia, cam kết xác thực tuyệt đối, hoàn một phần cho giao dịch mới. API báo cáo sản phẩm và đăng lại có điều kiện cần hoàn thiện riêng; việc schema có chỗ hỗ trợ không có nghĩa API đã tồn tại.

Mọi thay đổi sau này phải giữ cùng một đặc tả chính, cập nhật hợp đồng và kiểm thử. Không dùng kết quả kiểm thử phiên bản trước để khẳng định nghiệp vụ mới đã chạy đúng.
