import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { diaChiTrang, phanLoaiUrl } from '@/lib/dieu-huong-web';
import { mau } from '@/lib/giao-dien';

export default function TrangWeb({ duongDan = '/' }: { duongDan?: string }) {
  const insets = useSafeAreaInsets();
  const web = useRef<WebView<unknown>>(null);
  const daSapTienTrinh = useRef(false);
  const [lanMo, datLanMo] = useState(0);
  const quayLai = useRef(false);
  const hienTai = useRef(diaChiTrang(duongDan));
  const [url, datUrl] = useState(() => diaChiTrang(duongDan));
  const [dangTai, datDangTai] = useState(true);
  const [loi, datLoi] = useState(false);

  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!quayLai.current) {
        return false;
      }
      web.current?.goBack();

      return true;
    });

    return () => listener.remove();
  }, []);

  function moLienKet(dich: string) {
    const loai = phanLoaiUrl(dich);

    if (loai === 'noi-bo') {
      datUrl(dich);
    } else if (loai === 'ngoai') {
      void Linking.openURL(dich).catch(() =>
        Alert.alert('Chưa mở được liên kết', 'Hãy thử lại bằng trình duyệt trên điện thoại.'),
      );
    }
  }

  return (
    <SafeAreaView style={kieu.khung} edges={['top', 'bottom', 'left', 'right']}>
      <WebView<unknown>
        key={lanMo}
        ref={web}
        source={{ uri: url }}
        style={kieu.web}
        originWhitelist={['*']}
        onShouldStartLoadWithRequest={(request) => {
          const loai = phanLoaiUrl(request.url);

          if (loai === 'noi-bo') {
            return true;
          }
          if (loai === 'ngoai' && request.isTopFrame !== false) {
            moLienKet(request.url);
          }

          return false;
        }}
        onOpenWindow={(event) => moLienKet(event.nativeEvent.targetUrl)}
        onNavigationStateChange={(state) => {
          quayLai.current = state.canGoBack;
          hienTai.current = state.url;
        }}
        onLoadStart={() => datDangTai(true)}
        onLoadProgress={(event) => {
          quayLai.current = event.nativeEvent.canGoBack;
        }}
        onLoadEnd={() => datDangTai(false)}
        onError={() => datLoi(true)}
        onHttpError={(event) => {
          if (event.nativeEvent.url === hienTai.current) {
            datLoi(true);
          }
        }}
        onRenderProcessGone={() => {
          daSapTienTrinh.current = true;
          datLoi(true);
        }}
        onContentProcessDidTerminate={() => {
          daSapTienTrinh.current = true;
          datLoi(true);
        }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="never"
        allowFileAccess={false}
        allowFileAccessFromFileURLs={false}
        allowUniversalAccessFromFileURLs={false}
        thirdPartyCookiesEnabled={false}
        webviewDebuggingEnabled={false}
        javaScriptCanOpenWindowsAutomatically={false}
        allowsBackForwardNavigationGestures
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        mediaPlaybackRequiresUserAction
        geolocationEnabled={false}
      />
      {dangTai && !loi && (
        <ActivityIndicator
          accessibilityLabel="Đang tải VietBid"
          color={mau.vang}
          style={[kieu.dangTai, { top: insets.top + 8 }]}
        />
      )}
      {loi && (
        <View style={kieu.loi}>
          <Text style={kieu.tieuDe}>Chưa tải được VietBid</Text>
          <Text style={kieu.moTa}>
            Kiểm tra kết nối mạng rồi thử lại. Website có thể đang được cập nhật.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              datLoi(false);
              datDangTai(true);
              if (daSapTienTrinh.current) {
                daSapTienTrinh.current = false;
                quayLai.current = false;
                if (phanLoaiUrl(hienTai.current) === 'noi-bo') {
                  datUrl(hienTai.current);
                }
                datLanMo((lan) => lan + 1);
              } else {
                web.current?.reload();
              }
            }}
            style={kieu.nut}
          >
            <Text style={kieu.chuNut}>Thử lại</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const kieu = StyleSheet.create({
  khung: { flex: 1, backgroundColor: mau.nen },
  web: { flex: 1, backgroundColor: mau.nen },
  dangTai: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    backgroundColor: mau.nen,
    borderRadius: 20,
    padding: 8,
  },
  loi: {
    position: 'absolute',
    inset: 0,
    backgroundColor: mau.nen,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  tieuDe: {
    color: mau.chu,
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  moTa: {
    color: mau.chuPhu,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 420,
  },
  nut: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderRadius: 6,
    backgroundColor: mau.vang,
  },
  chuNut: {
    color: mau.nen,
    fontSize: 16,
    fontWeight: '600',
  },
});
