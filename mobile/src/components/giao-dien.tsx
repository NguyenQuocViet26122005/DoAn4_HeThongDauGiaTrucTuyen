import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextProps,
  type ViewProps,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { bo, khoang, mau, phong } from '@/lib/giao-dien';
import { duongDanAnh, loiDeDoc } from '@/lib/api';
import { demNguoc, mocThoiGian, nhan } from '@/lib/dinh-dang';
import { gioMayChu } from '@/lib/gio-may-chu';

export function Chu({ style, phu, dam, ...props }: TextProps & { phu?: boolean; dam?: boolean }) {
  return (
    <Text
      {...props}
      style={[
        kieu.chu,
        phu && { color: mau.chuPhu, fontSize: 13 },
        dam && { fontFamily: phong.thanDam },
        style,
      ]}
    />
  );
}

export function TieuDe({ style, nho, ...props }: TextProps & { nho?: boolean }) {
  return <Text {...props} style={[kieu.tieuDe, nho && { fontSize: 22, lineHeight: 28 }, style]} />;
}

export function The({ style, ...props }: ViewProps) {
  return <View {...props} style={[kieu.the, style]} />;
}

export function Nut({
  ten,
  onPress,
  phu,
  nguyHiem,
  dangTai,
  khoa,
  bieuTuong,
}: {
  ten: string;
  onPress: () => void;
  phu?: boolean;
  nguyHiem?: boolean;
  dangTai?: boolean;
  khoa?: boolean;
  bieuTuong?: keyof typeof Ionicons.glyphMap;
}) {
  const tat = khoa || dangTai;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!tat }}
      disabled={tat}
      onPress={onPress}
      style={({ pressed }) => [
        kieu.nut,
        phu ? kieu.nutPhu : kieu.nutChinh,
        nguyHiem && { borderColor: mau.do },
        tat && { opacity: 0.45 },
        pressed && { opacity: 0.8 },
      ]}
    >
      {dangTai ? (
        <ActivityIndicator color={phu ? mau.vang : mau.nen} />
      ) : (
        <View style={kieu.hang}>
          {bieuTuong && <Ionicons name={bieuTuong} size={18} color={phu ? mau.vang : mau.nen} />}
          <Text style={[kieu.chuNut, phu && { color: nguyHiem ? mau.do : mau.vang }]}>{ten}</Text>
        </View>
      )}
    </Pressable>
  );
}

const mauTrangThai: Record<string, string> = {
  HOAT_DONG: mau.xanh,
  HOAN_THANH: mau.xanh,
  DA_DAT_COC: mau.xanh,
  DA_LEN_LICH: mau.vang,
  CHO_THANH_TOAN: mau.cam,
  CHO_GUI_HANG: mau.vang,
  DA_GUI_HANG: mau.vang,
  DANG_KIEM_TRA: mau.vang,
  DA_HUY: mau.do,
  THAT_BAI: mau.do,
  DANG_TRANH_CHAP: mau.do,
};

export function NhanTrangThai({ giaTri }: { giaTri: string }) {
  const m = mauTrangThai[giaTri] || mau.chuPhu;

  return (
    <View style={[kieu.nhan, { borderColor: m }]}>
      <Text style={[kieu.chuNhan, { color: m }]}>{nhan(giaTri)}</Text>
    </View>
  );
}

export function AnhSanPham({
  src,
  cao = 180,
  vuong,
}: {
  src?: string | null;
  cao?: number;
  vuong?: boolean;
}) {
  const url = duongDanAnh(src);
  const khung = [kieu.anh, { height: cao }, vuong && { borderRadius: 0 }];

  return url ? (
    <Image source={url} style={khung} contentFit="cover" transition={250} />
  ) : (
    <View style={[...khung, kieu.anhTrong]}>
      <Ionicons name="diamond-outline" size={36} color={mau.vangDam} />
    </View>
  );
}

export function OTruong({ nhanTruong, ...props }: TextInputProps & { nhanTruong: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Chu phu>{nhanTruong}</Chu>
      <TextInput placeholderTextColor={mau.chuMo} {...props} style={[kieu.o, props.style]} />
    </View>
  );
}

// Trạng thái chung cho màn hình lấy dữ liệu: đang tải, lỗi kèm nút thử lại, hoặc rỗng.
export function ManHinhCho({
  dangTai,
  loi,
  thuLai,
  rong,
  thongDiepRong,
  children,
}: {
  dangTai: boolean;
  loi?: unknown;
  thuLai?: () => void;
  rong?: boolean;
  thongDiepRong?: string;
  children?: ReactNode;
}) {
  if (dangTai) {
    return (
      <View style={kieu.giua}>
        <ActivityIndicator color={mau.vang} size="large" />
      </View>
    );
  }
  if (loi) {
    return (
      <View style={kieu.giua}>
        <Chu style={{ textAlign: 'center' }}>{loiDeDoc(loi)}</Chu>
        {thuLai && <Nut ten="Thử lại" phu onPress={thuLai} />}
      </View>
    );
  }
  if (rong) {
    return (
      <View style={kieu.giua}>
        <Ionicons name="file-tray-outline" size={36} color={mau.chuMo} />
        <Chu phu style={{ textAlign: 'center' }}>
          {thongDiepRong || 'Chưa có dữ liệu.'}
        </Chu>
      </View>
    );
  }

  return <>{children}</>;
}

// Đếm ngược theo giờ máy chủ, cập nhật mỗi giây.
export function DemNguoc({ batDau, ketThuc }: { batDau?: string; ketThuc: string }) {
  const [hienTai, datHienTai] = useState(gioMayChu);

  useEffect(() => {
    const dem = setInterval(() => datHienTai(gioMayChu()), 1000);

    return () => clearInterval(dem);
  }, []);

  const chuaBatDau = !!batDau && mocThoiGian(batDau) > hienTai;
  const conLai = mocThoiGian(chuaBatDau ? batDau : ketThuc) - hienTai;

  return (
    <View style={kieu.hang}>
      <Ionicons name="time-outline" size={15} color={conLai < 60_000 ? mau.do : mau.chuPhu} />
      <Chu phu style={conLai < 60_000 && conLai > 0 ? { color: mau.do } : undefined}>
        {chuaBatDau ? `Bắt đầu sau ${demNguoc(conLai)}` : demNguoc(conLai)}
      </Chu>
    </View>
  );
}

const BUOC_DON = ['Thanh toán', 'Gửi hàng', 'Nhận và kiểm tra', 'Hoàn thành'];
const VI_TRI_BUOC: Record<string, number> = {
  CHO_THANH_TOAN: 0,
  CHO_GUI_HANG: 1,
  DA_THANH_TOAN: 1,
  DA_GUI_HANG: 2,
  DA_GIAO: 2,
  DANG_KIEM_TRA: 2,
  DANG_TRANH_CHAP: 2,
  HOAN_THANH: 4,
};

export function TienTrinhDon({ trangThai }: { trangThai: string }) {
  const viTri = VI_TRI_BUOC[trangThai];

  if (viTri === undefined) {
    return null;
  }

  return (
    <View style={kieu.tienTrinh}>
      {BUOC_DON.map((buoc, i) => (
        <View key={buoc} style={{ flex: 1, gap: 6 }}>
          <View
            style={[
              kieu.vach,
              { backgroundColor: i < viTri ? mau.vang : i === viTri ? mau.vangDam : mau.vien },
            ]}
          />
          <Text
            style={[kieu.chuBuoc, i === viTri && { color: mau.chu, fontFamily: phong.thanVua }]}
          >
            {buoc}
          </Text>
        </View>
      ))}
    </View>
  );
}

export const kieu = StyleSheet.create({
  chu: {
    color: mau.chu,
    fontFamily: phong.than,
    fontSize: 15,
    lineHeight: 22,
  },
  tieuDe: {
    color: mau.chu,
    fontFamily: phong.tieuDe,
    fontSize: 30,
    lineHeight: 36,
  },
  the: {
    backgroundColor: mau.nenThe,
    borderColor: mau.vien,
    borderWidth: 1,
    borderRadius: bo.the,
    padding: khoang.l,
    gap: khoang.s,
  },
  nut: {
    minHeight: 48,
    borderRadius: bo.nut,
    paddingHorizontal: khoang.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutChinh: { backgroundColor: mau.vang },
  nutPhu: { borderWidth: 1, borderColor: mau.vangDam },
  chuNut: {
    color: mau.nen,
    fontFamily: phong.thanDam,
    fontSize: 15,
  },
  hang: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nhan: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chuNhan: { fontFamily: phong.thanVua, fontSize: 12 },
  anh: {
    width: '100%',
    borderRadius: bo.the,
    backgroundColor: mau.nenNoi,
  },
  anhTrong: { alignItems: 'center', justifyContent: 'center' },
  o: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: mau.vien,
    borderRadius: bo.nut,
    paddingHorizontal: khoang.m,
    color: mau.chu,
    fontFamily: phong.than,
    fontSize: 16,
    backgroundColor: mau.nenNoi,
  },
  giua: {
    flex: 1,
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: khoang.m,
    padding: khoang.xl,
  },
  tienTrinh: {
    flexDirection: 'row',
    gap: 6,
    marginTop: khoang.s,
  },
  vach: { height: 4, borderRadius: 2 },
  chuBuoc: {
    color: mau.chuPhu,
    fontFamily: phong.than,
    fontSize: 11,
  },
});
