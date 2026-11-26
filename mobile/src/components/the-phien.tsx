import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { bo, khoang, mau, phong } from '@/lib/giao-dien';
import { tenGiaPhien, tien } from '@/lib/dinh-dang';
import type { Phien } from '@/lib/kieu';
import { AnhSanPham, Chu, DemNguoc, NhanTrangThai, TieuDe } from './giao-dien';

// Cùng thứ tự thông tin với thẻ web: ảnh, danh mục, tên, giá và thời gian.
export function ThePhien({ phien }: { phien: Phien }) {
  const dangMo = ['HOAT_DONG', 'DA_LEN_LICH'].includes(phien.trang_thai);

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={phien.tieu_de + ', ' + tien(phien.gia_hien_tai)}
      onPress={() => router.push({ pathname: '/phien/[id]', params: { id: phien.id } })}
      style={({ pressed }) => [kieu.the, pressed && { borderColor: mau.vangDam, opacity: 0.9 }]}
    >
      <View>
        <AnhSanPham src={phien.anh_chinh} vuong />
        <View style={kieu.nhanTren}>
          <NhanTrangThai giaTri={phien.trang_thai} />
          <Chu style={kieu.soPhien}>PHIÊN {String(phien.id).padStart(4, '0')}</Chu>
        </View>
      </View>
      <View style={kieu.noiDung}>
        {!!phien.ten_danh_muc && <Chu style={kieu.danhMuc}>{phien.ten_danh_muc}</Chu>}
        <TieuDe nho numberOfLines={2}>
          {phien.tieu_de}
        </TieuDe>
        <View style={kieu.hangGia}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Chu phu>{tenGiaPhien(phien.trang_thai, phien.ly_do_ket_thuc)}</Chu>
            <Chu style={kieu.gia}>{tien(phien.gia_hien_tai)}</Chu>
          </View>
          <Chu phu style={{ flexShrink: 1 }}>
            {phien.tong_luot_tra_gia} lượt trả giá
          </Chu>
        </View>
        <View style={kieu.chan}>
          {dangMo ? (
            <DemNguoc batDau={phien.thoi_gian_bat_dau} ketThuc={phien.thoi_gian_ket_thuc} />
          ) : (
            <Chu phu>Phiên đã khép lại</Chu>
          )}
          <Ionicons name="arrow-forward" size={18} color={mau.vang} />
        </View>
      </View>
    </Pressable>
  );
}

const kieu = StyleSheet.create({
  the: {
    backgroundColor: mau.nenThe,
    borderColor: mau.vien,
    borderWidth: 1,
    borderRadius: bo.the,
    overflow: 'hidden',
  },
  nhanTren: {
    position: 'absolute',
    top: khoang.m,
    left: khoang.m,
    right: khoang.m,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: khoang.s,
  },
  soPhien: {
    color: mau.chuPhu,
    fontSize: 11,
    backgroundColor: mau.nen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  noiDung: { padding: khoang.l, gap: khoang.s },
  danhMuc: { color: mau.vang, fontSize: 12 },
  hangGia: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: khoang.m,
    marginTop: khoang.s,
  },
  gia: {
    color: mau.vang,
    fontFamily: phong.thanVua,
    fontSize: 20,
    lineHeight: 28,
    fontVariant: ['tabular-nums'],
  },
  chan: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: khoang.s,
    borderTopWidth: 1,
    borderTopColor: mau.vien,
    paddingTop: khoang.m,
    marginTop: khoang.s,
  },
});
