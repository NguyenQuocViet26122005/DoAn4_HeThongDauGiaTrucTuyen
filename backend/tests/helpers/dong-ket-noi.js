const nhomKetNoi = require('../../dist/config/co-so-du-lieu');

let tacVuDong;

// Các tệp kiểm thử chạy chung tiến trình và dùng chung một nhóm kết nối.
// Những hàm dọn dẹp cùng chờ một tác vụ, tránh đóng MySQL nhiều lần.
function dongKetNoiMotLan() {
  tacVuDong ??= nhomKetNoi.end();
  return tacVuDong;
}

module.exports = { dongKetNoiMotLan };
