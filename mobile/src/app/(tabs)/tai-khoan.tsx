import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { DIA_CHI_WEB, doc } from '@/lib/api';
import { bo, khoang, mau, phong } from '@/lib/giao-dien';
import { nhan } from '@/lib/dinh-dang';
import { usePhienDangNhap } from '@/lib/phien-dang-nhap';
import { xacNhan } from '@/lib/xac-nhan';
import type { DiaChi, DonHang } from '@/lib/kieu';
import { Chu, TieuDe } from '@/components/giao-dien';
import { CanDangNhap } from '@/components/can-dang-nhap';

export default function TaiKhoan() {
  const { nguoiDung, dangXuat } = usePhienDangNhap();
  const donMua = useQuery({
    queryKey: ['/orders?vai_tro=NGUOI_MUA&limit=30'],
    queryFn: () => doc<DonHang[]>('/orders?vai_tro=NGUOI_MUA&limit=30'),
    enabled: !!nguoiDung,
  });
  const diaChi = useQuery({
    queryKey: ['/users/me/addresses'],
    queryFn: () => doc<DiaChi[]>('/users/me/addresses'),
    enabled: !!nguoiDung,
  });

  if (!nguoiDung) {
    return (
      <CanDangNhap
        bieuTuong="person-circle-outline"
        tieuDe="Tài khoản VietBid"
        moTa="Đăng nhập để quản lý địa chỉ nhận hàng, đơn mua và các phiên bạn tham gia."
      />
    );
  }

  const cacDon = donMua.data || [];
  const chiSo = [
    {
      ten: 'Chờ thanh toán',
      so: cacDon.filter((d) => d.trang_thai === 'CHO_THANH_TOAN').length,
      bieuTuong: 'card-outline' as const,
    },
    {
      ten: 'Đang giao',
      so: cacDon.filter((d) =>
        ['CHO_GUI_HANG', 'DA_THANH_TOAN', 'DA_GUI_HANG'].includes(d.trang_thai),
      ).length,
      bieuTuong: 'airplane-outline' as const,
    },
    {
      ten: 'Hoàn thành',
      so: cacDon.filter((d) => d.trang_thai === 'HOAN_THANH').length,
      bieuTuong: 'ribbon-outline' as const,
    },
  ];
  const chuCai = nguoiDung.ho_ten.trim().split(/\s+/).pop()?.[0]?.toUpperCase() || 'V';

  return (
    <ScrollView contentContainerStyle={kieu.khung}>
      <Animated.View entering={FadeInDown.springify().damping(18)}>
        <LinearGradient
          colors={['#3a311d', '#1a1712', '#0b0c0a']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={kieu.hoSo}
        >
          <View style={kieu.vongSang} />
          <LinearGradient
            colors={[mau.vang, mau.vangDam]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={kieu.anhDaiDien}
          >
            <Chu style={kieu.chuCai}>{chuCai}</Chu>
          </LinearGradient>
          <View style={{ gap: 2, alignItems: 'center' }}>
            <TieuDe style={{ textAlign: 'center' }}>{nguoiDung.ho_ten}</TieuDe>
            <Chu phu>{nguoiDung.email}</Chu>
          </View>
          <View style={kieu.hangNhan}>
            <View style={kieu.nhan}>
              <Ionicons name="shield-checkmark" size={13} color={mau.xanh} />
              <Chu style={{ fontSize: 12, color: mau.chu }}>
                {nguoiDung.trang_thai_tai_khoan === 'HOAT_DONG'
                  ? 'Tài khoản hoạt động'
                  : nhan(nguoiDung.trang_thai_tai_khoan)}
              </Chu>
            </View>
            {nguoiDung.trang_thai_nguoi_ban === 'DA_XAC_MINH' && (
              <View style={kieu.nhan}>
                <Ionicons name="storefront" size={13} color={mau.vang} />
                <Chu style={{ fontSize: 12, color: mau.chu }}>Người bán đã xác minh</Chu>
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).springify().damping(18)} style={kieu.luoiChiSo}>
        {chiSo.map((muc) => (
          <Pressable
            key={muc.ten}
            accessibilityRole="link"
            onPress={() => router.push('/don-hang')}
            style={kieu.oChiSo}
          >
            <Ionicons name={muc.bieuTuong} size={18} color={mau.vang} />
            <Chu style={kieu.soChiSo}>{muc.so}</Chu>
            <Chu phu style={{ fontSize: 12, textAlign: 'center' }}>
              {muc.ten}
            </Chu>
          </Pressable>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).springify().damping(18)} style={kieu.nhom}>
        <MucMenu
          bieuTuong="location-outline"
          ten="Sổ địa chỉ"
          moTa={
            diaChi.data?.length
              ? `${diaChi.data.length} địa chỉ nhận hàng`
              : 'Thêm địa chỉ để tham gia đấu giá'
          }
          onPress={() => router.push('/dia-chi')}
        />
        <MucMenu
          bieuTuong="cube-outline"
          ten="Đơn hàng"
          moTa="Thanh toán, theo dõi vận chuyển"
          onPress={() => router.push('/don-hang')}
        />
        <MucMenu
          bieuTuong="notifications-outline"
          ten="Thông báo"
          moTa="Vượt giá, thắng phiên, gửi hàng"
          onPress={() => router.push('/thong-bao')}
        />
        <MucMenu
          bieuTuong="globe-outline"
          ten="Mở VietBid trên web"
          moTa="Bán hàng, kiểm định, khiếu nại"
          onPress={() => void Linking.openURL(DIA_CHI_WEB)}
          cuoi
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(240).springify().damping(18)}>
        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            if (
              await xacNhan(
                'Đăng xuất',
                'Bạn muốn đăng xuất khỏi VietBid trên thiết bị này?',
                'Đăng xuất',
              )
            ) {
              await dangXuat();
            }
          }}
          style={({ pressed }) => [kieu.dangXuat, pressed && { opacity: 0.8 }]}
        >
          <Ionicons name="log-out-outline" size={18} color={mau.do} />
          <Chu style={{ color: mau.do, fontFamily: phong.thanDam }}>Đăng xuất</Chu>
        </Pressable>
        <Chu style={kieu.phienBan}>VietBid · phiên bản 1.0.0</Chu>
      </Animated.View>
    </ScrollView>
  );
}

function MucMenu({
  bieuTuong,
  ten,
  moTa,
  onPress,
  cuoi,
}: {
  bieuTuong: keyof typeof Ionicons.glyphMap;
  ten: string;
  moTa: string;
  onPress: () => void;
  cuoi?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        kieu.muc,
        !cuoi && kieu.mucVach,
        pressed && { backgroundColor: mau.nenNoi },
      ]}
    >
      <View style={kieu.oIcon}>
        <Ionicons name={bieuTuong} size={19} color={mau.vang} />
      </View>
      <View style={{ flex: 1 }}>
        <Chu style={{ fontFamily: phong.thanVua }}>{ten}</Chu>
        <Chu phu style={{ fontSize: 12 }}>
          {moTa}
        </Chu>
      </View>
      <Ionicons name="chevron-forward" size={18} color={mau.chuMo} />
    </Pressable>
  );
}

const kieu = StyleSheet.create({
  khung: {
    padding: khoang.l,
    gap: khoang.l,
    paddingBottom: 48,
  },
  hoSo: {
    borderRadius: bo.the + 8,
    borderWidth: 1,
    borderColor: 'rgba(213,183,120,0.25)',
    padding: khoang.xl,
    alignItems: 'center',
    gap: khoang.m,
    overflow: 'hidden',
  },
  vongSang: {
    position: 'absolute',
    right: -50,
    top: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(213,183,120,0.14)',
  },
  anhDaiDien: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: mau.vang,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  chuCai: {
    color: mau.nen,
    fontFamily: phong.tieuDe,
    fontSize: 40,
    lineHeight: 48,
  },
  hangNhan: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: khoang.s,
    justifyContent: 'center',
  },
  nhan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11,12,10,0.6)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  luoiChiSo: { flexDirection: 'row', gap: khoang.s },
  oChiSo: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: mau.nenThe,
    borderWidth: 1,
    borderColor: mau.vien,
    borderRadius: bo.the,
    paddingVertical: khoang.l,
    paddingHorizontal: khoang.s,
  },
  soChiSo: {
    color: mau.chu,
    fontFamily: phong.thanDam,
    fontSize: 22,
    lineHeight: 28,
  },
  nhom: {
    backgroundColor: mau.nenThe,
    borderWidth: 1,
    borderColor: mau.vien,
    borderRadius: bo.the + 4,
    overflow: 'hidden',
  },
  muc: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: khoang.m,
    padding: khoang.l,
  },
  mucVach: { borderBottomWidth: 1, borderBottomColor: mau.vien },
  oIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(213,183,120,0.1)',
  },
  dangXuat: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: khoang.s,
    minHeight: 50,
    borderRadius: bo.nut,
    borderWidth: 1,
    borderColor: 'rgba(224,122,111,0.4)',
  },
  phienBan: {
    color: mau.chuMo,
    fontSize: 11,
    textAlign: 'center',
    marginTop: khoang.l,
  },
});
