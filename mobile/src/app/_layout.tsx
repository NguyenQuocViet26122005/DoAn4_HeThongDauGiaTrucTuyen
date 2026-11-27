import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { mau } from '@/lib/giao-dien';

export default function BoCucGoc() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: mau.nen },
          animation: 'none',
        }}
      />
    </SafeAreaProvider>
  );
}
