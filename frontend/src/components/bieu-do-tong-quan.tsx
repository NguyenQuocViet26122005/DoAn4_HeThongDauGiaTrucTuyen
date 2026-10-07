import { useState } from 'react';
import { Link } from 'react-router-dom';
import { nhan } from '../utils/dinh-dang';

export interface DongBieuDo {
  trang_thai?: string;
  trang_thai_duyet?: string;
  so_luong?: number | string;
}

const mauTrangThai: Record<string, string> = {
  HOAT_DONG: '#d5b778',
  DA_LEN_LICH: '#8da9c4',
  DA_KET_THUC: '#7bb39b',
  HOAN_THANH: '#7bb39b',
  DA_DUYET: '#7bb39b',
  DA_HUY: '#c78680',
  THAT_BAI: '#c78680',
  TU_CHOI: '#c78680',
  DANG_TRANH_CHAP: '#c69ad2',
  CHO_THANH_TOAN: '#d5b778',
  CHO_XU_LY: '#d5b778',
  BAN_NHAP: '#92998c',
};

export function BieuDoTrangThai({
  ten,
  moTa,
  duLieu,
  duongDan,
  dangVong = false,
}: {
  ten: string;
  moTa: string;
  duLieu: DongBieuDo[];
  duongDan: string;
  dangVong?: boolean;
}) {
  const [dangChon, datDangChon] = useState<string | null>(null);
  const cacMuc = duLieu
    .map((dong) => {
      const khoa = dong.trang_thai || dong.trang_thai_duyet || 'KHAC';
      const giaTri = Number(dong.so_luong);

      return {
        khoa,
        ten: nhan(khoa),
        soLuong: Number.isFinite(giaTri) && giaTri > 0 ? giaTri : 0,
        mau: mauTrangThai[khoa] || '#a5b4c4',
      };
    })
    .sort((a, b) => b.soLuong - a.soLuong || a.khoa.localeCompare(b.khoa));
  const tong = cacMuc.reduce((giaTri, muc) => giaTri + muc.soLuong, 0);
  const lonNhat = Math.max(1, ...cacMuc.map((muc) => muc.soLuong));
  const mucChon = cacMuc.find((muc) => muc.khoa === dangChon);

  return (
    <section className="bieu-do-the">
      <div className="bieu-do-tieu-de">
        <div>
          <h2>{ten}</h2>
          <p>{moTa}</p>
        </div>
        <Link to={duongDan} aria-label={`Xem chi tiết ${ten.toLowerCase()}`}>
          Chi tiết ↗
        </Link>
      </div>
      {tong === 0 ? (
        <div className="bieu-do-rong">Chưa có dữ liệu để hiển thị biểu đồ.</div>
      ) : (
        <div className={dangVong ? 'bieu-do-vong-bo-cuc' : undefined}>
          {dangVong && (
            <div className="bieu-do-vong">
              <svg viewBox="0 0 200 200" aria-hidden="true">
                <circle
                  cx="100"
                  cy="100"
                  r="78"
                  fill="none"
                  stroke="var(--vien)"
                  strokeWidth="22"
                />
                {cacMuc.map((muc, viTri) => {
                  const truoc = cacMuc
                    .slice(0, viTri)
                    .reduce((giaTri, dong) => giaTri + dong.soLuong, 0);

                  return (
                    <circle
                      key={muc.khoa}
                      cx="100"
                      cy="100"
                      r="78"
                      fill="none"
                      stroke={muc.mau}
                      strokeWidth="22"
                      pathLength="100"
                      strokeDasharray={`${(muc.soLuong / tong) * 100} ${100 - (muc.soLuong / tong) * 100}`}
                      strokeDashoffset={(-truoc / tong) * 100}
                      transform="rotate(-90 100 100)"
                      opacity={mucChon && mucChon.khoa !== muc.khoa ? 0.25 : 1}
                    />
                  );
                })}
              </svg>
              <div className="bieu-do-vong-so" aria-live="polite">
                <strong>{(mucChon?.soLuong ?? tong).toLocaleString('vi-VN')}</strong>
                <span>{mucChon?.ten ?? 'Tổng số phiên'}</span>
              </div>
            </div>
          )}
          <ul className="bieu-do-chu-giai" aria-label={`${ten}: số lượng theo trạng thái`}>
            {cacMuc.map((muc) => (
              <li key={muc.khoa}>
                {dangVong ? (
                  <button
                    type="button"
                    className="bieu-do-chon"
                    aria-pressed={dangChon === muc.khoa}
                    onClick={() => datDangChon(dangChon === muc.khoa ? null : muc.khoa)}
                  >
                    <span className="bieu-do-cham" style={{ background: muc.mau }} />
                    <span>{muc.ten}</span>
                    <strong>{muc.soLuong}</strong>
                    <small>
                      {((muc.soLuong / tong) * 100).toLocaleString('vi-VN', {
                        maximumFractionDigits: 1,
                      })}
                      %
                    </small>
                  </button>
                ) : (
                  <>
                    <div className="bieu-do-nhan-cot">
                      <span>{muc.ten}</span>
                      <strong>{muc.soLuong.toLocaleString('vi-VN')}</strong>
                    </div>
                    <div className="bieu-do-duong-cot" aria-hidden="true">
                      <div
                        style={{ width: `${(muc.soLuong / lonNhat) * 100}%`, background: muc.mau }}
                      />
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="bieu-do-chu-thich">
        {dangVong
          ? 'Chọn một trạng thái để xem tỷ trọng.'
          : `Đơn vị: số lượng · Tổng cộng ${tong.toLocaleString('vi-VN')}`}
      </p>
    </section>
  );
}
