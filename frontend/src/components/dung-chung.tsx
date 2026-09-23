import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, App, Button, Empty, Form, Input, InputNumber, Modal, Select, Skeleton, Switch, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import type { BanGhi, TruongNhap } from '../types/du-lieu';
import { boNho, doc, duongDanAnh, http, loiDeDoc, taiTep } from '../services/api';
import { chuoi, mocThoiGian, nhan } from '../utils/dinh-dang';
import { BieuTuong, bieuTuongDanhMuc } from './bieu-tuong';

export function useDuLieu<T>(url: string, thamSo?: Record<string, unknown>, bat = true) {
  return useQuery({ queryKey: [url, thamSo], queryFn: () => doc<T>(url, thamSo), enabled: bat });
}
export function TrangThai({giaTri}: {giaTri: unknown}) {
  const ten = chuoi(giaTri);
  const mau = ['HOAT_DONG', 'DA_DUYET', 'DA_XAC_MINH', 'HOAN_THANH', 'DA_GIAI_NGAN', 'DA_CHAP_NHAN'].includes(ten) ? 'green' : ['DA_HUY', 'THAT_BAI', 'TU_CHOI', 'BI_KHOA', 'HET_HAN'].includes(ten) ? 'red' : 'gold';
  return <Tag color={mau}>{nhan(giaTri)}</Tag>;
}
export function TieuDe({nhanNho, ten, moTa, children}: {nhanNho?: string; ten: string; moTa?: string; children?: ReactNode}) {
  return <div className="tieu-de-trang"><div>{nhanNho && <span className="nhan-nho">{nhanNho}</span>}<h1>{ten}</h1>{moTa && <p>{moTa}</p>}</div>{children}</div>;
}
export function ChoDuLieu({truyVan, children, rong = false}: {truyVan: {isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown}; children: ReactNode; rong?: boolean}) {
  if (truyVan.isPending) return <div className="khoi-cho"><Skeleton active paragraph={{rows: 5}} /></div>;
  if (truyVan.isError) return <Alert type="error" showIcon title="Không tải được dữ liệu" description={loiDeDoc(truyVan.error)} action={<Button onClick={() => truyVan.refetch()}>Thử lại</Button>} />;
  if (rong) return <div className="trong"><Empty description="Chưa có dữ liệu trong mục này" image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>;
  return <>{children}</>;
}
export function AnhSanPham({src, ten = '', lon = false}: {src?: string | null; ten?: string; lon?: boolean}) {
  const [loi, datLoi] = useState<string | undefined>();
  const url = duongDanAnh(src);
  return <div className={`anh-san-pham ${lon ? 'anh-lon' : ''}`}>{url && loi !== url ? <img src={url} alt={ten} onError={() => datLoi(url)} loading="lazy" /> : <div className="anh-thay-the"><BieuTuong ten={bieuTuongDanhMuc(ten)} size={lon ? 120 : 68} /><span>Ảnh đang được cập nhật</span></div>}</div>;
}
export function DemNguoc({batDau, ketThuc}: {batDau?: string; ketThuc: string}) {
  const [hienTai, datHienTai] = useState(Date.now);
  useEffect(() => { const boDem = setInterval(() => datHienTai(Date.now()), 1000); return () => clearInterval(boDem); }, []);
  const chuaBatDau = batDau && mocThoiGian(batDau) > hienTai;
  const soGiay = Math.max(0, Math.floor((mocThoiGian(chuaBatDau ? batDau : ketThuc) - hienTai) / 1000));
  if (!soGiay) return <span className="chu-mo">Đã hết thời gian</span>;
  const ngay = Math.floor(soGiay / 86400);
  const phan = [Math.floor(soGiay / 3600) % 24, Math.floor(soGiay / 60) % 60, soGiay % 60].map(x => String(x).padStart(2, '0')).join(' : ');
  return <span className={`dem-nguoc ${soGiay < 60 ? 'sap-het' : ''}`}><BieuTuong ten="thoiGian" size={14} />{chuaBatDau ? 'Bắt đầu sau ' : ''}{ngay ? `${ngay}n ` : ''}{phan}</span>;
}
export function PhanTrang({trang, datTrang, soLuong, gioiHan = 20}: {trang: number; datTrang: (trang: number) => void; soLuong: number; gioiHan?: number}) {
  return <div className="phan-trang"><span className="chu-mo">Trang {trang} · {soLuong} kết quả</span><div><Button disabled={trang === 1} onClick={() => datTrang(trang - 1)}>Trang trước</Button><Button disabled={soLuong < gioiHan} onClick={() => datTrang(trang + 1)}>Trang sau</Button></div></div>;
}
export function BieuMau({truong, banDau, onLuu, nut = 'Lưu thay đổi', children}: {truong: TruongNhap[]; banDau?: BanGhi; onLuu: (duLieu: BanGhi) => Promise<void>; nut?: string; children?: ReactNode}) {
  const [dangLuu, datDangLuu] = useState(false);
  const [loi, datLoi] = useState('');
  return <Form layout="vertical" initialValues={banDau} onFinish={async (duLieu: BanGhi) => {
    datDangLuu(true); datLoi('');
    try { await onLuu(duLieu); await boNho.invalidateQueries(); } catch (e) { datLoi(loiDeDoc(e)); } finally { datDangLuu(false); }
  }} className="bieu-mau">
    {truong.map(t => <Form.Item key={t.ten} name={t.ten} label={t.nhan} valuePropName={t.loai === 'switch' ? 'checked' : 'value'} rules={[{required: t.batBuoc, message: `Vui lòng nhập ${t.nhan.toLowerCase()}`}, ...(t.loai === 'email' ? [{type: 'email' as const, message: 'Email không hợp lệ'}] : [])]} extra={t.goiY}>
      {t.loai === 'select' ? <Select options={t.luaChon} placeholder={`Chọn ${t.nhan.toLowerCase()}`} allowClear={!t.batBuoc} /> : t.loai === 'switch' ? <Switch /> : t.loai === 'textarea' ? <Input.TextArea rows={4} maxLength={20000} showCount /> : t.loai === 'number' ? <InputNumber min={t.min ?? 0} max={t.max ?? 9999999999999} style={{width: '100%'}} /> : t.loai === 'password' ? <Input.Password autoComplete="current-password" /> : <Input type={t.loai || 'text'} maxLength={500} />}
    </Form.Item>)}
    {children}
    {loi && <Alert type="error" showIcon title={loi} className="loi-bieu-mau" />}
    <Button type="primary" htmlType="submit" loading={dangLuu} size="large">{nut}<BieuTuong ten="muiTen" size={16} /></Button>
  </Form>;
}
export function HopThoai({ten, truong, banDau, onLuu, nguyHiem = false}: {ten: string; truong: TruongNhap[]; banDau?: BanGhi; onLuu: (duLieu: BanGhi) => Promise<void>; nguyHiem?: boolean}) {
  const [mo, datMo] = useState(false);
  const {message} = App.useApp();
  return <><Button danger={nguyHiem} onClick={() => datMo(true)}>{ten}</Button><Modal title={ten} open={mo} onCancel={() => datMo(false)} footer={null} destroyOnHidden><BieuMau truong={truong} banDau={banDau} nut="Xác nhận" onLuu={async (d) => { await onLuu(d); message.success('Đã lưu thành công'); datMo(false); }} /></Modal></>;
}
export function HanhDong({ten, onLam, xacNhan, nguyHiem = false}: {ten: string; onLam: () => Promise<unknown>; xacNhan?: string; nguyHiem?: boolean}) {
  const [dangChay, datDangChay] = useState(false);
  const {message, modal} = App.useApp();
  async function thucHien() {
    datDangChay(true);
    try { await onLam(); await boNho.invalidateQueries(); message.success('Thao tác thành công'); }
    catch (e) { message.error(loiDeDoc(e)); throw e; }
    finally { datDangChay(false); }
  }
  return <Button danger={nguyHiem} loading={dangChay} onClick={() => xacNhan ? modal.confirm({title: ten, content: xacNhan, okText: 'Xác nhận', cancelText: 'Quay lại', onOk: thucHien}) : void thucHien().catch(() => {})}>{ten}</Button>;
}
export function TaiTep({nhom, onTai, nhan: tieuDe = 'Chọn tệp', value}: {nhom: string; onTai: (url: string) => void; nhan?: string; value?: string}) {
  const [dangTai, datDangTai] = useState(false);
  const {message} = App.useApp();
  return <label className="chon-tep"><BieuTuong ten="cong" /><span>{dangTai ? 'Đang tải lên…' : value ? 'Đã tải tệp · Chọn lại' : tieuDe}</span><small>{nhom === 'evidence' ? 'Ảnh / PDF · tối đa 10 MB' : 'PNG, JPG, WebP · tối đa 5 MB'}</small><input aria-label={tieuDe} type="file" accept={nhom === 'evidence' ? 'image/png,image/jpeg,image/webp,application/pdf' : 'image/png,image/jpeg,image/webp'} disabled={dangTai} onChange={async e => {
    const tep = e.target.files?.[0]; e.target.value = ''; if (!tep) return;
    if (tep.size > (nhom === 'evidence' ? 10 : 5) * 1024 * 1024) { message.error('Tệp vượt kích thước cho phép'); return; }
    datDangTai(true);
    try { onTai(await taiTep(tep, nhom)); message.success('Tải tệp thành công'); } catch (e) { message.error(loiDeDoc(e)); } finally { datDangTai(false); }
  }} /></label>;
}
export function TepRiengTu({url, ten}: {url: string; ten: string}) {
  const {message, modal} = App.useApp();
  const [dangTai, datDangTai] = useState(false);
  return <Button loading={dangTai} onClick={async () => {
    if (!url.startsWith('/api/uploads/files/')) { message.info('Tệp mẫu chưa có trên máy chủ. Hãy tải lên tệp mới.'); return; }
    datDangTai(true);
    try {
      const tep = await http.get<Blob>(url.replace(/^\/api/, ''), {responseType: 'blob'});
      const blob = URL.createObjectURL(tep.data);
      modal.info({title: ten, width: 720, content: tep.data.type === 'application/pdf' ? <iframe title={ten} src={blob} style={{width: '100%', height: 500}} /> : <img src={blob} alt={ten} style={{maxWidth: '100%', maxHeight: 520}} />, afterClose: () => URL.revokeObjectURL(blob)});
    } catch (e) { message.error(loiDeDoc(e)); } finally { datDangTai(false); }
  }}>{ten}</Button>;
}
