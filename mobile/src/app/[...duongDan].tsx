import { useLocalSearchParams } from 'expo-router';
import TrangWeb from '@/components/trang-web';

export default function DuongDanCu() {
  const { duongDan } = useLocalSearchParams<{ duongDan?: string[] }>();

  return <TrangWeb duongDan={'/' + (duongDan || []).map(encodeURIComponent).join('/')} />;
}
