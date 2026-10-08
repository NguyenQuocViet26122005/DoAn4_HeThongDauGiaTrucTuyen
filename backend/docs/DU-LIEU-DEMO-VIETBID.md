# Bộ dữ liệu thực hành VietBid

Cập nhật ngày 08/10/2026. Đây là dữ liệu được lưu trong MySQL và đọc qua API thật của dự án. Tài khoản và giao dịch là tình huống tổng hợp cho đồ án, không phải giao dịch thương mại đã xảy ra ngoài đời.

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

Giữ 50 sản phẩm ID 95–144, thuộc 20 người bán đã xác minh và 10 danh mục. Có 56 ảnh, mỗi sản phẩm có đúng một ảnh chính. Đã sửa thông tin và ảnh sai đối tượng trong bộ mở rộng; tất cả thuộc tính dùng đúng cấu hình của danh mục. Mười hai danh mục cũ không hoạt động được giữ để bảo toàn lịch sử. Có 18 phiên, 57 lượt trả giá, 30 cọc, 13 đơn, 9 thanh toán, 3 tranh chấp và 8 đánh giá; các sản phẩm còn lại phục vụ các bước vận hành trước đấu giá.

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

Bộ mở rộng có thêm 35 tài khoản, dùng cùng mật khẩu thực hành ở trên:

- Người bán đã xác minh: **nguoi.ban.06@vietbid.test** đến **nguoi.ban.20@vietbid.test** (ID 1106–1120).
- Người mua: **nguoi.mua.11@vietbid.test** đến **nguoi.mua.30@vietbid.test** (ID 1211–1230).

Mỗi tài khoản mới có hồ sơ, số điện thoại và một địa chỉ mặc định. Mười lăm tài khoản người bán mới có hồ sơ xác minh đã duyệt; sản phẩm của họ được phân bố theo các danh mục giá trị cao thay vì tạo ngẫu nhiên không có quan hệ.

`nguoi.mua.19@vietbid.test` và `nguoi.mua.30@vietbid.test` có yêu cầu xác minh người bán đang chờ; `nguoi.mua.23@vietbid.test` có hồ sơ bán bị từ chối để bổ sung thông tin. Các tài khoản này vẫn được mua theo quyền người dùng.

## Các câu chuyện bổ sung đã lưu ngày 08/10/2026

11. **Sản phẩm 129, phiên 2068, đơn 3050:** người bán 1112; ba người mua 1211–1213 đặt cọc và trả giá; 1211 thắng, cọc chuyển vào đơn, thanh toán phần còn lại, trung tâm giao, buyer nhận và xác nhận hoàn thành. Giải ngân toàn bộ và đánh giá hai chiều.
12. **Sản phẩm 130, phiên 2069:** người thắng 1214 không thanh toán đơn 3051 đúng hạn; đơn hủy, cọc không hoàn, vi phạm được ghi nhận. Đề nghị 5009 gửi cho 1215 bằng giá công khai của người này; chấp nhận, thanh toán, tạo đơn 3052, giao nhận và hoàn thành, đánh giá hai chiều.
13. **Sản phẩm 131, phiên 2070, đơn 3053:** 1217 thắng và thanh toán; sau giao nhận phát hiện thiếu phụ kiện. Tranh chấp 7010 có bằng chứng của buyer/seller, seller phản hồi và Admin đối chiếu rồi hoàn toàn bộ tiền sản phẩm lẫn vận chuyển. Không tạo đánh giá cho đơn đã hủy.
14. **Sản phẩm 133, phiên 2071:** ba người mua 1220–1222 trả giá. 1221 và 1222 có cùng mức tối đa; 1221 đặt trước nên dẫn đầu. Mức tối đa chỉ lưu riêng theo người tham gia, không đưa vào nhật ký hoặc dữ liệu công khai.
15. **Sản phẩm 136, phiên 2072:** đã duyệt và trung tâm đang giữ; phiên bắt đầu ngày 10/10, ba tài khoản theo dõi, chưa có lượt trả giá trước giờ mở.
16. **Sản phẩm 137, phiên 2073, đơn 3054:** 1224 Mua ngay và thanh toán đủ, trung tâm giao; buyer đã nhận và còn trong thời hạn kiểm tra hàng.
17. **Sản phẩm 143, phiên 2074, đơn 3055:** 1226 thắng; cọc được chuyển vào đơn, phần còn lại đang chờ thanh toán trong hạn.
18. **Sản phẩm 144, phiên 2075:** 1227–1229 đặt cọc và trả giá; 1230 theo dõi. Phiên còn hoạt động.

Hồ sơ thực hành và các mốc thời gian được tạo qua service backend trong một transaction. Thời gian lịch sử chỉ được đặt cho kết nối dựng dữ liệu và được trả về đồng hồ thực trước commit; không đổi thời gian của máy chủ. Trạng thái đang diễn ra có thể đổi khi tác vụ tự động chạy theo đồng hồ thực.

## Kiểm tra bộ 50 sản phẩm

Chạy trong thư mục backend:

```powershell
node scripts/hoan-thien-du-lieu-vietbid.js --verify
```

Ngày 08/10/2026: 31 nhóm đối soát đạt sau commit, 160 đường dẫn tệp đã kiểm tra. Có bản sao riêng trước khi cập nhật; bảng, view, trigger và khóa ngoại giữ nguyên. `--dry-run` thực thi rồi rollback, `--apply` sao lưu và áp dụng khi chưa có dấu mốc; chạy lại không tạo trùng câu chuyện. Dữ liệu dùng ảnh tư liệu có nguồn và hồ sơ thực hành, không phải chứng thư kiểm định hoặc giấy tờ của người thật. Thông số đo đạc trong hồ sơ tổng hợp không phải kết quả đo hiện vật từ nguồn ảnh.

Metadata ảnh đã sửa nằm trong `demo-assets/du-lieu-chuan-vietbid.json`. Tệp `du-lieu-mo-rong-bao-cao.json` là nguồn lịch sử của lần mở rộng đầu; không dùng ảnh sai đã ghi trong đó để nạp lại bộ đã chuẩn hóa.

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

- 51 tài khoản: 1 Admin và 50 người mua/người bán; 20 người bán đã xác minh, 30 tài khoản mua chưa được cấp quyền bán, 50 địa chỉ mặc định.
- 50 sản phẩm, 50 ảnh chính và 6 ảnh bổ sung; 18 sản phẩm có phiên liên kết. Các sản phẩm còn lại có hồ sơ ở những bước vận hành trước đấu giá.
- 18 phiên, 57 lượt trả giá công khai và 43 bản ghi tham gia/theo dõi.
- 30 khoản cọc, 13 đơn, 9 thanh toán, 2 đề nghị mua tiếp, 2 vi phạm.
- 32 hồ sơ kiểm định: 21 đạt, 2 đang kiểm định, 2 cần bổ sung, 2 đã tiếp nhận, 1 đang vận chuyển, 3 chờ gửi, 1 không đạt/đã trả.
- 3 tranh chấp, 8 đánh giá, 167 thông báo, 342 nhật ký và 2 yêu cầu xử lý tại thời điểm chốt dữ liệu.
- 56 ảnh sản phẩm, 58 hồ sơ PDF đã gắn quan hệ và 46 đường dẫn ảnh hồ sơ xác minh. Tổng cộng 160 đường dẫn tệp được đối soát.

## Ảnh và hồ sơ

Ảnh thật được lưu tại backend/uploads; MySQL lưu đường dẫn, người tải và quan hệ với sản phẩm/hồ sơ. Không lưu byte ảnh trong SQL. Nguồn ảnh ban đầu: demo-assets/nguon-anh.json và demo-assets/bo-moi.json. Bộ mở rộng đã đối chiếu lại đối tượng, tiêu đề, tác giả, giấy phép và SHA-256 trong demo-assets/du-lieu-chuan-vietbid.json; tệp du-lieu-mo-rong-bao-cao.json chỉ ghi nguồn lịch sử của lần mở rộng đầu. MySQL đã cập nhật ảnh chính và nguồn tương ứng. Các tệp cũ cần để phục hồi bản sao được giữ trên đĩa.

Hiện 5 sản phẩm có từ 2 ảnh trở lên; các sản phẩm khác có một ảnh. Không dùng ảnh lặp chỉ để đủ số lượng. Ảnh Wikimedia là ảnh tham khảo hiện vật và được kiểm tra định dạng, dung lượng trước khi lưu. Các PDF và ảnh xác minh đều ghi rõ là hồ sơ thực hành, không phải chứng thư hay giấy tờ danh tính thật.

Script `scripts/bo-sung-du-lieu-bao-cao.js` là bước mở rộng ban đầu từ 28 lên 50 sản phẩm. Bước chuẩn hóa và nối luồng là `scripts/hoan-thien-du-lieu-vietbid.js`, có dấu mốc chống chạy trùng, sao lưu trước khi ghi và 31 nhóm đối soát trước commit. Dùng `--verify` của script hoàn thiện để kiểm tra bộ hiện tại.

## Nạp dữ liệu an toàn

Các lệnh tái tạo dưới đây dành cho bộ gốc 28 sản phẩm từ bản sao nguồn, không phải lệnh nạp lại bộ 50 sản phẩm đã hoàn thiện. Bộ hiện tại được kiểm tra bằng `hoan-thien-du-lieu-vietbid.js --verify`; bản sao trước khi hoàn thiện được giữ riêng và có checksum.

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
