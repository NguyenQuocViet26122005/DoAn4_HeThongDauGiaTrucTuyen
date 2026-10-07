# Bộ dữ liệu thực hành VietBid

Cập nhật ngày 07/10/2026. Đây là dữ liệu được lưu trong MySQL và đọc qua API thật của dự án. Tài khoản và giao dịch là tình huống tổng hợp cho đồ án, không phải giao dịch thương mại đã xảy ra ngoài đời.

## Danh mục và sản phẩm

Chỉ hiển thị đúng 10 danh mục đã thống nhất:

- Đồ cổ & Cổ vật (ID 64).
- Nghệ thuật (ID 65).
- Đồng hồ cao cấp (ID 66).
- Trang sức & Đá quý (ID 67).
- Hàng hiệu hiếm / Phiên bản giới hạn (ID 68).
- Xe cổ & Phương tiện sưu tầm (ID 69).
- Sách, Bản thảo & Tài liệu quý hiếm (ID 70).
- Kỷ vật (ID 71).
- Nhạc cụ Vintage giá trị cao (ID 72).
- Máy ảnh cổ & Thiết bị quang học sưu tầm (ID 73).

Giữ 28 sản phẩm (ID 95–122), tên, mô tả, thương hiệu, thuộc tính và danh mục đã có. 12 danh mục cũ được giữ ở trạng thái không hoạt động để bảo toàn bản ghi; tổng số bản ghi danh mục là 22. Có 10 sản phẩm tham gia các câu chuyện đấu giá, phần còn lại ở bước bản nháp hoặc kiểm định.

## Tài khoản đăng nhập

Mật khẩu thực hành chung: **VietBid@2026**. MySQL lưu hash bcrypt, không lưu mật khẩu thuần. Chỉ dùng những tài khoản này trong môi trường đồ án.

- Quản trị VietBid: **admin@vietbid.test** — Admin (ID 1001).
- Nguyễn Minh Hoàng: **hoang@vietbid.test** — người bán đã xác minh (ID 1101).
- Lê Thu Hà: **ha@vietbid.test** — người bán đã xác minh (ID 1102).
- Trần Quốc Vinh: **vinh@vietbid.test** — người bán đã xác minh (ID 1103).
- Phạm Ngọc Mai: **mai@vietbid.test** — người bán đã xác minh (ID 1104).
- Vũ Quang Minh: **minh@vietbid.test** — người bán đã xác minh (ID 1105).
- Trần Đức Anh: **duc.anh@vietbid.test** — người mua (ID 1201).
- Nguyễn Bảo Ngọc: **bao.ngoc@vietbid.test** — người mua (ID 1202).
- Hoàng Gia Bảo: **gia.bao@vietbid.test** — người mua (ID 1203).
- Vũ Hải Nam: **hai.nam@vietbid.test** — người mua (ID 1204).
- Đỗ Nhật Minh: **nhat.minh@vietbid.test** — người mua (ID 1205).
- Lý Thanh Tâm: **thanh.tam@vietbid.test** — người mua (ID 1206).
- Bùi Ngọc Anh: **ngoc.anh@vietbid.test** — người mua (ID 1207).
- Cao Thu Hằng: **thu.hang@vietbid.test** — người mua (ID 1208).
- Vũ Quỳnh Anh: **quynh.anh@vietbid.test** — người mua (ID 1209).
- Phan Minh Tùng: **minh.tung@vietbid.test** — người mua (ID 1210).

## Chuỗi nghiệp vụ

1. **Phiên 2001, Rolex Submariner, sản phẩm 95:** Nguyễn Minh Hoàng bán; ba người trả giá; Đức Anh thắng. Cọc 18 triệu chuyển vào đơn 3001; thanh toán phần còn lại, trung tâm giao, người mua nhận, giải ngân và hai bên đánh giá.
2. **Phiên 2002, Omega, sản phẩm 96:** Hải Nam thắng nhưng không thanh toán, đơn 3002 bị hủy, cọc không hoàn và vi phạm 6001 được ghi nhận. Hoàng gửi đề nghị 5001 cho Bảo Ngọc theo giá công khai 72 triệu; Bảo Ngọc chấp nhận, thanh toán đơn 3003 và đang chờ trung tâm gửi hàng. Không lấy mức tối đa bí mật làm giá đề nghị.
3. **Phiên 2003, Limoges, sản phẩm 107:** Thu Hằng mua từ Thu Hà; đơn 3004 có tranh chấp 7001 và bằng chứng của hai bên. Admin giải quyết cho người bán, giải ngân toàn bộ; đơn hoàn tất và hai bên đánh giá.
4. **Phiên 2004, bình phong sơn mài, sản phẩm 105:** Gia Bảo mua từ Thu Hà; đơn 3005 đang tranh chấp 7002, Admin đang xử lý, tiền còn được giữ. Có thể dùng hồ sơ này để thực hành quyết định cuối.
5. **Phiên 2005, Mercedes, sản phẩm 116:** Nhật Minh chọn Mua ngay; đơn 3006 thanh toán đủ và đang giao. Người mua có thể tiếp tục xác nhận nhận hàng.
6. **Phiên 2006, Datejust, sản phẩm 97:** Thanh Tâm thắng; đơn 3007 đang chờ thanh toán, đã chuyển cọc 9,5 triệu vào đơn. Hạn được tính từ mốc kết thúc phiên.
7. **Phiên 2007, Patek, sản phẩm 99:** đang hoạt động, có cọc và hai người đã trả giá; Ngọc Anh đang dẫn đầu. Người mua khác có thể đặt cọc rồi tham gia.
8. **Phiên 2008, Leica, sản phẩm 112:** đang hoạt động; Quỳnh Anh và Minh Tùng cùng đặt tối đa 36 triệu; Quỳnh Anh đặt trước nên dẫn đầu. Có báo cáo sản phẩm để Admin xử lý.
9. **Phiên 2009, violin, sản phẩm 118:** sắp mở, có theo dõi và yêu cầu hủy chờ Admin xét duyệt.
10. **Phiên 2010, Fender, sản phẩm 119:** kết thúc không đạt giá sàn; không tạo đơn và hoàn cọc cho hai người tham gia.

Mốc thời gian được tính tương đối theo thời điểm bản sao nguồn. Các phiên và hạn xử lý tiếp tục trôi theo đồng hồ thật; khi bật bộ lập lịch, trạng thái sẽ thay đổi đúng nghiệp vụ.

## Quy mô

- 16 tài khoản: 1 Admin, 5 người bán, 10 người mua; 15 địa chỉ.
- 10 phiên, 27 lượt trả giá công khai được tính bằng bộ máy đấu giá của backend, 19 bản ghi tham gia/theo dõi.
- 12 khoản cọc, 7 đơn, 5 thanh toán, 1 đề nghị mua tiếp, 1 vi phạm.
- 12 hồ sơ kiểm định: 10 đạt, 1 đang kiểm định, 1 cần bổ sung.
- 2 tranh chấp, 4 đánh giá, 29 thông báo, 56 nhật ký và 2 yêu cầu xử lý.
- 34 ảnh sản phẩm, 26 hồ sơ PDF và 5 ảnh xác minh tổng hợp. Đã kiểm tra tồn tại/nội dung 65 đường dẫn tệp qua API.

## Ảnh và hồ sơ

Ảnh thật được lưu tại backend/uploads; MySQL lưu đường dẫn, người tải và quan hệ với sản phẩm/hồ sơ. Không lưu byte ảnh trong SQL. Nguồn ảnh cũ: demo-assets/nguon-anh.json; ảnh bổ sung và giấy phép: demo-assets/bo-moi.json. Đã thay ảnh chính sai mẫu của Rolex 95 bằng ảnh đúng tham chiếu 14060M, giữ nguyên tệp cũ trên đĩa.

Hiện 5 sản phẩm có từ 2 ảnh trở lên; các sản phẩm khác có một ảnh. Chưa đạt mục tiêu 10–12 sản phẩm đều có 2–3 ảnh đúng mẫu; không dùng ảnh khác sản phẩm hay ảnh lặp để đủ số lượng. Ảnh Wikimedia là ảnh tham khảo hiện vật. Các PDF và ảnh xác minh đều ghi rõ là hồ sơ thực hành, không phải chứng thư hay giấy tờ danh tính thật.

## Nạp dữ liệu an toàn

Script không tạo/xóa bảng và không thay đổi cấu trúc 21 bảng, view, trigger hoặc migration. Trước mỗi lần ghi có bản sao riêng được kiểm tra SHA-256. Dữ liệu được thay trong transaction, xác minh rồi mới commit; lỗi thì rollback. Không xóa uploads.

Chạy từ backend; nguồn phải là bản sao hiện tại đã xác minh trong co-so-du-lieu/ban-sao-rieng. Bản sao chứa dữ liệu riêng, không đưa lên Git.

```powershell
node scripts/du-lieu-demo-vietbid.js --target=doan4_daugia_rebuild --source=../co-so-du-lieu/ban-sao-rieng/doan4_daugia_truoc_bo_moi_20261007_cap_nhat.json --dry-run
node scripts/du-lieu-demo-vietbid.js --target=doan4_daugia_rebuild --source=../co-so-du-lieu/ban-sao-rieng/doan4_daugia_truoc_bo_moi_20261007_cap_nhat.json --apply
node scripts/du-lieu-demo-vietbid.js --target=doan4_daugia --source=../co-so-du-lieu/ban-sao-rieng/doan4_daugia_truoc_bo_moi_20261007_cap_nhat.json --apply
node scripts/du-lieu-demo-vietbid.js --target=doan4_daugia --verify
```

Lệnh áp dụng vào CSDL chính chỉ chạy khi nguồn vẫn khớp dữ liệu chính và chính phiên bản script/tài nguyên đó đã qua kiểm tra trên bản sao. Không dùng lệnh nạp lại sau khi đã thao tác thực hành mà chưa lưu và đối chiếu bản sao mới. Lệnh verify đối chiếu bộ dữ liệu ban đầu; sau khi người dùng tạo giao dịch mới, số lượng kỳ vọng có thể không còn khớp.

## Kết quả kiểm tra ngày 07/10/2026

- Kiểm tra dữ liệu trên bản sao: PASS, 23 nhóm kiểm tra không có lỗi về khóa ngoại, quyền, lịch sử giá, thời gian, cọc, thanh toán, đơn, tranh chấp và tệp.
- Đăng nhập 16 tài khoản và 203 yêu cầu HTTP trên bộ mới: PASS; gồm dữ liệu từng vai trò, chi tiết 10 phiên/7 đơn/2 tranh chấp, đề nghị mua tiếp và tải tệp. Các thao tác đăng nhập kiểm tra được rollback.
- Backend: build thành công, 18 kiểm thử nền và 57 kiểm thử tích hợp đạt. Bộ HTTP tích hợp bao phủ 107 API và 45 phản hồi lỗi quyền/trạng thái.
- Frontend: lint/build thành công, 13 kiểm thử đạt. Build còn cảnh báo một gói biểu tượng lớn hơn 500 kB.
- CSDL chính đã nạp và kiểm tra lại PASS. Trình duyệt đã hiển thị đúng 10 danh mục, các phiên đang hoạt động/sắp mở; đăng nhập Admin và trang tổng quan quản trị hoạt động. Chưa nghiệm thu trực quan toàn bộ luồng của cả ba vai trò.
- Truy cập website bằng http://localhost:5173 theo cấu hình nguồn được phép. Chế độ dev:local hiện tắt tác vụ tự động để giữ dữ liệu khi xem; chạy chế độ bình thường khi cần thực hành các mốc tự động.
