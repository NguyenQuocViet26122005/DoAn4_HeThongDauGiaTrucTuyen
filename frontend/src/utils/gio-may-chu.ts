// Độ lệch giữa đồng hồ máy chủ và máy người dùng, cập nhật từ header X-Server-Time của mỗi phản hồi.
// Đếm ngược và khóa thao tác theo giờ máy chủ, nên máy người dùng chạy sai giờ vẫn hiện đúng.
let doLech = 0;

export function ghiNhanGioMayChu(giaTri: unknown, nhanLuc = Date.now()) {
  const mayChu = Number(giaTri);

  if (Number.isFinite(mayChu) && mayChu > 0) {
    doLech = mayChu - nhanLuc;
  }
}

export function gioMayChu() {
  return Date.now() + doLech;
}
