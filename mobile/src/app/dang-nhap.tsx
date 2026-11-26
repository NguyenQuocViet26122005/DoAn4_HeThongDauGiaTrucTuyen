import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, LinearTransition } from 'react-native-reanimated';
import { gui, loiDeDoc } from '@/lib/api';
import { bo, khoang, mau, phong } from '@/lib/giao-dien';
import { usePhienDangNhap } from '@/lib/phien-dang-nhap';
import { Chu, Nut, OTruong, TieuDe } from '@/components/giao-dien';

export default function DangNhap() {
  const { dangNhap } = usePhienDangNhap();
  const [dangKy, datDangKy] = useState(false);
  const [hoTen, datHoTen] = useState('');
  const [soDienThoai, datSoDienThoai] = useState('');
  const [email, datEmail] = useState('');
  const [matKhau, datMatKhau] = useState('');
  const [hienMatKhau, datHienMatKhau] = useState(false);
  const [dangGui, datDangGui] = useState(false);
  const [loi, datLoi] = useState('');

  async function guiBieuMau() {
    if (dangGui) {
      return;
    }
    if (!email.trim() || !matKhau || (dangKy && !hoTen.trim())) {
      datLoi(dangKy ? 'Nhập họ tên, email và mật khẩu.' : 'Nhập email và mật khẩu.');

      return;
    }

    datDangGui(true);
    datLoi('');
    try {
      if (dangKy) {
        await gui('/auth/register', {
          email: email.trim(),
          mat_khau: matKhau,
          ho_ten: hoTen.trim(),
          ...(soDienThoai.trim() ? { so_dien_thoai: soDienThoai.trim() } : {}),
        });
      }
      await dangNhap(email, matKhau);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    } catch (loiGui) {
      datLoi(loiDeDoc(loiGui));
    } finally {
      datDangGui(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: mau.nen }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={kieu.khung} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInUp.springify().damping(16)} style={kieu.logo}>
          <View style={kieu.oLogo}>
            <Ionicons name="diamond" size={30} color={mau.nen} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify().damping(18)} style={{ gap: 4 }}>
          <TieuDe style={kieu.tieuDe}>{dangKy ? 'Tạo tài khoản' : 'Đăng nhập'}</TieuDe>
          <Chu phu style={{ textAlign: 'center' }}>
            {dangKy
              ? 'Một tài khoản để đấu giá, theo dõi đơn và nhận thông báo tức thì.'
              : 'Đăng nhập để đặt giá và theo dõi các phiên bạn quan tâm.'}
          </Chu>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).springify().damping(18)} style={kieu.chuyen}>
          {[
            { ten: 'Đăng nhập', giaTri: false },
            { ten: 'Đăng ký', giaTri: true },
          ].map((muc) => {
            const chon = dangKy === muc.giaTri;

            return (
              <Pressable
                key={muc.ten}
                accessibilityRole="tab"
                accessibilityState={{ selected: chon }}
                onPress={() => {
                  datDangKy(muc.giaTri);
                  datLoi('');
                }}
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
        </Animated.View>

        <Animated.View
          layout={LinearTransition.springify().damping(18)}
          entering={FadeInDown.delay(260).springify().damping(18)}
          style={kieu.bieuMau}
        >
          {dangKy && (
            <Animated.View entering={FadeInDown} style={{ gap: khoang.m }}>
              <OTruong
                nhanTruong="Họ và tên"
                value={hoTen}
                onChangeText={datHoTen}
                autoComplete="name"
                maxLength={100}
              />
              <OTruong
                nhanTruong="Số điện thoại (không bắt buộc)"
                value={soDienThoai}
                onChangeText={datSoDienThoai}
                keyboardType="phone-pad"
                autoComplete="tel"
                maxLength={20}
              />
            </Animated.View>
          )}
          <OTruong
            nhanTruong="Email"
            value={email}
            onChangeText={datEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
          />
          <View>
            <OTruong
              nhanTruong="Mật khẩu"
              value={matKhau}
              onChangeText={datMatKhau}
              secureTextEntry={!hienMatKhau}
              autoComplete={dangKy ? 'new-password' : 'current-password'}
              onSubmitEditing={() => void guiBieuMau()}
              style={{ paddingRight: 48 }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={hienMatKhau ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              onPress={() => datHienMatKhau((v) => !v)}
              style={kieu.nutMat}
              hitSlop={8}
            >
              <Ionicons
                name={hienMatKhau ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={mau.chuPhu}
              />
            </Pressable>
          </View>
          {dangKy && (
            <Chu phu style={{ fontSize: 12 }}>
              Mật khẩu tối thiểu 8 ký tự.
            </Chu>
          )}
          {!!loi && (
            <Animated.View entering={FadeInDown} style={kieu.loi}>
              <Ionicons name="alert-circle-outline" size={18} color={mau.do} />
              <Chu
                style={{
                  color: mau.do,
                  flex: 1,
                  fontSize: 14,
                }}
              >
                {loi}
              </Chu>
            </Animated.View>
          )}
          <Nut
            ten={dangKy ? 'Tạo tài khoản và vào VietBid' : 'Đăng nhập'}
            bieuTuong={dangKy ? 'sparkles-outline' : 'log-in-outline'}
            dangTai={dangGui}
            onPress={() => void guiBieuMau()}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(340)} style={kieu.camKet}>
          {[
            ['shield-checkmark-outline', 'Tiền được giữ trung gian đến khi bạn nhận hàng'],
            ['ribbon-outline', 'Sản phẩm giá trị được kiểm định trước khi lên sàn'],
          ].map(([bieuTuong, noiDung]) => (
            <View key={noiDung} style={kieu.dongCamKet}>
              <Ionicons name={bieuTuong as 'ribbon-outline'} size={16} color={mau.vang} />
              <Chu phu style={{ flex: 1, fontSize: 12 }}>
                {noiDung}
              </Chu>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const kieu = StyleSheet.create({
  khung: {
    padding: khoang.xl,
    paddingTop: khoang.xl,
    gap: khoang.xl,
    flexGrow: 1,
  },
  logo: { alignItems: 'center' },
  oLogo: {
    width: 72,
    height: 72,
    borderRadius: bo.the,
    backgroundColor: mau.vang,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tieuDe: {
    fontSize: 38,
    lineHeight: 44,
    textAlign: 'center',
  },
  chuyen: {
    flexDirection: 'row',
    backgroundColor: mau.nenThe,
    borderRadius: bo.nut,
    padding: 4,
    borderWidth: 1,
    borderColor: mau.vien,
  },
  oChuyen: {
    flex: 1,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: bo.nut,
  },
  oChuyenChon: { backgroundColor: mau.vang },
  bieuMau: {
    gap: khoang.m,
    backgroundColor: mau.nenThe,
    borderRadius: bo.the,
    borderWidth: 1,
    borderColor: mau.vien,
    padding: khoang.l,
  },
  nutMat: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loi: {
    flexDirection: 'row',
    gap: khoang.s,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(224,122,111,0.4)',
    backgroundColor: 'rgba(224,122,111,0.08)',
    borderRadius: bo.nut,
    padding: khoang.m,
  },
  camKet: { gap: khoang.s, paddingHorizontal: khoang.s },
  dongCamKet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: khoang.s,
  },
});
