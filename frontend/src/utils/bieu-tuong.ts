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
