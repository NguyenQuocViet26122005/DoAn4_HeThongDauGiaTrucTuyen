import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { boNho, doc, gui, loiDeDoc, maNgauNhien } from '@/lib/api';
import { bo, khoang, mau, phong } from '@/lib/giao-dien';
import { mocThoiGian, nhan, tien } from '@/lib/dinh-dang';
import { gioMayChu } from '@/lib/gio-may-chu';
import { usePhienDangNhap } from '@/lib/phien-dang-nhap';
import { thongBao, xacNhan } from '@/lib/xac-nhan';
import type { DatCoc, DiaChi, DonHang, Phien } from '@/lib/kieu';
import { Chu, Nut, The } from './giao-dien';

type BuocGia = { gia_tu: string; gia_den: string | null; muc_tang_gia: string };

// Mức gợi ý giống web: lần đầu từ giá khởi điểm; sau đó giá hiện tại + bước giá;
// đã có mức tối đa thì phải cao hơn mức đó; người đang dẫn đầu chỉ cần nâng trần.
function mucGoiY(phien: Phien, cacBuoc: BuocGia[] = [], mucCu?: string | null, dangDanDau = false) {
  const daDat = mucCu ? Number(mucCu) + 1 : undefined;
  const hienTai = Number(phien.gia_hien_tai);
  const buoc = cacBuoc.find(
    (b) => hienTai >= Number(b.gia_tu) && (b.gia_den == null || hienTai <= Number(b.gia_den)),
  );
  const chung = !Number(phien.tong_luot_tra_gia)
    ? Math.max(Number(phien.gia_khoi_diem), 1)
    : buoc
      ? hienTai + Number(buoc.muc_tang_gia)
      : undefined;

  if (dangDanDau) {
    return daDat;
  }

  return daDat && chung ? Math.max(daDat, chung) : (daDat ?? chung);
}

function useGioMayChu() {
  const [hienTai, datHienTai] = useState(gioMayChu);

  useEffect(() => {
    const dem = setInterval(() => datHienTai(gioMayChu()), 1000);

    return () => clearInterval(dem);
  }, []);

  return hienTai;
}

const lamMoiPhien = (id: string) =>
  boNho.invalidateQueries({
    predicate: ({ queryKey }) =>
      typeof queryKey[0] === 'string' &&
      (queryKey[0].startsWith(`/auctions/${id}`) || queryKey[0].startsWith('/auctions?')),
  });

export function ThamGiaPhien({ phien }: { phien: Phien }) {
  const { nguoiDung } = usePhienDangNhap();
  const hienTai = useGioMayChu();
  const [mucNhap, datMucNhap] = useState('');
  const [dangGui, datDangGui] = useState('');
  const coTaiKhoan = !!nguoiDung && nguoiDung.vai_tro === 'NGUOI_DUNG';
  const laNguoiBan = String(nguoiDung?.id) === String(phien.nguoi_ban_id);
  const canCoc = !!Number(phien.yeu_cau_dat_coc);
  const choThamGia = coTaiKhoan && !laNguoiBan;

  const diaChi = useQuery({
    queryKey: ['/users/me/addresses'],
    queryFn: () => doc<DiaChi[]>('/users/me/addresses'),
    enabled: choThamGia,
  });
  const coc = useQuery({
    queryKey: [`/auctions/${phien.id}/deposit`],
    queryFn: () => doc<DatCoc | null>(`/auctions/${phien.id}/deposit`),
    enabled: choThamGia && canCoc,
  });
  const cuaToi = useQuery({
    queryKey: [`/auctions/${phien.id}/my-max`],
    queryFn: () => doc<{ muc_toi_da_cua_toi: string | null }>(`/auctions/${phien.id}/my-max`),
    enabled: choThamGia,
  });
  const buocGia = useQuery({
    queryKey: ['/bid-increments'],
    queryFn: () => doc<BuocGia[]>('/bid-increments'),
    enabled: choThamGia,
  });

  if (!nguoiDung) {
    return (
      <The style={kieu.khoi}>
        <Chu>Đăng nhập để đặt cọc, đặt giá và theo dõi phiên.</Chu>
        <Nut
          ten="Đăng nhập để tham gia"
          bieuTuong="log-in-outline"
          onPress={() => router.push('/dang-nhap')}
        />
      </The>
    );
  }
  if (!coTaiKhoan) {
    return (
      <GhiChu bieuTuong="shield-outline" noiDung="Tài khoản quản trị không tham gia đấu giá." />
    );
  }
  if (laNguoiBan) {
    return (
      <GhiChu
        bieuTuong="storefront-outline"
        noiDung="Đây là phiên của bạn. Theo dõi kết quả trên web VietBid."
      />
    );
  }

  const conHieuLuc =
    ['DA_LEN_LICH', 'HOAT_DONG'].includes(phien.trang_thai) &&
    mocThoiGian(phien.thoi_gian_ket_thuc) > hienTai;
  const daBatDau = mocThoiGian(phien.thoi_gian_bat_dau) <= hienTai;

  if (!conHieuLuc) {
    return (
      <GhiChu bieuTuong="flag-outline" noiDung="Phiên đã kết thúc, không nhận thao tác mới." />
    );
  }

  const diaChiNhan = diaChi.data?.[0];
  const duCoc = !canCoc || coc.data?.trang_thai === 'DA_DAT_COC';
  const mucCu = cuaToi.data?.muc_toi_da_cua_toi;
  const dangDanDau = phien.nguoi_dan_dau === `ND-${nguoiDung.id}`;
  const toiThieu = mucGoiY(phien, buocGia.data, mucCu, dangDanDau);
  const choMuaNgay =
    !!Number(phien.cho_phep_mua_ngay) && !!phien.gia_mua_ngay && daBatDau && !!diaChiNhan;

  async function thucHien(ten: string, viec: () => Promise<void>) {
    datDangGui(ten);
    try {
      await viec();
    } catch (loi) {
      thongBao('Chưa thực hiện được', loiDeDoc(loi));
    } finally {
      datDangGui('');
      await lamMoiPhien(phien.id);
    }
  }

  async function datGia() {
    const muc = Math.floor(Number(mucNhap.replace(/\D/g, '')));

    if (!muc) {
      thongBao('Nhập mức tối đa bạn chấp nhận');

      return;
    }
    if (
      !(await xacNhan(
        'Xác nhận cam kết đấu giá',
        `Mức tối đa bí mật: ${tien(muc)}\nPhí vận chuyển nếu thắng: ${tien(phien.phi_van_chuyen)}.\nCam kết này không thể giảm hoặc rút lại.`,
        'Đặt giá',
      ))
    ) {
      return;
    }
    await thucHien('gia', async () => {
      const ketQua = await gui<{ ban_dang_dan_dau: boolean }>(`/auctions/${phien.id}/bids`, {
        gia_toi_da: String(muc),
      });

      datMucNhap('');
      thongBao(
        'Đã ghi nhận mức tối đa',
        ketQua.ban_dang_dan_dau
          ? 'Bạn đang dẫn đầu phiên.'
          : 'Đã có mức cao hơn hoặc được ưu tiên trước.',
      );
    });
  }

  if (!diaChiNhan) {
    return (
      <The style={kieu.khoi}>
        <Chu>Bạn cần thêm địa chỉ nhận hàng trước khi tham gia.</Chu>
        <Nut
          ten="Thêm địa chỉ nhận hàng"
          bieuTuong="location-outline"
          onPress={() => router.push('/dia-chi')}
        />
      </The>
    );
  }

  return (
    <Animated.View entering={FadeIn} style={{ gap: khoang.m }}>
      {canCoc && !duCoc && (
        <The style={kieu.khoi}>
          <View style={kieu.hang}>
            <Ionicons name="lock-closed-outline" size={18} color={mau.vang} />
            <Chu dam>Đặt cọc {tien(phien.so_tien_dat_coc)} để mở đặt giá</Chu>
          </View>
          <Chu phu>
            Người không thắng được hoàn cọc; cọc của người thắng chuyển vào đơn. Bỏ thanh toán không
            được hoàn cọc.
          </Chu>
          {coc.data && <Chu phu>Trạng thái cọc: {nhan(coc.data.trang_thai)}</Chu>}
          {!coc.data ? (
            <Nut
              ten="Đăng ký tham gia phiên"
              dangTai={dangGui === 'dang-ky'}
              onPress={() =>
                void thucHien('dang-ky', () => gui(`/auctions/${phien.id}/deposit/register`))
              }
            />
          ) : (
            <Nut
              ten={`Thanh toán cọc ${tien(phien.so_tien_dat_coc)}`}
              bieuTuong="card-outline"
              dangTai={dangGui === 'coc'}
              khoa={!['CHO_THANH_TOAN', 'THAT_BAI'].includes(coc.data.trang_thai)}
              onPress={async () => {
                if (
                  await xacNhan(
                    'Thanh toán cọc',
                    `Thanh toán mô phỏng ${tien(phien.so_tien_dat_coc)} cho phiên #${phien.id}.`,
                    'Thanh toán',
                  )
                ) {
                  await thucHien('coc', () =>
                    gui(`/auctions/${phien.id}/deposit/pay`, {
                      khoa_yeu_cau: maNgauNhien(),
                      ket_qua_mo_phong: 'THANH_CONG',
                    }),
                  );
                }
              }}
            />
          )}
        </The>
      )}

      <The style={[kieu.khoi, !(duCoc && daBatDau) && { opacity: 0.55 }]}>
        <Chu dam style={{ fontSize: 17 }}>
          Đặt mức giá tối đa
        </Chu>
        <Chu phu>
          Hệ thống tự trả giá theo bước giá trong phạm vi bạn cam kết. Hai mức bằng nhau: người đặt
          trước được ưu tiên.
        </Chu>
        {!!mucCu && (
          <View style={kieu.mucCuaToi}>
            <Chu phu>Mức tối đa bạn đã đặt</Chu>
            <Chu dam style={{ color: mau.vang }}>
              {tien(mucCu)}
            </Chu>
          </View>
        )}
        {!daBatDau && <Chu style={{ color: mau.cam }}>Phiên chưa bắt đầu, chưa nhận đặt giá.</Chu>}
        {canCoc && !duCoc && <Chu style={{ color: mau.cam }}>Hoàn tất đặt cọc để mở đặt giá.</Chu>}
        <TextInput
          accessibilityLabel="Mức tối đa bí mật"
          editable={duCoc && daBatDau}
          keyboardType="number-pad"
          value={mucNhap ? Number(mucNhap.replace(/\D/g, '')).toLocaleString('vi-VN') : ''}
          onChangeText={(chu) => datMucNhap(chu.replace(/\D/g, ''))}
          placeholder={toiThieu ? `Từ ${tien(toiThieu)}` : 'Nhập số tiền'}
          placeholderTextColor={mau.chuMo}
          style={kieu.oGia}
        />
        <Nut
          ten="Đặt mức tối đa"
          bieuTuong="hammer-outline"
          dangTai={dangGui === 'gia'}
          khoa={!duCoc || !daBatDau}
          onPress={() => void datGia()}
        />
      </The>

      {choMuaNgay && (
        <The style={kieu.khoi}>
          <Chu dam>Mua ngay với {tien(phien.gia_mua_ngay)}</Chu>
          <Chu phu>Kết thúc phiên ngay và tạo đơn cho bạn; thanh toán ngay sau khi xác nhận.</Chu>
          <Nut
            phu
            ten="Mua ngay"
            bieuTuong="flash-outline"
            dangTai={dangGui === 'mua-ngay'}
            onPress={async () => {
              if (
                !(await xacNhan(
                  'Mua ngay',
                  `Mua với giá ${tien(phien.gia_mua_ngay)} cộng phí vận chuyển ${tien(phien.phi_van_chuyen)}.`,
                  'Mua ngay',
                ))
              ) {
                return;
              }
              await thucHien('mua-ngay', async () => {
                const ketQua = await gui<{ ket_qua_mo_phong: string; don_hang: DonHang | null }>(
                  `/auctions/${phien.id}/buy-now`,
                  { khoa_yeu_cau: maNgauNhien(), ket_qua_mo_phong: 'THANH_CONG' },
                );

                if (ketQua.don_hang) {
                  router.push(`/don-hang/${ketQua.don_hang.id}`);
                }
              });
            }}
          />
        </The>
      )}
    </Animated.View>
  );
}

function GhiChu({
  bieuTuong,
  noiDung,
}: {
  bieuTuong: keyof typeof Ionicons.glyphMap;
  noiDung: string;
}) {
  return (
    <The style={[kieu.khoi, kieu.hang]}>
      <Ionicons name={bieuTuong} size={20} color={mau.vang} />
      <Chu style={{ flex: 1 }}>{noiDung}</Chu>
    </The>
  );
}

const kieu = StyleSheet.create({
  khoi: { gap: khoang.m },
  hang: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: khoang.s,
  },
  mucCuaToi: {
    borderWidth: 1,
    borderColor: 'rgba(213,183,120,0.35)',
    borderRadius: bo.nut,
    padding: khoang.m,
    backgroundColor: 'rgba(213,183,120,0.06)',
  },
  oGia: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: mau.vangDam,
    borderRadius: bo.nut,
    paddingHorizontal: khoang.l,
    color: mau.vang,
    fontFamily: phong.thanDam,
    fontSize: 22,
    backgroundColor: mau.nenNoi,
  },
});
