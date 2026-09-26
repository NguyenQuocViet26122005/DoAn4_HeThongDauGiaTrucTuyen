import { DatePicker, Form, Input, Select } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { ThuocTinhDanhMuc } from '../types/san-pham';

export default function ThuocTinhSanPham({ danhSach }: { danhSach: ThuocTinhDanhMuc[] }) {
  return (
    <div className="luoi-truong-san-pham">
      {danhSach.map((muc) => (
        <Form.Item
          key={muc.id}
          name={['gia_tri', String(muc.id)]}
          label={`${muc.ten_thuoc_tinh}${muc.don_vi ? ` (${muc.don_vi})` : ''}`}
          extra={muc.bat_buoc ? 'Cần điền trước khi gửi duyệt' : undefined}
          getValueProps={
            muc.kieu_nhap === 'NGAY'
              ? (giaTri: string) => ({ value: giaTri ? dayjs(giaTri) : null })
              : undefined
          }
          getValueFromEvent={
            muc.kieu_nhap === 'NGAY'
              ? (giaTri: Dayjs | null) => giaTri?.format('YYYY-MM-DD')
              : undefined
          }
          rules={[
            { max: 500, message: 'Tối đa 500 ký tự' },
            ...(muc.kieu_nhap === 'SO'
              ? [
                  {
                    pattern: /^-?\d+(\.\d+)?$/,
                    message: 'Nhập số, dùng dấu chấm cho phần thập phân',
                  },
                ]
              : []),
          ]}
        >
          {muc.kieu_nhap === 'LUA_CHON' ? (
            <Select
              allowClear
              placeholder="Chọn giá trị"
              options={muc.lua_chon_json?.map((value) => ({ value, label: value }))}
            />
          ) : muc.kieu_nhap === 'DUNG_SAI' ? (
            <Select
              allowClear
              placeholder="Chọn giá trị"
              options={[
                { value: 'true', label: 'Có' },
                { value: 'false', label: 'Không' },
              ]}
            />
          ) : muc.kieu_nhap === 'NGAY' ? (
            <DatePicker
              format="DD/MM/YYYY"
              placeholder="Ngày/tháng/năm"
              style={{ width: '100%' }}
            />
          ) : (
            <Input
              type="text"
              inputMode={muc.kieu_nhap === 'SO' ? 'decimal' : undefined}
              maxLength={500}
            />
          )}
        </Form.Item>
      ))}
    </div>
  );
}
