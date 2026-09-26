import { useState } from 'react';
import { Alert, App, Button, Form, Input, Select } from 'antd';
import { TepRiengTu } from './dung-chung';
import { taiTep, loiDeDoc } from '../services/api';
import { xuLyHoSo, lamMoiDuyetVaKiemDinh } from '../services/kiem-dinh';
import { loaiTepKiemDinh, type HoSoKiemDinh } from '../types/kiem-dinh';
import { nhan } from '../utils/dinh-dang';

export default function TepKiemDinh({
  hoSo,
  quanTri,
  dangBan,
  datDangBan,
}: {
  hoSo: HoSoKiemDinh;
  quanTri: boolean;
  dangBan: boolean;
  datDangBan: (giaTri: boolean) => void;
}) {
  const { message } = App.useApp();
  const [bieuMau] = Form.useForm();
  const [tep, datTep] = useState<File>();
  const [duongDan, datDuongDan] = useState('');
  const [loi, datLoi] = useState('');
  const [lanChon, datLanChon] = useState(0);

  async function ganTep(noiDung: { loai_tep: string; mo_ta?: string }) {
    if (!tep) {
      datLoi('Vui lòng chọn một tệp báo cáo hoặc ảnh từ máy.');

      return;
    }
    datDangBan(true);
    datLoi('');
    try {
      // Giữ đường dẫn khi gắn hồ sơ thất bại để thử lại cùng tệp đã tải.
      const url = duongDan || (await taiTep(tep, 'inspection'));

      datDuongDan(url);
      await xuLyHoSo(hoSo.id, 'files', { ...noiDung, duong_dan_tep: url });
      datTep(undefined);
      datDuongDan('');
      datLanChon((cu) => cu + 1);
      bieuMau.resetFields();
      message.success('Đã đính kèm tệp vào hồ sơ');
      await lamMoiDuyetVaKiemDinh();
    } catch (loi) {
      datLoi(loiDeDoc(loi));
    } finally {
      datDangBan(false);
    }
  }

  return (
    <section className="tam-noi-dung">
      <h2>Tệp hồ sơ</h2>
      <p className="chu-mo">
        Biên bản, báo cáo và chứng nhận chỉ hiển thị cho tài khoản có quyền xem hồ sơ.
      </p>
      <div className="tep-ho-so">
        {hoSo.tep_dinh_kem.map((muc) => (
          <article key={muc.id}>
            <div>
              <strong>{nhan(muc.loai_tep)}</strong>
              <p>{muc.mo_ta || 'Không có mô tả bổ sung'}</p>
            </div>
            <TepRiengTu url={muc.duong_dan_tep} ten={`Xem tệp #${muc.id}`} />
          </article>
        ))}
      </div>
      {!hoSo.tep_dinh_kem.length && <p className="chu-mo">Chưa có tệp đính kèm.</p>}
      {quanTri && hoSo.co_the_cap_nhat && hoSo.ngay_nhan_trung_tam && (
        <Form
          form={bieuMau}
          layout="vertical"
          disabled={dangBan}
          onFinish={ganTep}
          initialValues={{ loai_tep: 'BAO_CAO_KIEM_DINH' }}
        >
          <h3>Đính kèm tệp mới</h3>
          <Form.Item name="loai_tep" label="Loại hồ sơ" rules={[{ required: true }]}>
            <Select options={loaiTepKiemDinh.map((value) => ({ value, label: nhan(value) }))} />
          </Form.Item>
          <label className="chon-tep-kiem-dinh">
            Chọn ảnh hoặc PDF · tối đa 10 MiB
            <input
              key={lanChon}
              aria-label="Chọn tệp kiểm định"
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              disabled={dangBan}
              onChange={(suKien) => {
                const moi = suKien.target.files?.[0];

                datTep(undefined);
                datDuongDan('');
                datLoi('');
                if (!moi) {
                  return;
                }
                if (
                  moi.size > 10 * 1024 * 1024 ||
                  !['image/png', 'image/jpeg', 'image/webp', 'application/pdf'].includes(moi.type)
                ) {
                  datLoi('Chỉ nhận JPG, PNG, WebP hoặc PDF, tối đa 10 MiB.');
                  suKien.target.value = '';

                  return;
                }
                datTep(moi);
              }}
            />
          </label>
          <Form.Item name="mo_ta" label="Mô tả tệp">
            <Input.TextArea maxLength={500} rows={2} />
          </Form.Item>
          {loi && <Alert type="error" showIcon title={loi} />}
          <Button
            className="nut-luu-kiem-dinh"
            htmlType="submit"
            type="primary"
            loading={dangBan}
            disabled={!tep}
          >
            Tải và gắn vào hồ sơ
          </Button>
        </Form>
      )}
    </section>
  );
}
