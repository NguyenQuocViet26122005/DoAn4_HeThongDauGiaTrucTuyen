// Độ lệch đồng hồ máy chủ so với điện thoại, lấy từ header X-Server-Time của mỗi phản hồi API.
// Đếm ngược và khóa nút đặt giá theo giờ máy chủ, nên điện thoại chạy sai giờ vẫn hiện đúng.
let doLech = 0;

export function ghiNhanGioMayChu(giaTri: string | null) {
  const mayChu = Number(giaTri);

  if (Number.isFinite(mayChu) && mayChu > 0) {
    doLech = mayChu - Date.now();
  }
}

export const gioMayChu = () => Date.now() + doLech;
