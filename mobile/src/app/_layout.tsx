import { useEffect } from 'react';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { QueryClientProvider } from '@tanstack/react-query';
import { BeVietnamPro_400Regular } from '@expo-google-fonts/be-vietnam-pro/400Regular';
import { BeVietnamPro_500Medium } from '@expo-google-fonts/be-vietnam-pro/500Medium';
import { BeVietnamPro_600SemiBold } from '@expo-google-fonts/be-vietnam-pro/600SemiBold';
import { CormorantGaramond_500Medium } from '@expo-google-fonts/cormorant-garamond/500Medium';
import { CormorantGaramond_500Medium_Italic } from '@expo-google-fonts/cormorant-garamond/500Medium_Italic';
import { boNho } from '@/lib/api';
import { mau, phong } from '@/lib/giao-dien';
import { NhaCungCapDangNhap, usePhienDangNhap } from '@/lib/phien-dang-nhap';
import { useCapNhatThoiGianThuc } from '@/lib/thoi-gian-thuc';

void SplashScreen.preventAutoHideAsync();

const giaoDienToi = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: mau.vang,
    background: mau.nen,
    card: mau.nen,
    text: mau.chu,
    border: mau.vien,
  },
};

function DieuHuong() {
  const { nguoiDung, dangKhoiTao } = usePhienDangNhap();

  useCapNhatThoiGianThuc(nguoiDung?.id);

  useEffect(() => {
    if (!dangKhoiTao) {
      void SplashScreen.hideAsync();
    }
  }, [dangKhoiTao]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: mau.nen },
        headerTintColor: mau.vang,
        headerTitleStyle: { fontFamily: phong.thanDam, color: mau.chu },
        contentStyle: { backgroundColor: mau.nen },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="dang-nhap" options={{ title: 'Đăng nhập', presentation: 'modal' }} />
      <Stack.Screen name="phien/[id]" options={{ title: 'Chi tiết phiên' }} />
      <Stack.Screen name="don-hang/[id]" options={{ title: 'Chi tiết đơn hàng' }} />
      <Stack.Screen name="dia-chi" options={{ title: 'Sổ địa chỉ' }} />
    </Stack>
  );
}

export default function BoCucGoc() {
  const [daTaiPhong] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    CormorantGaramond_500Medium,
    CormorantGaramond_500Medium_Italic,
  });

  if (!daTaiPhong) {
    return null;
  }

  return (
    <QueryClientProvider client={boNho}>
      <NhaCungCapDangNhap>
        <ThemeProvider value={giaoDienToi}>
          <StatusBar style="light" />
          <DieuHuong />
        </ThemeProvider>
      </NhaCungCapDangNhap>
    </QueryClientProvider>
  );
}
