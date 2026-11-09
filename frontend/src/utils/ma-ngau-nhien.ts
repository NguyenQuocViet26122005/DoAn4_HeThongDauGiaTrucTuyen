// crypto.randomUUID chỉ có trên HTTPS hoặc localhost; mở qua IP mạng LAN (http://192.168.x.x)
// thì dựng UUID v4 từ crypto.getRandomValues, hàm này có ở mọi ngữ cảnh.
export function maNgauNhien(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const byte = crypto.getRandomValues(new Uint8Array(16));

  byte[6] = (byte[6] & 0x0f) | 0x40;
  byte[8] = (byte[8] & 0x3f) | 0x80;

  const hex = Array.from(byte, (b) => b.toString(16).padStart(2, '0')).join('');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
