import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { doc } from '@/lib/api';
import { bo, khoang, mau, phong } from '@/lib/giao-dien';
import type { Phien } from '@/lib/kieu';
import { Chu, ManHinhCho, TieuDeTrang } from '@/components/giao-dien';
import { ThePhien } from '@/components/the-phien';

const BO_LOC = [
  { giaTri: 'HOAT_DONG', ten: 'Đang diễn ra' },
  { giaTri: 'DA_LEN_LICH', ten: 'Sắp diễn ra' },
  { giaTri: 'DA_KET_THUC', ten: 'Đã kết thúc' },
];

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
          <TieuDeTrang
            ten="Thế giới những giá trị đặc biệt"
            moTa="Một món đồ vừa ý. Một mức giá của riêng bạn."
          />
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
      renderItem={({ item }) => <ThePhien phien={item} />}
    />
  );
}

const kieu = StyleSheet.create({
  danhSach: {
    padding: khoang.l,
    gap: khoang.xl,
    paddingBottom: 48,
  },
  oTim: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: khoang.s,
    backgroundColor: mau.nenThe,
    borderWidth: 1,
    borderColor: mau.vien,
    borderRadius: bo.nut,
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
    borderRadius: bo.nut,
    paddingHorizontal: 16,
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: mau.nenThe,
  },
  locChon: { backgroundColor: mau.vang, borderColor: mau.vang },
});
