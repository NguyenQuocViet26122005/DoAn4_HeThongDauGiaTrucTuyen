import { useState } from 'react';
import { Alert, Descriptions, Steps } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { ChoDuLieu, TieuDe, TrangThai } from '../components/dung-chung';
import ThaoTacKiemDinh from '../components/thao-tac-kiem-dinh';
import TepKiemDinh from '../components/tep-kiem-dinh';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import type { HoSoKiemDinh } from '../types/kiem-dinh';
import { ngayGio, nhan } from '../utils/dinh-dang';

function NoiDungHoSo({ hoSo, quanTri }: { hoSo: HoSoKiemDinh; quanTri: boolean }) {
  const [dangBan, datDangBan] = useState(false);
  const goc = quanTri ? '/quan-tri' : '/nguoi-ban';
  const buoc =
    ['DAT', 'KHONG_DAT', 'CAN_BO_SUNG'].includes(hoSo.ket_qua || '')
      ? 3
      : hoSo.trang_thai === 'DANG_KIEM_DINH'
        ? 2
        : hoSo.ngay_nhan_trung_tam
          ? 1
          : 0;

  return (
    <>
      <TieuDe
        nhanNho={`KIỂM ĐỊNH LẦN ${hoSo.lan_kiem_dinh}`}
        ten={hoSo.tieu_de}
        moTa={hoSo.ma_kiem_dinh}
      >
        <TrangThai giaTri={hoSo.trang_thai} />
      </TieuDe>
      <section className="tam-noi-dung lo-trinh-kiem-dinh">
        <Steps
          size="small"
          current={buoc}
          items={[
            { title: 'Gửi đến trung tâm' },
            { title: 'Tiếp nhận' },
            { title: 'Kiểm định' },
            { title: 'Kết quả & lưu giữ' },
          ]}
        />
        <p>
          <Link className="link-vang" to={`${goc}/san-pham/${hoSo.san_pham_id}`}>
            Xem sản phẩm #{hoSo.san_pham_id} ↗
          </Link>
        </p>
        {hoSo.ngay_roi_trung_tam && (
          <Alert type="info" title={`Hàng đã rời trung tâm: ${ngayGio(hoSo.ngay_roi_trung_tam)}`} />
        )}
        {hoSo.trang_thai === 'DANG_LUU_GIU' && !hoSo.ngay_roi_trung_tam && (
          <Alert
            type="success"
            showIcon
            title="Kiểm định đạt, hàng đang được trung tâm giữ"
            description="Cần duyệt nội dung sản phẩm trước khi tạo phiên đấu giá."
          />
        )}
      </section>
      <div className="cot-ho-so-kiem-dinh">
        <div className="cac-buoc-san-pham">
          <section className="tam-noi-dung">
            <h2>Vận chuyển & tiếp nhận</h2>
            <Descriptions
              column={1}
              items={[
                {
                  key: 'gui',
                  label: 'Ngày gửi',
                  children: ngayGio(hoSo.ngay_gui_trung_tam),
                },
                {
                  key: 'dv',
                  label: 'Đơn vị vận chuyển',
                  children: hoSo.don_vi_gui_trung_tam || 'Chưa khai báo',
                },
                {
                  key: 'vd',
                  label: 'Mã vận đơn',
                  children: hoSo.ma_van_don_den_trung_tam || 'Chưa khai báo',
                },
                {
                  key: 'nhan',
                  label: 'Trung tâm nhận',
                  children: ngayGio(hoSo.ngay_nhan_trung_tam),
                },
                {
                  key: 'tt',
                  label: 'Tình trạng khi nhận',
                  children: hoSo.tinh_trang_khi_nhan || 'Chưa ghi nhận',
                },
                {
                  key: 'serial',
                  label: 'Serial / mã nhận dạng',
                  children: hoSo.serial_khi_nhan || 'Chưa ghi nhận',
                },
                {
                  key: 'kien',
                  label: 'Số kiện',
                  children: hoSo.so_kien ?? 'Chưa ghi nhận',
                },
                {
                  key: 'gc',
                  label: 'Ghi chú',
                  children: hoSo.ghi_chu_tiep_nhan || '—',
                },
              ]}
            />
          </section>
          <section className="tam-noi-dung">
            <h2>Kết quả chuyên môn</h2>
            <Descriptions
              column={1}
              items={[
                {
                  key: 'kq',
                  label: 'Kết quả',
                  children: nhan(hoSo.ket_qua || 'CHUA_CO_KET_QUA'),
                },
                {
                  key: 'ngay',
                  label: 'Ngày kiểm định',
                  children: ngayGio(hoSo.ngay_kiem_dinh),
                },
                {
                  key: 'cg',
                  label: 'Chuyên gia',
                  children: hoSo.ten_chuyen_gia || 'Chưa ghi nhận',
                },
                {
                  key: 'dv',
                  label: 'Đơn vị',
                  children: hoSo.don_vi_kiem_dinh || 'Chưa ghi nhận',
                },
                {
                  key: 'cn',
                  label: 'Mã chứng nhận',
                  children: hoSo.ma_chung_nhan || 'Chưa cung cấp',
                },
              ]}
            />
            <p className="van-ban-kiem-dinh">
              {hoSo.nhan_xet || 'Chưa có nhận xét của chuyên gia.'}
            </p>
            {hoSo.ngay_tra_nguoi_ban && (
              <Alert
                type="warning"
                title={`Đã trả người bán: ${ngayGio(hoSo.ngay_tra_nguoi_ban)}`}
                description={hoSo.ly_do_tra}
              />
            )}
          </section>
        </div>
        <div className="cac-buoc-san-pham">
          <ThaoTacKiemDinh
            hoSo={hoSo}
            quanTri={quanTri}
            dangBan={dangBan}
            datDangBan={datDangBan}
          />
          <TepKiemDinh hoSo={hoSo} quanTri={quanTri} dangBan={dangBan} datDangBan={datDangBan} />
        </div>
      </div>
    </>
  );
}

export default function ChiTietKiemDinh({ quanTri = false }: { quanTri?: boolean }) {
  const { id = '' } = useParams();
  const hoSo = useDuLieu<HoSoKiemDinh>(`/inspections/${id}`);

  return (
    <>
      <Link
        className="link-vang quay-lai-kiem-dinh"
        to={`${quanTri ? '/quan-tri' : '/nguoi-ban'}/kiem-dinh`}
      >
        ← Danh sách kiểm định
      </Link>
      {!hoSo.data ? (
        <ChoDuLieu truyVan={hoSo}>{null}</ChoDuLieu>
      ) : (
        <>
          {hoSo.isError && (
            <Alert
              type="warning"
              title="Chưa làm mới được hồ sơ"
              description="Dữ liệu đang hiển thị là lần tải gần nhất. Hãy thử tải lại trước khi xử lý."
            />
          )}
          <NoiDungHoSo key={id} hoSo={hoSo.data} quanTri={quanTri} />
        </>
      )}
    </>
  );
}
