import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { bo, khoang, mau } from '@/lib/giao-dien';
import { tenGiaPhien, tien } from '@/lib/dinh-dang';
import type { Phien } from '@/lib/kieu';
import { AnhSanPham, Chu, DemNguoc, NhanTrangThai, TieuDe } from './giao-dien';

// Thẻ phiên: ảnh lớn phủ gradient tối, nhãn nổi trên ảnh, trồi lên lần lượt khi danh sách mở
// và co nhẹ khi bấm để cảm giác như vật thể thật.
export function ThePhien({ phien, viTri = 0 }: { phien: Phien; viTri?: number }) {
  const tiLe = useSharedValue(1);
  const kieuNhan = useAnimatedStyle(() => ({ transform: [{ scale: tiLe.get() }] }));
  const dangMo = ['HOAT_DONG', 'DA_LEN_LICH'].includes(phien.trang_thai);

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(viTri, 6) * 70)
        .springify()
        .damping(18)}
    >
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${phien.tieu_de}, ${tien(phien.gia_hien_tai)}`}
        onPress={() => router.push(`/phien/${phien.id}`)}
        onPressIn={() => {
          tiLe.set(withSpring(0.97, { damping: 20 }));
        }}
        onPressOut={() => {
          tiLe.set(withSpring(1, { damping: 14 }));
        }}
      >
        <Animated.View style={[kieu.the, kieuNhan]}>
          <View>
            <AnhSanPham src={phien.anh_chinh} cao={230} vuong />
            <LinearGradient
              colors={['rgba(11,12,10,0)', 'rgba(11,12,10,0.15)', 'rgba(11,12,10,0.92)']}
              locations={[0, 0.45, 1]}
              style={kieu.phuAnh}
            />
            <View style={kieu.nhanTren}>
              <View style={kieu.nenNhan}>
                <NhanTrangThai giaTri={phien.trang_thai} />
              </View>
              <Chu style={kieu.soPhien}>PHIÊN {String(phien.id).padStart(4, '0')}</Chu>
            </View>
            <View style={kieu.chuTrenAnh}>
              {!!phien.ten_danh_muc && (
                <Chu style={kieu.danhMuc} numberOfLines={1}>
                  {phien.ten_danh_muc.toUpperCase()}
                </Chu>
              )}
              <TieuDe nho numberOfLines={2} style={{ color: '#fff' }}>
                {phien.tieu_de}
              </TieuDe>
            </View>
          </View>
          <View style={kieu.duoi}>
            <View style={kieu.hangGia}>
              <View style={{ flex: 1 }}>
                <Chu phu>{tenGiaPhien(phien.trang_thai, phien.ly_do_ket_thuc)}</Chu>
                <Chu dam style={kieu.gia}>
                  {tien(phien.gia_hien_tai)}
                </Chu>
              </View>
              <View style={kieu.luot}>
                <Chu dam style={{ color: mau.chu, fontSize: 16 }}>
                  {phien.tong_luot_tra_gia}
                </Chu>
                <Chu phu style={{ fontSize: 11 }}>
                  lượt giá
                </Chu>
              </View>
            </View>
            {dangMo && (
              <View style={kieu.vachDem}>
                <DemNguoc batDau={phien.thoi_gian_bat_dau} ketThuc={phien.thoi_gian_ket_thuc} />
              </View>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const kieu = StyleSheet.create({
  the: {
    backgroundColor: mau.nenThe,
    borderColor: mau.vien,
    borderWidth: 1,
    borderRadius: bo.the + 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  phuAnh: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  nhanTren: {
    position: 'absolute',
    top: khoang.m,
    left: khoang.m,
    right: khoang.m,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nenNhan: { backgroundColor: 'rgba(11,12,10,0.7)', borderRadius: 999 },
  soPhien: {
    color: mau.chu,
    fontSize: 11,
    letterSpacing: 1.2,
    backgroundColor: 'rgba(11,12,10,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  chuTrenAnh: {
    position: 'absolute',
    left: khoang.l,
    right: khoang.l,
    bottom: khoang.m,
    gap: 2,
  },
  danhMuc: {
    color: mau.vang,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  duoi: { padding: khoang.l, gap: khoang.m },
  hangGia: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: khoang.m,
  },
  gia: {
    color: mau.vang,
    fontSize: 24,
    lineHeight: 30,
  },
  luot: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: mau.vien,
    borderRadius: bo.nut,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  vachDem: {
    borderTopWidth: 1,
    borderTopColor: mau.vien,
    paddingTop: khoang.m,
  },
});
