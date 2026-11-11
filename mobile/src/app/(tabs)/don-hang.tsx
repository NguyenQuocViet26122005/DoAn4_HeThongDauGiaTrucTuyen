import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { doc } from '@/lib/api';
import { bo, khoang, mau, phong } from '@/lib/giao-dien';
import { ngayGio, tien } from '@/lib/dinh-dang';
import { usePhienDangNhap } from '@/lib/phien-dang-nhap';
import type { DonHang } from '@/lib/kieu';
import { AnhSanPham, Chu, ManHinhCho, NhanTrangThai, TienTrinhDon } from '@/components/giao-dien';
import { CanDangNhap } from '@/components/can-dang-nhap';

const VAI_TRO = [
  { giaTri: 'NGUOI_MUA', ten: 'Tôi mua' },
  { giaTri: 'NGUOI_BAN', ten: 'Tôi bán' },
];

export default function DonHangCuaToi() {
  const { nguoiDung } = usePhienDangNhap();
  const [vaiTro, datVaiTro] = useState('NGUOI_MUA');
  const duongDan = `/orders?vai_tro=${vaiTro}&limit=30`;
  const truyVan = useQuery({
    queryKey: [duongDan],
    queryFn: () => doc<DonHang[]>(duongDan),
    enabled: !!nguoiDung,
  });

  if (!nguoiDung) {
    return (
      <CanDangNhap
        bieuTuong="cube-outline"
        tieuDe="Đơn hàng của bạn"
        moTa="Đăng nhập để thanh toán, theo dõi vận chuyển và xác nhận nhận hàng."
      />
    );
  }

  return (
    <FlatList
      data={truyVan.data || []}
      keyExtractor={(don) => don.id}
      contentContainerStyle={kieu.danhSach}
      refreshControl={
        <RefreshControl
          refreshing={truyVan.isRefetching}
          onRefresh={() => void truyVan.refetch()}
          tintColor={mau.vang}
        />
      }
      ListHeaderComponent={
        <View style={kieu.chuyen}>
          {VAI_TRO.map((muc) => {
            const chon = vaiTro === muc.giaTri;

            return (
              <Pressable
                key={muc.giaTri}
                accessibilityRole="tab"
                accessibilityState={{ selected: chon }}
                onPress={() => datVaiTro(muc.giaTri)}
                style={[kieu.oChuyen, chon && kieu.oChuyenChon]}
              >
                <Chu
                  style={[{ fontSize: 14 }, chon && { color: mau.nen, fontFamily: phong.thanDam }]}
                >
                  {muc.ten}
                </Chu>
              </Pressable>
            );
          })}
        </View>
      }
      ListEmptyComponent={
        <ManHinhCho
          dangTai={truyVan.isPending}
          loi={truyVan.error}
          thuLai={() => void truyVan.refetch()}
          rong
          thongDiepRong={
            vaiTro === 'NGUOI_MUA'
              ? 'Bạn chưa có đơn mua nào. Thắng một phiên để bắt đầu.'
              : 'Bạn chưa có đơn bán nào.'
          }
        />
      }
      renderItem={({ item, index }) => <TheDon don={item} viTri={index} />}
    />
  );
}

function TheDon({ don, viTri }: { don: DonHang; viTri: number }) {
  const canThanhToan = don.trang_thai === 'CHO_THANH_TOAN';
  const canNhan = don.trang_thai === 'DA_GUI_HANG';

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(viTri, 6) * 60)
        .springify()
        .damping(18)}
    >
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push(`/don-hang/${don.id}`)}
        style={({ pressed }) => [kieu.the, pressed && { opacity: 0.85 }]}
      >
        <View style={kieu.hang}>
          <View style={kieu.anh}>
            <AnhSanPham src={don.anh_chinh} cao={84} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <NhanTrangThai giaTri={don.trang_thai} />
            <Chu dam numberOfLines={2}>
              {don.tieu_de || `Phiên #${don.phien_dau_gia_id}`}
            </Chu>
            <Chu phu numberOfLines={1} style={{ fontSize: 12 }}>
              {ngayGio(don.ngay_tao)} · {don.ma_don_hang}
            </Chu>
          </View>
          <Ionicons name="chevron-forward" size={18} color={mau.chuMo} />
        </View>
        <TienTrinhDon trangThai={don.trang_thai} />
        <View style={kieu.chan}>
          <Chu phu>Tổng đơn</Chu>
          <Chu dam style={{ color: mau.vang, fontSize: 17 }}>
            {tien(don.tong_tien)}
          </Chu>
        </View>
        {(canThanhToan || canNhan) && (
          <View style={kieu.nhacViec}>
            <Ionicons
              name={canThanhToan ? 'card-outline' : 'archive-outline'}
              size={16}
              color={mau.cam}
            />
            <Chu
              style={{
                color: mau.cam,
                fontSize: 13,
                flex: 1,
              }}
            >
              {canThanhToan
                ? `Cần thanh toán ${tien(don.so_tien_con_phai_thanh_toan)} trước ${ngayGio(don.han_thanh_toan)}`
                : 'Hàng đang đến. Xác nhận khi bạn đã nhận.'}
            </Chu>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const kieu = StyleSheet.create({
  danhSach: {
    padding: khoang.l,
    gap: khoang.m,
    paddingBottom: 48,
  },
  chuyen: {
    flexDirection: 'row',
    backgroundColor: mau.nenThe,
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: mau.vien,
    marginBottom: khoang.s,
  },
  oChuyen: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 999,
  },
  oChuyenChon: { backgroundColor: mau.vang },
  the: {
    backgroundColor: mau.nenThe,
    borderWidth: 1,
    borderColor: mau.vien,
    borderRadius: bo.the + 4,
    padding: khoang.l,
    gap: khoang.m,
  },
  hang: {
    flexDirection: 'row',
    gap: khoang.m,
    alignItems: 'center',
  },
  anh: {
    width: 84,
    height: 84,
    borderRadius: bo.the,
    overflow: 'hidden',
  },
  chan: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: mau.vien,
    paddingTop: khoang.m,
  },
  nhacViec: {
    flexDirection: 'row',
    gap: khoang.s,
    alignItems: 'center',
    backgroundColor: 'rgba(226,166,90,0.08)',
    borderRadius: bo.nut,
    padding: khoang.m,
  },
});
