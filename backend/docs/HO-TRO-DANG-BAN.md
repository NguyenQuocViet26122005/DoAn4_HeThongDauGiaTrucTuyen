# Hỗ trợ đăng bán và kiểm duyệt

Ba chức năng nằm trong form sản phẩm, trang duyệt và form tạo phiên; không có chatbot chính sách.

## Kiểm duyệt tin (luôn hoạt động)

- `POST /api/listing-support/products/:id/review`, body `{ "dung_ai": false }`.
- Chỉ chủ sản phẩm hoặc Admin được xem. Cảnh báo liên hệ, email, URL, cam kết xác thực tuyệt đối và ảnh trùng/gần giống của người bán khác.
- Dấu vân tay SHA-256 và dHash tính tại upload; cache cạnh ảnh, không thêm bảng/cột. Ảnh cũ tính khi rà soát. Ảnh ngoài hệ thống/không đọc được được báo chưa đối chiếu, không suy diễn là đã kiểm tra sạch.
- dHash là tín hiệu tương đồng, có thể dương/âm giả. Ảnh cắt, xoay hoặc thay nhiều có thể không được phát hiện. Không tự từ chối hoặc kết luận gian lận.
- Người bán thấy cảnh báo khi gửi duyệt và có thể quay lại sửa hoặc vẫn gửi cho Admin xét. Admin có danh sách cảnh báo, tự quyết định.
- `dung_ai:true` gửi tiêu đề, mô tả, tên danh mục và thuộc tính, không gửi tài khoản, đơn, tiền, giá tối đa hay bằng chứng. Nội dung có dấu hiệu liên hệ/địa chỉ (kể cả chuỗi số viết thành chữ) bị chặn trước khi gọi AI. Bộ lọc là heuristic, nên không nhập thông tin cá nhân vào các trường công khai.
- AI chỉ trả ba mã: liên hệ viết lách, mâu thuẫn thuộc tính, sai danh mục; không tự duyệt. Kết quả AI chỉ dùng trong lần rà soát hiện tại, không lưu thành quyết định.
- Giao diện tính cả cảnh báo cơ bản lẫn cảnh báo AI khi hiển thị mức cảnh báo. Khi hồ sơ đã lưu được cập nhật, kết quả rà soát cũ được xóa để đối chiếu lại bản mới.

## Gợi ý hồ sơ từ ảnh (cần khóa API)

- `GET /api/listing-support/status` trả `{ai_san_sang:boolean}`; yêu cầu đăng nhập.
- `POST /api/listing-support/photos/prepare`: multipart trường `photos`, 3–5 ảnh JPEG/PNG/WebP, tối đa 5 MB/ảnh. Chỉ người bán đã xác minh.
- Máy chủ dùng Sharp xoay ảnh, giảm kích thước, loại EXIF/GPS; Tesseract chạy tại máy chủ với dữ liệu eng/vie cài qua npm, che mọi dòng chữ nhận được. Không gửi ảnh lên AI trong bước chuẩn bị.
- Trả `{ma,anh,thong_bao}` để người bán xem trước. Nếu chữ còn sót, người bán phải hủy/chọn ảnh đã cắt bỏ thông tin. OCR không đảm bảo nhận mọi chữ, đặc biệt chữ viết tay, rất nhỏ, mờ; không dùng ảnh người, giấy tờ hoặc cảnh có địa chỉ.
- Bản xem trước lưu tạm trong RAM tối đa 10 phút, thuộc riêng tài khoản, tối đa 10 bản; mỗi máy chủ xử lý OCR một yêu cầu một lúc. Không ghi ảnh gốc vào kho sản phẩm.
- `POST /api/listing-support/photos/suggest`: `{ma,ghi_chu,xac_nhan_anh_an_toan:true}`. Chỉ sau xác nhận mới gửi ảnh đã che và ghi chú đến OpenAI.
- AI gợi ý danh mục trong danh sách thật; tiêu đề, tình trạng, mô tả có thể null. Thuộc tính không thuộc danh mục/không đúng kiểu hoặc lựa chọn bị loại. Serial, nguồn gốc, năm mua/sản xuất, phụ kiện cần người bán tự xác nhận; không suy đoán qua ảnh.
- Ghi chú đầu vào vẫn dò cả liên hệ và địa chỉ. Kết quả gợi ý chỉ dò liên hệ (số điện thoại, số viết bằng chữ, email, liên kết) trong từng giá trị chuỗi; không dò địa chỉ. Mô tả gợi ý tối đa 1500 ký tự. Mọi thuộc tính kiểu `NGAY` đều bị bỏ; giá trị `DUNG_SAI` được kiểm tra rồi chuẩn hóa `"1"` thành `"true"`, `"0"` thành `"false"` trước khi điền form.
- Người bán chọn từng trường, bấm điền vào form rồi sửa/lưu. Chưa tự lưu, gửi duyệt hoặc tạo phiên. Ảnh thật vẫn thêm ở bước ảnh hiện có sau lưu bản nháp.

## Tham khảo giá (luôn hoạt động khi đủ mẫu)

- `GET /api/listing-support/products/:id/prices`: chỉ chủ sản phẩm đã xác minh. Trả null khi dưới 5 mẫu; giao diện hiện “Chưa đủ 5 món cùng danh mục đã bán trong 12 tháng để tham khảo giá.” Khi đang tải hoặc lỗi thì không hiện khối tham khảo.
- Dùng tối đa 200 món cùng danh mục đã hoàn tất và giải ngân đủ trong 12 tháng, mỗi món gốc một mẫu, bỏ chính món đang đăng; không gồm phí vận chuyển, đơn hủy, cọc, đơn chưa hoàn tất.
- Khoảng phân vị 25%–75% tính bằng BigInt từ `gia_san_pham`, hiển thị số mẫu và phạm vi. Đây là giá bán lịch sử cùng danh mục, không phải định giá cá thể hoặc khuyến nghị chính xác cho giá khởi điểm. Không tự điền giá.

## Bật AI

Trong môi trường máy chủ, cấu hình `AI_ENABLED=true`, `OPENAI_API_KEY` và `OPENAI_MODEL` là model hỗ trợ ảnh, Responses API và Structured Outputs. `.env.example` chỉ chứa tên biến và giá trị trống; không đưa khóa lên frontend/Git. Không cần khóa khi chạy kiểm tra cơ bản hoặc tham khảo giá.

Responses API dùng `store:false`, timeout 30 giây, giới hạn đầu ra 6000 token (bao gồm token suy luận đối với model suy luận), kiểm tra JSON Schema rồi kiểm tra nghiệp vụ. Không có công cụ giao dịch. Lỗi ghi `AI_FAILED` với tên tác vụ, nhóm lỗi và HTTP status nếu có; trạng thái chưa hoàn tất ghi `loai: incomplete` kèm `ly_do` nếu có, nội dung từ chối ghi `loai: refusal`. Không log nội dung, ảnh, địa chỉ, khóa hoặc phản hồi nguyên gốc. Giới hạn 12 yêu cầu/phút/tài khoản cho các API hỗ trợ. Giới hạn và RAM theo tiến trình; khi triển khai nhiều tiến trình cần kho dùng chung và giới hạn chi phí tại tài khoản API.

Cập nhật 25/11/2026: bộ lọc địa chỉ giữ dấu tiếng Việt và xét ngữ cảnh; không chặn chỉ vì có “tình trạng”, “quần áo”, “đường kính”, “xa xỉ”. Khi rà soát dữ liệu JSON, bộ lọc đọc từng giá trị thay vì dò tên trường hoặc nối các trường. Vẫn chặn liên hệ, chuỗi số viết thành chữ và dấu hiệu địa chỉ giao nhận. Serial toàn số giống số điện thoại vẫn có thể bị cảnh báo, cần người dùng/Admin kiểm tra.

Khuôn gửi provider bỏ `$schema`, `minLength/maxLength` ở các nút schema; giới hạn độ dài chuỗi được ghi vào `description` và vẫn được Zod gốc kiểm tra khi nhận kết quả. Giữ `minItems/maxItems`, cấu trúc, `required`, enum, null và `additionalProperties:false`.

Bộ lọc địa chỉ không phân biệt hoa thường. Đơn vị có dấu “phường, quận, huyện, thôn, ngõ, hẻm, xã, tỉnh, thành phố” theo sau bởi một từ được coi là địa chỉ, trừ “tỉnh táo”, “xã hội”. “Đường”/“duong” theo sau bởi một từ cũng được coi là địa chỉ, trừ các từ chỉ sản phẩm: kính, may, chỉ, sọc, khâu, viền, nét, vân, cong, thẳng, kẻ, gân, truyền, mòn, chéo, cắt, ray, ống, rãnh (so khớp cả không dấu). Các nhánh nhãn địa chỉ, giao nhận và đơn vị không dấu kèm số vẫn hoạt động. Chưa có xác nhận gọi thật với model/tài khoản API được triển khai; kiểm thử dùng phản hồi giả.

Tắt AI hoặc lỗi provider vẫn viết, lưu, gửi duyệt, xét duyệt và tạo phiên bình thường. Giao diện luôn hiện tình trạng không có AI, không giả kết quả thành công.

## Giới hạn đã biết

- Đối chiếu ảnh trùng đọc toàn bộ ảnh của người bán khác mỗi lần chủ sản phẩm hoặc Admin mở chi tiết. Phù hợp quy mô hiện tại; khi lên hàng nghìn ảnh cần lưu dấu vân tay vào CSDL qua migration để truy vấn hiệu quả hơn.
- OCR xử lý một yêu cầu một lúc; yêu cầu đồng thời nhận 429 và cần thử lại.
- Bản xem trước lưu trong RAM theo tiến trình, mất khi máy chủ khởi động lại và không dùng chung giữa các tiến trình.
