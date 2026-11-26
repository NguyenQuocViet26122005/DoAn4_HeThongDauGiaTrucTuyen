import { Alert, Form } from 'antd';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { tien } from '../utils/dinh-dang';

export default function ThamKhaoGia() {
  const id = Form.useWatch('san_pham_id', Form.useFormInstance());
  const query = useDuLieu<{
    so_mau: number;
    gia_tu: string;
    gia_den: string;
    pham_vi: string;
    luu_y: string;
  } | null>(`/listing-support/products/${id}/prices`, undefined, !!id);

  if (!query.isSuccess) {
    return null;
  }

  if (query.data === null) {
    return (
      <Alert
        type="info"
        title="Chưa đủ 5 món cùng danh mục đã bán trong 12 tháng để tham khảo giá."
      />
    );
  }

  return (
    <Alert
      type="info"
      title={`Giá thực bán tham khảo: ${tien(query.data.gia_tu)} – ${tien(query.data.gia_den)}`}
      description={
        <>
          <p>
            Dựa trên {query.data.so_mau} món đã bán. {query.data.pham_vi}
          </p>
          <p>{query.data.luu_y}</p>
        </>
      }
    />
  );
}
