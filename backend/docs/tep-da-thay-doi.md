# Cấu trúc và thay đổi mã nguồn

Backend hiện dùng TypeScript + Express + Zod, MySQL 21 bảng. Tên tệp/hàm nghiệp vụ tiếng Việt được giữ; các thư mục kiến trúc vẫn theo cấu trúc đã có.

- `src/may-chu.ts`: khởi động HTTP, Socket.IO và tác vụ nền.
- `src/ung-dung.ts`: middleware, route và phản hồi lỗi.
- `src/config`: cấu hình runtime và pool MySQL; không đưa bí mật vào mã nguồn.
- `src/routes` → `controllers` → `services` → `repositories`: định tuyến, nhận/trả HTTP, nghiệp vụ và truy vấn SQL.
- `src/validations`: schema Zod và các hàm kiểm tra/chuẩn hóa đầu vào.
- `src/types`: kiểu dùng chung và phần mở rộng Express.
- `src/jobs`, `sockets`, `utils`: tác vụ định kỳ, sự kiện và tiện ích.
- `tests`: kiểm thử đơn vị, HTTP, nghiệp vụ và nhiều kết nối MySQL.
- `scripts`: kiểm tra schema, chạy kiểm thử tích hợp, định dạng và kiểm tra các khối code.
- `dist`: kết quả `npm run build`; không sửa trực tiếp và không lưu vào Git.

Các tệp `.js` cũ trong `src` đã chuyển sang `.ts`; công cụ kiểm tra cú pháp JavaScript cũ được bỏ vì lệnh `check` dùng TypeScript. `package.json` và lockfile chứa các công cụ tương ứng. Kiểm thử và công cụ CSDL dùng mã đã biên dịch nên phải build trước khi chạy riêng.

Quy tắc định dạng nằm ở gốc dự án: `.prettierrc.cjs`, `.editorconfig`, `.cursor/rules/code-de-doc.mdc`. Lệnh `format` và `format:check` dùng chung cho backend, frontend, kiểm thử và công cụ CSDL. Cấu hình không định dạng thư viện, tệp build, bản sao dữ liệu hoặc lịch sử SQL.

Các truy vấn đã đồng bộ 21 bảng, gồm giữ tiền/vận chuyển trong đơn, theo dõi/cam kết trong bảng tham gia, tệp đính kèm chung, thuộc tính JSON, kiểm định và cọc. Xem `../../co-so-du-lieu/HUONG-DAN-CSDL.md` về mapping, bản sao và sơ đồ.

Nhóm mới nằm ở `services/kiem-dinh.ts`, `services/dat-coc.ts`, `services/yeu-cau-thanh-toan.ts`, repository tương ứng, schema kiểm định và route/controller `kiem-dinh-dat-coc.ts`. Luồng Mua ngay/Second Chance, thanh toán phần thiếu, vận chuyển trung tâm và tranh chấp đã cập nhật cùng kiểm thử HTTP/MySQL.

SQL chính dùng 21 bảng; migration 003/004 giữ dữ liệu cũ. Bản sao 19 và 27 bảng được giữ riêng. Sơ đồ hiện tại có 9 trang, sinh từ metadata và mẫu HTML/CSS/JavaScript đã định dạng dễ đọc; bản draw.io 19 bảng cũ được bỏ để tránh nhầm.

Phía frontend, hook `useDuLieu` đặt trong `hooks/su-dung-du-lieu.ts`, hàm chọn biểu tượng danh mục đặt trong `utils/bieu-tuong.ts`; component vẫn giữ tên cũ. Việc sắp xếp code không đồng nghĩa giao diện đã hoàn thiện.
