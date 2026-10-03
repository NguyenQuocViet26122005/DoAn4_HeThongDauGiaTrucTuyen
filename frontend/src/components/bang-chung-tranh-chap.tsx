import { useRef, useState } from 'react';
import { Alert, App, Button, Form, Input } from 'antd';
import { TepRiengTu } from './dung-chung';
import { loiDeDoc, taiTep } from '../services/api';
import { lamMoiTranhChap, xuLyTranhChap } from '../services/tranh-chap';
import { tranhChapDangMo } from '../utils/giao-hang-tranh-chap';
import { ngayGio } from '../utils/dinh-dang';
import type { ChiTietTranhChap } from '../types/tranh-chap';

export default function BangChungTranhChap({ hoSo }: { hoSo: ChiTietTranhChap }) {
  const [bieuMau] = Form.useForm();
  const [tep, datTep] = useState<File>();
  const [duongDan, datDuongDan] = useState('');
  const [lanChon, datLanChon] = useState(0);
  const [dangGui, datDangGui] = useState(false);
  const [loi, datLoi] = useState('');
  const dangXuLy = useRef(false);
  const { message } = App.useApp();
  const duocThem = tranhChapDangMo(hoSo.trang_thai) && hoSo.bang_chung.length < 30;

  async function them(noiDung: { mo_ta?: string }) {
    if (!tep || dangXuLy.current || !duocThem) {
      return;
    }

    dangXuLy.current = true;
    datDangGui(true);
    datLoi('');

    try {
      const url = duongDan || (await taiTep(tep, 'evidence'));

      datDuongDan(url);
      await xuLyTranhChap(hoSo.id, 'evidence', { ...noiDung, duong_dan_tep: url });
      datTep(undefined);
      datDuongDan('');
      datLanChon((cu) => cu + 1);
      bieuMau.resetFields();
      message.success('Đã bổ sung bằng chứng');
    } catch (loiGui) {
      datLoi(loiDeDoc(loiGui));
    } finally {
      await lamMoiTranhChap();
      dangXuLy.current = false;
      datDangGui(false);
    }
  }

  return (
    <section className="tam-noi-dung">
      <h2>Bằng chứng ({hoSo.bang_chung.length}/30)</h2>
      <p className="chu-mo">Chỉ các bên của đơn và Admin được xem tệp hồ sơ.</p>
      <div className="tep-ho-so">
        {hoSo.bang_chung.map((muc) => (
          <article key={muc.id}>
            <div>
              <strong>Bằng chứng #{muc.id}</strong>
              <p className="van-ban-dai">{muc.mo_ta || 'Không có mô tả bổ sung'}</p>
              <small>
                Tài khoản #{muc.nguoi_tai_len_id} · {ngayGio(muc.ngay_tao)}
              </small>
            </div>
            <TepRiengTu url={muc.duong_dan_tep} ten={`Xem bằng chứng #${muc.id}`} />
          </article>
        ))}
      </div>
      {!hoSo.bang_chung.length && <p>Chưa có bằng chứng đính kèm.</p>}
      {duocThem && (
        <Form form={bieuMau} layout="vertical" disabled={dangGui} onFinish={them}>
          <label className="chon-tep-kiem-dinh">
            Chọn ảnh hoặc PDF · tối đa 10 MiB
            <input
              key={lanChon}
              type="file"
              aria-label="Chọn bằng chứng"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              disabled={dangGui}
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
          <Form.Item name="mo_ta" label="Mô tả bằng chứng">
            <Input.TextArea rows={3} maxLength={500} />
          </Form.Item>
          {loi && <Alert type="error" title={loi} />}
          <Button
            className="nut-luu-kiem-dinh"
            type="primary"
            htmlType="submit"
            loading={dangGui}
            disabled={!tep}
          >
            Bổ sung bằng chứng
          </Button>
        </Form>
      )}
    </section>
  );
}
