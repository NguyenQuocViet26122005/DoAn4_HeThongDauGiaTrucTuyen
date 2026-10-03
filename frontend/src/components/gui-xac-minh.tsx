import { useState } from 'react';
import { Form, Input, Select } from 'antd';
import BieuMauThaoTac from './bieu-mau-thao-tac';
import { TaiTep } from './dung-chung';
import { gui } from '../services/api';
import { nhan } from '../utils/dinh-dang';
import type { DuLieuXacMinh } from '../types/xac-minh';

export default function GuiXacMinh({ daGui }: { daGui: () => Promise<void> }) {
  const [soTepDangTai, datSoTepDangTai] = useState(0);
  const [loaiGiayTo, datLoaiGiayTo] = useState('CCCD');

  return (
    <BieuMauThaoTac<DuLieuXacMinh>
      ten="Nộp hồ sơ xác minh"
      khoa={soTepDangTai > 0}
      banDau={{ loai_giay_to: 'CCCD' }}
      xacNhan={(duLieu) => (
        <>
          <p>
            Giấy tờ: {nhan(duLieu.loai_giay_to)} · {duLieu.so_giay_to}
          </p>
          <p>Ngân hàng: {duLieu.ten_ngan_hang}</p>
          <p>
            Chủ tài khoản: {duLieu.chu_tai_khoan} · {duLieu.so_tai_khoan}
          </p>
          <p>
            Hồ sơ được gửi cho Admin xét duyệt quyền bán hàng. Bạn chưa được bán cho tới khi được
            xác minh.
          </p>
        </>
      )}
      onGui={async (duLieu) => {
        await gui('/seller-verifications', duLieu);
        await daGui();
      }}
    >
      <Form.Item name="loai_giay_to" label="Loại giấy tờ" rules={[{ required: true }]}>
        <Select
          onChange={datLoaiGiayTo}
          options={[
            { value: 'CCCD', label: 'Căn cước công dân' },
            { value: 'HO_CHIEU', label: 'Hộ chiếu' },
            { value: 'KHAC', label: 'Giấy tờ khác' },
          ]}
        />
      </Form.Item>
      <Form.Item
        name="so_giay_to"
        label="Số giấy tờ"
        rules={[
          {
            required: true,
            whitespace: true,
            message: 'Nhập số giấy tờ',
          },
        ]}
      >
        <Input maxLength={50} />
      </Form.Item>
      {[
        ['anh_mat_truoc', 'Ảnh mặt trước', true],
        ['anh_mat_sau', 'Ảnh mặt sau', loaiGiayTo === 'CCCD'],
        ['anh_selfie', 'Ảnh chân dung cầm giấy tờ', true],
      ].map(([ten, nhan, batBuoc]) => (
        <Form.Item
          key={String(ten)}
          name={String(ten)}
          label={String(nhan)}
          trigger="onTai"
          validateTrigger="onTai"
          rules={[{ required: !!batBuoc, message: `Tải ${String(nhan).toLowerCase()}` }]}
        >
          <TaiTep
            nhom="verification"
            nhan={String(nhan)}
            onTai={() => {}}
            onDangTai={(dangTai) => datSoTepDangTai((so) => so + (dangTai ? 1 : -1))}
          />
        </Form.Item>
      ))}
      <Form.Item
        name="ten_ngan_hang"
        label="Tên ngân hàng"
        rules={[
          {
            required: true,
            whitespace: true,
            message: 'Nhập tên ngân hàng',
          },
        ]}
      >
        <Input maxLength={100} />
      </Form.Item>
      <Form.Item
        name="so_tai_khoan"
        label="Số tài khoản"
        rules={[
          {
            required: true,
            whitespace: true,
            message: 'Nhập số tài khoản',
          },
        ]}
      >
        <Input maxLength={50} />
      </Form.Item>
      <Form.Item
        name="chu_tai_khoan"
        label="Chủ tài khoản"
        rules={[
          {
            required: true,
            whitespace: true,
            message: 'Nhập chủ tài khoản',
          },
        ]}
      >
        <Input maxLength={100} />
      </Form.Item>
    </BieuMauThaoTac>
  );
}
