import { z } from 'zod';

export const dinhDanh = z.union([z.string().regex(/^[1-9]\d{0,19}$/),z.number().int().positive().safe()]);
export const soTien = z.union([z.string().regex(/^\d{1,13}(\.\d{1,2})?$/),z.number().finite().nonnegative()]);
export const dungSai = z.union([z.boolean(),z.literal(0),z.literal(1)]);
export const vanBan = (toiDa: number, nhan: string) => z.string({error:`${nhan} phải là chuỗi`}).trim().min(1,`${nhan} không được bỏ trống`).max(toiDa,`${nhan} tối đa ${toiDa} ký tự`);
export const vanBanTuyChon = (toiDa: number) => z.string().max(toiDa).nullish();
