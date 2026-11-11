import { Alert, Platform } from 'react-native';

// Hộp xác nhận trước thao tác có hậu quả (đặt giá, thanh toán). Alert của React Native
// không chạy trên bản web xem thử nên dùng window.confirm ở đó.
export function xacNhan(tieuDe: string, noiDung: string, nutDongY = 'Xác nhận') {
  if (Platform.OS === 'web') {
    return Promise.resolve(globalThis.confirm?.(`${tieuDe}\n\n${noiDung}`) ?? false);
  }

  return new Promise<boolean>((traVe) =>
    Alert.alert(tieuDe, noiDung, [
      {
        text: 'Quay lại',
        style: 'cancel',
        onPress: () => traVe(false),
      },
      { text: nutDongY, onPress: () => traVe(true) },
    ]),
  );
}

export function thongBao(tieuDe: string, noiDung = '') {
  if (Platform.OS === 'web') {
    globalThis.alert?.(noiDung ? `${tieuDe}\n\n${noiDung}` : tieuDe);
  } else {
    Alert.alert(tieuDe, noiDung);
  }
}
