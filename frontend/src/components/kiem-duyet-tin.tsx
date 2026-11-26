import { useEffect, useState } from 'react';
import { Alert, Button } from 'antd';
import { raSoatTin, type KiemDuyetTin } from '../services/ho-tro-dang-ban';
import { loiDeDoc } from '../services/api';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import '../styles/ho-tro-dang-ban.css';

export default function KiemDuyetNoiDung({ id, coBan }: { id: string; coBan?: KiemDuyetTin }) {
  const [ketQua, datKetQua] = useState<KiemDuyetTin>();
  const [dangTai, datDangTai] = useState(false);
  const [loi, datLoi] = useState('');
  const trangThai = useDuLieu<{ ai_san_sang: boolean }>('/listing-support/status');
  const duLieu = ketQua ?? coBan;
  const coCanhBao = !!(duLieu?.canh_bao.length || duLieu?.canh_bao_ai?.length);

  useEffect(() => {
    // Bản đã lưu mới cần xóa kết quả rà soát của bản trước đúng một lần.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    datKetQua(undefined);
  }, [coBan]);

  async function quet(dungAI: boolean) {
    datDangTai(true);
    datLoi('');
    try {
      datKetQua(await raSoatTin(id, dungAI));
    } catch (e) {
      datLoi(loiDeDoc(e));
    } finally {
      datDangTai(false);
    }
  }

  return (
    <div className="kiem-duyet-tin">
      <h3>Cảnh báo nội dung</h3>
      {duLieu && (
        <Alert
          type={coCanhBao ? 'warning' : 'info'}
          title={
            coCanhBao
              ? 'Cần đối chiếu trước khi gửi hoặc duyệt'
              : 'Chưa thấy dấu hiệu trong kiểm tra cơ bản'
          }
          description={
            <>
              <ul>
                {[...duLieu.canh_bao, ...(duLieu.canh_bao_ai ?? [])].map((c) => (
                  <li key={c.ma}>{c.noi_dung}</li>
                ))}
              </ul>
              {!!duLieu.anh_chua_doi_chieu && (
                <p>
                  Một số ảnh không đọc được hoặc không phải ảnh cục bộ nên chưa đối chiếu đầy đủ.
                </p>
              )}
              <p>Cảnh báo là tín hiệu tham khảo. Admin vẫn quyết định duyệt hoặc từ chối.</p>
            </>
          }
        />
      )}
      <div className="cac-nut-kiem-dinh">
        <Button loading={dangTai} onClick={() => void quet(false)}>
          Kiểm tra lại bản đã lưu
        </Button>
        {trangThai.data?.ai_san_sang && (
          <Button loading={dangTai} onClick={() => void quet(true)}>
            Nhờ AI rà soát thêm
          </Button>
        )}
      </div>
      {trangThai.data?.ai_san_sang && (
        <small>
          AI chỉ nhận nội dung tin và thuộc tính đã lọc; hãy bỏ thông tin liên hệ, địa chỉ trước.
        </small>
      )}
      {duLieu?.thong_bao && <Alert type="info" title={duLieu.thong_bao} />}
      {loi && <Alert type="error" title={loi} />}
    </div>
  );
}
