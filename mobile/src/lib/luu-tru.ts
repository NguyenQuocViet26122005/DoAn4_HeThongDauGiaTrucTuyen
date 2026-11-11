import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Token đăng nhập lưu trong kho bảo mật của điện thoại (Keychain/Keystore).
// Bản web dùng để xem thử không có SecureStore nên tạm dùng sessionStorage như web VietBid.
const KHOA = 'vietbid-token';

export async function docToken() {
  if (Platform.OS === 'web') {
    return globalThis.sessionStorage?.getItem(KHOA) ?? null;
  }

  return SecureStore.getItemAsync(KHOA);
}

export async function luuToken(token: string | null) {
  if (Platform.OS === 'web') {
    if (token) {
      globalThis.sessionStorage?.setItem(KHOA, token);
    } else {
      globalThis.sessionStorage?.removeItem(KHOA);
    }

    return;
  }
  if (token) {
    await SecureStore.setItemAsync(KHOA, token);
  } else {
    await SecureStore.deleteItemAsync(KHOA);
  }
}
