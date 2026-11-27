import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { diaChiTrang } from '@/lib/dieu-huong-web';
import { mau } from '@/lib/giao-dien';

// Bản xem trước mở chính website thay vì dựng lại một giao diện khác trong Expo Web.
export default function TrangWeb({ duongDan = '/' }: { duongDan?: string }) {
  useEffect(() => {
    window.location.replace(diaChiTrang(duongDan));
  }, [duongDan]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: mau.nen,
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator color={mau.vang} accessibilityLabel="Đang mở VietBid" />
    </View>
  );
}
