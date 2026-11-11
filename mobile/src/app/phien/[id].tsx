import { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { doc } from '@/lib/api';
import { bo, khoang, mau } from '@/lib/giao-dien';
import { ngayGio, nhan, tenGiaPhien, tien } from '@/lib/dinh-dang';
import { usePhienDangNhap } from '@/lib/phien-dang-nhap';
import type { LuotGia, Phien, SanPham } from '@/lib/kieu';
import {
  AnhSanPham,
  Chu,
  DemNguoc,
  ManHinhCho,
  NhanTrangThai,
  The,
  TieuDe,
} from '@/components/giao-dien';
import { ThamGiaPhien } from '@/components/tham-gia-phien';

const RONG = Dimensions.get('window').width;

// Giá lóe vàng mỗi khi có lượt giá mới để người xem nhận ra ngay.
function GiaNhapNhay({ gia }: { gia: string }) {
  const sang = useSharedValue(0);
  const truoc = useRef(gia);
  const kieuSang = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + sang.get() * 0.06 }],
    opacity: 1 - sang.get() * 0.15,
  }));

  useEffect(() => {
    if (truoc.current !== gia) {
      truoc.current = gia;
      sang.set(withSequence(withTiming(1, { duration: 180 }), withTiming(0, { duration: 420 })));
    }
  }, [gia, sang]);

  return (
    <Animated.Text style={[kieu.gia, kieuSang]} accessibilityLiveRegion="polite">
      {tien(gia)}
    </Animated.Text>
  );
}

export default function ChiTietPhien() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { nguoiDung } = usePhienDangNhap();
  const [anh, datAnh] = useState(0);
  const phien = useQuery({
    queryKey: [`/auctions/${id}`],
    queryFn: () => doc<Phien>(`/auctions/${id}`),
  });
  const sanPham = useQuery({
    queryKey: [`/products/${phien.data?.san_pham_id}`],
    queryFn: () => doc<SanPham>(`/products/${phien.data?.san_pham_id}`),
    enabled: !!phien.data,
  });
  const lichSu = useQuery({
    queryKey: [`/auctions/${id}/bids?limit=10`],
    queryFn: () => doc<LuotGia[]>(`/auctions/${id}/bids?limit=10`),
  });

  if (!phien.data) {
    return (
      <ManHinhCho dangTai={phien.isPending} loi={phien.error} thuLai={() => void phien.refetch()} />
    );
  }

  const p = phien.data;
  const cacAnh = sanPham.data?.hinh_anh.length
    ? sanPham.data.hinh_anh.map((h) => h.duong_dan_anh)
    : [p.anh_chinh];
  const dangMo = ['HOAT_DONG', 'DA_LEN_LICH'].includes(p.trang_thai);
  const nguoiDanDau = p.nguoi_dan_dau
    ? p.nguoi_dan_dau === `ND-${nguoiDung?.id}`
      ? 'Bạn'
      : p.nguoi_dan_dau
    : null;

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 48 }}
      refreshControl={
        <RefreshControl
          refreshing={phien.isRefetching}
          tintColor={mau.vang}
          onRefresh={() => {
            void phien.refetch();
            void lichSu.refetch();
          }}
        />
      }
    >
      <Stack.Screen options={{ title: `Phiên #${p.id}` }} />
      <View>
        <FlatList
          data={cacAnh}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          onMomentumScrollEnd={(e) => datAnh(Math.round(e.nativeEvent.contentOffset.x / RONG))}
          renderItem={({ item }) => (
            <View style={{ width: RONG }}>
              <AnhSanPham src={item} cao={RONG * 0.85} vuong />
            </View>
          )}
        />
        <LinearGradient
          colors={['rgba(11,12,10,0)', 'rgba(11,12,10,1)']}
          style={kieu.chanAnh}
          pointerEvents="none"
        />
        {cacAnh.length > 1 && (
          <View style={kieu.chamAnh}>
            {cacAnh.map((_, i) => (
              <View key={i} style={[kieu.cham, i === anh && kieu.chamChon]} />
            ))}
          </View>
        )}
      </View>

      <View style={kieu.noiDung}>
        <Animated.View entering={FadeInDown.springify().damping(18)} style={{ gap: khoang.s }}>
          <NhanTrangThai giaTri={p.trang_thai} />
          {!!p.ten_danh_muc && <Chu style={kieu.danhMuc}>{p.ten_danh_muc.toUpperCase()}</Chu>}
          <TieuDe>{p.tieu_de}</TieuDe>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).springify().damping(18)}>
          <LinearGradient
            colors={['rgba(213,183,120,0.16)', 'rgba(213,183,120,0.02)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={kieu.khungGia}
          >
            <Chu phu>{tenGiaPhien(p.trang_thai, p.ly_do_ket_thuc)}</Chu>
            <GiaNhapNhay gia={p.gia_hien_tai} />
            <View style={kieu.hangGiua}>
              <Chu phu>{p.tong_luot_tra_gia} lượt trả giá</Chu>
              {nguoiDanDau && (
                <Chu style={{ color: nguoiDanDau === 'Bạn' ? mau.xanh : mau.chu, fontSize: 13 }}>
                  Dẫn đầu: {nguoiDanDau}
                </Chu>
              )}
            </View>
            {dangMo && (
              <View style={kieu.vach}>
                <DemNguoc batDau={p.thoi_gian_bat_dau} ketThuc={p.thoi_gian_ket_thuc} />
                <Chu phu style={{ fontSize: 12 }}>
                  Kết thúc {ngayGio(p.thoi_gian_ket_thuc)}
                </Chu>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        <View style={kieu.luoi}>
          <ODuLieu nhanO="Giá khởi điểm" giaTri={tien(p.gia_khoi_diem)} />
          <ODuLieu nhanO="Phí vận chuyển" giaTri={tien(p.phi_van_chuyen)} />
          <ODuLieu
            nhanO="Đặt cọc"
            giaTri={Number(p.yeu_cau_dat_coc) ? tien(p.so_tien_dat_coc) : 'Không yêu cầu'}
          />
          {!!Number(p.cho_phep_mua_ngay) && !!p.gia_mua_ngay && (
            <ODuLieu nhanO="Mua ngay" giaTri={tien(p.gia_mua_ngay)} />
          )}
        </View>

        <ThamGiaPhien phien={p} />

        {!!sanPham.data && (
          <The>
            <Chu dam style={{ fontSize: 17 }}>
              Câu chuyện sản phẩm
            </Chu>
            <Chu phu>
              {nhan(sanPham.data.tinh_trang_san_pham)}
              {sanPham.data.thuong_hieu ? ` · ${sanPham.data.thuong_hieu}` : ''}
            </Chu>
            <Chu>{sanPham.data.mo_ta}</Chu>
          </The>
        )}

        <The>
          <Chu dam style={{ fontSize: 17 }}>
            Lịch sử trả giá
          </Chu>
          <Chu phu>
            Chỉ hiển thị giá công khai. Mức tối đa của người tham gia luôn được giữ kín.
          </Chu>
          {(lichSu.data || []).length === 0 && <Chu phu>Phiên chưa có lượt trả giá.</Chu>}
          {(lichSu.data || []).map((luot, i) => (
            <View key={luot.id} style={[kieu.dongGia, i === 0 && kieu.dongDau]}>
              <View>
                <Chu>{luot.nguoi_tra_gia}</Chu>
                <Chu phu style={{ fontSize: 12 }}>
                  {ngayGio(luot.ngay_tao)}
                </Chu>
              </View>
              <Chu dam style={{ color: i === 0 ? mau.vang : mau.chu }}>
                {tien(luot.so_tien)}
              </Chu>
            </View>
          ))}
        </The>
      </View>
    </ScrollView>
  );
}

function ODuLieu({ nhanO, giaTri }: { nhanO: string; giaTri: string }) {
  return (
    <View style={kieu.o}>
      <Chu phu style={{ fontSize: 12 }}>
        {nhanO}
      </Chu>
      <Chu dam>{giaTri}</Chu>
    </View>
  );
}

const kieu = StyleSheet.create({
  chanAnh: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  chamAnh: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  cham: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  chamChon: { width: 18, backgroundColor: mau.vang },
  noiDung: {
    padding: khoang.l,
    gap: khoang.l,
    marginTop: -24,
  },
  danhMuc: {
    color: mau.vang,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  khungGia: {
    borderRadius: bo.the + 4,
    borderWidth: 1,
    borderColor: 'rgba(213,183,120,0.3)',
    padding: khoang.l,
    gap: khoang.xs,
  },
  gia: {
    color: mau.vang,
    fontFamily: 'BeVietnamPro_600SemiBold',
    fontSize: 34,
    lineHeight: 42,
    alignSelf: 'flex-start',
  },
  hangGiua: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vach: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(213,183,120,0.2)',
    marginTop: khoang.s,
    paddingTop: khoang.s,
    gap: 2,
  },
  luoi: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: khoang.s,
  },
  o: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: mau.nenThe,
    borderWidth: 1,
    borderColor: mau.vien,
    borderRadius: bo.nut,
    padding: khoang.m,
    gap: 2,
  },
  dongGia: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: khoang.s,
    borderTopWidth: 1,
    borderTopColor: mau.vien,
  },
  dongDau: { borderTopWidth: 0 },
});
