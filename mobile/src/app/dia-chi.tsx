import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { boNho, doc, gui, loiDeDoc } from '@/lib/api';
import { bo, khoang, mau, phong } from '@/lib/giao-dien';
import { usePhienDangNhap } from '@/lib/phien-dang-nhap';
import { thongBao, xacNhan } from '@/lib/xac-nhan';
import type { DiaChi } from '@/lib/kieu';
import { Chu, ManHinhCho, Nut, OTruong } from '@/components/giao-dien';

const CAC_TRUONG = [
  ['ten_nguoi_nhan', 'Tên người nhận', 100],
  ['sdt_nguoi_nhan', 'Số điện thoại', 20],
  ['tinh_thanh', 'Tỉnh / thành phố', 100],
  ['quan_huyen', 'Quận / huyện', 100],
  ['phuong_xa', 'Phường / xã', 100],
  ['dia_chi_chi_tiet', 'Số nhà, đường', 255],
] as const;

type Khoa = (typeof CAC_TRUONG)[number][0];
type BieuMau = Record<Khoa, string> & { la_mac_dinh: boolean };

const RONG: BieuMau = {
  ten_nguoi_nhan: '',
  sdt_nguoi_nhan: '',
  tinh_thanh: '',
  quan_huyen: '',
  phuong_xa: '',
  dia_chi_chi_tiet: '',
  la_mac_dinh: false,
};

const lamMoi = () => boNho.invalidateQueries({ queryKey: ['/users/me/addresses'] });

export default function SoDiaChi() {
  const { nguoiDung } = usePhienDangNhap();
  const truyVan = useQuery({
    queryKey: ['/users/me/addresses'],
    queryFn: () => doc<DiaChi[]>('/users/me/addresses'),
    enabled: !!nguoiDung,
  });
  // undefined: đang xem danh sách; null: thêm mới; DiaChi: đang sửa.
  const [dangSua, datDangSua] = useState<DiaChi | null>();
  const [bieuMau, datBieuMau] = useState<BieuMau>(RONG);
  const [dangLuu, datDangLuu] = useState(false);
  const [loi, datLoi] = useState('');

  if (!nguoiDung) {
    return <ManHinhCho dangTai={false} rong thongDiepRong="Đăng nhập để quản lý địa chỉ." />;
  }

  function moBieuMau(diaChi: DiaChi | null) {
    datDangSua(diaChi);
    datLoi('');
    datBieuMau(
      diaChi
        ? {
            ten_nguoi_nhan: diaChi.ten_nguoi_nhan,
            sdt_nguoi_nhan: diaChi.sdt_nguoi_nhan,
            tinh_thanh: diaChi.tinh_thanh,
            quan_huyen: diaChi.quan_huyen,
            phuong_xa: diaChi.phuong_xa,
            dia_chi_chi_tiet: diaChi.dia_chi_chi_tiet,
            la_mac_dinh: !!Number(diaChi.la_mac_dinh),
          }
        : { ...RONG, la_mac_dinh: !truyVan.data?.length },
    );
  }

  async function luu() {
    if (dangLuu) {
      return;
    }

    const daChuanHoa = { ...bieuMau };

    for (const [khoa, ten] of CAC_TRUONG) {
      daChuanHoa[khoa] = bieuMau[khoa].trim();
      if (!daChuanHoa[khoa]) {
        datLoi(`Vui lòng nhập ${ten.toLowerCase()}.`);

        return;
      }
    }
    if (!/^\+?[0-9 ()-]{8,20}$/.test(daChuanHoa.sdt_nguoi_nhan)) {
      datLoi('Nhập số điện thoại hợp lệ.');

      return;
    }

    datDangLuu(true);
    datLoi('');
    try {
      await gui(
        `/users/me/addresses${dangSua ? `/${dangSua.id}` : ''}`,
        daChuanHoa,
        dangSua ? 'PUT' : 'POST',
      );
      await lamMoi();
      datDangSua(undefined);
    } catch (loiLuu) {
      datLoi(loiDeDoc(loiLuu));
    } finally {
      datDangLuu(false);
    }
  }

  if (dangSua !== undefined) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={kieu.khung} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.springify().damping(18)} style={kieu.bieuMau}>
            <Chu dam style={{ fontSize: 18 }}>
              {dangSua ? 'Sửa địa chỉ' : 'Địa chỉ mới'}
            </Chu>
            {CAC_TRUONG.map(([khoa, ten, doDai]) => (
              <OTruong
                key={khoa}
                nhanTruong={ten}
                value={bieuMau[khoa]}
                maxLength={doDai}
                keyboardType={khoa === 'sdt_nguoi_nhan' ? 'phone-pad' : 'default'}
                onChangeText={(giaTri) => datBieuMau((cu) => ({ ...cu, [khoa]: giaTri }))}
              />
            ))}
            <View style={kieu.hangCongTac}>
              <View style={{ flex: 1 }}>
                <Chu>Dùng làm địa chỉ mặc định</Chu>
                <Chu phu style={{ fontSize: 12 }}>
                  Địa chỉ mặc định được dùng khi bạn thắng phiên.
                </Chu>
              </View>
              <Switch
                value={bieuMau.la_mac_dinh}
                onValueChange={(giaTri) => datBieuMau((cu) => ({ ...cu, la_mac_dinh: giaTri }))}
                trackColor={{ true: mau.vangDam, false: mau.vien }}
                thumbColor={bieuMau.la_mac_dinh ? mau.vang : mau.chuPhu}
              />
            </View>
            {!!loi && <Chu style={{ color: mau.do }}>{loi}</Chu>}
            <Nut
              ten="Lưu địa chỉ"
              bieuTuong="checkmark-outline"
              dangTai={dangLuu}
              onPress={() => void luu()}
            />
            <Nut ten="Quay lại" phu khoa={dangLuu} onPress={() => datDangSua(undefined)} />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView contentContainerStyle={kieu.khung}>
      <ManHinhCho
        dangTai={truyVan.isPending}
        loi={truyVan.error}
        thuLai={() => void truyVan.refetch()}
      >
        {(truyVan.data || []).length === 0 && (
          <View style={kieu.rong}>
            <Ionicons name="location-outline" size={40} color={mau.vang} />
            <Chu phu style={{ textAlign: 'center' }}>
              Thêm địa chỉ nhận hàng để có thể đặt cọc và đặt giá.
            </Chu>
          </View>
        )}
        {(truyVan.data || []).map((diaChi, i) => {
          const macDinh = !!Number(diaChi.la_mac_dinh);

          return (
            <Animated.View
              key={diaChi.id}
              entering={FadeInDown.delay(i * 60)
                .springify()
                .damping(18)}
              exiting={FadeOut}
              layout={LinearTransition}
              style={[kieu.the, macDinh && kieu.theMacDinh]}
            >
              <View style={kieu.hang}>
                <Ionicons name={macDinh ? 'home' : 'location-outline'} size={18} color={mau.vang} />
                <Chu dam style={{ flex: 1 }}>
                  {diaChi.ten_nguoi_nhan}
                </Chu>
                {macDinh && (
                  <View style={kieu.nhanMacDinh}>
                    <Chu
                      style={{
                        color: mau.nen,
                        fontSize: 11,
                        fontFamily: phong.thanDam,
                      }}
                    >
                      Mặc định
                    </Chu>
                  </View>
                )}
              </View>
              <Chu phu>{diaChi.sdt_nguoi_nhan}</Chu>
              <Chu>
                {[
                  diaChi.dia_chi_chi_tiet,
                  diaChi.phuong_xa,
                  diaChi.quan_huyen,
                  diaChi.tinh_thanh,
                ].join(', ')}
              </Chu>
              <View style={kieu.hangNut}>
                <Pressable accessibilityRole="button" onPress={() => moBieuMau(diaChi)} hitSlop={8}>
                  <Chu style={{ color: mau.vang, fontSize: 14 }}>Sửa</Chu>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={async () => {
                    if (
                      !(await xacNhan(
                        'Xóa địa chỉ',
                        `Xóa địa chỉ của ${diaChi.ten_nguoi_nhan}?`,
                        'Xóa',
                      ))
                    ) {
                      return;
                    }
                    try {
                      await gui(`/users/me/addresses/${diaChi.id}`, {}, 'DELETE');
                      await lamMoi();
                    } catch (loiXoa) {
                      thongBao('Chưa xóa được', loiDeDoc(loiXoa));
                    }
                  }}
                >
                  <Chu style={{ color: mau.do, fontSize: 14 }}>Xóa</Chu>
                </Pressable>
              </View>
            </Animated.View>
          );
        })}
        <Nut ten="Thêm địa chỉ" bieuTuong="add-outline" onPress={() => moBieuMau(null)} />
      </ManHinhCho>
    </ScrollView>
  );
}

const kieu = StyleSheet.create({
  khung: {
    padding: khoang.l,
    gap: khoang.m,
    paddingBottom: 48,
  },
  bieuMau: {
    gap: khoang.m,
    backgroundColor: mau.nenThe,
    borderWidth: 1,
    borderColor: mau.vien,
    borderRadius: bo.the + 4,
    padding: khoang.l,
  },
  hangCongTac: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: khoang.m,
  },
  rong: {
    alignItems: 'center',
    gap: khoang.m,
    padding: khoang.xl,
  },
  the: {
    backgroundColor: mau.nenThe,
    borderWidth: 1,
    borderColor: mau.vien,
    borderRadius: bo.the + 2,
    padding: khoang.l,
    gap: 4,
  },
  theMacDinh: { borderColor: 'rgba(213,183,120,0.45)' },
  hang: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: khoang.s,
  },
  nhanMacDinh: {
    backgroundColor: mau.vang,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  hangNut: {
    flexDirection: 'row',
    gap: khoang.xl,
    marginTop: khoang.s,
  },
});
