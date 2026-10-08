import { useEffect, useState } from 'react';
import { Alert, App, Button, Descriptions, Form, Input, Modal } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { ChoDuLieu, TieuDe, TrangThai, TrangThaiPhien } from '../components/dung-chung';
import QuyenNguoiBan from '../components/quyen-nguoi-ban';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { loiDeDoc } from '../services/api';
import { guiYeuCauHuyPhien, lamMoiPhienNguoiBan } from '../services/phien-nguoi-ban';
import type { PhienNguoiBan, ThongKeCoc } from '../types/phien-nguoi-ban';
import { mocThoiGian, ngayGio, tien } from '../utils/dinh-dang';

const lyDoKetThuc: Record<string, string> = {
  CO_NGUOI_THANG: 'Đã xác định người thắng',
  MUA_NGAY: 'Đã bán qua Mua ngay',
  KHONG_CO_TRA_GIA: 'Không có lượt trả giá hợp lệ',
  KHONG_DAT_GIA_SAN: 'Chưa đạt giá sàn',
  HUY_THEO_YEU_CAU_NGUOI_BAN: 'Admin đã duyệt hủy theo yêu cầu người bán',
};

function SoLuongDatCoc({ id }: { id: string }) {
  const thongKe = useDuLieu<ThongKeCoc>(`/auctions/${id}/participants/summary`);

  return (
    <section className="tam-noi-dung">
      <h2>Đăng ký & đặt cọc</h2>
      <ChoDuLieu truyVan={thongKe}>
        {thongKe.data && (
          <Descriptions
            column={1}
            items={[
              {
                key: 'dk',
                label: 'Đã đăng ký',
                children: thongKe.data.da_dang_ky,
              },
              {
                key: 'coc',
                label: 'Đang có cọc hợp lệ',
                children: thongKe.data.da_coc,
              },
              {
                key: 'dkien',
                label: 'Đủ điều kiện từ hồ sơ cọc',
                children: thongKe.data.du_dieu_kien,
              },
            ]}
          />
        )}
      </ChoDuLieu>
      <p className="chu-mo">
        Các số lượng phản ánh trạng thái cọc hiện tại. Không cung cấp danh tính, mức tối đa hoặc
        giao dịch tài chính của người tham gia.
      </p>
    </section>
  );
}

function YeuCauHuy({ phien, hetGio }: { phien: PhienNguoiBan; hetGio: boolean }) {
  const { message } = App.useApp();
  const [mo, datMo] = useState(false);
  const [dangGui, datDangGui] = useState(false);
  const [loi, datLoi] = useState('');
  const yeuCau = phien.yeu_cau_huy_moi_nhat;
  const coTheHuy = phien.co_the_yeu_cau_huy && !hetGio;

  async function gui(duLieu: { ly_do: string }) {
    datDangGui(true);
    datLoi('');

    try {
      await guiYeuCauHuyPhien(phien.id, duLieu.ly_do);

      datMo(false);
      message.success('Đã gửi yêu cầu hủy, chờ Admin xét duyệt');
      await lamMoiPhienNguoiBan();
    } catch (loi) {
      datLoi(loiDeDoc(loi));
      void lamMoiPhienNguoiBan();
    } finally {
      datDangGui(false);
    }
  }

  return (
    <section className="tam-noi-dung">
      <h2>Yêu cầu hủy phiên</h2>
      <p className="chu-mo">
        Gửi yêu cầu không dừng phiên ngay. Phiên tiếp tục theo lịch cho đến khi Admin duyệt hủy hoặc
        có kết quả kết thúc.
      </p>
      {yeuCau && (
        <div className="yeu-cau-huy-phien">
          <TrangThai giaTri={yeuCau.trang_thai} />
          <p className="chu-mo">Gửi lúc {ngayGio(yeuCau.ngay_tao)}</p>
          <p className="van-ban-kiem-dinh">{yeuCau.ly_do}</p>
          {yeuCau.ghi_chu_duyet && (
            <Alert
              type={yeuCau.trang_thai === 'TU_CHOI' ? 'warning' : 'info'}
              title="Phản hồi của Admin"
              description={yeuCau.ghi_chu_duyet}
            />
          )}
          {yeuCau.ngay_duyet && (
            <p className="chu-mo">Xét duyệt lúc {ngayGio(yeuCau.ngay_duyet)}</p>
          )}
        </div>
      )}
      {!coTheHuy && (
        <Alert
          type="info"
          title={
            phien.ly_do_khong_the_huy ||
            (hetGio ? 'Phiên đã hết thời gian gửi yêu cầu hủy.' : 'Hiện chưa thể gửi yêu cầu hủy.')
          }
        />
      )}
      {coTheHuy && (
        <Button
          danger
          onClick={() => {
            datLoi('');
            datMo(true);
          }}
        >
          Gửi yêu cầu hủy
        </Button>
      )}
      <Modal
        title="Gửi yêu cầu hủy phiên"
        open={mo}
        footer={null}
        destroyOnHidden
        closable={!dangGui}
        mask={{ closable: !dangGui }}
        onCancel={() => !dangGui && datMo(false)}
      >
        <Form layout="vertical" disabled={dangGui} onFinish={gui}>
          <Form.Item
            name="ly_do"
            label="Lý do xin hủy"
            rules={[
              {
                required: true,
                whitespace: true,
                max: 1000,
                message: 'Vui lòng nhập lý do, tối đa 1.000 ký tự',
              },
            ]}
          >
            <Input.TextArea rows={5} maxLength={1000} showCount />
          </Form.Item>
          {loi && <Alert className="loi-bieu-mau" type="error" title={loi} showIcon />}
          <Button danger type="primary" htmlType="submit" loading={dangGui} disabled={!coTheHuy}>
            Gửi Admin xét duyệt
          </Button>
        </Form>
      </Modal>
    </section>
  );
}

function NoiDungPhien({ id }: { id: string }) {
  const truyVan = useDuLieu<PhienNguoiBan>(`/auctions/mine/${id}`, undefined, true, 10000);
  const phien = truyVan.data;
  const [hienTai, datHienTai] = useState(Date.now);

  useEffect(() => {
    const boDem = setInterval(() => datHienTai(Date.now()), 1000);

    return () => clearInterval(boDem);
  }, []);

  return (
    <>
      <Link className="link-vang quay-lai-kiem-dinh" to="/nguoi-ban/phien">
        ← Phiên đấu giá của tôi
      </Link>
      <ChoDuLieu truyVan={truyVan}>
        {phien && (
          <>
            <TieuDe
              nhanNho={`QUẢN LÝ PHIÊN #${phien.id}`}
              ten={phien.tieu_de}
              moTa="Giá và trạng thái được lấy từ phiên đang lưu trên hệ thống."
            >
              <TrangThaiPhien phien={phien} />
            </TieuDe>
            <div className="cac-nut-kiem-dinh">
              <Link className="nut-vang" to={`/phien/${id}`}>
                Xem trang công khai ↗
              </Link>
              <Button loading={truyVan.isFetching} onClick={() => void lamMoiPhienNguoiBan()}>
                Làm mới phiên
              </Button>
              <Link className="link-vang" to={`/nguoi-ban/san-pham/${phien.san_pham_id}`}>
                Hồ sơ sản phẩm ↗
              </Link>
            </div>
            {['DA_LEN_LICH', 'HOAT_DONG'].includes(phien.trang_thai) &&
              mocThoiGian(phien.thoi_gian_ket_thuc) <= hienTai && (
                <Alert
                  className="nhac-phien-ban"
                  type="info"
                  title="Đã hết giờ, đang chờ hệ thống chốt kết quả"
                  description="Chọn Làm mới phiên để xem kết quả khi hệ thống hoàn tất xử lý."
                />
              )}
            <div className="cot-ho-so-kiem-dinh">
              <div className="cac-buoc-san-pham">
                <section className="tam-noi-dung">
                  <span className="nhan-nho">GIÁ CÔNG KHAI HIỆN TẠI</span>
                  <p className="gia-phien-ban">{tien(phien.gia_hien_tai)}</p>
                  <Descriptions
                    column={1}
                    items={[
                      {
                        key: 'gkd',
                        label: 'Khởi điểm',
                        children: tien(phien.gia_khoi_diem),
                      },
                      {
                        key: 'mn',
                        label: 'Giá Mua ngay đã thiết lập',
                        children: phien.gia_mua_ngay
                          ? `${tien(phien.gia_mua_ngay)}${phien.cho_phep_mua_ngay ? '' : ' · Đã tắt'}`
                          : 'Không sử dụng',
                      },
                      {
                        key: 'l',
                        label: 'Lượt trả giá công khai',
                        children: phien.tong_luot_tra_gia,
                      },
                      {
                        key: 'phi',
                        label: 'Phí vận chuyển',
                        children: tien(phien.phi_van_chuyen),
                      },
                      {
                        key: 'coc',
                        label: 'Cọc tham gia mỗi người',
                        children: phien.yeu_cau_dat_coc
                          ? tien(phien.so_tien_dat_coc)
                          : 'Không yêu cầu cọc',
                      },
                    ]}
                  />
                </section>
                <section className="tam-noi-dung">
                  <h2>Lịch & kết quả</h2>
                  <Descriptions
                    column={1}
                    items={[
                      {
                        key: 'bd',
                        label: 'Bắt đầu',
                        children: ngayGio(phien.thoi_gian_bat_dau),
                      },
                      {
                        key: 'kt',
                        label: 'Kết thúc hiện tại',
                        children: ngayGio(phien.thoi_gian_ket_thuc),
                      },
                      {
                        key: 'gh',
                        label: 'Số lần gia hạn',
                        children: phien.so_lan_gia_han,
                      },
                      {
                        key: 'kq',
                        label: 'Kết quả',
                        children: phien.ly_do_ket_thuc
                          ? lyDoKetThuc[phien.ly_do_ket_thuc] || 'Phiên đã được xử lý kết thúc'
                          : 'Chưa chốt kết quả',
                      },
                    ]}
                  />
                </section>
              </div>
              <div className="cac-buoc-san-pham">
                <YeuCauHuy
                  phien={phien}
                  hetGio={mocThoiGian(phien.thoi_gian_ket_thuc) <= hienTai}
                />
                {!!phien.yeu_cau_dat_coc && <SoLuongDatCoc id={id} />}
                <Alert
                  type="info"
                  showIcon
                  title="Bảo mật mức giá tối đa"
                  description="Người bán không được xem mức tối đa của người tham gia và không được tự trả giá hoặc Mua ngay sản phẩm của mình."
                />
              </div>
            </div>
          </>
        )}
      </ChoDuLieu>
    </>
  );
}

export default function ChiTietPhienNguoiBan() {
  const { id = '' } = useParams();

  return (
    <QuyenNguoiBan>
      <NoiDungPhien key={id} id={id} />
    </QuyenNguoiBan>
  );
}
