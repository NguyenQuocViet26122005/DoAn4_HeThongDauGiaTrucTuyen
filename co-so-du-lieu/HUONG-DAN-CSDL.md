# Cơ sở dữ liệu đấu giá — 21 bảng

CSDL chính của ứng dụng là **`doan4_daugia`**. Ngày 25/09/2026 đã nâng cấp lên **21 bảng InnoDB, 53 khóa ngoại, 12 trigger và 2 view**, đồng bộ backend TypeScript/Express/Zod. Đối chiếu 322 cột với SQL chuẩn không thiếu cột hoặc có bảng dư.

Lần trước đã gộp 27 xuống 19 bảng; lần này bổ sung `kiem_dinh_san_pham` và `dat_coc_dau_gia` cho nghiệp vụ kiểm định/cọc. Không tách lại giữ tiền hoặc vận chuyển thành bảng riêng. Cấu hình cọc mới mặc định tắt: Admin cấu hình rồi bật cho các phiên tạo sau đó.

## Cách tổ chức

- `don_hang` giữ thông tin đơn, tiền đã thu/hoàn/giải ngân, cọc chuyển vào đơn và vận chuyển. `so_tien_con_phai_thanh_toan` được MySQL tính từ tổng tiền trừ tiền đã thu.
- `tham_gia_phien` gộp theo dõi và cam kết tối đa; chỉ bản ghi có cam kết mới tham gia đấu giá. API/Socket không xuất mức tối đa.
- `kiem_dinh_san_pham` ghi từng lần tiếp nhận/kiểm định/giữ hoặc trả hàng. Kết quả Admin nhập theo báo cáo chuyên gia bên ngoài; hàng đạt vẫn ở trung tâm tới khi giao buyer.
- `dat_coc_dau_gia` có một bản ghi cho mỗi người/phiên; hoàn cọc, chuyển đơn hoặc không hoàn khi quá hạn. Cọc đã chuyển là một phần tiền đơn, không tính hai lần.
- `tep_dinh_kem` giữ ảnh sản phẩm, bằng chứng tranh chấp và tệp kiểm định; ràng buộc loại/đối tượng, quyền đọc riêng theo hồ sơ.
- `danh_muc`/`san_pham` dùng JSON cho cấu hình/giá trị thuộc tính; backend kiểm tra đúng loại và trường bắt buộc.
- `cau_hinh_he_thong` lưu bước giá và chính sách cọc. `nhat_ky_hoat_dong` ghi sự kiện, gia hạn và khóa chống xử lý thanh toán lặp.
- `yeu_cau_xu_ly` gộp yêu cầu hủy; báo cáo sản phẩm được lưu trong `vi_pham` để dùng hàng đợi xử lý hiện có, không tạo thêm bảng. Backend kiểm tra người gửi, sản phẩm công khai và báo cáo trùng theo sản phẩm.

Giảm bảng không tự bảo đảm truy vấn nhanh hơn. Để sơ đồ dễ đọc, chia theo nghiệp vụ và thu gọn cột hiển thị; vẫn giữ khóa ngoại cần thiết.

## SQL và sơ đồ dùng hiện tại

- `../doan4_daugia_tieng_viet.sql`: khởi tạo **CSDL mới**, 21 bảng cùng cấu hình/danh mục công khai. Không có tài khoản/mật khẩu mẫu hoặc lệnh xóa database. Máy hiện tại đã nâng cấp, không chạy lại tệp này.
- `migrations/003-kiem-dinh-va-dat-coc.sql` và `004-bao-ve-kiem-dinh-va-coc.sql`: các bước 19 → 21 đã áp dụng qua công cụ sao lưu/đối chiếu, không chạy lặp thủ công.
- `nang-cap-21-chinh-thuc.json`: kết quả nâng cấp chính; `nang-cap-21-kiem-thu.json`: kết quả thử trước đó.
- `so-do-21-bang.drawio`: 9 trang có thể chỉnh sửa; `so-do-csdl.html`: bản xem tương tác; `so-do/`: SVG và Mermaid từng nhóm.
- `mo-hinh.json`: metadata cột/quan hệ, không chứa dữ liệu người dùng. `cong-cu/tao-so-do.cjs` và `mau-so-do.html` sinh sơ đồ.
- `lich-su/cau-truc-19-bang.sql`, `lich-su/cau-truc-27-bang.sql`: cấu trúc lịch sử để đối chiếu, không phải SQL vận hành hiện tại.

## Xem diagram trong MySQL Workbench

1. Refresh **Schemas**, chọn `doan4_daugia`, mở **Tables**: 21 bảng.
2. Chọn **Database → Reverse Engineer**, chọn kết nối và schema `doan4_daugia`.
3. Hoàn tất wizard, lưu model thành `.mwb`. Model cũ không tự cập nhật sau migration.
4. Dùng **Add Diagram** tạo các trang nhỏ rồi kéo bảng từ Catalog vào. Bảng tham chiếu xuất hiện trên nhiều trang không tạo thêm bảng vật lý.
5. Chia thành tài khoản, sản phẩm, đấu giá, giao dịch, hậu mãi, yêu cầu/vi phạm, hỗ trợ, kiểm định và cọc. Tham khảo 9 trang draw.io hoặc HTML; bật/tắt riêng đường liên kết tài khoản.

Không cần sửa CSDL để ẩn đường nối trong sơ đồ trình bày.

## Sao lưu, đối chiếu và phục hồi

Toàn bộ dữ liệu ở các cột cũ của 19 bảng sau nâng cấp khớp dấu vân tay trước đó, không chỉ khớp số dòng. Các ID, tiền, ngày, giá tối đa bí mật và trạng thái lịch sử được giữ. Sản phẩm/phiên cũ không tự bị áp kiểm định/cọc; đơn cũ giữ nguồn gửi từ seller. Dữ liệu `HANG_GIA` và hoàn một phần lịch sử vẫn đọc được, API mới không tạo thêm.

Bản sao riêng được loại khỏi Git, không gửi công khai:

- `ban-sao-rieng/doan4_daugia-truoc-21.json` và `.sha256`: dữ liệu/DDL/view/trigger của 19 bảng trước nâng cấp. Đã phục hồi vào CSDL riêng và đối chiếu đủ 19 bảng, kiểm tra 46 khóa ngoại không mồ côi; xem `kiem-tra-phuc-hoi-19.json`.
- `ban-sao-rieng/doan4_daugia_sao_luu_20260923070110.json` và `.sha256`: bản 27 bảng trước lần gộp cũ; đã phục hồi và đối chiếu, xem `kiem-tra-phuc-hoi.json`.

Khi cần kiểm chứng lại bản 19 bảng, build backend rồi chạy `node co-so-du-lieu/cong-cu/phuc-hoi-truoc-21.cjs` từ gốc. Công cụ chỉ tạo mới `doan4_daugia_phuc_hoi_19`, dừng nếu đã tồn tại và không ghi đè CSDL chính. Bản 27 bảng có công cụ riêng `phuc-hoi-ban-sao.cjs`.

MySQL DDL tự commit. Migration ghi tiến độ sau mỗi bước; không thể dùng `ROLLBACK` để hoàn tác DDL. Nếu bị gián đoạn giữa DDL và ghi tiến độ, cần đối chiếu trạng thái thực tế trước khi tiếp tục. Sau khi có giao dịch mới, không tự hạ schema hoặc ghi đè từ bản sao cũ.

## Kiểm thử

Chạy trong `backend`:

```powershell
npm run check:schema
npm run test:prepare
npm test
npm run test:api
npm run test:integration
```

`check:schema` chỉ đọc CSDL đang cấu hình. `test:prepare` tạo mới **`doan4_daugia_kiem_thu`** bằng SQL chuẩn và dữ liệu cấu hình/danh mục mẫu công khai; không sao chép tài khoản. Công cụ dừng nếu tên đã tồn tại. Các bài kiểm thử tự chọn CSDL này, tắt jobs và dùng JWT ngẫu nhiên trong tiến trình, không sửa `.env`.

Kết quả đã xác minh: 17 kiểm thử đơn vị/HTTP cơ bản, 54 kiểm thử tích hợp, 29 ca ràng buộc MySQL. Hai bộ HTTP đối chiếu 102 route; kiểm tra giá bí mật, quyền tệp, trạng thái kiểm định/cọc, tiền và cạnh tranh nhiều kết nối. Đây chưa phải kiểm thử tải hoặc nghiệm thu giao diện.

Kiểm tra ràng buộc trực tiếp: build backend rồi chạy `node co-so-du-lieu/cong-cu/kiem-tra-mysql.cjs --kiem-tra` từ gốc. Toàn bộ dữ liệu thử được rollback hoặc dọn đúng theo UUID; số tự tăng có thể có khoảng trống.

## Dọn CSDL phụ

Các CSDL thiết kế, kiểm thử và phục hồi được dọn sau khi xác minh; ứng dụng chỉ dùng `doan4_daugia`. Bản sao dạng tệp được giữ. `ket-qua-don-dep.json` ghi các tên đã xóa và kết quả đối chiếu CSDL chính trước/sau dọn.

Sau một lần kiểm thử mới, có thể chạy `node co-so-du-lieu/cong-cu/don-csdl-phu.cjs` để chỉ kiểm tra. Thêm `--xoa-csdl-phu` mới thực hiện dọn danh sách tên cố định. Công cụ kiểm tra bản sao, dữ liệu còn lại, kết nối đang dùng và tham chiếu từ CSDL khác trước khi xóa; không nhận tên tùy ý, không xóa CSDL chính.

Nếu dữ liệu chính đã có giao dịch mới so với bản sao trước migration, công cụ dọn chủ động dừng để kiểm tra/sao lưu lại, không xóa cưỡng bức. Trong Workbench, Refresh Schemas để bỏ các tên CSDL phụ đã xóa khỏi màn hình.

## Phạm vi tiếp theo

Giao diện báo cáo sản phẩm và đăng lại sau Cơ hội mua tiếp đã được nối với API hiện có; cần nghiệm thu đầy đủ trên trình duyệt. Thanh toán/vận chuyển hiện mô phỏng; chưa có ví, cổng tiền thật, chuyên gia đăng nhập hoặc quy trình trả hàng nhiều chặng. SQL khởi tạo không tự sửa dữ liệu danh mục/sản phẩm đang có trong MySQL chính.
