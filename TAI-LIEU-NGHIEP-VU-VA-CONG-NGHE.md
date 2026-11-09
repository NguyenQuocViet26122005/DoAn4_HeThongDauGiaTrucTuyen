# ĐỒ ÁN 4 — HỆ THỐNG ĐẤU GIÁ TRỰC TUYẾN

**Tên website: VietBid.** Ưu tiên trải nghiệm web trên máy tính; giao diện tự điều chỉnh theo màn hình nhỏ, không tạo ứng dụng điện thoại riêng.

**Tài liệu nghiệp vụ chi tiết và công nghệ — phiên bản 3.2, ngày 17/10/2026.**

**Bổ sung phiên bản 3.2:** quyết toán cọc bỏ thanh toán theo quyết định Admin; giải tỏa cảnh báo đơn không tự giải ngân; đồng bộ bàn giao hàng đang ở trung tâm; biên bản trách nhiệm, phí hoàn và đối soát bồi thường ngoài đơn. Chi tiết và trình tự sử dụng tại mục 24.13. Không thêm bảng/cột hoặc nạp lại dữ liệu chính trong đợt này.

**Cập nhật ngày 17/10/2026:** đã triển khai hàng hoàn/kiểm kê, đăng bán lại liên kết sản phẩm gốc, khóa bán trùng và chọn cọc từng phiên. Mục 24.1 lưu hiện trạng trước sửa; mục 24.12 ghi phần đã hoàn thiện và cách kiểm thử lại. Kết quả kiểm thử cũ không thay cho kiểm thử phần mở rộng.

Cập nhật giao diện người dùng, quản trị và kiểm tra luồng mua tiếp ngày 05/10/2026; giữ phạm vi nghiệp vụ phiên bản 3.0 và cấu trúc 21 bảng.

Cập nhật danh mục ngày 06/10/2026: MySQL chính bật 10 danh mục hàng giá trị cao, ngừng hoạt động mềm 12 danh mục phổ thông cũ; API công khai lọc sản phẩm và phiên theo danh mục đang hoạt động. Giữ nguyên sản phẩm, phiên và giao dịch cũ để bảo toàn lịch sử; đồng bộ SQL khởi tạo và tài liệu nghiệp vụ. Đã đạt kiểm tra định dạng, kiểu backend và lint frontend; chưa chạy lại bộ test nghiệp vụ.

Đây là đặc tả chính của project. Phiên bản này thay thế các mô tả cũ về phạm vi hàng phổ thông, đặt cọc ngoài phạm vi, Mua ngay tạo đơn chưa thanh toán và Second Chance thanh toán sau. Khi triển khai phải đồng bộ tài liệu, SQL, backend, hợp đồng API và kiểm thử.

**Trạng thái triển khai:** SQL và backend dùng 21 bảng. Lượt kiểm tra nền ngày 08/10/2026 đạt 18/18 kiểm thử backend cơ bản, 59/59 kiểm thử tích hợp và 13/13 kiểm thử frontend. Bộ HTTP nền bao phủ 91 API và bộ kiểm định/cọc bao phủ thêm 16 API. Đã mở rộng kịch bản cùng một tài khoản vừa mua vừa bán, kiểm tra quyền theo từng đơn đến khi giải ngân và đánh giá. Báo cáo sản phẩm, đăng lại và các nhánh chính của Cơ hội mua tiếp đã được kiểm tra trên trình duyệt trong CSDL kiểm thử riêng. Phạm vi và kết quả đợt nền ở mục 23; đợt khép ngoại lệ ngày 18/10/2026 ở mục 24.13; các số liệu có ngày ở phần dưới là lịch sử từng đợt, không phải số lượng cố định khi hệ thống tiếp tục có người dùng mới.

## Cập nhật bộ dữ liệu ngày 07/10/2026

Đã thay dữ liệu nghiệp vụ trong MySQL chính `doan4_daugia` sau khi sao lưu có checksum, thử trên `doan4_daugia_rebuild` và xác minh thành công. Giữ nguyên cấu trúc 21 bảng, view, trigger và 28 sản phẩm hiện có. Chỉ hiển thị 10 danh mục người dùng chốt; 12 bản ghi danh mục cũ được lưu ở trạng thái không hoạt động.

Bộ mới có 1 Admin, 5 người bán đã xác minh, 10 người mua; 10 phiên, 27 lượt trả giá, 12 khoản cọc, 7 đơn, 5 thanh toán, 2 tranh chấp và 4 đánh giá. Các chuỗi thành công, quá hạn/không hoàn cọc/Second Chance, Mua ngay, tranh chấp và không đạt giá sàn được liên kết từ hồ sơ kiểm định đến tiền và nhật ký. Đây là dữ liệu tổng hợp được lưu thật trong MySQL, không phải giao dịch thương mại thật.

Đã kiểm tra 23 nhóm ràng buộc dữ liệu không có lỗi; 16 tài khoản và 203 yêu cầu HTTP trên bộ mới đều đạt. Backend đạt 18 kiểm thử nền và 57 kiểm thử tích hợp; frontend đạt lint, build và 13 kiểm thử. Đã render và kiểm tra bố cục 26 PDF hồ sơ. 34 ảnh sản phẩm có tệp cục bộ; hiện 5 sản phẩm có nhiều ảnh, chưa đạt mục tiêu 10–12 sản phẩm đều có 2–3 ảnh đúng mẫu.

Danh sách tài khoản, ID phiên/đơn, trạng thái từng câu chuyện, nguồn ảnh và cách kiểm tra lại được cập nhật trong [Bộ dữ liệu thực hành VietBid](backend/docs/DU-LIEU-DEMO-VIETBID.md). Quy tắc nghiệp vụ không thay đổi. Khi bộ lập lịch chạy, thời hạn và trạng thái sẽ tiếp tục được xử lý theo đồng hồ thực.

### Mở rộng dữ liệu trình bày ngày 08/10/2026

Giữ nguyên 21 bảng và các chuỗi giao dịch đã có. CSDL chính hiện có 50 tài khoản người mua/người bán ngoài Admin, 50 sản phẩm, 50 địa chỉ mặc định, 56 ảnh sản phẩm và 10 danh mục đang hoạt động. Bộ dữ liệu gồm 20 người bán đã xác minh và 30 tài khoản mua; hai tài khoản mua đang xin quyền bán, một tài khoản có hồ sơ bán bị từ chối. Có 18 phiên, 57 lượt trả giá, 30 khoản cọc, 13 đơn hàng, 9 thanh toán, 3 tranh chấp, 2 vi phạm và 8 đánh giá. Đây là tình huống tổng hợp lưu thật trong MySQL; không phải giao dịch thương mại ngoài đời.

Đã sửa ảnh và thông tin không khớp của bộ mở rộng; thuộc tính của cả 50 sản phẩm dùng đúng cấu hình danh mục. Bổ sung tám câu chuyện bằng các service nghiệp vụ hiện có, bao gồm hoàn thành giao dịch, người thắng không thanh toán rồi Second Chance, tranh chấp hoàn toàn bộ, bằng mức tối đa ưu tiên người trước, phiên sắp mở, Mua ngay và đơn đang chờ thanh toán. Hồ sơ kiểm định có các trạng thái chờ gửi, đang vận chuyển, đã nhận, đang kiểm định, cần bổ sung, không đạt/đã trả và đạt/đang lưu giữ. Các tệp thuộc đúng chủ sở hữu; người bán đã xác minh có hồ sơ đối chiếu đầy đủ.

Đã chạy thử trong transaction rồi rollback, sao lưu CSDL chính với checksum trước khi áp dụng, và kiểm tra lại sau commit: 31 nhóm đối soát đạt, gồm khóa ngoại, quyền, thời gian, thuộc tính, cọc, thanh toán, tiền giữ, vận chuyển, Second Chance, tranh chấp, đánh giá và tệp. Không sửa schema. Chính sách cọc mặc định vẫn do Admin bật; các phiên trong câu chuyện lưu chính sách tại thời điểm tạo. Script kiểm tra là `backend/scripts/hoan-thien-du-lieu-vietbid.js --verify`; các mốc đang hoạt động sẽ tiếp tục thay đổi khi tác vụ tự động chạy.

Đã đối chiếu hash mật khẩu thực hành của 51 tài khoản, kiểm tra đăng nhập bằng các vai trò và 116 yêu cầu HTTP đọc 18 phiên, 13 đơn, 56 ảnh cùng quyền của hồ sơ tranh chấp/Second Chance. Kết quả đạt; phản hồi công khai không chứa mức tối đa bí mật. Đã chụp 48 giao diện ở thu phóng 100% bằng đúng tài khoản tham gia giao dịch, theo thứ tự dùng chung → người mua → người bán → Admin để cập nhật báo cáo tuần 7.

Ảnh mới lấy từ Wikimedia Commons, được kiểm tra định dạng và dung lượng trước khi lưu; tệp metadata ghi trang nguồn, tác giả, giấy phép và SHA-256. Trước khi ghi đã tạo bản sao riêng, sau khi ghi đã đối chiếu số lượng, khóa ngoại, ảnh chính và địa chỉ mặc định. Phần mở rộng không thay đổi quy tắc đấu giá, tiền, trạng thái hoặc cấu trúc MySQL.

### Biểu đồ tổng quan quản trị — 07/10/2026

Trang tổng quan bổ sung bốn thẻ tổng số (người dùng, sản phẩm, phiên, đơn), biểu đồ vòng trạng thái phiên và hai biểu đồ cột ngang về trạng thái đơn hàng, duyệt sản phẩm. Nguồn dữ liệu là API có sẵn `GET /api/admin/statistics`, lấy tổng hợp từ MySQL theo quyền Admin. Không thêm bảng, cột, dữ liệu mẫu hoặc thay quy tắc nghiệp vụ.

Các biểu đồ phản ánh tổng số theo trạng thái hiện tại, không phải thống kê theo ngày hay doanh thu. Nhấn trạng thái trong chú giải biểu đồ vòng để xem số lượng/tỷ trọng; nút Làm mới tải lại cùng nguồn dữ liệu cho thẻ, biểu đồ và bảng chi tiết. Trường hợp chưa có dữ liệu hiển thị thông báo thay vì vẽ tỷ lệ giả. Bảng thanh toán/giữ tiền/tranh chấp vẫn được giữ trong phần số liệu chi tiết; tác vụ tự động nằm cuối trang. Bố cục tự xếp lại trên màn hình nhỏ, nhãn và số lượng vẫn đọc được bằng bàn phím/trình đọc màn hình.

## 1. Mục tiêu và phạm vi

Xây dựng nền tảng đấu giá dành cho hàng hiếm, hàng sưu tầm và tài sản có giá trị cao. Hệ thống hỗ trợ xác minh danh tính người bán, kiểm định vật lý tại trung tâm, đấu giá tự động với mức tối đa bí mật, cọc tham gia, thanh toán mô phỏng và giữ tiền trung gian.

VietBid chỉ phục vụ hàng hiếm, hàng sưu tầm và tài sản có giá trị cao: đồ cổ/cổ vật, tranh/tác phẩm nghệ thuật, đồng hồ cao cấp, trang sức/đá quý, hàng hiệu hiếm hoặc phiên bản giới hạn, xe cổ/phương tiện sưu tầm, sách/bản thảo/tài liệu lịch sử hiếm, kỷ vật, nhạc cụ vintage giá trị cao và máy ảnh cổ/thiết bị quang học sưu tầm. Không định hướng bán điện tử phổ thông, đồ gia dụng, thời trang đại trà hoặc hàng tiêu dùng thông thường. Việc thuộc danh mục không tự chứng minh tính xác thực hoặc quyền sở hữu; sản phẩm vẫn phải qua duyệt và chính sách kiểm định tương ứng.

Bản đồ án mô phỏng tiền và vận chuyển. Không tích hợp cổng thanh toán thật, eKYC thật hoặc hãng vận chuyển thật; không có ví nội bộ, nạp/rút/chuyển số dư. Website quản lý thu hồi, tiếp nhận, kiểm kê, kiểm định lại, trả người bán hoặc gửi lại người mua; đúng tác nhân ghi nhận từng mốc. Chuyên gia kiểm định ngoài website, Admin nhập báo cáo và kết quả.

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
- **Day.js:** hiển thị thời gian; **Framer Motion:** đã cài, chưa dùng.
- **React Bits — LiquidChrome (`components/react-bits/LiquidChrome.tsx`):** nền 3D kim loại vàng lỏng phủ kín khối bìa ở trang chủ và trang đăng nhập, gợn sóng theo con trỏ; viết bằng WebGL2 thuần, không cần three.js. Có lớp phủ tối phía trên để chữ luôn đọc rõ. Tải lười, dừng vẽ khi cuộn khỏi màn hình, tự tắt khi trình duyệt không có WebGL hoặc người dùng chọn giảm chuyển động (khi đó chỉ còn nền gradient).
- **Phông chữ tự lưu trữ (@fontsource):** Be Vietnam Pro cho chữ thân, Cormorant Garamond cho tiêu đề; cả hai có đủ dấu tiếng Việt và không phụ thuộc Google Fonts lúc chạy.
- **Hệ thống giao diện chung (`styles/he-thong.css`, theme Ant Design trong `App.tsx`):** một thang bo góc (thẻ 12px, nút 6px), một khoảng cách lưới, mục đang chọn ở thanh bên dùng nền trung tính, nhãn viết thường thay cho nhãn chữ hoa giãn cách, số trong bảng thẳng cột. Quy tắc lấy theo các skill thiết kế Impeccable và Taste.
- **GSAP + @gsap/react (ScrollTrigger):** chữ hero trồi lên khi mở trang, thẻ phiên hiện dần khi cuộn, số liệu tổng quan đếm lên, giá phiên lóe vàng khi có lượt giá mới. Mọi chuyển động tắt khi giảm chuyển động.
- **React Hook Form + Zod:** đã cài, định hướng dùng cho biểu mẫu nghiệp vụ; không để hai thư viện cùng quản lý một bộ giá trị biểu mẫu.
- **ESLint, TypeScript, Prettier:** kiểm tra và thống nhất cách trình bày.

Các thư mục hiện có gồm `pages`, `components`, `services`, `socket`, `store`, `hooks`, `routes`, `types`, `utils`, `constants`, `styles`. Không mặc định mọi thư viện hoặc thư mục đã có chức năng hoàn chỉnh. Điểm khởi động đã nối React Router, giao diện Ant Design tiếng Việt với màu đen–vàng, TanStack Query và khôi phục phiên đăng nhập. Biểu mẫu đăng nhập/đăng ký hiện dùng Ant Design Form; chưa dùng React Hook Form để quản lý cùng biểu mẫu.

### 3.1.1. Phạm vi giao diện nền VietBid

- Trang chủ: ảnh bìa, phiên đang diễn ra và phiên sắp mở lấy riêng theo trạng thái từ API, đối chiếu cả thời gian bắt đầu/kết thúc trước khi đưa vào khu vực cơ hội hiện tại; danh mục thật, hướng dẫn ngắn và liên kết xác minh người bán. Không đưa phiên đã hết hạn vào hai nhóm này.
- Khám phá: tìm tên, lọc danh mục/trạng thái và phân trang theo hợp đồng API. Thứ tự hiện tại là phiên mới nhất trước; chưa đưa lên giao diện các kiểu sắp xếp chưa được backend hỗ trợ. Thẻ và trang chi tiết đổi nhãn giá theo trạng thái để phân biệt giá khởi điểm, giá công khai hiện tại, giá trúng, giá cuối phiên và giá tại thời điểm hủy.
- Nguồn dữ liệu công khai: phiên, giá, lượt trả, trạng thái và danh mục lấy từ API/MySQL; không tự dựng dữ liệu thay thế khi API trống. Ảnh thiếu hoặc không tải được phải được báo đúng là chưa có ảnh khả dụng. Chỉ danh mục đang hoạt động xuất hiện trong khám phá; sản phẩm thuộc danh mục đã ngừng hoạt động không xuất hiện trong danh sách công khai.
- Chi tiết phiên: xem ảnh, mô tả, thuộc tính, giá công khai, thời gian, phí vận chuyển, yêu cầu cọc, tóm tắt kiểm định và lịch sử giá. Người mua có địa chỉ được đăng ký/thanh toán cọc, đặt mức giá tối đa bí mật và Mua ngay qua API thật. Hiển thị điều kiện còn thiếu, trạng thái đang gửi, lỗi và xác nhận trước khi giao dịch; người bán không thao tác mua trên phiên của mình, Admin không tham gia mua.
- Đăng nhập/đăng ký: kiểm tra đầu vào, báo lỗi từng trường, nút đang xử lý, gọi API thật và quay lại trang cần đăng nhập. Đăng ký thành công chuyển về đăng nhập. Không thêm đăng nhập mạng xã hội, quên mật khẩu hoặc ví khi chưa có trong đặc tả/API.
- Tài khoản: xem/sửa hồ sơ, nộp xác minh người bán, danh sách theo dõi, phiên đã tham gia; sổ địa chỉ cho phép thêm/sửa/chọn mặc định/xóa theo điều kiện API. Danh sách đơn có phân trang, phân biệt bạn mua/bạn bán theo API hiện có; chi tiết hiển thị số tiền, giữ/hoàn/giải ngân, địa chỉ chụp, vận đơn, hạn và lịch sử thanh toán. Người mua đổi địa chỉ đơn khi còn chờ thanh toán và còn hạn; thanh toán phần còn lại; xác nhận nhận hàng rồi hoàn tất qua hai bước riêng. Đã có giao diện gửi hàng, tranh chấp và thông báo theo mục 3.1.3. Second Chance và đánh giá đã có giao diện theo mục 3.1.4; chưa nghiệm thu toàn bộ luồng trên trình duyệt. Phạm vi đã có của người bán và Admin được liệt kê riêng bên dưới.
- Người bán — sản phẩm: đã có danh sách riêng, tìm kiếm/lọc/phân trang, tạo/sửa bản nháp, thuộc tính theo danh mục, tải nhiều ảnh, chọn ảnh đại diện, bỏ ảnh và gửi duyệt qua API thật. Chỉ người bán đã xác minh, tài khoản hoạt động mới vào luồng này. Màn hình hiển thị lý do từ chối và lý do khóa sửa; không tự mở khóa sản phẩm đã kiểm định hoặc có phiên.
- Đăng lại sản phẩm: danh sách người bán chỉ hiện nút đăng lại khi sản phẩm đã duyệt, không còn phiên đang chờ/chạy, không còn đơn cần xử lý và không còn đề nghị Mua tiếp đang chờ/đã chấp nhận. Phiên cũ không có người thắng hoặc đơn cũ bị hủy vì không thanh toán có thể đăng lại sau khi mọi đề nghị Mua tiếp đã bị từ chối/hết hạn. Backend kiểm tra lại điều kiện trong transaction khi tạo phiên.
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
- **Báo cáo sản phẩm:** người dùng đăng nhập báo cáo từ chi tiết phiên, chọn lý do và mô tả; người bán không thể báo cáo sản phẩm của mình và mỗi người chỉ gửi một báo cáo cho cùng sản phẩm. Báo cáo vào hàng chờ vi phạm của Admin, không tự kết luận hoặc tự áp dụng chế tài. Người gửi xem trạng thái/kết quả trong mục Vi phạm của tài khoản; Admin xem tiêu đề sản phẩm và ghi quyết định có lý do. Người bị báo cáo không thấy danh tính người gửi.
- **Đánh giá:** người mua/người bán đánh giá đối tác từ đơn hoàn tất, 1–5 sao và nhận xét tối đa 1.000 ký tự. Chi tiết đơn hiển thị đánh giá đã gửi của người đang xem; trang công khai theo người nhận có phân trang. Có liên kết từ phiên, đơn và hồ sơ cá nhân. Backend giữ quyền đối tác và giới hạn một lần mỗi bên.
- **Theo dõi:** thêm/bỏ theo dõi trên chi tiết phiên, bỏ theo dõi từ danh sách cá nhân. Trạng thái được đọc theo tài khoản đang đăng nhập; thao tác theo dõi không tạo cam kết giá hoặc ưu tiên đấu giá.
- **Người dùng:** Admin tìm tên/email, xem quyền bán và trạng thái, chuyển hoạt động/tạm ngừng/khóa có lý do và xác nhận. Không cho đổi trạng thái tài khoản Admin qua chức năng này. Có liên kết tới vi phạm và đánh giá của tài khoản.
- **Vi phạm:** người dùng xem hồ sơ của mình; Admin xem toàn bộ hoặc lọc theo tài khoản, ghi nhận hồ sơ có liên kết phiên/đơn và xét cảnh cáo/tạm ngừng/khóa hoặc hủy vi phạm. Quyết định yêu cầu lý do và xác nhận; điểm không tự khóa tài khoản.
- **Phiên quản trị:** tìm và lọc phiên theo trạng thái; xem yêu cầu hủy của người bán, duyệt/từ chối có lý do. Backend kiểm tra lại trạng thái trong transaction và hoàn cọc theo quy tắc khi hủy hợp lệ.
- **Danh mục và thuộc tính:** thêm/sửa danh mục, danh mục cha, thứ tự, trạng thái sử dụng và yêu cầu kiểm định; thêm/sửa thuộc tính văn bản/số/lựa chọn/đúng-sai/ngày, đơn vị và bắt buộc nhập. Backend bảo vệ cây danh mục và thuộc tính đã sử dụng. Không thêm xóa cứng danh mục hoặc thuộc tính.
- **Cấu hình:** Admin sửa các thời hạn, chính sách cọc và toàn bộ khoảng bước giá qua biểu mẫu có xác nhận. Cọc chỉ chụp vào phiên tạo sau khi lưu; bước giá chỉ sửa khi không còn phiên chờ/đang chạy. Biểu mẫu dùng số tiền dạng chuỗi cho các khoảng để giữ chính xác phần thập phân lịch sử.
- **Theo dõi vận hành:** bảng cọc hiển thị trạng thái, số tiền, các mốc xử lý và đơn liên quan; nhật ký có phân trang; tổng quan dùng số liệu thật từ API theo trạng thái, phân biệt giá trị đơn, tổng thu và tiền đang giữ. Admin xem trạng thái tác vụ nền, lượt chạy cuối và số lỗi; không có nút tự bật tác vụ hoặc quét dữ liệu chính từ trình duyệt.
- **Cập nhật thời gian thực:** một kết nối Socket.IO theo phiên đăng nhập; vào/rời phòng khi mở chi tiết phiên công khai hoặc phiên của người bán, vào lại khi kết nối lại, đóng khi đổi tài khoản/rời ứng dụng. Sự kiện giá/bắt đầu/kết thúc chỉ làm mới nhóm dữ liệu phiên; thông báo chỉ làm mới nhóm dữ liệu theo liên kết của nó (đơn, tranh chấp, kiểm định…); không lưu mức tối đa bí mật. Trang phiên chỉ tự tải lại 10 giây khi socket mất kết nối; số thông báo chưa đọc có chu kỳ dự phòng 30 giây. Khi máy chủ ngắt hoặc từ chối socket (thường do token hết hạn), giao diện hỏi lại `/users/me`: hết hạn thì đăng xuất, còn hợp lệ thì kết nối lại.
- **Phòng danh sách và chốt khi đọc:** mọi kết nối socket tự vào phòng `danh-sach-phien`, nên trang chủ/khám phá thấy giá và trạng thái đổi mà không cần mở chi tiết. Đọc chi tiết hoặc danh sách phiên sẽ chốt ngay các phiên đã đến giờ (cùng nghiệp vụ với tác vụ định kỳ), nên trạng thái đúng cả khi tắt tác vụ định kỳ lúc demo.
- **Kiểm thử E2E (Playwright, `npm run test:e2e` trong frontend):** chạy trên máy chủ thử cổng 5001 với CSDL kiểm thử và transaction hoàn tác, dùng Edge có sẵn; đo bố cục các trang ở cỡ máy tính và điện thoại, chạy các luồng đăng nhập, đặt giá, đặt cọc, thanh toán đơn, liên kết thông báo của người bán.
- **Giờ máy chủ:** mọi phản hồi API có header `X-Server-Time`; đếm ngược và việc khóa nút đặt giá/thanh toán dùng giờ máy chủ, nên máy người dùng chạy sai giờ vẫn hiện đúng.
- **Mã ngẫu nhiên:** khóa chống gửi trùng và mã ảnh dùng `crypto.randomUUID`, tự chuyển sang `crypto.getRandomValues` khi mở qua HTTP không bảo mật (ví dụ IP mạng LAN).

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

Admin chỉ tạo và bật danh mục phù hợp với phạm vi hàng hiếm, sưu tầm hoặc tài sản có giá trị cao ở phần đầu tài liệu. Danh mục có thuộc tính động, trạng thái hoạt động và `yeu_cau_kiem_dinh`; chính sách kiểm định dựa vào loại hàng, không chỉ dựa trên giá seller tự khai. Bộ SQL khởi tạo VietBid có mười danh mục chuyên biệt, không gồm điện tử, gia dụng, thời trang đại trà hoặc hàng tiêu dùng phổ thông. Tên danh mục không phải chứng nhận tính xác thực.

MySQL chính đã bật mười danh mục chuyên biệt và ngừng hoạt động mềm mười hai danh mục phổ thông cũ. Sản phẩm, phiên và giao dịch gắn với danh mục cũ được giữ nguyên để bảo toàn lịch sử; chúng không xuất hiện trong danh sách sản phẩm/phiên công khai. SQL khởi tạo chỉ dùng cho CSDL mới và không tự cập nhật, xóa hoặc di chuyển dữ liệu hiện có.

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

Điều kiện tạo: seller hoạt động và đã xác minh; sở hữu sản phẩm; sản phẩm đã duyệt; không có phiên đang chờ/chạy, không có đơn đang xử lý và không có đề nghị Mua tiếp đang chờ/đã chấp nhận. Đơn cũ có thể hủy vì không thanh toán, hoặc hoàn tiền tranh chấp và đã được duyệt hàng đủ điều kiện bán lại theo mục 24.12. Không còn đề nghị Mua tiếp đang chờ; đề nghị đã chấp nhận được xét theo nghĩa vụ thực tế của đơn sinh ra, không khóa vĩnh viễn bằng trạng thái lịch sử. Phiên không có người thắng có thể đăng lại. Nếu bắt buộc kiểm định, lần kiểm định hợp lệ phải có kết quả đạt và trung tâm vẫn giữ đúng sản phẩm.

Phiên có giá khởi điểm, giá sàn tùy chọn, Mua ngay tùy chọn, phí vận chuyển cố định, thời gian bắt đầu/kết thúc. Giá sàn không thấp hơn giá khởi điểm; Mua ngay không thấp hơn giá sàn hoặc khởi điểm. Không hard-code tỷ lệ chênh lệch giá Mua ngay.

Bước giá do Admin cấu hình thành các khoảng liên tục, không chồng lấn. Không đổi bộ bước giá khi còn phiên chờ hoặc đang chạy. Cửa sổ gia hạn và số giây gia hạn được chụp vào phiên.

Trạng thái chính: `DA_LEN_LICH`, `HOAT_DONG`, `DA_KET_THUC`, `THAT_BAI`, `DA_HUY`. Tác vụ mở/đóng theo giờ MySQL; API tự kiểm tra hạn ngay khi nhận yêu cầu, không chờ tác vụ quét.

Giao diện chọn sản phẩm dùng `GET /products/mine?du_dieu_kien_dau_gia=1`: lọc trước phân trang, chỉ lấy sản phẩm của chính chủ đã duyệt và thỏa các điều kiện phiên, đơn, đề nghị Mua tiếp nêu trên. Nếu bắt buộc kiểm định, hồ sơ mới nhất phải đạt, còn lưu giữ, chưa rời trung tâm và có báo cáo. Kết quả chỉ phản ánh lúc đọc; API tạo vẫn kiểm tra lại điều kiện và khóa dữ liệu trong transaction.

`GET /auctions/mine/:id` dành riêng cho người bán đã xác minh sở hữu phiên; trả thông tin công khai cùng yêu cầu hủy mới nhất, khả năng gửi yêu cầu và lý do bị khóa. Không trả giá sàn hoặc mức tối đa bí mật. Giao diện nhập lịch theo UTC+7 và gửi ISO có múi giờ; không tự chốt phiên theo đồng hồ trình duyệt. Đợt bổ sung giao diện này không đổi cấu trúc CSDL.

## 8. Chính sách cọc và đăng ký tham gia

**Admin cấu hình rồi bật cọc; có thể cho người bán chọn bật/tắt từng phiên bằng cho_phep_nguoi_ban_chon.** Nếu bật cọc nhưng không cho chọn, người bán phải tuân thủ yêu cầu cọc. Ban đầu chính sách tắt; không tự áp 10% hoặc một số tiền cho phiên đang có. Cấu hình `DEPOSIT_POLICY` gồm bật/tắt, kiểu `TY_LE` hoặc `CO_DINH`, giá trị. Tỷ lệ tính theo giá khởi điểm, làm tròn lên một đồng. Tiền cọc dương và không vượt giá khởi điểm. Chính sách mới chỉ áp dụng khi tạo phiên mới; phiên lưu số tiền cuối cùng làm snapshot.

Phiên yêu cầu cọc: người mua đăng ký → kiểm tra tài khoản hoạt động, địa chỉ, không phải seller, phiên còn hiệu lực → hiển thị số tiền cọc → thanh toán mô phỏng → thành công mới được BID. Có thể đăng ký/cọc khi phiên đã lên lịch; BID chỉ mở khi bắt đầu.

Một người chỉ có một hồ sơ cọc chính cho một phiên. Theo dõi phiên là thao tác riêng, không thay thế đăng ký/cọc và không tạo ưu tiên bằng trần. Backend kiểm tra cọc trước khi ghi `gia_toi_da`, không chỉ ẩn nút ở frontend.

Trạng thái cọc: `CHO_THANH_TOAN`, `DA_DAT_COC`, `THAT_BAI`, `DA_HOAN_COC`, `DA_CHUYEN_VAO_DON`, `KHONG_HOAN_COC`, `HET_HAN`. Retry cùng khóa nhận lại kết quả đã xử lý; thử lại thực sự sau thất bại dùng khóa mới. Nhật ký giữ kết quả các lần thử, không tạo thêm bảng ví.

Seller chỉ xem số lượng đăng ký, đã cọc, đủ điều kiện. Không được xem mức tối đa, mã giao dịch cọc chi tiết, thông tin tài chính hoặc CCCD buyer. Buyer xem khoản cọc của mình; Admin xem nghiệp vụ cọc nhưng vẫn không đọc trần bí mật.

## 9. Đấu giá tự động và bảo mật mức tối đa

Người mua đặt mức tối đa bí mật. Hệ thống chỉ nâng giá công khai theo mức cần thiết, bước giá và khả năng của các bên. Không nhảy thẳng lên trần người dẫn đầu. Không cho giảm/rút trần trong bản đầu. Nếu hai trần bằng nhau, người đặt trước được ưu tiên; nếu cùng dấu thời gian thì dùng thứ tự ghi nhận ổn định.

Chỉ lượt giá công khai hợp lệ trong 60 giây cuối mới kích hoạt cộng thêm 90 giây vào giờ kết thúc hiện tại. Người đang dẫn đầu tăng trần nhưng không làm đổi giá công khai không tạo lượt giả hoặc gia hạn giả.

Trần của một người không được xuất cho người khác qua API, Socket.IO, thông báo hoặc nhật ký, kể cả API Admin. Ngoại lệ duy nhất: `GET /auctions/:id/my-max` trả trần của chính người gọi (trường `muc_toi_da_cua_toi`), để họ biết phải nâng lên trên mức nào. Giá sàn cũng không được suy ra bằng cách xuất dữ liệu nội bộ. API dùng danh sách trường công khai và lớp kiểm tra đầu ra.

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

Đã có workflow nhận hàng hoàn, kiểm kê, kiểm định lại, duyệt bán lại, gửi trả seller và xác nhận nhận lại theo mục 24.12. Khi cần hoàn tiền, Admin phải có kết quả kiểm kê hoặc căn cứ thất lạc; không thêm actor chuyên gia.

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

Lịch quét cũng gửi một thông báo nhắc khi phiên đang hoạt động còn không quá 10 phút cho người theo dõi/người đã đặt mức tối đa, và khi đơn chờ thanh toán còn không quá 6 giờ cho người mua. Chỉ nhắc khi còn hạn; mỗi người nhận được nhắc một lần cho từng phiên/đơn. Các bản ghi đã nhắc không chiếm hàng đợi của bản ghi chưa nhắc.

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

### Cập nhật triển khai ngày 07/10/2026

- Tách phạm vi danh sách phiên Admin khỏi danh sách công khai để quản trị vẫn xem được lịch sử thuộc danh mục ngừng hoạt động.
- Nối tác vụ nhắc phiên và thanh toán vào lịch quét, giữ kiểm tra thời hạn và chống thông báo lặp trong transaction.
- Bổ sung thông tin có trang sau cho các danh sách phân trang; frontend khóa nút chuyển trang trong lúc tải và chỉ cho chuyển tiếp khi backend xác nhận còn dữ liệu.
- Khi sửa địa chỉ mặc định, hệ thống chuyển mặc định sang địa chỉ khác nếu có; địa chỉ duy nhất vẫn giữ mặc định. Quyền sở hữu và cập nhật địa chỉ tiếp tục được kiểm tra trong transaction.
- Biểu mẫu thao tác xóa bước xác nhận cũ khi mở lại; biểu mẫu địa chỉ ngăn gửi lặp trong lúc đang lưu.
- Bổ sung mẫu cấu hình backend, để trống bí mật JWT và mật khẩu MySQL; không thay đổi cấu hình riêng hoặc dữ liệu MySQL.

Đã chạy kiểm thử ngày 07/10/2026: 18/18 kiểm thử backend cơ bản, 13/13 kiểm thử logic frontend và 59/59 kiểm thử tích hợp đạt trên `doan4_daugia_kiem_thu`. Bộ HTTP nền kiểm tra 91 API, bộ kiểm định/cọc kiểm tra thêm 16 API. Đã bổ sung hồi quy cho phân trang (kể cả trang cuối đủ số bản ghi và trang rỗng), địa chỉ mặc định, phạm vi Admin khi ẩn danh mục và lịch nhắc đúng hạn/không lặp/người theo dõi mới. Các kết quả này không thay thế nghiệm thu tương tác trên trình duyệt.

Frontend đã xử lý kết thúc phiên cục bộ khi `/users/me` trả 403 vì tài khoản bị khóa/tạm ngưng, tránh giữ trạng thái khởi tạo vô hạn. Tài liệu API đã đồng bộ tài khoản demo với bộ Postman hiện tại. Không thay đổi cấu trúc hoặc dữ liệu CSDL chính trong đợt kiểm thử.

### Kiểm tra lại ngày 08/10/2026

Đã chạy lại 18/18 kiểm thử backend cơ bản, 13/13 kiểm thử logic frontend và 59/59 kiểm thử tích hợp: không có ca thất bại hoặc bỏ qua. Bộ HTTP nền bao phủ 91 API với 219 yêu cầu, gồm 45 phản hồi lỗi được đối chiếu; bộ kiểm định/cọc bao phủ thêm 16 API, tổng cộng 107 API. Kiểm thử nhiều kết nối xác nhận ưu tiên người đặt trước khi bằng mức tối đa, cạnh tranh BID/Mua ngay, chốt một đơn, thu tiền một lần và Socket.IO không lộ mức tối đa. Các ca gia hạn, hạn thanh toán, lịch nhắc và tự giải ngân cũng đạt. Kiểm tra định dạng, kiểu dữ liệu, lint và build đều đạt; frontend còn cảnh báo một gói biểu tượng lớn hơn 500 kB, cần theo dõi khi tối ưu tải trang.

Trên trình duyệt, đã đăng nhập riêng Admin, người bán và hai người mua trong CSDL kiểm thử. Các thao tác đã xác nhận:

- Theo dõi/bỏ theo dõi lưu sau tải lại; bỏ theo dõi vẫn giữ cam kết và phiên xuất hiện trong danh sách đã tham gia, kể cả ở trang tiếp theo.
- Hai người mua nộp cọc và đặt cùng mức tối đa 22 triệu; người đặt trước dẫn đầu, giá công khai cập nhật sang cửa sổ còn lại, ô mức tối đa được xóa.
- Thanh toán đơn 18.050.000 đồng trừ cọc 1.800.000 đồng, chỉ thu thêm 16.250.000 đồng; tải lại vẫn có đúng lịch sử thanh toán. Người bán khai báo vận đơn, người mua nhận hàng vẫn giữ tiền, xác nhận hoàn tất mới giải ngân và lưu đánh giá 5 sao.
- Admin tải và xem ảnh bằng chứng riêng, tiếp nhận tranh chấp, hoàn toàn bộ hoặc giải ngân toàn bộ 18.050.000 đồng; tiền đang giữ về 0 và hồ sơ đóng không còn thao tác xử lý.
- Người bán gửi Second Chance, người nhận thanh toán theo giá công khai 21 triệu cộng phí 50.000 đồng; đơn mới đã trả đủ, cọc bằng 0 và không thu cọc lại.
- Admin gửi hàng từ trung tâm; người bán không có thao tác gửi thay. Người mua bị chặn khi mở khu vực Admin hoặc đơn của người khác.
- Người mua báo cáo sản phẩm, Admin quyết định không vi phạm và đóng hồ sơ. Người bán xin hủy phiên chưa có cam kết, Admin duyệt hủy, sau đó đăng lại cùng sản phẩm thành phiên mới; sản phẩm có Second Chance đã chấp nhận không có liên kết đăng lại.
- Cả 12 khu vực quản trị tải được, gồm biểu đồ tổng quan, danh mục, cọc, vi phạm, cấu hình và nhật ký. Bố cục PC không tràn ngang; tổng quan, danh mục, đơn, tranh chấp và phiên công khai cũng không tràn ngang ở chiều rộng thực tế 424 px, thu phóng 100%. Đây chưa phải kiểm tra toàn bộ thiết bị và trình duyệt.

Máy chủ thử tắt jobs và hoàn tác toàn bộ dữ liệu khi dừng. Đã sửa đường dẫn ảnh WebP và điều kiện kết hợp các bộ dữ liệu trong công cụ kiểm thử giao diện; không thay đổi nghiệp vụ hoặc phạm vi transaction ứng dụng. Không còn tài khoản giao diện thử; ảnh thử được dọn, kể cả hai ảnh cũ đã xác minh không còn chủ sở hữu/tham chiếu. CSDL chính `doan4_daugia` vẫn đạt 21 bảng, 322 cột được đối chiếu, 31 nhóm liên kết và 160 đường dẫn tệp; giữ nguyên 51 tài khoản, 50 sản phẩm, 18 phiên và 13 đơn.

Các màn hình và API chính cho khách mua, người bán và Admin đã được triển khai. Việc còn lại là bổ sung 7 biểu đồ tuần tự vào mục 3.2.3 theo hình người dùng cung cấp, kiểm tra toàn bộ màn hình trên các thiết bị nhỏ và trình duyệt khác, cùng kiểm thử tải nếu triển khai thực tế. Không dùng kết quả của các luồng đã thử để khẳng định mọi tổ hợp đầu vào đều đúng.

Các phần ngoài đợt này: tiền/vận chuyển/eKYC thật, ví nội bộ, quy trình trả hàng nhiều chặng, actor chuyên gia, cam kết xác thực tuyệt đối, hoàn một phần cho giao dịch mới. Báo cáo sản phẩm và đăng lại có điều kiện đã được thử trực tiếp theo các nhánh nêu trên; các nhánh khóa sản phẩm có giao dịch đang xử lý tiếp tục được kiểm tra qua bộ tích hợp.

### Rà soát từng tác nhân và tài khoản kiêm mua/bán — 08/10/2026

Lượt rà soát tiếp theo chạy lại 90/90 kiểm thử đạt (18 backend, 59 tích hợp, 13 frontend). Đã mở rộng ca HTTP trong `backend/tests/integration/tep-va-san-pham.test.js` để kiểm tra một người dùng có cả đơn mua và đơn bán; số ca cấp ngoài vẫn là 59, số bước bên trong tăng. Tất cả giao dịch thử được hoàn tác trong `doan4_daugia_kiem_thu`.

**Các bước người mua được đối chiếu qua bộ kiểm thử:** đăng ký không tự nâng quyền → đăng nhập → địa chỉ của chính mình → theo dõi riêng với cam kết → đăng ký/cọc nếu phiên yêu cầu → đặt mức tối đa bí mật → xác định người thắng và chuyển cọc → thanh toán phần còn lại → nhận hàng, vẫn giữ tiền → hoàn tất, giải ngân → đánh giá đối tác. Các nhánh không đủ cọc, thiếu địa chỉ, thanh toán lỗi/lặp, quá hạn, không đạt sàn, Mua ngay, Second Chance và tranh chấp đều có ca kiểm tra riêng trong bộ tích hợp.

**Các bước người bán được đối chiếu:** chưa xác minh bị chặn đăng sản phẩm → gửi hồ sơ/tệp riêng → Admin duyệt → token đang dùng nhận đúng quyền mới từ MySQL → tạo sản phẩm, gắn ảnh, gửi duyệt → kiểm định và lưu giữ nếu bắt buộc → duyệt sản phẩm → mở phiên → người khác mua → khai báo vận chuyển nếu nguồn gửi là người bán → người mua xác nhận/hoàn tất → giải ngân và đánh giá. Hàng ở trung tâm chỉ Admin được ghi nhận gửi; seller không tự duyệt sản phẩm, tự đặt cọc, trả giá hoặc Mua ngay hàng của mình.

**Các bước quản trị được đối chiếu:** xét hồ sơ người bán → mở/nhận/bắt đầu kiểm định → yêu cầu báo cáo trước khi ghi đạt → duyệt sản phẩm → quản lý phiên, cọc và yêu cầu hủy → theo dõi đơn, ghi nhận trung tâm gửi → tiếp nhận tranh chấp và quyết toán toàn bộ một lần → xử lý vi phạm → xem cấu hình, thống kê và nhật ký. Người mua/bán bị từ chối API quản trị; Admin không được dùng quyền quản trị để Mua ngay.

**Kịch bản hai vai trò mới:** cùng tài khoản đã xác minh bán một món cho B và mua món khác từ C. Danh sách đơn mua/bán lọc đúng trước phân trang. Người này không được khai báo gửi trên đơn mình mua hoặc xác nhận nhận/hoàn tất trên đơn mình bán. Hai đơn đều thanh toán 24 triệu, giữ nguyên tiền khi vừa nhận hàng, chỉ giải ngân sau xác nhận hoàn tất; đánh giá gửi đúng đối tác tương ứng và lần đánh giá thứ hai bị chặn. Đầu ra HTTP tiếp tục được kiểm tra không chứa mật khẩu băm hoặc mức tối đa bí mật.

**Kiểm tra trên dữ liệu chính:** đã đăng ký và đăng nhập tài khoản cá nhân theo yêu cầu qua giao diện, đối chiếu trong MySQL và danh sách Admin; kiểm tra thêm 15 yêu cầu API của tài khoản mới, đúng dữ liệu/quyền và không có trường bí mật. Chưa nộp địa chỉ hoặc hồ sơ xác minh thay người dùng vì còn chờ thông tin nhận hàng và lựa chọn hồ sơ kiểm thử. Tài khoản mới hiện chưa có quyền bán; không coi kịch bản tài khoản giả lập trong bộ test là đã hoàn tất xác minh cho tài khoản cá nhân.

Trên trình duyệt đã kiểm tra chặn hồ sơ xác minh rỗng và chặn tài khoản chưa xác minh mở trang đăng bán; đăng nhập riêng người bán đã xác minh để đọc bốn nhóm sản phẩm/kiểm định/phiên/đơn và biểu mẫu tạo sản phẩm; đăng nhập Admin để mở các khu vực quản trị. Đây là kiểm tra điều hướng và điều kiện giao diện trong lượt này; các thao tác thay đổi giao dịch đầy đủ được xác nhận qua HTTP trên CSDL kiểm thử và bằng lượt trình duyệt trước đó.

Sau khi thêm tài khoản, MySQL chính có 52 tài khoản, vẫn 50 sản phẩm, 18 phiên và 13 đơn. Đối chiếu 53 liên kết khóa ngoại không có bản ghi mồ côi; không có đơn lệch giữa tiền đã thu với tổng tiền đang giữ, đã hoàn và đã giải ngân. Các con số 51 tài khoản ở phần lịch sử mô tả mốc trước đăng ký mới. Công cụ kiểm tra bộ seed hiện chốt đúng 51 tài khoản nên không dùng điều kiện số lượng đó để kết luận dữ liệu vận hành bị lỗi khi có người dùng đăng ký thêm. Không sửa schema hoặc tạo giao dịch trên dữ liệu chính trong lượt này.

### Hoàn tất tài khoản thực hành cá nhân — 08/10/2026

Sau khi người dùng đồng ý dùng thông tin giả lập, đã bổ sung địa chỉ mặc định tại khu vực Phố Hiến và hồ sơ CCCD kiểm thử với số giấy tờ 12 chữ số, số tài khoản ngân hàng dạng số, chủ tài khoản và ba tệp PNG ghi rõ không phải giấy tờ thật. Dữ liệu được gửi qua API hiện có, tệp thuộc đúng tài khoản; Admin xét duyệt bằng luồng xác minh, có nhật ký và thông báo. Tài khoản đã ở trạng thái `DA_XAC_MINH`, vẫn giữ vai trò `NGUOI_DUNG` để cùng mua và bán; không cấp quyền quản trị. Trạng thái chờ bổ sung ở đoạn trên là mốc trước khi hoàn tất bước này.

Đã đọc lại hồ sơ sau duyệt bằng cùng token, truy cập danh sách phiên bán và cả hai phạm vi đơn mua/bán thành công. Tệp xác minh không đăng nhập trả 401; giao diện hồ sơ sau tải lại hiển thị Đã xác minh. Địa chỉ và giấy tờ chỉ phục vụ đồ án; không tích hợp xác minh danh tính hoặc chuyển tiền thật. Không thay schema hoặc nới lỏng quy tắc xác minh chung của hệ thống.

Mọi thay đổi sau này phải giữ cùng một đặc tả chính, cập nhật hợp đồng và kiểm thử. Không dùng kết quả kiểm thử phiên bản trước để khẳng định nghiệp vụ mới đã chạy đúng.

## 24. Rà soát luồng sau đấu giá và đề xuất hoàn thiện — 17/10/2026

Phần này lưu kết quả rà soát và thiết kế ngày 17/10/2026. Sau khi người dùng đồng ý triển khai, kết quả được ghi ở mục 24.12. Các mô tả chưa có ở mục 24.1 là hiện trạng trước sửa. Thời hạn mặc định không thay cho cấu hình/thời hạn đã lưu của từng đối tượng.

### 24.1. Hiện trạng trước đợt hoàn thiện và khoảng trống đã xác định

1. Chốt phiên có người thắng tạo đơn theo giá công khai và chuyển cọc vào đơn; tác vụ quá hạn hủy đơn chưa thanh toán với lý do `KHONG_THANH_TOAN`. Xem `backend/src/services/dau-gia.ts` và `backend/src/services/don-hang.ts`.
2. Second Chance đã có API và nút ở chi tiết đơn bán, nhưng **chỉ nhận đơn hủy vì không thanh toán**. Nút không xuất hiện với đơn hoàn tiền tranh chấp. Đây là giới hạn có chủ ý của luồng hiện tại, không thể kết luận tính năng hoàn toàn chưa có. Xem `backend/src/services/de-nghi-mua-tiep.ts` và `frontend/src/components/tao-de-nghi-mua-tiep.tsx`.
3. Giải quyết tranh chấp cho người mua hiện hoàn toàn bộ tiền, hủy đơn với lý do `HOAN_TIEN_TRANH_CHAP` và đóng tranh chấp. Chưa có điều kiện bắt buộc ghi nhận thu hồi/kiểm kê hàng trước quyết toán. Xem `backend/src/services/tranh-chap.ts`.
4. Chưa có chuỗi hàng từ người mua/đơn vị vận chuyển hoàn về trung tâm, kiểm kê lại, quyết định lưu giữ bán tiếp hoặc trả người bán. Thao tác trả hàng kiểm định hiện chỉ dùng cho hàng kiểm định không đạt/cần bổ sung trước bán; không dùng được để thu hồi hàng sau giao dịch.
5. Điều kiện đăng lại hiện cho phép trường hợp không bán được hoặc đơn hủy do không thanh toán. Đơn hoàn tiền tranh chấp khóa sản phẩm; hồ sơ đã ghi ngày rời trung tâm cũng không còn đủ điều kiện tạo phiên. Ngoài ra, truy vấn kiểm định vẫn xem mọi phiên `DA_KET_THUC` là nghĩa vụ, và điều kiện đăng lại vẫn chặn mọi đề nghị `DA_CHAP_NHAN` trong lịch sử. Cần xét nghĩa vụ thực tế còn tồn tại, không chỉ trạng thái lịch sử. Xem `backend/src/repositories/danh-muc-san-pham.ts` và `backend/src/repositories/kiem-dinh.ts`.
6. Khi tạo phiên, backend tự chụp `DEPOSIT_POLICY` từ Admin. Form/API chưa có lựa chọn bật/tắt cọc riêng của người bán. Giá Mua ngay đã là tùy chọn của người bán.
7. Lý do tranh chấp đang dùng danh sách chung, chưa ràng buộc `KHONG_KHOP_HO_SO_KIEM_DINH` với việc đơn có hồ sơ kiểm định. Giao diện đã tách nút “Báo chưa nhận hàng”, nhưng backend còn cho mọi lý do khi đơn đang trong hạn kiểm tra; cần đồng bộ điều kiện cả hai phía.
8. Kiểm tra Second Chance hiện tập trung vào đơn và đề nghị của phiên gốc. Khi bổ sung bán lại, cần kiểm tra toàn bộ nghĩa vụ của cùng món hàng, kể cả phiên mới hoặc hồ sơ đăng ký lại, ở cả lúc gửi và chấp nhận đề nghị để tránh bán trùng.

### 24.2. Phân biệt các nghĩa của “không nhận hàng”

- **Không thanh toán sau khi thắng:** chưa đủ tiền, hàng chưa được gửi. Sau quá hạn mới hủy đơn và xét Second Chance. Không phát sinh vận chuyển hoàn nếu hàng vẫn ở trung tâm.
- **Chưa nhận được hàng:** người mua báo hàng chưa tới. Đây là yêu cầu kiểm tra giao nhận, chưa phải chứng cứ người mua từ chối hay lỗi của người bán. Tiền tiếp tục được giữ; tra vận đơn và xác minh.
- **Từ chối nhận/đổi ý:** người mua chủ động không nhận hoặc đơn vị vận chuyển ghi nhận từ chối. Cần yêu cầu hủy, bằng chứng giao hàng và quyết định Admin; không cho một nút bấm tự hủy, hoàn tiền hoặc xác nhận vi phạm.
- **Đã nhận nhưng hàng có vấn đề:** hàng thiếu phụ kiện, hỏng, sai mô tả/serial hoặc không khớp báo cáo. Mở tranh chấp; kiểm tra hàng hoàn về khi cần. Không kết luận người bán có lỗi chỉ từ lý do người mua chọn.

Nút đề xuất cho người mua gồm “Báo chưa nhận hàng”, “Yêu cầu hủy/không tiếp tục nhận hàng” và “Báo vấn đề với hàng đã nhận”, hiển thị theo đúng giai đoạn. “Đã nhận hàng” và “Xác nhận hàng phù hợp/Hoàn tất” là hai thao tác khác nhau. Backend phải kiểm tra lại quyền và điều kiện khi nhận yêu cầu.

### 24.3. Luồng thành công từ lúc kết thúc phiên

1. Hết giờ sau mọi lần gia hạn: khóa phiên, kiểm tra lượt hợp lệ và giá sàn, xác định đúng một người thắng theo giá công khai. Nếu không có giá hợp lệ hoặc chưa đạt sàn, kết thúc thất bại và hoàn cọc; không tạo đơn.
2. Có người thắng: kết thúc phiên, tạo đúng một đơn còn nghĩa vụ, chụp giá/phí/địa chỉ/hạn; chuyển cọc người thắng vào đơn và hoàn cọc người không thắng. Cọc trước khi chốt chưa gắn đơn là bình thường.
3. Người thắng trả phần còn thiếu trong hạn mặc định 48 giờ. Nếu cọc đã đủ tổng đơn thì ghi nhận đủ tiền, không thu thêm. Thanh toán lỗi không kéo dài hạn; gửi lại cùng khóa không thu trùng.
4. Tiền được giữ trung gian, đơn chờ gửi; người bán chưa được giải ngân. Với hàng trung tâm giữ, Admin ghi nhận trung tâm đóng gói và gửi trong hạn mặc định 3 ngày. Với đơn nguồn người bán, người bán ghi nhận gửi.
5. Khi có bằng chứng đã giao, người mua hoặc Admin ghi nhận nhận hàng; bắt đầu hạn kiểm tra mặc định 3 ngày. Mã vận đơn, đồng hồ hoặc việc không bấm nút chưa đủ chứng minh đã giao.
6. Người mua xác nhận hàng phù hợp thì hoàn tất sớm. Hết hạn kiểm tra chỉ tự hoàn tất khi đã ghi nhận giao, đủ tiền, không tranh chấp/cờ Admin và tài khoản đủ điều kiện.
7. Giải ngân đúng một lần, cho đánh giá đúng đối tác, giữ toàn bộ lịch sử và gửi thông báo liên quan. “Đấu giá thành công” chỉ có nghĩa đã chọn người thắng; “Giao dịch hoàn tất” mới là đơn đã quyết toán.

### 24.4. Các nhánh ngoại lệ cần xử lý

1. **Winner không thanh toán:** hết hạn thì hủy đơn, đánh dấu cọc không hoàn theo chính sách đã công bố, ghi vi phạm chờ xét. Hàng còn nguyên ở trung tâm không phải vận chuyển về lần nữa. Người bán có thể gửi Second Chance hoặc chọn đăng phiên mới khi không còn đề nghị/nghĩa vụ đang mở; hai lựa chọn loại trừ nhau.
2. **Đã thanh toán nhưng nguồn gửi chưa gửi:** giữ tiền, nhắc/đánh dấu quá hạn và cho Admin tiếp nhận. Nếu hủy trước khi hàng rời trung tâm, chỉ kiểm kê hàng đang có. Lỗi chậm gửi của trung tâm không tự ghi thành vi phạm của người bán. Không tự đổi nguyên nhân thành không thanh toán để mở Second Chance.
3. **Hàng đang vận chuyển, chưa tới:** người mua có quyền báo chưa nhận tại mốc mặc định 7 ngày; Admin được can thiệp sớm khi có thông tin cần xử lý. Chờ xác minh/giao tiếp/hoàn về; không tự giải ngân vì người mua im lặng, không bán món hàng đang trên đường.
4. **Người mua từ chối nhận hoặc đổi ý sau thanh toán:** ghi yêu cầu và bằng chứng; Admin xét nguyên nhân. Khi chấp nhận hủy, thu hồi về trung tâm và kiểm kê. Người mua có thể được ghi nhận vi phạm sau khi xác minh nếu vi phạm cam kết; không tự tịch thu cọc đã hòa vào tiền đơn. Phạm vi hiện tại chỉ hỗ trợ hoàn toàn bộ hoặc giải ngân toàn bộ, chưa có tự khấu trừ phí/hoàn một phần.
5. **Hàng giao không thành công, hoàn về nguyên vẹn:** Admin tiếp nhận, đối chiếu serial, phụ kiện, tình trạng và hồ sơ; ghi kết quả kiểm kê. Sau khi quyết toán đơn/tranh chấp cũ, hàng đang ở trung tâm và còn phù hợp hồ sơ có thể được duyệt tạo phiên mới. Không bắt buộc trả người bán rồi gửi lại trung tâm chỉ để bán tiếp.
6. **Hàng lỗi, thiếu phụ kiện hoặc sai mô tả:** mở tranh chấp, giữ tiền, cho người mua và người bán nộp bằng chứng. Nếu cần hoàn hàng, người mua gửi về trung tâm; trung tâm đối chiếu và ghi nhận kết luận, sau đó hoàn/giải ngân theo quyết định. Hàng không còn đạt điều kiện phải bị khóa bán và trả người bán để xử lý.
7. **Người bán nhận lại hàng lỗi:** người bán xác nhận đã nhận lại, sửa/bổ sung/cập nhật đúng tình trạng rồi tạo hồ sơ đăng ký bán lại có liên kết hồ sơ gốc. Sản phẩm cần duyệt, kiểm định lại khi bắt buộc; chưa đạt thì không mở phiên. Không sửa mô tả của sản phẩm gắn với đơn cũ để xóa dấu vết sai lệch.
8. **Không khớp serial hoặc hàng hoàn có bất thường:** khóa khả năng bán tiếp, giữ hồ sơ và tiền chưa quyết toán để Admin xác minh. Không tự hoàn tiền chỉ vì có mã vận đơn hoàn; cần ghi nhận đúng món hàng. Nếu đã hoàn tiền trước đó thì xử lý hàng/vi phạm bằng hồ sơ bổ sung, không quyết toán tiền lần hai.
9. **Thất lạc hoặc hư hỏng không thu hồi được:** Admin ghi bằng chứng/kết luận và quyết định tiền theo phạm vi hệ thống; có thể hoàn tiền mà không có kiện hàng để nhận lại. Sản phẩm phải bị khóa bán; không tự đặt trạng thái đang ở trung tâm. Xử lý bồi thường với hãng vận chuyển ngoài phạm vi đồ án.
10. **Khiếu nại không có căn cứ:** Admin ghi quyết định và bằng chứng. Nếu đủ căn cứ giao đúng hàng và hoàn tất nghĩa vụ thì giải ngân toàn bộ, đóng đơn/tranh chấp; không bán lại sản phẩm đã thuộc người mua.
11. **Người nhận Second Chance từ chối/hết hạn:** chỉ đóng đề nghị, không tự tạo đơn hay vi phạm vì từ chối lời mời. Người bán chủ động gửi tiếp hoặc mở phiên mới nếu đủ điều kiện. Chấp nhận phải thanh toán đủ ngay, không đặt lại cọc và không tái sử dụng cọc đã hoàn.
12. **Đơn cũ đã hủy/hoàn tiền theo code hiện tại:** giữ quyết toán cũ, bổ sung quy trình kiểm kê/thu hồi có tham chiếu đơn và tranh chấp. Không đổi lý do hủy thành `KHONG_THANH_TOAN`, xóa đơn, xóa ngày rời trung tâm hay sửa trực tiếp cờ kiểm định để làm hiện nút đăng lại.

### 24.5. Kiểm kê hàng hoàn và điều kiện bán tiếp

Đề xuất quản lý **trạng thái tiền của đơn** và **vị trí/tình trạng món hàng** riêng. Đơn đã hủy chưa đồng nghĩa trung tâm đã nhận lại hàng. Báo cáo kiểm định trước khi gửi là bằng chứng lịch sử, không chứng minh tình trạng sau quá trình vận chuyển và sử dụng.

Luồng hàng hoàn dự kiến: yêu cầu thu hồi → ghi nhận gửi hoàn nếu hàng ở ngoài trung tâm → trung tâm thực nhận → kiểm kê/đối chiếu → đủ điều kiện lưu giữ để bán lại hoặc chờ trả người bán → ghi vận đơn trả → người bán xác nhận nhận lại. Đây là nhãn thiết kế, chưa phải enum/API mới đã có trong MySQL.

Nếu hàng chưa từng rời trung tâm thì bỏ qua bước vận chuyển về, nhưng vẫn ghi nhận kiểm kê và quyết định xử lý. Nếu hàng mất thì đi nhánh thất lạc, không tạo biên bản tiếp nhận giả.

Biên bản cần gắn sản phẩm, phiên, đơn/tranh chấp gốc, thời gian, người ghi nhận, nguồn gửi, mã vận đơn, serial/mã nhận dạng, số kiện, phụ kiện, ảnh và kết quả đối chiếu. Kiểm kê không thay thế kiểm định chuyên môn: có nghi vấn xác thực/hỏng hóc thì yêu cầu chuyên gia tái kiểm định và báo cáo mới; Admin ghi nhận kết quả.

Chỉ mở khả năng tạo phiên mới khi đồng thời thỏa mãn:

- Người bán vẫn sở hữu món hàng và đủ quyền bán; hồ sơ sản phẩm được duyệt, không bị khóa vì lỗi đang chờ xử lý.
- Đơn/tranh chấp cũ đã có quyết định và hoàn tất các nghĩa vụ ảnh hưởng đến món hàng; không còn người mua đang có quyền nhận món hàng.
- Trung tâm thực sự đang giữ đúng món hàng nếu bắt buộc kiểm định; đã hoàn tất kiểm kê sau hoàn hàng và kiểm định lại khi cần.
- Không có phiên khác đang chờ/chạy, đơn còn nghĩa vụ hoặc đề nghị đang hiệu lực cho cùng món hàng, kể cả qua một hồ sơ sản phẩm đăng ký lại.
- Người bán chọn mở phiên mới; hệ thống tạo ID phiên mới, giữ nguyên phiên và giá cũ. Không mở lại phiên đã kết thúc hay mang lượt BID/cọc cũ sang phiên mới.

Hàng hoàn nguyên vẹn, hồ sơ không thay đổi và trung tâm tiếp tục giữ có thể dùng lại hồ sơ sản phẩm gốc sau duyệt bán lại. Hàng trả người bán hoặc phải sửa nội dung/tình trạng dùng hồ sơ đăng ký lại liên kết gốc; không buộc mọi trường hợp tạo sản phẩm trùng. Với hồ sơ kiểm định, ghi nhận lần nhận/kiểm tra mới có liên kết lịch sử; không xóa ngày rời trung tâm của lần giao trước.

### 24.6. Phạm vi và vị trí Second Chance

**Đề xuất giữ phạm vi hiện có: Second Chance dành cho đơn chưa thanh toán, đã hủy hợp lệ, hàng còn đủ điều kiện bán.** Chưa mở rộng sang mọi trường hợp giao không thành công hoặc đã hoàn tiền tranh chấp. Với hàng đã gửi ra ngoài, quy trình thu hồi/kiểm kê rồi tạo phiên mới rõ ràng hơn và không dùng lại cam kết giá của phiên cũ cho một tình trạng hàng có thể đã thay đổi.

Nếu muốn hỗ trợ Second Chance sau giao hàng thất bại trong tương lai, phải thiết kế bổ sung điều kiện thu hồi, tình trạng không đổi, kết thúc nghĩa vụ cũ, giá/hiệu lực lời mời và khóa bán trùng. Không đơn giản đổi điều kiện từ một lý do hủy thành mọi đơn `DA_HUY`.

Vị trí hiện có của người bán: `Đơn bán hàng` → chi tiết đơn gốc tại `/nguoi-ban/don-hang/:id` → mục “Đề nghị mua tiếp” → nút “Gửi đề nghị mua tiếp”. Danh sách đề nghị gửi/nhận ở `/tai-khoan/de-nghi`. Admin không thay người bán gửi lời mời.

Người được mời không tự động thành người thắng mới: họ được quyền từ chối/hết hạn. Hệ thống chọn theo lượt trả công khai hợp lệ cuối của từng người, giá giảm dần, thời gian/ID tăng dần; bỏ người không đủ điều kiện và giá chưa đạt sàn. Không dùng `gia_toi_da` bí mật để định giá Second Chance. Vì có giá sàn, không phải phiên nào cũng có ứng viên hợp lệ dù có nhiều bidder.

Khi đã chuyển sang phiên mới/hồ sơ bán lại, không cho gửi hoặc chấp nhận Second Chance từ phiên cũ. Một đề nghị đã chấp nhận là lịch sử giao dịch; nếu đơn sinh ra sau đó hủy, phải căn cứ nghĩa vụ và điều kiện hàng hiện tại, không khóa món hàng vĩnh viễn chỉ vì còn chữ `DA_CHAP_NHAN` trong lịch sử.

### 24.7. Bật/tắt cọc theo từng phiên

**Trước đợt sửa:** Admin bật/tắt và cấu hình mức cọc chung; mỗi phiên mới tự chụp chính sách. Sau đợt sửa, công tắc riêng và quyền cho phép lựa chọn đã có theo mục 24.12.

**Thiết kế đề xuất:** Admin quyết định phạm vi cho phép, người bán chọn trong phạm vi đó khi tạo phiên:

1. Admin tắt cọc: phiên mới không thu cọc, người bán không tự thu ngoài quy trình.
2. Admin cho phép tùy chọn: form tạo phiên có “Yêu cầu đặt cọc”; người bán bật/tắt, số tiền tính theo công thức Admin đã cấu hình và hiển thị trước khi tạo.
3. Admin bắt buộc cọc: công tắc hiển thị bật và khóa, giải thích chính sách; người bán không được tắt. Chưa tự đặt ngưỡng giá/danh mục bắt buộc khi chưa được cấu hình.

Lựa chọn và số tiền chụp vào phiên một lần; không bật/tắt hoặc đổi số tiền sau khi phiên được tạo để không thay điều kiện của người đã tham gia. Cọc phải dương, không vượt giá khởi điểm và dùng phép tính tiền chính xác. Thêm trường gửi từ frontend cần đồng bộ Zod/API, không chỉ thêm công tắc giao diện.

Người mua thấy yêu cầu/số tiền ngay trên chi tiết phiên, trước đăng ký/BID. Người thua được hoàn cọc, người thắng được trừ vào đơn, quá hạn chưa trả đủ xử lý theo chính sách đã công bố. Sau khi đã trả đủ tiền đơn, cọc là một phần tổng tiền; khi hoàn toàn bộ do tranh chấp cũng hoàn cả phần này. Không tự tạo chế độ giữ riêng cọc hoặc trừ phí trả hàng trong bản chỉ có hai kết quả quyết toán toàn bộ.

### 24.8. Mua ngay: quyền quyết định, hiển thị và mục đích

Người bán quyết định có đặt giá Mua ngay hay không lúc tạo phiên. Đề xuất thể hiện bằng công tắc “Cho phép Mua ngay” và ô giá khi bật; giá phải hợp lệ so với giá khởi điểm/giá sàn. Admin quản lý chính sách và duyệt hồ sơ sản phẩm; backend quyết định hiệu lực giao dịch theo quy tắc đã công bố. Người bán không được tự bật lại sau khi người mua đã BID.

Quy tắc VietBid hiện có:

- Không có giá sàn: Mua ngay còn hiệu lực trước lượt trả giá công khai hợp lệ đầu tiên.
- Có giá sàn: Mua ngay còn hiệu lực khi giá công khai chưa đạt sàn; đạt sàn thì tắt. Không dựa vào việc giá công khai đã bằng giá Mua ngay hay chưa.
- Chỉ mua được khi phiên đang trong thời gian hoạt động, người mua có quyền, có địa chỉ và không phải người bán của món đó. Phiên sắp mở/đã kết thúc/hủy không nhận giao dịch mới.
- Thanh toán thành công mới chốt phiên, tạo đơn đã thu đủ và hoàn cọc các bidder còn lại; cọc hợp lệ của người mua được khấu trừ. Thanh toán lỗi không chốt phiên.

Ví dụ: khởi điểm 10 triệu, sàn 20 triệu, Mua ngay 25 triệu. Trước khi đạt sàn, người mua có thể thanh toán 25 triệu cộng phí để chốt. Khi BID làm giá công khai đạt 20 triệu, Mua ngay tắt dù giá vẫn dưới 25 triệu. Không xuất giá sàn bí mật ra API công khai; thông báo chỉ nêu đã đạt điều kiện giá sàn.

Vị trí thao tác mua: trang `/phien/:id`, trong khu vực tham gia của người mua, cạnh/dưới biểu mẫu đặt giá. Hiện code vẫn hiển thị khối/nút bị khóa khi không khả dụng. Đề xuất giữ lời giải thích cụ thể: chưa mở phiên, đã kết thúc, người bán không bật, đã có BID hoặc đã đạt sàn; khách chưa đăng nhập thấy thông tin và liên kết đăng nhập, còn seller/Admin chỉ có thông tin quản lý.

Mua ngay là tính năng tùy chọn, giúp chốt sớm với mức giá người bán đồng ý và người mua chấp nhận. Nó không bắt buộc đối với một sàn đấu giá và cũng không thay thế cách xác định người thắng khi phiên chạy hết giờ. VietBid đã có luồng này nên có thể giữ, tắt mặc định khi tạo phiên và chỉ bật theo lựa chọn người bán; không cần thêm một chế độ cửa hàng bán giá cố định riêng cho đồ án.

Đối chiếu eBay: nền tảng hỗ trợ cả bán giá cố định và thêm Mua ngay vào phiên đấu giá. Hướng dẫn chính thức nêu Mua ngay thường biến mất sau BID đầu tiên, hoặc khi đạt sàn nếu có; có ngoại lệ theo danh mục. Phần lớn danh mục yêu cầu giá Mua ngay cao hơn giá đấu ban đầu ít nhất 30%; đây là quy tắc riêng của eBay, không tự áp vào VietBid. eBay cũng hỗ trợ Second Chance khi winner không trả tiền và đơn đã hủy, chưa đạt sàn hoặc có thêm hàng giống nhau; VietBid chỉ chọn nhánh phù hợp với món hàng duy nhất và giữ điều kiện giá sàn hiện có.

### 24.9. Thứ tự triển khai đề xuất

1. Đồng bộ đặc tả sau khi chốt chính sách: tách không thanh toán, chưa nhận, từ chối nhận và hàng sai/lỗi; phân định rõ quyền yêu cầu với quyền kết luận của Admin.
2. Thiết kế dữ liệu vòng đời hàng/biên bản nhận lại có liên kết đơn, sản phẩm và hồ sơ kiểm định. Đánh giá sử dụng cấu trúc hiện có hoặc migration tối thiểu sau khi có thiết kế cụ thể; không hứa giữ nguyên số bảng nếu làm mất lịch sử nhiều lần thu hồi. Không cần thêm actor trung tâm/chuyên gia riêng.
3. Bổ sung API và transaction cho yêu cầu hủy/thu hồi, ghi vận chuyển hoàn, nhận lại/kiểm kê, quyết định lưu giữ hoặc trả seller, seller xác nhận nhận lại. Siết quyết toán theo bằng chứng/điều kiện, có ngoại lệ ghi nhận rõ cho thất lạc và dữ liệu đã hoàn tiền.
4. Thống nhất một điều kiện đủ khả năng bán cho cả đăng lại, gửi/chấp nhận Second Chance và kiểm định. Khóa cùng món hàng xuyên các phiên/hồ sơ để ngăn bán trùng. Giữ nguyên lịch sử và báo lý do khóa có thể hành động được.
5. Nối giao diện đúng từng tác nhân: buyer gửi yêu cầu/bằng chứng; seller phản hồi, nhận hàng trả và đăng lại; Admin xác nhận vị trí, kiểm kê, quyết định tiền/hàng. Bổ sung công tắc cọc theo quyền và công tắc Mua ngay, giải thích lý do không khả dụng.
6. Kiểm thử trên CSDL riêng bằng các chuỗi đầy đủ, rồi mới chuyển dữ liệu/schema theo kế hoạch có sao lưu. Bộ kiểm thử của phiên bản cũ không chứng minh các nhánh mới đã hoàn thiện.

### 24.10. Các ca nghiệm thu cho phần mở rộng

1. Chốt phiên/cọc/tạo đơn một lần; retry hoặc nhiều request không tạo hai người thắng/hai đơn còn nghĩa vụ.
2. Không có BID/chưa đạt sàn không tạo đơn, hoàn cọc đúng một lần; giá trúng không lấy trần bí mật.
3. Winner quá hạn mới mở điều kiện Second Chance; nút nằm ở đúng đơn bán và kiểm tra lại quyền ở API.
4. Không có ứng viên đạt sàn phải giải thích được; đề nghị dùng giá công khai, không lộ hoặc dùng mức tối đa.
5. Second Chance bị từ chối/hết hạn không tạo nghĩa vụ mua/vi phạm; thử lại thanh toán không thu trùng và không dùng cọc đã hoàn.
6. Mở phiên mới và gửi/chấp nhận đề nghị cũ đồng thời chỉ cho một nhánh bán món hàng thành công, kể cả hồ sơ đăng ký lại có ID khác.
7. Không giải ngân khi chỉ có vận đơn, khi đang vận chuyển/chưa nhận, có tranh chấp/cờ xử lý, hoặc chưa đủ tiền.
8. “Chưa nhận” không tự biến thành “từ chối”; người bán không tự xác nhận giao để bắt đầu đồng hồ kiểm tra.
9. Đơn đã hoàn tiền không tự đánh dấu hàng đã về trung tâm, không thu/hoàn thêm khi mở hồ sơ thu hồi bổ sung.
10. Kiểm kê phải đúng serial/số kiện/phụ kiện, có bằng chứng; hàng chưa nhận lại hoặc đang nghi vấn không được bán lại.
11. Hàng vẫn ở trung tâm bỏ qua vận chuyển hoàn; hàng thất lạc không có biên bản tiếp nhận giả và bị khóa bán.
12. Hàng nguyên vẹn được duyệt mở phiên mới; hàng lỗi trả seller, đăng ký lại/kiểm định lại; lịch sử sản phẩm, đơn, kiểm định cũ không bị sửa.
13. Đề nghị đã chấp nhận/phiên đã kết thúc trong lịch sử không khóa vĩnh viễn quyền xử lý hàng khi nghĩa vụ thực tế đã chấm dứt.
14. Lý do không khớp kiểm định chỉ dùng khi đơn có hồ sơ; quyền và lý do tranh chấp thống nhất giữa frontend và backend.
15. Cọc từng phiên tuân thủ ba chế độ Admin, số tiền hợp lệ và snapshot; request giả không vượt chính sách, đổi cấu hình không làm đổi phiên cũ.
16. Mua ngay kiểm tra trước BID/đạt sàn, giờ phiên, quyền, địa chỉ và thanh toán; cạnh tranh với BID/chốt phiên không bán hai lần, không bật lại trái phép.

### 24.11. Nguồn tham khảo

Đã đối chiếu hướng dẫn chính thức ngày 17/10/2026. Đây là tham khảo thiết kế; chính sách riêng của eBay không tự trở thành yêu cầu của VietBid.

- [eBay — Making Second Chance Offers](https://www.ebay.com/help/default/default/making-second-chance-offers?id=4142).
- [eBay — Responding to Second Chance Offers](https://www.ebay.com/help/buying/auctions-bidding/second-chance-offer?id=4017).
- [eBay — Selling with Buy It Now](https://www.ebay.com/help/selling/listings/selling-buy-now?id=4109).

### 24.12. Kết quả triển khai và cách kiểm thử lại — 17/10/2026

Đã nối backend và frontend cho các bước bên dưới. Giữ 21 bảng; thêm don_hang.xu_ly_hang (JSON ghi các mốc và lịch sử) và san_pham.san_pham_goc_id (liên kết cùng món hàng). Migration 005 và công cụ nang-cap-hang-hoan.cjs sao lưu có SHA-256, đối chiếu toàn bộ cột/dữ liệu cũ trước/sau. Đã áp dụng cho CSDL kiểm thử và doan4_daugia; không xóa dữ liệu nghiệp vụ hoặc sửa kết quả tiền của đơn cũ.

**Người mua:** trong chi tiết đơn đã thanh toán, trước/đang giao có nút “Yêu cầu hủy / không tiếp tục nhận hàng”. Gửi yêu cầu mở hồ sơ xét duyệt, tiền tiếp tục giữ. “Báo chưa nhận hàng” vẫn theo mốc khiếu nại riêng. Trong hồ sơ hàng hoàn, chỉ đúng bên đang giữ hàng được khai báo gửi hoàn; người mua được xác nhận nhận lại khi trung tâm gửi lại hàng cho mình.

**Admin:** mở chi tiết đơn hoặc tranh chấp → phần “Thu hồi, kiểm kê & bán lại” → “Bắt đầu xử lý hàng hoàn”. Nếu hàng chưa rời trung tâm, chuyển thẳng chờ kiểm kê; nếu đang ở ngoài, khai báo gửi hoàn → trung tâm xác nhận nhận lại (serial/số kiện/tình trạng) → ghi biên bản kiểm kê (serial/phụ kiện/kết quả). Hàng nhận lại từ ngoài trung tâm tạo lần kiểm định mới, không sửa báo cáo/ngày rời trung tâm của lần giao trước. Hàng không khớp nhận dạng chặn hoàn tiền cho đến khi xác minh; thất lạc có nhánh riêng cần ghi căn cứ, không có biên bản nhận giả.

**Hoàn toàn bộ:** sau kiểm kê hoặc kết luận thất lạc, Admin ra quyết định trong tranh chấp. Tiền hoàn gồm cọc đã chuyển và phí; không hoàn/thu lại lần hai. Các đơn cũ đã được hoàn tiền vẫn bắt đầu thu hồi từ chi tiết đơn để bổ sung lịch sử hàng, không mở lại quyết toán.

**Bán tiếp hàng nguyên vẹn:** kiểm kê đạt → giải quyết đơn/tranh chấp cũ → hoàn tất lần kiểm định mới nếu hàng đã rời trung tâm → Admin duyệt lại sản phẩm → “Duyệt cho đấu giá lại” → người bán tạo phiên mới từ chi tiết đơn hoặc danh sách sản phẩm. Lượt BID, cọc và kết quả cũ không chuyển sang phiên mới.

**Trả người bán:** hàng cần xử lý → hoàn tất quyết định đơn/tranh chấp → Admin “Gửi trả hàng cho người bán” và nhập vận đơn → seller “Tôi đã nhận lại hàng” → “Tạo hồ sơ đăng ký bán lại”. Tạo duy nhất bản nháp liên kết sản phẩm gốc, sao chép nội dung/ảnh để seller cập nhật; hồ sơ gốc được lưu trữ, không sửa nội dung đã giao dịch. Bản đăng ký lại phải gửi duyệt và kiểm định theo chính sách áp dụng.

**Khiếu nại không có căn cứ:** trước khi bàn giao hàng hoàn, Admin có thể “Dừng yêu cầu thu hồi” và giải ngân khi đã có xác nhận giao. Nếu đã nhận về trung tâm, cần đối chiếu/kiểm định đạt, duyệt lại và “Gửi lại người mua sau đối chiếu”; người mua hoặc Admin xác nhận đã giao lại rồi mới giải ngân theo quyết định tranh chấp. Người bán không tự xác nhận giao lại. Tiền không giải ngân khi hàng còn ở trung tâm hoặc đang trên đường gửi lại.

**Second Chance:** giữ nhánh đơn hủy do không thanh toán, seller chủ động gửi từng lần. API và giao diện giải thích khi không có ứng viên đạt sàn, có đề nghị đang chờ hoặc sản phẩm đã có phiên mới. Đã chặn gửi/chấp nhận đề nghị cũ khi cùng món hàng được đăng sang phiên khác; giao dịch dùng khóa sản phẩm gốc để bảo vệ cả hồ sơ đăng ký lại.

**Cọc từng phiên:** Admin → Cấu hình → bật chính sách cọc và “Cho người bán chọn bật/tắt cọc từng phiên” nếu muốn cho chọn. Seller → Tạo phiên → Chính sách tham gia → bật/tắt “Yêu cầu đặt cọc”; xem trước số tiền theo cấu hình. Nếu Admin bắt buộc/tắt cọc, công tắc tương ứng bị khóa và có giải thích. Backend kiểm tra lại, giữ snapshot phiên cũ. Mua ngay có công tắc riêng; tắt thì không gửi giá Mua ngay còn lưu trong form. Quy tắc tắt sau BID/đạt sàn được giữ, có giải thích trên chi tiết phiên.

**Kiểm tra:** bộ tích hợp 67/67 ca đạt trong CSDL riêng và rollback, gồm tám ca mới về thu hồi/kiểm kê/bán lại/chính sách cọc/gửi lại buyer. Bộ HTTP nền chạy 224 yêu cầu, 93/93 route thành công và 45 phản hồi lỗi đúng mã; bộ kiểm định/cọc vẫn bao phủ 16 route riêng. Định dạng, kiểu/build và kiểm thử frontend được kiểm tra cùng đợt. Không coi kết quả API là đã nghiệm thu mọi màn hình/trình duyệt hoặc tải lớn.

**Dọn tệp:** xóa tools/bo_sung_thiet_ke_csdl.py là công cụ soạn báo cáo dùng một lần, không được ứng dụng hoặc scripts gọi. Giữ báo cáo Word, ảnh, SQL chuẩn, migration, sao lưu, công cụ khôi phục, seed và kiểm thử đang có tác dụng. Không xóa các tài liệu/sản phẩm dữ liệu người dùng chỉ vì chúng không được import lúc chạy web.

### 24.13. Khép các nhánh ngoại lệ — phiên bản 3.2, 17/10/2026

#### Quyết toán cọc khi người thắng bỏ thanh toán

Chính sách do người dùng chốt: Admin chọn bồi hoàn toàn bộ cọc cho người bán hoặc hoàn toàn bộ cọc cho người mua khi có ngoại lệ được xác minh. Không chia cọc, không tự thu thêm, không tính khoản này thành đơn bán thành công. Hết hạn thanh toán chỉ hủy đơn, ghi vi phạm và giữ cọc chờ Admin; không tự chuyển cọc cho seller.

Làm rõ ngày 18/10/2026: bỏ thanh toán vì đổi ý, thiếu tiền hoặc quên hạn không phải ngoại lệ hoàn cọc. Nếu chọn hoàn cho buyer, API và giao diện bắt buộc loai_ngoai_le (LOI_HE_THONG/LOI_BEN_BAN/SAI_THONG_TIN_PHIEN) và tham_chieu_bang_chung đã đối chiếu; Admin chịu trách nhiệm kiểm tra hồ sơ thực tế, không chỉ nhập một ghi chú chung. Hệ thống ghi biên bản, không tự xác minh nội dung chứng cứ bên ngoài. Chưa thu đủ tiền thì xét cọc; đã thu đủ tiền thì xét toàn bộ escrow theo tranh chấp, không tự tách cọc để phạt riêng. Yêu cầu hủy vì đổi ý là yêu cầu xét duyệt, không phải quyền tự nhận lại tiền.

Tham chiếu để phân biệt mô hình, không sao chép thành quy tắc VietBid: [eBay xử lý không thanh toán và ngoại lệ có căn cứ](https://www.ebay.com/help/default/default/unpaid-item-policy?id=4271); [eBay phân biệt chưa nhận được với từ chối nhận](https://www.ebay.com/help/policies/ebay-money-back-guarantee-policy/ebay-money-back-guarantee-policy?id=4210); [Catawiki dùng khoản tạm giữ và xét giải phóng sau nghĩa vụ phí](https://www.catawiki.com/en/help/bidding-basics/what-is-a-bid-reservation). Khoản tạm giữ trên thẻ và cọc thu thực tế là các cơ chế khác nhau.

Admin mở **Quản lý đơn hàng → Chi tiết → Đối soát và xử lý ngoại lệ → Quyết toán cọc**. Phải nhập ít nhất 20 ký tự về căn cứ, kiểm tra đúng cọc gắn đơn, tiền đang giữ và số tiền đã thu chỉ là cọc. Quyết toán chỉ áp dụng đơn hủy do KHONG_THANH_TOAN, chưa có tranh chấp và chưa quyết toán. Seller bị hạn chế tài khoản chưa được nhận bồi hoàn. Hoàn tiền ngoại lệ cho buyer không bị ngăn chỉ vì seller bị hạn chế.

Sau quyết định, đơn vẫn DA_HUY; escrow hết số dư và được ghi DA_GIAI_NGAN hoặc DA_HOAN_TIEN theo bên nhận. Bản ghi cọc vẫn giữ liên kết chuyển vào đơn và dấu KHONG_HOAN_COC của thời điểm quá hạn; kết quả quyết toán cuối đọc từ đơn và biên bản, giao diện hiển thị “Đã bồi hoàn” hoặc “Đã hoàn cọc ngoại lệ”. Vi phạm được Admin xem xét riêng, không tự hủy chỉ vì hoàn lại cọc. Nhật ký lưu người xử lý, thời điểm, lý do, cọc và số tiền. Gửi lại cùng quyết định trả kết quả cũ; quyết định trái ngược bị từ chối, kể cả hai yêu cầu đến đồng thời. Điều kiện hàng/Second Chance được xét riêng, không bị khóa vì khoản cọc đang đối soát.

#### Giải tỏa cảnh báo của đơn gửi muộn hoặc đã khôi phục tài khoản

Admin mở chi tiết đơn → **Xác nhận đã kiểm tra và giải tỏa cảnh báo**. Chỉ cho phép khi đơn đã gửi/đang kiểm tra, đã thu đủ và đang giữ tiền, không có tranh chấp/thu hồi đang xử lý, cả buyer và seller đang hoạt động. Khi chưa đủ điều kiện, giao diện giải thích lý do khóa. Đơn chưa gửi phải thực hiện gửi hàng trước; đơn hủy xử lý cọc hoặc hàng hoàn; đơn tranh chấp xử lý theo hồ sơ tranh chấp.

Thao tác chỉ gỡ cờ, lưu biên bản và thông báo hai bên; không tự hoàn tất, giải ngân, xóa vi phạm hoặc kéo dài hạn kiểm tra. Buyer xác nhận hàng phù hợp hoặc job xử lý sau hạn nếu đủ điều kiện. Job không quét lặp các đơn gửi muộn đã chờ Admin. Quyết định tranh chấp giải ngân cho seller cũng kiểm tra lại tài khoản hiện tại, không dùng để vượt điều kiện tài khoản bị khóa.

#### Hàng chưa rời trung tâm nhưng đơn đã hủy

Nếu hàng vẫn ở trung tâm thì không dựng một chuyến hoàn giả và không tạo lần tiếp nhận/kiểm định mới. Sau kiểm kê và quyết định hủy/hoàn tiền, Admin gửi trả seller: cập nhật đúng hồ sơ lưu giữ ban đầu (hoặc hồ sơ mới nếu hàng đã thực sự quay về), ngày rời trung tâm, ngày trả và lý do. Báo cáo, kết quả, serial và thông tin chuyên gia của lần kiểm định cũ không bị sửa. Hồ sơ gắn đơn luôn chỉ đọc; việc bàn giao thực hiện qua đơn. Seller xác nhận nhận lại rồi tạo hồ sơ nháp liên kết gốc nếu muốn bán lại; không hồi sinh hồ sơ cũ đã lưu trữ.

#### Phí hoàn, thất lạc và bồi thường

Trong phần hàng hoàn, Admin có **Kết luận trách nhiệm và chi phí phát sinh**. Quy tắc xét theo bằng chứng:

- Người mua đổi ý khi hàng phù hợp: xem xét người mua chịu chi phí hoàn thực tế; không tự mất riêng cọc sau khi đã thanh toán đủ đơn.
- Hàng sai/lỗi: đối chiếu hồ sơ giao nhận để xác định trách nhiệm seller, trung tâm hoặc đơn vị vận chuyển, không mặc định quy mọi lỗi cho seller sau kiểm định.
- Thất lạc: xác minh bên chịu trách nhiệm theo vị trí bàn giao; hoàn đủ tiền đang giữ cho buyer theo quyết định tranh chấp, khóa bán món hàng thất lạc. Bồi thường cho bên thiệt hại được ghi riêng theo chứng cứ; không tự trả cả giá trị đơn cho seller từ tiền của buyer.

Biên bản ghi bên chịu phí, phí hoàn, bên trả/nhận bồi thường, số tiền và căn cứ ít nhất 30 ký tự. Số tiền bằng 0 phải chọn Không phát sinh; có tiền phải có bên chịu trách nhiệm, bồi thường không được trả cho chính mình. Không phát sinh được ghi 0 sau khi đã xác minh, không dùng 0 để giả vờ khoản chưa rõ đã giải quyết.

Các khoản phát sinh được thanh toán/đối soát thủ công ngoài khoản escrow của đơn; hiện chưa tích hợp cổng thu chi hoặc hãng vận chuyển thật. Admin chỉ dùng **Xác nhận đã đối soát chi phí và bồi thường** sau khi kiểm tra chứng từ, nhập mã chứng từ và kết quả. Ghi kết luận không có nghĩa đã thanh toán; giao diện tách trạng thái chưa/đã đối soát. Việc này không khấu trừ tiền hoàn, sửa tổng đơn hoặc ghi thêm giao dịch thanh toán vào escrow. Hoàn tiền buyer không phải chờ đối tác bồi thường; hồ sơ chi phí vẫn được xử lý sau khi tranh chấp kết thúc hoặc hàng đã mở phiên khác. Biên bản đã chốt không được ghi đè; thử lại không tạo trùng lịch sử.

#### Phạm vi rà soát và kiểm tra

Đối chiếu các nhóm API: tài khoản/địa chỉ/xác minh, danh mục/thuộc tính/sản phẩm/ảnh/duyệt, kiểm định/lưu giữ, tạo phiên/cọc/giá tối đa/gia hạn/Mua ngay/chốt phiên, đơn/thanh toán/giao nhận/giải ngân, tranh chấp/bằng chứng/hàng hoàn/đăng lại, Second Chance, đánh giá/thông báo/vi phạm/cấu hình/thống kê/tác vụ. Kiểm tra quyền đúng actor, chống sửa số tiền, giữ bí mật mức tối đa và xử lý lặp/đồng thời. Kiểm thử dùng doan4_daugia_kiem_thu; không nạp lại hoặc sửa dữ liệu nghiệp vụ chính.

**Kết quả kiểm tra ngày 18/10/2026:** backend cơ bản đạt 18/18, tích hợp MySQL đạt 75/75, frontend đạt 13/13; không có ca bỏ qua hoặc thất bại. Bộ HTTP nền đối chiếu 95/95 route với 250 yêu cầu, gồm 53 phản hồi lỗi đúng mã; bộ kiểm định/cọc đối chiếu thêm 16 route. Ca nhiều kết nối kiểm tra hai quyết định cọc trái ngược cùng lúc: chỉ một kết quả được ghi, không hoàn và bồi hoàn trùng. Các ca mới kiểm tra hoàn cọc thiếu chứng cứ/bỏ thanh toán do đổi ý bị từ chối, nhãn kết quả cuối ở phía buyer, giải tỏa không tự giải ngân, khóa tài khoản, cập nhật lưu giữ gốc và đối soát chi phí không đổi escrow.

**Kiểm tra trực tiếp bằng đúng tác nhân:** Admin quyết toán cọc bồi hoàn seller và hoàn ngoại lệ có căn cứ; phía buyer thấy kết quả tương ứng. Biểu mẫu hoàn ngoại lệ chặn thiếu loại lỗi/tham chiếu; màn hình xác nhận nêu đủ số tiền và căn cứ. Seller gửi Second Chance sau đơn quá hạn; bidder tiếp theo chấp nhận, trả đúng giá công khai và tạo đơn mới đã thanh toán. Với đơn gửi muộn, buyer nhận hàng nhưng chưa thể hoàn tất khi còn cờ; Admin kiểm tra/gỡ cờ vẫn giữ tiền; buyer hoàn tất sau đó mới giải ngân. Với hàng chưa rời trung tâm, Admin cập nhật bàn giao về seller, ghi trách nhiệm/phí và chứng từ; seller xác nhận nhận lại, tạo một hồ sơ nháp liên kết gốc rồi mở đúng trang chỉnh sửa. Đây là phạm vi thao tác thực sự đã thử, không phải nghiệm thu mọi màn hình, trình duyệt hoặc tổ hợp đầu vào.

Máy chủ giao diện thử dùng cổng riêng, tắt jobs và nối doan4_daugia_kiem_thu. Đã dừng máy chủ, dọn năm tài khoản và toàn bộ chuỗi dữ liệu tạm theo UUID; xóa công cụ dựng môi trường tạm. Các kiểm thử tích hợp rollback hoặc tự dọn dữ liệu riêng sau khi chạy. Đợt khép ngoại lệ không thay đổi cấu trúc hoặc dữ liệu nghiệp vụ trong doan4_daugia. Thanh toán và đối soát chi phí vẫn chưa kết nối dịch vụ chuyển tiền thật.

#### Thứ tự tự nghiệm thu các nhánh mới

1. **Người thắng quá hạn thanh toán:** kiểm tra đơn đã hủy, cọc chờ quyết toán; người mua/người bán không có quyền quyết toán. Admin mở chi tiết đơn để bồi hoàn seller hoặc hoàn ngoại lệ có loại lỗi, lý do và tham chiếu chứng cứ. Sau quyết định, tiền đang giữ bằng 0; tải lại vẫn một kết quả; đơn vẫn đã hủy.
2. **Second Chance:** trên phiên có đơn hủy do không thanh toán, seller chọn người trả giá hợp lệ tiếp theo; kiểm tra giá đề nghị là giá công khai. Người nhận chấp nhận và thanh toán đủ mới có đơn mới. Không dùng nhánh này cho đơn đã thanh toán rồi hủy do tranh chấp.
3. **Gửi muộn nhưng hàng phù hợp:** ghi nhận đã gửi và buyer đã nhận; khi còn cờ Admin, buyer chưa hoàn tất được. Admin xác minh rồi giải tỏa; kiểm tra tiền vẫn được giữ. Buyer xác nhận hàng phù hợp mới hoàn tất và giải ngân.
4. **Hủy và trả hàng:** đối chiếu hàng thực tế đang ở đâu, thu hồi nếu đã rời trung tâm, kiểm kê và giải quyết tranh chấp. Hàng có lỗi phải trả seller; seller xác nhận nhận lại rồi tạo hồ sơ mới liên kết gốc. Hàng đủ điều kiện bán tiếp phải hoàn tất các bước kiểm định/duyệt mà hệ thống yêu cầu trước tạo phiên; không bỏ qua điều kiện vì từng được kiểm định ở giao dịch cũ.
5. **Phí hoàn hoặc thất lạc:** Admin ghi bên chịu trách nhiệm, số tiền và căn cứ. Nếu có chi phí, xác nhận đối soát chỉ sau khi có chứng từ. Kiểm tra tổng đơn, tiền hoàn và giải ngân không tự thay đổi theo biên bản chi phí; hàng thất lạc không được mở bán lại.

Chạy ứng dụng thường ở localhost:5173 với backend cổng 5000. Cổng 5175 đã dùng cho máy chủ kiểm thử tạm và không phải địa chỉ mặc định. Khởi động backend bằng `npm --prefix backend run dev:local`, frontend bằng `npm --prefix frontend run dev` từ thư mục gốc, trên hai terminal riêng; không chạy lại SQL để thử các chức năng này.
