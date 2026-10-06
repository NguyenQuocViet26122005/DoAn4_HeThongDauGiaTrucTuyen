# Bộ dữ liệu demo VietBid

Bộ dữ liệu này dựng các hồ sơ có liên kết xuyên suốt trên CSDL `doan4_daugia`. Script chỉ thêm bản ghi qua service hiện có và các cập nhật thời gian phục vụ dữ liệu lịch sử; không xóa dữ liệu cũ, không tạo bảng và không thay đổi cấu trúc CSDL.

## Cách nạp

Chạy tại thư mục `backend`:

```powershell
npm run du-lieu:demo
```

Lệnh mặc định chỉ kiểm tra và in kế hoạch. Sau khi xem kế hoạch, dùng lệnh sau để ghi dữ liệu:

```powershell
npm run du-lieu:demo -- --apply
```

Script kiểm tra tên CSDL, đủ 21 bảng, ảnh cục bộ và xung đột email trước khi ghi. Toàn bộ thao tác CSDL nằm trong một transaction. Nếu quy trình lỗi, transaction được rollback và các tệp vừa chép vào `backend/uploads` được dọn. Dấu hoàn tất `SEED_VIETBID_DEMO_V1` khiến lần chạy sau không tạo trùng.

Sau khi nạp hoặc bất cứ lúc nào muốn kiểm tra lại trạng thái các câu chuyện và ảnh, chạy:

```powershell
npm run du-lieu:demo:verify
```

## Quy mô

- 6 người bán đã xác minh; 14 tài khoản người mua.
- 28 sản phẩm thuộc 10 danh mục giá trị cao, mỗi sản phẩm có một ảnh chính và hồ sơ kiểm định.
- 18 phiên: 5 phiên kết thúc theo các câu chuyện giao dịch, 9 phiên đang diễn ra, 3 phiên sắp mở và 1 phiên không đạt giá sàn.
- 5 câu chuyện đấu giá và 6 đơn hàng liên kết: các đơn hoàn tất, đơn không thanh toán, Second Chance, hoàn tiền tranh chấp và giải ngân sau tranh chấp.

## Các câu chuyện giao dịch

1. **Rolex Submariner:** Nguyễn Minh Hoàng đã xác minh và gửi sản phẩm qua quy trình kiểm định; năm tài khoản tham gia (bốn tài khoản đặt cọc), bốn bidder đặt giá; Trần Đức Anh thắng. Cọc chuyển vào đơn, buyer thanh toán phần còn lại, Admin cập nhật vận chuyển, buyer xác nhận nhận hàng, tiền được giải ngân và buyer đánh giá 5 sao.
2. **Omega Speedmaster:** người thắng không thanh toán đúng hạn; đơn bị hủy, cọc không hoàn và vi phạm được ghi nhận. Khoản cọc vẫn được giữ trong đơn chờ Admin xử lý. Người bán gửi Second Chance cho bidder kế tiếp. Giá đề nghị được kiểm tra bằng lượt trả giá công khai hợp lệ, không lấy mức giá tối đa bí mật; bidder chấp nhận, thanh toán, nhận hàng và hoàn tất đơn.
3. **Bộ bình sứ Limoges:** buyer thanh toán, nhận hàng rồi mở tranh chấp về kiện dễ vỡ. Hồ sơ có tệp ảnh tham khảo được gắn nhãn rõ; Admin xử lý hoàn lại toàn bộ số tiền.
4. **Bình phong sơn mài:** buyer mở tranh chấp, seller phản hồi, Admin tiếp nhận và giải quyết theo hướng phù hợp với người bán; toàn bộ tiền đang giữ được giải ngân.
5. **Mercedes-Benz 280 SL:** buyer chọn Mua ngay, thanh toán, nhận xe, xác nhận hoàn tất và đánh giá seller.
6. **Các phiên còn lại:** có người đấu giá và trạng thái đa dạng như đang hoạt động, sắp mở hoặc kết thúc dưới giá sàn.

## Tài khoản demo

Mật khẩu chung: `VietBidDemo2026!`

| Vai trò   | Tên                | Email                                 |
| --------- | ------------------ | ------------------------------------- |
| Người bán | Nguyễn Minh Hoàng  | `seller.hoang@demo.vietbid.test`      |
| Người bán | Lê Thu Hà          | `seller.ha@demo.vietbid.test`         |
| Người bán | Trần Quốc Vinh     | `seller.vinh@demo.vietbid.test`       |
| Người bán | Phạm Ngọc Mai      | `seller.mai@demo.vietbid.test`        |
| Người bán | Vũ Quang Minh      | `seller.minh@demo.vietbid.test`       |
| Người bán | Đặng Thu Trang     | `seller.trang@demo.vietbid.test`      |
| Người mua | Trần Đức Anh       | `buyer.duc.anh@demo.vietbid.test`     |
| Người mua | Nguyễn Bảo Ngọc    | `buyer.bao.ngoc@demo.vietbid.test`    |
| Người mua | Hoàng Gia Bảo      | `buyer.gia.bao@demo.vietbid.test`     |
| Người mua | Phạm Minh Châu     | `buyer.minh.chau@demo.vietbid.test`   |
| Người mua | Vũ Hải Nam         | `buyer.hai.nam@demo.vietbid.test`     |
| Người mua | Lê Tuấn Kiệt       | `buyer.tuan.kiet@demo.vietbid.test`   |
| Người mua | Nguyễn Phương Thảo | `buyer.phuong.thao@demo.vietbid.test` |
| Người mua | Đỗ Nhật Minh       | `buyer.nhat.minh@demo.vietbid.test`   |
| Người mua | Lý Thanh Tâm       | `buyer.thanh.tam@demo.vietbid.test`   |
| Người mua | Bùi Ngọc Anh       | `buyer.ngoc.anh@demo.vietbid.test`    |
| Người mua | Đặng Quốc Huy      | `buyer.quoc.huy@demo.vietbid.test`    |
| Người mua | Cao Thu Hằng       | `buyer.thu.hang@demo.vietbid.test`    |
| Người mua | Vũ Quỳnh Anh       | `buyer.quynh.anh@demo.vietbid.test`   |
| Người mua | Phan Minh Tùng     | `buyer.minh.tung@demo.vietbid.test`   |

## Tính xác thực và giới hạn

Tên, hồ sơ, giá, lượt đấu, giao dịch, đánh giá và quyết định xử lý đều là dữ liệu học tập được tạo để trình diễn luồng nghiệp vụ, không đại diện cho người hay giao dịch thật. Mô tả của từng lô demo đều ghi rõ ảnh Wikimedia Commons chỉ để tham khảo, không phải ảnh chụp lô hàng đang rao. Ảnh kiện hàng đính kèm tranh chấp cũng chỉ là ảnh minh họa, không phải bằng chứng giao nhận thật. Báo cáo kiểm định là tệp mẫu và không phải chứng nhận thực tế. Thanh toán dùng cơ chế mô phỏng hiện có của dự án.

Nguồn, tác giả và giấy phép của từng ảnh được ghi trong [`demo-assets/nguon-anh.json`](../demo-assets/nguon-anh.json). Hướng dẫn ghi công dễ đọc nằm tại [`NGUON-ANH-DEMO.md`](NGUON-ANH-DEMO.md).
