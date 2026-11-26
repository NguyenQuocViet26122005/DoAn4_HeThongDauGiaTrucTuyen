import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { boNho, doc, gui, loiDeDoc } from '@/lib/api';
import { bo, khoang, mau, phong } from '@/lib/giao-dien';
import { ngayGio } from '@/lib/dinh-dang';
import { usePhienDangNhap } from '@/lib/phien-dang-nhap';
import { thongBao } from '@/lib/xac-nhan';
import type { ThongBao } from '@/lib/kieu';
import { Chu, ManHinhCho, TieuDeTrang } from '@/components/giao-dien';
import { CanDangNhap } from '@/components/can-dang-nhap';

// Chỉ mở các đích app có màn hình; đường dẫn khác trong dữ liệu không được điều hướng tùy ý.
function dichTrongApp(duongDan: string | null) {
  const khop = /^\/(auctions|orders)\/([1-9]\d*)$/.exec(duongDan || '');

  if (!khop) {
    return null;
  }

  return khop[1] === 'auctions'
    ? (`/phien/${khop[2]}` as const)
    : (`/don-hang/${khop[2]}` as const);
}

function bieuTuong(duongDan: string | null): keyof typeof Ionicons.glyphMap {
  if (duongDan?.startsWith('/auctions')) {
    return 'hammer-outline';
  }
  if (duongDan?.startsWith('/orders')) {
    return 'cube-outline';
  }
  if (duongDan?.startsWith('/disputes')) {
    return 'chatbubbles-outline';
  }

  return 'notifications-outline';
}

const lamMoi = () =>
  boNho.invalidateQueries({
    predicate: ({ queryKey }) =>
      typeof queryKey[0] === 'string' && queryKey[0].startsWith('/notifications'),
  });

export default function TrangThongBao() {
  const { nguoiDung } = usePhienDangNhap();
  const [chiChuaDoc, datChiChuaDoc] = useState(false);
  const duongDan = `/notifications?limit=40${chiChuaDoc ? '&unread=true' : ''}`;
  const truyVan = useQuery({
    queryKey: [duongDan],
    queryFn: () => doc<ThongBao[]>(duongDan),
    enabled: !!nguoiDung,
  });

  if (!nguoiDung) {
    return (
      <CanDangNhap
        bieuTuong="notifications-outline"
        tieuDe="Không bỏ lỡ nhịp nào"
        moTa="Đăng nhập để nhận báo khi bị vượt giá, khi thắng phiên và khi đơn được gửi."
      />
    );
  }

  async function doc1(muc: ThongBao) {
    try {
      if (!Number(muc.da_doc)) {
        await gui(`/notifications/${muc.id}/read`, {}, 'PATCH');
        await lamMoi();
      }
    } catch (loi) {
      thongBao('Chưa đánh dấu đã đọc', loiDeDoc(loi));
    }

    const dich = dichTrongApp(muc.duong_dan_lien_ket);

    if (dich) {
      router.push(dich);
    }
  }

  async function docTatCa() {
    try {
      await gui('/notifications/read-all', {}, 'PATCH');
      await lamMoi();
    } catch (loi) {
      thongBao('Chưa đánh dấu được', loiDeDoc(loi));
    }
  }

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
          <TieuDeTrang ten="Thông báo" moTa="Cập nhật từ phiên đấu giá và đơn hàng của bạn." />
          <View style={kieu.dau}>
            <View style={kieu.hangLoc}>
              {[
                { ten: 'Tất cả', giaTri: false },
                { ten: 'Chưa đọc', giaTri: true },
              ].map((muc) => {
                const chon = chiChuaDoc === muc.giaTri;

                return (
                  <Pressable
                    key={muc.ten}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: chon }}
                    onPress={() => datChiChuaDoc(muc.giaTri)}
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
            <Pressable
              accessibilityRole="button"
              onPress={() => void docTatCa()}
              style={{ minHeight: 48, justifyContent: 'center' }}
            >
              <Chu style={{ color: mau.vang, fontSize: 13 }}>Đọc tất cả</Chu>
            </Pressable>
          </View>
        </View>
      }
      ListEmptyComponent={
        <ManHinhCho
          dangTai={truyVan.isPending}
          loi={truyVan.error}
          thuLai={() => void truyVan.refetch()}
          rong
          thongDiepRong={chiChuaDoc ? 'Bạn đã đọc hết thông báo.' : 'Chưa có thông báo nào.'}
        />
      }
      renderItem={({ item, index }) => {
        const chuaDoc = !Number(item.da_doc);

        return (
          <Animated.View
            entering={FadeInDown.delay(Math.min(index, 8) * 45)
              .springify()
              .damping(18)}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => void doc1(item)}
              style={({ pressed }) => [
                kieu.the,
                chuaDoc && kieu.theChuaDoc,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View
                style={[kieu.vongIcon, chuaDoc && { backgroundColor: 'rgba(213,183,120,0.16)' }]}
              >
                <Ionicons
                  name={bieuTuong(item.duong_dan_lien_ket)}
                  size={20}
                  color={chuaDoc ? mau.vang : mau.chuPhu}
                />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Chu dam={chuaDoc} style={{ fontSize: 15 }}>
                  {item.tieu_de}
                </Chu>
                <Chu phu numberOfLines={3}>
                  {item.noi_dung.replace(/\s+mô phỏng/gi, '')}
                </Chu>
                <Chu style={{ color: mau.chuMo, fontSize: 11 }}>{ngayGio(item.ngay_tao)}</Chu>
              </View>
              {chuaDoc && <View style={kieu.chamMoi} />}
            </Pressable>
          </Animated.View>
        );
      }}
    />
  );
}

const kieu = StyleSheet.create({
  danhSach: {
    padding: khoang.l,
    gap: khoang.s,
    paddingBottom: 48,
  },
  dau: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: khoang.s,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: khoang.s,
  },
  hangLoc: { flexDirection: 'row', gap: khoang.s },
  loc: {
    borderWidth: 1,
    borderColor: mau.vien,
    borderRadius: bo.nut,
    paddingHorizontal: 14,
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: mau.nenThe,
  },
  locChon: { backgroundColor: mau.vang, borderColor: mau.vang },
  the: {
    flexDirection: 'row',
    gap: khoang.m,
    alignItems: 'flex-start',
    backgroundColor: mau.nenThe,
    borderWidth: 1,
    borderColor: mau.vien,
    borderRadius: bo.the,
    padding: khoang.m,
  },
  theChuaDoc: { borderColor: 'rgba(213,183,120,0.4)', backgroundColor: '#191a15' },
  vongIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mau.nenNoi,
  },
  chamMoi: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: mau.vang,
    marginTop: 6,
  },
});
