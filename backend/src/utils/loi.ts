class LoiUngDung extends Error {
  readonly status: number;
  constructor(trangThai: number, thongDiep: string) {
    super(thongDiep);
    this.status = trangThai;
  }
}

function baoDam(dieuKien: unknown, trangThai: number, thongDiep: string): asserts dieuKien {
  if (!dieuKien) {
    throw new LoiUngDung(trangThai, thongDiep);
  }
}

function batBuocTonTai<T>(giaTri: T | null | undefined, thongDiep = 'Không tìm thấy dữ liệu') {
  baoDam(giaTri, 404, thongDiep);

  return giaTri;
}

const cungId = (a: unknown, b: unknown) => a != null && b != null && String(a) === String(b);
export { LoiUngDung, baoDam, batBuocTonTai, cungId };
