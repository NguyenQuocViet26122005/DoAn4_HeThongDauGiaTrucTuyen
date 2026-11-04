import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

// Số đếm lên khi xuất hiện và lóe vàng khi giá trị đổi (ví dụ có lượt giá mới).
// Nội dung chữ luôn là giá trị thật; khi người dùng giảm chuyển động thì hiện thẳng giá trị.
export default function SoChuyenDong({
  giaTri,
  dinhDang = (so) => Math.round(so).toLocaleString('vi-VN'),
  className,
}: {
  giaTri: number;
  dinhDang?: (so: number) => string;
  className?: string;
}) {
  const phanTu = useRef<HTMLElement>(null);
  const truoc = useRef<number | null>(null);

  useGSAP(
    () => {
      const el = phanTu.current;

      if (!el) {
        return;
      }

      const mm = gsap.matchMedia();

      mm.add(
        {
          dong: '(prefers-reduced-motion: no-preference)',
          tinh: '(prefers-reduced-motion: reduce)',
        },
        (ngu) => {
          if (ngu.conditions?.tinh || !Number.isFinite(giaTri)) {
            el.textContent = dinhDang(giaTri);

            return;
          }

          const batDau = truoc.current ?? 0;
          const dem = { so: batDau };

          gsap.to(dem, {
            so: giaTri,
            duration: truoc.current == null ? 1.2 : 0.7,
            ease: 'expo.out',
            onUpdate: () => {
              el.textContent = dinhDang(dem.so);
            },
          });
          if (truoc.current != null && truoc.current !== giaTri) {
            gsap.fromTo(
              el,
              { color: '#fff3d1', textShadow: '0 0 18px rgba(213,183,120,.65)' },
              {
                color: '',
                textShadow: '0 0 0 rgba(0,0,0,0)',
                duration: 1.4,
                ease: 'power2.out',
              },
            );
          }
        },
      );
      truoc.current = giaTri;

      return () => mm.revert();
    },
    { dependencies: [giaTri] },
  );

  return (
    <strong ref={phanTu} className={className}>
      {dinhDang(giaTri)}
    </strong>
  );
}
