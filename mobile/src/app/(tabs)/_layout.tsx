import { Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { doc } from '@/lib/api';
import { mau, phong } from '@/lib/giao-dien';
import { usePhienDangNhap } from '@/lib/phien-dang-nhap';

export default function BoCucTab() {
  const { nguoiDung } = usePhienDangNhap();
  const chuaDoc = useQuery({
    queryKey: ['/notifications/unread-count'],
    queryFn: () => doc<{ chua_doc: number }>('/notifications/unread-count'),
    enabled: !!nguoiDung,
    refetchInterval: 30_000,
  });
  const soChuaDoc = Number(chuaDoc.data?.chua_doc || 0);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: mau.nen },
        headerTitleStyle: { fontFamily: phong.thanDam, color: mau.chu },
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: mau.nen, borderTopColor: mau.vien },
        tabBarActiveTintColor: mau.vang,
        tabBarInactiveTintColor: mau.chuMo,
        tabBarLabelStyle: { fontFamily: phong.thanVua, fontSize: 11 },
        sceneStyle: { backgroundColor: mau.nen },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Khám phá',
          headerTitle: () => (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="diamond" size={18} color={mau.vang} />
              <Text
                style={{
                  fontFamily: phong.tieuDe,
                  fontSize: 26,
                  color: mau.chu,
                }}
              >
                Viet<Text style={{ color: mau.vang, fontFamily: phong.tieuDeNghieng }}>Bid</Text>
              </Text>
            </View>
          ),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="diamond-outline" color={String(color)} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="don-hang"
        options={{
          title: 'Đơn hàng',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" color={String(color)} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="thong-bao"
        options={{
          title: 'Thông báo',
          tabBarBadge: soChuaDoc ? (soChuaDoc > 99 ? '99+' : soChuaDoc) : undefined,
          tabBarBadgeStyle: { backgroundColor: mau.vang, color: mau.nen },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" color={String(color)} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="tai-khoan"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" color={String(color)} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
