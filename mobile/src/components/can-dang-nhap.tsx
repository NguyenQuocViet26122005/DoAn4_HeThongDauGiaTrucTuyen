import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { khoang, mau } from '@/lib/giao-dien';
import { Chu, Nut, TieuDe } from './giao-dien';

// Màn chờ đăng nhập dùng chung cho các tab cần tài khoản.
export function CanDangNhap({
  bieuTuong,
  tieuDe,
  moTa,
}: {
  bieuTuong: keyof typeof Ionicons.glyphMap;
  tieuDe: string;
  moTa: string;
}) {
  return (
    <View style={kieu.khung}>
      <Animated.View entering={FadeInDown.springify().damping(16)}>
        <View style={kieu.vong}>
          <Ionicons name={bieuTuong} size={40} color={mau.vang} />
        </View>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(90).springify().damping(18)} style={{ gap: 6 }}>
        <TieuDe style={{ textAlign: 'center' }}>{tieuDe}</TieuDe>
        <Chu phu style={{ textAlign: 'center' }}>
          {moTa}
        </Chu>
      </Animated.View>
      <Animated.View
        entering={FadeInDown.delay(180).springify().damping(18)}
        style={{ alignSelf: 'stretch' }}
      >
        <Nut ten="Đăng nhập" bieuTuong="log-in-outline" onPress={() => router.push('/dang-nhap')} />
      </Animated.View>
    </View>
  );
}

const kieu = StyleSheet.create({
  khung: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: khoang.xl,
    gap: khoang.l,
  },
  vong: {
    backgroundColor: mau.nenNoi,
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(213,183,120,0.35)',
  },
});
