const net: Record<string, string> = {
  tim: 'M21 21l-5-5M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  timYeu:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  muiTen: 'M4 12h16m-6-6 6 6-6 6',
  khien: 'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6l-9-4Zm-4 10 3 3 5-6',
  dongHo: 'M8 2h8l1 5m-9-5L7 7m1 15h8l1-5m-9 5-1-5M12 8v4l3 2M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  thoiGian: 'M12 7v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  chuong: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  nguoi: 'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M16 5a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  hop: 'm3 6 9-4 9 4v12l-9 4-9-4V6Zm0 0 9 4 9-4M12 10v12M7 4l10 4',
  bua: 'm14 3 7 7-4 4-7-7 4-4ZM3 20l10-10M2 22h10M6 4l3-3m10 16 3-3',
  luoi: 'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z',
  xe: 'M5 17H3V6h12v11H9m6-9h4l3 5v4h-3M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  the: 'M2 8h20M3 3h18v17H3V3Zm3 12h5',
  laptop: 'M4 3h16v13H4V3ZM1 20h22l-3-4H4l-3 4Z',
  dienThoai: 'M7 2h10v20H7V2Zm3 3h4m-3 14h2',
  mayAnh: 'M3 6h4l2-3h6l2 3h4v15H3V6Zm13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  kimCuong: 'm2 8 5-5h10l5 5-10 14L2 8Zm0 0h20M7 3l5 19 5-19',
  taiNghe: 'M3 15v-4a9 9 0 0 1 18 0v4M3 12h4v9H3v-9Zm14 0h4v9h-4v-9Z',
  cong: 'M12 5v14M5 12h14',
  thoat: 'M9 3H3v18h6m6-15 6 6-6 6M8 12h13',
  bieuDo: 'M3 3v18h18M7 15v3m5-9v9m5-14v14',
  menu: 'M3 6h18M3 12h18M3 18h18',
  thu: 'M3 5h18v14H3V5Zm0 0 9 8 9-8',
  diaChi: 'M20 9c0 6-8 13-8 13S4 15 4 9a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
};

export function BieuTuong({ ten, size = 20 }: { ten: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={net[ten] || net.kimCuong} />
    </svg>
  );
}

export function bieuTuongDanhMuc(ten: string) {
  const t = ten.toLowerCase();

  return t.includes('đồng hồ')
    ? 'dongHo'
    : t.includes('điện thoại')
      ? 'dienThoai'
      : t.includes('laptop') || t.includes('máy tính')
        ? 'laptop'
        : t.includes('âm thanh')
          ? 'taiNghe'
          : t.includes('xe')
            ? 'xe'
            : t.includes('ảnh') || t.includes('sưu tầm')
              ? 'mayAnh'
              : 'kimCuong';
}
