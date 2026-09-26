import { Collapse } from 'antd';
import { Link } from 'react-router-dom';
import { BieuTuong } from '../components/bieu-tuong';
import { TieuDe } from '../components/dung-chung';

const cauHoi = [
  [
    'Giá tối đa có được công khai không?',
    'Không. Hệ thống dùng mức tối đa để tự động trả giá theo bước giá được cấu hình. Lịch sử chỉ hiện giá trả công khai. Nếu hai mức tối đa bằng nhau, người đặt trước được ưu tiên. Người bán không được tự đấu giá.',
  ],
  [
    'Khi nào tôi cần đặt cọc?',
    'Chỉ các phiên công bố yêu cầu cọc mới cần đặt cọc trước khi trả giá. Chính sách do Admin cấu hình và chỉ áp dụng cho phiên mới. Cọc của người thắng được chuyển vào đơn, người không thắng được hoàn cọc. Không thanh toán phần còn lại đúng hạn có thể bị mất cọc và được Admin xem xét vi phạm.',
  ],
  [
    'Phiên có tự gia hạn không?',
    'Có. Một lượt trả giá hợp lệ trong 60 giây cuối sẽ gia hạn phiên thêm 90 giây. Hãy theo dõi thời điểm kết thúc được cập nhật trên phiên.',
  ],
  [
    'Mua ngay và cơ hội mua tiếp khác nhau thế nào?',
    'Mua ngay yêu cầu thanh toán toàn bộ ngay khi mua, được trừ khoản cọc hợp lệ đã đặt nếu có. Cơ hội mua tiếp (Second Chance) do người bán gửi khi người thắng không thanh toán; giá lấy từ lượt trả công khai hợp lệ, không lấy mức tối đa bí mật. Chấp nhận đề nghị cũng cần thanh toán toàn bộ, không yêu cầu cọc mới. Thanh toán thất bại chưa tạo đơn.',
  ],
  [
    'Nhận hàng có đồng nghĩa với hoàn tất giao dịch?',
    'Không. Sau khi nhận hàng, bạn có thời gian kiểm tra. Tiền vẫn được giữ trung gian cho đến khi đủ điều kiện hoàn tất. Khi có tranh chấp hoặc cờ xử lý của Admin, tiền chưa được giải ngân. Tranh chấp được giải quyết bằng hoàn toàn bộ cho người mua, gồm cọc và phí vận chuyển, hoặc giải ngân toàn bộ cho người bán.',
  ],
];

export default function HuongDan() {
  return (
    <div className="khung trang-noi-dung">
      <div className="duong-dan">
        <Link to="/">Trang chủ</Link> / Cách tham gia
      </div>
      <TieuDe
        nhanNho="TỰ TIN TRONG TỪNG LỰA CHỌN"
        ten="Hành trình sở hữu, thật rõ ràng."
        moTa="Từ lần khám phá đầu tiên đến khi món đồ về tay bạn."
      />
      <div className="luoi-huong-dan">
        {[
          [
            '01',
            'nguoi',
            'Tạo tài khoản',
            'Đăng ký, đăng nhập và thêm địa chỉ nhận hàng trước khi tham gia.',
          ],
          [
            '02',
            'khien',
            'Tìm hiểu sản phẩm',
            'Xem mô tả, tình trạng, kết quả kiểm định nếu có và chính sách cọc của phiên.',
          ],
          [
            '03',
            'bua',
            'Đặt giá của bạn',
            'Đặt cọc nếu phiên yêu cầu, sau đó chọn mức tối đa bí mật. Hệ thống trả giá tự động.',
          ],
          [
            '04',
            'hop',
            'Thanh toán & nhận hàng',
            'Thanh toán đúng hạn, theo dõi vận chuyển, kiểm tra hàng và xác nhận hoàn tất.',
          ],
        ].map(([so, icon, ten, moTa]) => (
          <article className="the-huong-dan" key={so}>
            <div>
              <BieuTuong ten={icon} size={30} />
              <span>{so}</span>
            </div>
            <h2>{ten}</h2>
            <p>{moTa}</p>
          </article>
        ))}
      </div>
      <section id="nguoi-ban" className="huong-dan-ban">
        <div>
          <span className="nhan-nho">DÀNH CHO NGƯỜI BÁN</span>
          <h2>
            Trao một món đồ.
            <br />
            Mở một hành trình mới.
          </h2>
          <Link className="nut-vang" to="/tai-khoan/xac-minh">
            Bắt đầu xác minh <BieuTuong ten="muiTen" size={18} />
          </Link>
        </div>
        <ol>
          <li>
            <strong>Xác minh tài khoản người bán</strong>
            <p>Admin kiểm tra hồ sơ trước khi bạn được phép bán.</p>
          </li>
          <li>
            <strong>Gửi sản phẩm và kiểm định khi được yêu cầu</strong>
            <p>
              Sản phẩm thuộc diện kiểm định phải đạt và đang được trung tâm giữ. Admin duyệt sản
              phẩm trước khi mở phiên.
            </p>
          </li>
          <li>
            <strong>Tạo phiên và theo dõi kết quả</strong>
            <p>
              Công bố giá khởi điểm, Mua ngay nếu có, thời gian và phí vận chuyển. Giá sàn được hệ
              thống kiểm tra khi kết thúc.
            </p>
          </li>
          <li>
            <strong>Hoàn tất giao dịch</strong>
            <p>
              Admin gửi hàng đang được trung tâm giữ. Với đơn do người bán giữ hàng, người bán thực
              hiện gửi hàng.
            </p>
          </li>
        </ol>
      </section>
      <section className="khu-vuc cau-hoi">
        <span className="nhan-nho">TRƯỚC KHI BẠN BẮT ĐẦU</span>
        <h2>Những điều cần biết</h2>
        <Collapse
          items={cauHoi.map(([label, noiDung], i) => ({
            key: String(i),
            label,
            children: <p>{noiDung}</p>,
          }))}
        />
      </section>
    </div>
  );
}
