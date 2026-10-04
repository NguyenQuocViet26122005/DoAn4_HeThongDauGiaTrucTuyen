import { Alert, Button, Descriptions } from 'antd';
import { ChoDuLieu } from './dung-chung';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { ngayGio } from '../utils/dinh-dang';

interface TrangThaiTacVu {
  enabled: boolean;
  running: boolean;
  interval_ms: number;
  lastRun: { time: string; processed: number; failed: number } | null;
}

export default function TrangThaiTacVuTuDong() {
  const truyVan = useDuLieu<TrangThaiTacVu>('/admin/jobs', undefined, true, 30000);
  const tacVu = truyVan.data;

  return (
    <section className="tam-noi-dung">
      <h2>Tác vụ tự động</h2>
      <p>Mở và kết thúc phiên, xử lý đơn quá hạn, hết hạn đề nghị và hoàn tất đơn đủ điều kiện.</p>
      <Button onClick={() => void truyVan.refetch()} loading={truyVan.isFetching}>
        Làm mới tác vụ
      </Button>
      <ChoDuLieu truyVan={truyVan}>
        {tacVu && (
          <>
            {!tacVu.enabled && (
              <Alert
                showIcon
                type="warning"
                title="Tác vụ tự động đang tắt"
                description="Các phiên và giao dịch đến hạn chưa được xử lý tự động. Cần người vận hành bật tác vụ trên máy chủ để chạy đầy đủ quy trình."
              />
            )}
            {Boolean(tacVu.lastRun?.failed) && (
              <Alert
                showIcon
                type="warning"
                title="Lượt chạy gần nhất có lỗi"
                description="Người vận hành cần xem nhật ký máy chủ để xử lý các giao dịch chưa hoàn tất."
              />
            )}
            <Descriptions
              column={1}
              items={[
                {
                  key: 'bat',
                  label: 'Trạng thái',
                  children: !tacVu.enabled
                    ? 'Đang tắt'
                    : tacVu.running
                      ? 'Đang xử lý'
                      : 'Đang chờ lượt tiếp theo',
                },
                {
                  key: 'chu-ky',
                  label: 'Chu kỳ',
                  children: `${tacVu.interval_ms / 1000} giây`,
                },
                {
                  key: 'gan-nhat',
                  label: 'Lượt gần nhất',
                  children: tacVu.lastRun
                    ? ngayGio(tacVu.lastRun.time)
                    : 'Chưa có lượt chạy trong lần khởi động này',
                },
                ...(tacVu.lastRun
                  ? [
                      {
                        key: 'xu-ly',
                        label: 'Số mục xử lý trong lượt',
                        children: tacVu.lastRun.processed,
                      },
                      {
                        key: 'loi',
                        label: 'Số lỗi trong lượt',
                        children: tacVu.lastRun.failed,
                      },
                    ]
                  : []),
              ]}
            />
          </>
        )}
      </ChoDuLieu>
    </section>
  );
}
