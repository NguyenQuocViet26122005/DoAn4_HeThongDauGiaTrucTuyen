import LiquidChrome from './react-bits/LiquidChrome';

// Nền 3D lấy từ React Bits (LiquidChrome, WebGL2 thuần, không cần three.js): bề mặt kim loại
// vàng lỏng phủ kín khối bìa, gợn sóng theo con trỏ. Tự dừng khi khuất màn hình.
export default function Bia3D({
  dienThoai = false,
  canGiua = false,
}: {
  dienThoai?: boolean;
  canGiua?: boolean;
}) {
  return (
    <div className="bia-3d" aria-hidden="true">
      <LiquidChrome
        color="#c9a35e"
        speed={0.15}
        amplitude={canGiua ? 0.25 : 0.35}
        frequencyX={2.5}
        frequencyY={2}
        roughness={0.25}
        exposure={0.9}
        interactive={!dienThoai}
        maxDevicePixelRatio={dienThoai ? 1 : 1.5}
      />
    </div>
  );
}
