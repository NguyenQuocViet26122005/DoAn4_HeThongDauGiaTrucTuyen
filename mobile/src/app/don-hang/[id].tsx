import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { boNho, doc, gui, loiDeDoc, maNgauNhien } from '@/lib/api';
import { bo, khoang, mau } from '@/lib/giao-dien';
import { mocThoiGian, ngayGio, nhan, tien } from '@/lib/dinh-dang';
import { gioMayChu } from '@/lib/gio-may-chu';
import { usePhienDangNhap } from '@/lib/phien-dang-nhap';
import { thongBao, xacNhan } from '@/lib/xac-nhan';
import type { DiaChi, DonHang } from '@/lib/kieu';
import {
  AnhSanPham,
  Chu,
  ManHinhCho,
  NhanTrangThai,
  Nut,
  The,
  TienTrinhDon,
  TieuDe,
} from '@/components/giao-dien';

const TRANH_CHAP_MO = ['DANG_MO', 'NGUOI_BAN_DA_PHAN_HOI', 'QUAN_TRI_DANG_XU_LY'];

// Tiền từ API là chuỗi thập phân; so sánh theo đơn vị nhỏ nhất để tránh sai số dấu phẩy động.
const xu = (giaTri: string | null | undefined) => Math.round(Number(giaTri || 0) * 100);

function duocHoanTat(don: DonHang) {
  return (
    ['DA_GIAO', 'DANG_KIEM_TRA'].includes(don.trang_thai) &&
    !Number(don.can_admin_xu_ly) &&
    !(don.tranh_chap || []).some((muc) => TRANH_CHAP_MO.includes(muc.trang_thai)) &&
    don.trang_thai_giu_tien === 'DANG_GIU' &&
    xu(don.so_tien_da_thu) === xu(don.tong_tien)
  );
}

const lamMoiDon = (id: string) =>
  boNho.invalidateQueries({
    predicate: ({ queryKey }) =>
      typeof queryKey[0] === 'string' &&
      (queryKey[0] === `/orders/${id}` || queryKey[0].startsWith('/orders?')),
  });

export default function ChiTietDon() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { nguoiDung } = usePhienDangNhap();
  const [hienTai, datHienTai] = useState(gioMayChu);
  const [dangGui, datDangGui] = useState('');
  const truyVan = useQuery({
    queryKey: [`/orders/${id}`],
    queryFn: () => doc<DonHang>(`/orders/${id}`),
    enabled: !!nguoiDung,
  });
  const don = truyVan.data;
  const laNguoiMua = !!don && String(don.nguoi_mua_id) === String(nguoiDung?.id);
  const choThanhToan = don?.trang_thai === 'CHO_THANH_TOAN';
  const diaChi = useQuery({
    queryKey: ['/users/me/addresses'],
    queryFn: () => doc<DiaChi[]>('/users/me/addresses'),
    enabled: laNguoiMua && choThanhToan,
  });

  useEffect(() => {
    const dem = setInterval(() => datHienTai(gioMayChu()), 1000);

    return () => clearInterval(dem);
  }, []);

  if (!nguoiDung) {
    return <ManHinhCho dangTai={false} rong thongDiepRong="Đăng nhập để xem đơn hàng." />;
  }
  if (!don) {
    return (
      <ManHinhCho
        dangTai={truyVan.isPending}
        loi={truyVan.error}
        thuLai={() => void truyVan.refetch()}
      />
    );
  }

  const conHan = !!don.han_thanh_toan && mocThoiGian(don.han_thanh_toan) > hienTai;
  const duocThaoTac = laNguoiMua && nguoiDung.trang_thai_tai_khoan === 'HOAT_DONG';
  const daNhanHang = ['DA_GIAO', 'DANG_KIEM_TRA'].includes(don.trang_thai);

  async function thucHien(ten: string, viec: () => Promise<void>) {
    datDangGui(ten);
    try {
      await viec();
    } catch (loi) {
      thongBao('Chưa thực hiện được', loiDeDoc(loi));
    } finally {
      datDangGui('');
      await lamMoiDon(don!.id);
    }
  }

  async function thanhToan() {
    if (
      !(await xacNhan(
        'Thanh toán đơn hàng',
        `Thanh toán mô phỏng ${tien(don!.so_tien_con_phai_thanh_toan)}. Tiền được giữ trung gian đến khi bạn xác nhận hàng phù hợp.`,
        'Thanh toán',
      ))
    ) {
      return;
    }
    await thucHien('thanh-toan', async () => {
      const ketQua = await gui<DonHang>(`/orders/${don!.id}/payments/simulate`, {
        khoa_yeu_cau: maNgauNhien(),
        ket_qua_mo_phong: 'THANH_CONG',
      });

      thongBao(
        xu(ketQua.so_tien_da_thu) === xu(ketQua.tong_tien)
          ? 'Đơn đã thanh toán đủ'
          : 'Thanh toán chưa thành công',
        'Tiền được giữ trung gian, người bán sẽ gửi hàng cho bạn.',
      );
    });
  }

  async function xacNhanBuoc(thaoTac: 'delivered' | 'confirm') {
    const laNhan = thaoTac === 'delivered';

    if (
      !(await xacNhan(
        laNhan ? 'Xác nhận đã nhận hàng' : 'Hoàn tất giao dịch',
        laNhan
          ? 'Chỉ xác nhận khi bạn thực sự đã nhận hàng. Thời gian kiểm tra bắt đầu sau bước này; tiền vẫn được giữ trung gian.'
          : 'Hàng phù hợp sẽ hoàn tất đơn và giải ngân toàn bộ tiền cho người bán. Không chọn nếu hàng có vấn đề.',
        laNhan ? 'Đã nhận hàng' : 'Hoàn tất',
      ))
    ) {
      return;
    }
    await thucHien(thaoTac, async () => {
      const daLuu = await gui<DonHang>(`/orders/${don!.id}/${thaoTac}`);

      thongBao(
        daLuu.trang_thai === 'HOAN_THANH'
          ? 'Đơn đã hoàn tất'
          : Number(daLuu.can_admin_xu_ly)
            ? 'Đơn cần Admin kiểm tra'
            : 'Đã ghi nhận nhận hàng',
        daLuu.trang_thai === 'HOAN_THANH'
          ? 'Cảm ơn bạn đã mua sắm trên VietBid.'
          : 'Tiền vẫn được giữ trong thời gian kiểm tra.',
      );
    });
  }

  return (
    <ScrollView
      contentContainerStyle={kieu.khung}
      refreshControl={
        <RefreshControl
          refreshing={truyVan.isRefetching}
          tintColor={mau.vang}
          onRefresh={() => void truyVan.refetch()}
        />
      }
    >
      <Stack.Screen options={{ title: 'Chi tiết đơn hàng' }} />

      <Animated.View entering={FadeInDown.springify().damping(18)}>
        <LinearGradient
          colors={['rgba(213,183,120,0.18)', 'rgba(21,23,19,1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={kieu.dau}
        >
          <View style={kieu.hang}>
            <View style={kieu.anh}>
              <AnhSanPham src={don.anh_san_pham || don.anh_chinh} cao={92} />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <NhanTrangThai giaTri={don.trang_thai} />
              <TieuDe nho numberOfLines={2}>
                {don.tieu_de_san_pham || don.tieu_de || `Phiên #${don.phien_dau_gia_id}`}
              </TieuDe>
              <Chu phu numberOfLines={1} style={{ fontSize: 12 }}>
                Mã đơn {don.ma_don_hang}
              </Chu>
            </View>
          </View>
          <TienTrinhDon trangThai={don.trang_thai} />
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push(`/phien/${don.phien_dau_gia_id}`)}
            style={kieu.lienKet}
          >
            <Chu style={{ color: mau.vang, fontSize: 13 }}>Xem phiên #{don.phien_dau_gia_id}</Chu>
            <Ionicons name="arrow-forward" size={14} color={mau.vang} />
          </Pressable>
        </LinearGradient>
      </Animated.View>

      {duocThaoTac && choThanhToan && (
        <Animated.View entering={FadeInDown.delay(60).springify().damping(18)}>
          <The style={[kieu.khoiViec, { borderColor: conHan ? mau.vangDam : mau.do }]}>
            <View style={kieu.hang}>
              <Ionicons name="card-outline" size={20} color={conHan ? mau.vang : mau.do} />
              <Chu dam style={{ flex: 1 }}>
                {conHan
                  ? `Thanh toán trước ${ngayGio(don.han_thanh_toan)}`
                  : 'Đã hết hạn thanh toán, đang chờ hệ thống xử lý'}
              </Chu>
            </View>
            <Chu dam style={kieu.soTienLon}>
              {tien(don.so_tien_con_phai_thanh_toan)}
            </Chu>
            <Chu phu>
              Thanh toán thất bại không kéo dài hạn. Đổi địa chỉ chỉ áp dụng trước khi thanh toán.
            </Chu>
            {(diaChi.data || []).length > 1 && (
              <View style={{ gap: khoang.s }}>
                <Chu phu>Giao tới</Chu>
                {(diaChi.data || []).map((muc) => {
                  const dangChon =
                    muc.ten_nguoi_nhan === don.ten_nguoi_nhan &&
                    don.dia_chi_giao_hang.includes(muc.dia_chi_chi_tiet);

                  return (
                    <Pressable
                      key={muc.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: dangChon, disabled: !conHan }}
                      disabled={!conHan || dangChon || !!dangGui}
                      onPress={() =>
                        void thucHien('dia-chi', async () => {
                          await gui(`/orders/${don.id}/address`, { dia_chi_id: muc.id }, 'PATCH');
                        })
                      }
                      style={[kieu.diaChi, dangChon && kieu.diaChiChon]}
                    >
                      <Ionicons
                        name={dangChon ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={dangChon ? mau.vang : mau.chuMo}
                      />
                      <View style={{ flex: 1 }}>
                        <Chu style={{ fontSize: 14 }}>
                          {muc.ten_nguoi_nhan} · {muc.sdt_nguoi_nhan}
                        </Chu>
                        <Chu phu numberOfLines={2} style={{ fontSize: 12 }}>
                          {[
                            muc.dia_chi_chi_tiet,
                            muc.phuong_xa,
                            muc.quan_huyen,
                            muc.tinh_thanh,
                          ].join(', ')}
                        </Chu>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
            <Nut
              ten="Thanh toán phần còn lại"
              bieuTuong="shield-checkmark-outline"
              dangTai={dangGui === 'thanh-toan'}
              khoa={!conHan || !!dangGui}
              onPress={() => void thanhToan()}
            />
          </The>
        </Animated.View>
      )}

      {duocThaoTac && don.trang_thai === 'DA_GUI_HANG' && (
        <The style={kieu.khoiViec}>
          <View style={kieu.hang}>
            <Ionicons name="airplane-outline" size={20} color={mau.vang} />
            <Chu dam style={{ flex: 1 }}>
              Hàng đang trên đường đến bạn
            </Chu>
          </View>
          {!!don.ma_van_don && (
            <Chu phu>
              {don.don_vi_van_chuyen} · Mã vận đơn {don.ma_van_don}
            </Chu>
          )}
          <Nut
            ten="Tôi đã nhận hàng"
            bieuTuong="archive-outline"
            dangTai={dangGui === 'delivered'}
            onPress={() => void xacNhanBuoc('delivered')}
          />
        </The>
      )}

      {duocThaoTac && daNhanHang && (
        <The style={kieu.khoiViec}>
          <View style={kieu.hang}>
            <Ionicons name="search-outline" size={20} color={mau.vang} />
            <Chu dam style={{ flex: 1 }}>
              Kiểm tra hàng đến {ngayGio(don.han_kiem_tra)}
            </Chu>
          </View>
          <Chu phu>
            Chỉ hoàn tất khi hàng phù hợp. Nếu có vấn đề, mở khiếu nại trên web VietBid trước hạn
            kiểm tra; tiền vẫn được giữ.
          </Chu>
          <Nut
            ten="Hàng phù hợp — hoàn tất"
            bieuTuong="checkmark-done-outline"
            dangTai={dangGui === 'confirm'}
            khoa={!duocHoanTat(don)}
            onPress={() => void xacNhanBuoc('confirm')}
          />
        </The>
      )}

      {don.trang_thai === 'HOAN_THANH' && (
        <The style={[kieu.khoiViec, { borderColor: 'rgba(127,200,169,0.4)' }]}>
          <View style={kieu.hang}>
            <Ionicons name="checkmark-circle" size={22} color={mau.xanh} />
            <Chu dam style={{ flex: 1 }}>
              Giao dịch đã hoàn tất
            </Chu>
          </View>
        </The>
      )}

      <The>
        <Chu dam style={{ fontSize: 17 }}>
          Thanh toán
        </Chu>
        <Dong ten="Giá sản phẩm" giaTri={tien(don.gia_san_pham)} />
        <Dong ten="Phí vận chuyển" giaTri={tien(don.phi_van_chuyen)} />
        <Dong ten="Tiền cọc đã chuyển" giaTri={tien(don.tien_coc_da_chuyen)} />
        <Dong ten="Đã thu" giaTri={tien(don.so_tien_da_thu)} />
        <View style={kieu.tong}>
          <Chu dam>Tổng đơn</Chu>
          <Chu dam style={{ color: mau.vang, fontSize: 20 }}>
            {tien(don.tong_tien)}
          </Chu>
        </View>
        <Chu phu style={{ fontSize: 12 }}>
          Giữ tiền: {nhan(don.trang_thai_giu_tien)}
        </Chu>
      </The>

      <The>
        <Chu dam style={{ fontSize: 17 }}>
          Giao hàng
        </Chu>
        <Chu>
          {don.ten_nguoi_nhan} · {don.sdt_nguoi_nhan}
        </Chu>
        <Chu phu>{don.dia_chi_giao_hang}</Chu>
        {!!don.ma_van_don && (
          <Chu phu>
            {don.don_vi_van_chuyen} · {don.ma_van_don}
          </Chu>
        )}
        <Chu phu style={{ fontSize: 12 }}>
          Tạo đơn {ngayGio(don.ngay_tao)}
        </Chu>
      </The>

      {!laNguoiMua && (
        <Chu phu style={{ textAlign: 'center' }}>
          Đây là đơn bạn bán. Quản lý gửi hàng trên web VietBid.
        </Chu>
      )}
    </ScrollView>
  );
}

function Dong({ ten, giaTri }: { ten: string; giaTri: string }) {
  return (
    <View style={kieu.dong}>
      <Chu phu>{ten}</Chu>
      <Chu>{giaTri}</Chu>
    </View>
  );
}

const kieu = StyleSheet.create({
  khung: {
    padding: khoang.l,
    gap: khoang.l,
    paddingBottom: 48,
  },
  dau: {
    borderRadius: bo.the + 6,
    borderWidth: 1,
    borderColor: 'rgba(213,183,120,0.3)',
    padding: khoang.l,
    gap: khoang.m,
  },
  hang: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: khoang.m,
  },
  anh: {
    width: 92,
    height: 92,
    borderRadius: bo.the,
    overflow: 'hidden',
  },
  lienKet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  khoiViec: { gap: khoang.m, borderColor: mau.vangDam },
  soTienLon: {
    color: mau.vang,
    fontSize: 30,
    lineHeight: 38,
  },
  diaChi: {
    flexDirection: 'row',
    gap: khoang.s,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: mau.vien,
    borderRadius: bo.nut,
    padding: khoang.m,
  },
  diaChiChon: { borderColor: mau.vangDam, backgroundColor: 'rgba(213,183,120,0.06)' },
  dong: { flexDirection: 'row', justifyContent: 'space-between' },
  tong: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: mau.vien,
    paddingTop: khoang.s,
    marginTop: 4,
  },
});
