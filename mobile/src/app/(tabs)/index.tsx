import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { doc } from '@/lib/api';
import { bo, khoang, mau, phong } from '@/lib/giao-dien';
import type { Phien } from '@/lib/kieu';
import { Chu, ManHinhCho, TieuDe } from '@/components/giao-dien';
import { ThePhien } from '@/components/the-phien';

const BO_LOC = [
  { giaTri: 'HOAT_DONG', ten: 'Đang diễn ra' },
  { giaTri: 'DA_LEN_LICH', ten: 'Sắp mở' },
  { giaTri: 'DA_KET_THUC', ten: 'Đã kết thúc' },
];

function Hero({ soDangDienRa }: { soDangDienRa?: number }) {
  return (
    <Animated.View entering={FadeIn.duration(600)}>
      <LinearGradient
        colors={['#3a311d', '#1a1712', '#0b0c0a']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={kieu.hero}
      >
        <View style={kieu.vongSang} />
        <Animated.View entering={FadeInDown.delay(120).springify().damping(18)}>
          <Chu style={kieu.thuongHieu}>VIETBID · ĐẤU GIÁ & SƯU TẦM</Chu>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(220).springify().damping(18)}>
          <TieuDe style={kieu.dongMot}>Giá trị xứng tầm.</TieuDe>
          <TieuDe style={kieu.dongHai}>Cơ hội trong tầm tay.</TieuDe>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(320).springify().damping(18)}>
          <Chu phu style={{ fontSize: 14 }}>
            Món đồ được kiểm định, giá minh bạch, tiền được giữ an toàn đến khi bạn nhận hàng.
          </Chu>
        </Animated.View>
        {soDangDienRa != null && soDangDienRa > 0 && (
          <Animated.View entering={FadeInDown.delay(420)} style={kieu.chiSo}>
            <View style={kieu.chamSong} />
            <Chu style={{ color: mau.chu, fontSize: 13 }}>
              {soDangDienRa} phiên đang diễn ra ngay lúc này
            </Chu>
          </Animated.View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

export default function KhamPha() {
  const [trangThai, datTrangThai] = useState('HOAT_DONG');
  const [tuKhoa, datTuKhoa] = useState('');
  const [timKiem, datTimKiem] = useState('');
  const thamSo = new URLSearchParams({ trang_thai: trangThai, limit: '30' });

  if (timKiem) {
    thamSo.set('q', timKiem);
  }

  const duongDan = `/auctions?${thamSo}`;
  const truyVan = useQuery({ queryKey: [duongDan], queryFn: () => doc<Phien[]>(duongDan) });
  const dangDienRa = useQuery({
    queryKey: ['/auctions?trang_thai=HOAT_DONG&limit=50'],
    queryFn: () => doc<Phien[]>('/auctions?trang_thai=HOAT_DONG&limit=50'),
  });

  return (
    <FlatList
      data={truyVan.data || []}
      keyExtractor={(muc) => muc.id}
      contentContainerStyle={kieu.danhSach}
      refreshControl={
        <RefreshControl
          refreshing={truyVan.isRefetching}
          onRefresh={() => void truyVan.refetch()}
          tintColor={mau.vang}
        />
      }
      ListHeaderComponent={
        <View style={{ gap: khoang.l }}>
          <Hero soDangDienRa={dangDienRa.data?.length} />
          <View style={kieu.oTim}>
            <Ionicons name="search" size={18} color={mau.chuPhu} />
            <TextInput
              accessibilityLabel="Tìm sản phẩm"
              placeholder="Tìm điều bạn yêu thích…"
              placeholderTextColor={mau.chuMo}
              value={tuKhoa}
              onChangeText={datTuKhoa}
              returnKeyType="search"
              onSubmitEditing={() => datTimKiem(tuKhoa.trim())}
              style={kieu.chuTim}
            />
            {!!timKiem && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Xóa tìm kiếm"
                onPress={() => {
                  datTuKhoa('');
                  datTimKiem('');
                }}
              >
                <Ionicons name="close-circle" size={18} color={mau.chuMo} />
              </Pressable>
            )}
          </View>
          <View style={kieu.hangLoc}>
            {BO_LOC.map((muc) => {
              const chon = trangThai === muc.giaTri;

              return (
                <Pressable
                  key={muc.giaTri}
                  accessibilityRole="button"
                  accessibilityState={{ selected: chon }}
                  onPress={() => datTrangThai(muc.giaTri)}
                  style={[kieu.loc, chon && kieu.locChon]}
                >
                  <Chu
                    style={[
                      { fontSize: 13 },
                      chon && { color: mau.nen, fontFamily: phong.thanDam },
                    ]}
                  >
                    {muc.ten}
                  </Chu>
                </Pressable>
              );
            })}
          </View>
        </View>
      }
      ListEmptyComponent={
        <ManHinhCho
          dangTai={truyVan.isPending}
          loi={truyVan.error}
          thuLai={() => void truyVan.refetch()}
          rong
          thongDiepRong={
            timKiem ? `Không có phiên khớp “${timKiem}”.` : 'Chưa có phiên nào ở mục này.'
          }
        />
      }
      renderItem={({ item, index }) => <ThePhien phien={item} viTri={index} />}
    />
  );
}

const kieu = StyleSheet.create({
  danhSach: {
    padding: khoang.l,
    gap: khoang.xl,
    paddingBottom: 48,
  },
  hero: {
    borderRadius: bo.the + 8,
    padding: khoang.xl,
    gap: khoang.m,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(213,183,120,0.25)',
  },
  vongSang: {
    position: 'absolute',
    right: -60,
    top: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(213,183,120,0.16)',
  },
  thuongHieu: {
    color: mau.vang,
    fontSize: 11,
    letterSpacing: 2,
  },
  dongMot: { fontSize: 38, lineHeight: 44 },
  dongHai: {
    fontSize: 38,
    lineHeight: 44,
    color: mau.vang,
    fontFamily: phong.tieuDeNghieng,
  },
  chiSo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(11,12,10,0.6)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chamSong: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: mau.xanh,
  },
  oTim: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: khoang.s,
    backgroundColor: mau.nenThe,
    borderWidth: 1,
    borderColor: mau.vien,
    borderRadius: 999,
    paddingHorizontal: khoang.l,
    minHeight: 48,
  },
  chuTim: {
    flex: 1,
    color: mau.chu,
    fontFamily: phong.than,
    fontSize: 15,
    minHeight: 46,
  },
  hangLoc: {
    flexDirection: 'row',
    gap: khoang.s,
    flexWrap: 'wrap',
  },
  loc: {
    borderWidth: 1,
    borderColor: mau.vien,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: mau.nenThe,
  },
  locChon: { backgroundColor: mau.vang, borderColor: mau.vang },
});
