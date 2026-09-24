import { z } from 'zod';
import { baoDam, LoiUngDung } from '../utils/loi';
import { donViTienNho, chuoiTien } from '../utils/tien';

/** Chỉ trả thông báo kiểm tra, không đính kèm giá trị đầu vào hoặc bí mật vào lỗi. */
export function docSchema<T>(schema: z.ZodType<T>, dauVao: unknown): T {
  const ketQua = schema.safeParse(dauVao);

  if (!ketQua.success) {
    throw new LoiUngDung(400, ketQua.error.issues[0]?.message || 'Dữ liệu không hợp lệ');
  }

  return ketQua.data;
}

export function chuoi(giaTri: unknown, nhan: string, lonHon = 255, nhoHon = 1): string {
  return docSchema(
    z
      .string({ error: `${nhan} phải là chuỗi` })
      .trim()
      .min(nhoHon, `${nhan} phải dài ${nhoHon}–${lonHon} ký tự`)
      .max(lonHon, `${nhan} phải dài ${nhoHon}–${lonHon} ký tự`),
    giaTri,
  );
}

export function id(giaTri: unknown, nhan = 'ID'): string {
  const schema = z
    .union([z.string(), z.number().int().safe()])
    .transform(String)
    .refine((x) => /^[1-9]\d{0,19}$/.test(x), `${nhan} không hợp lệ`)
    .refine(
      (x) => /^[1-9]\d{0,19}$/.test(x) && BigInt(x) <= 18446744073709551615n,
      `${nhan} vượt giới hạn`,
    );

  return docSchema(schema, giaTri);
}

export function soNguyen(giaTri: unknown, nhan: string, nhoHon = 0, lonHon = 1000000): number {
  const schema = z
    .union([z.number(), z.string().regex(/^\d+$/, `${nhan} phải là số nguyên`)])
    .transform(Number)
    .pipe(
      z
        .number()
        .int()
        .safe()
        .min(nhoHon, `${nhan} ngoài giới hạn`)
        .max(lonHon, `${nhan} ngoài giới hạn`),
    );

  return docSchema(schema, giaTri);
}

export function giaTriLuaChon<T extends string | number>(
  giaTri: unknown,
  cacGiaTri: readonly T[],
  nhan: string,
): T {
  return docSchema(
    z.custom<T>((x) => cacGiaTri.includes(x as T), `${nhan} không hợp lệ`),
    giaTri,
  );
}

export function giaTriDungSai(giaTri: unknown, nhan: string): 0 | 1 {
  const ketQua = docSchema(
    z.union([z.boolean(), z.literal(0), z.literal(1)], { error: `${nhan} phải là true/false` }),
    giaTri,
  );

  return ketQua ? 1 : 0;
}

export function kiemTraTien(giaTri: unknown, nhan: string, duong = false): string {
  const hopLe = docSchema(
    z.union([z.string(), z.number()], { error: `${nhan} không hợp lệ` }),
    giaTri,
  );
  const n = donViTienNho(hopLe, nhan);

  baoDam(!duong || n > 0n, 400, `${nhan} phải lớn hơn 0`);

  return chuoiTien(n);
}

export function tienVietNam(giaTri: unknown, nhan: string, duong = false): string {
  const tien = kiemTraTien(giaTri, nhan, duong);

  baoDam(donViTienNho(tien) % 100n === 0n, 400, `${nhan} phải là số nguyên đồng Việt Nam`);

  return tien;
}

export function kiemTraNoiDung(giaTri: unknown, duocPhep: string[]): Record<string, unknown> {
  const truong = Object.fromEntries(duocPhep.map((khoa) => [khoa, z.unknown().optional()]));

  return docSchema(
    z.strictObject(truong, {
      error: 'Nội dung JSON có trường không được phép hoặc không đúng định dạng',
    }),
    giaTri,
  );
}

export function phanTrang(truyVan: Record<string, unknown> = {}) {
  const trang = soNguyen(truyVan.page ?? 1, 'page', 1, 100000);
  const gioiHan = soNguyen(truyVan.limit ?? 20, 'limit', 1, 100);

  return {
    page: trang,
    limit: gioiHan,
    offset: (trang - 1) * gioiHan,
  };
}

export function thuDienTu(giaTri: unknown): string {
  return docSchema(
    z
      .string()
      .trim()
      .min(1)
      .max(150)
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email không hợp lệ')
      .transform((x) => x.toLowerCase()),
    giaTri,
  );
}

export function matKhau(giaTri: unknown): string {
  return docSchema(
    z
      .string()
      .min(8, 'Mật khẩu cần ít nhất 8 ký tự')
      .refine((x) => Buffer.byteLength(x) <= 72, 'Mật khẩu tối đa 72 byte'),
    giaTri,
  );
}

export function soDienThoai(giaTri: unknown): string {
  return docSchema(
    z
      .string()
      .trim()
      .max(20)
      .regex(/^\+?[0-9 ()-]{8,20}$/, 'Số điện thoại không hợp lệ'),
    giaTri,
  );
}
