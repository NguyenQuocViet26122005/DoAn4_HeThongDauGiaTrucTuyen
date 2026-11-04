import { Button, Input } from 'antd';
import type { ComponentProps } from 'react';
import { BieuTuong } from './bieu-tuong';

// Nút tìm kiếm mặc định của Ant Design không có tên cho trình đọc màn hình.
export default function OTimKiem(props: ComponentProps<typeof Input.Search>) {
  return (
    <Input.Search
      enterButton={
        <Button aria-label="Tìm kiếm" disabled={props.disabled}>
          <BieuTuong ten="tim" size={16} />
        </Button>
      }
      {...props}
    />
  );
}
