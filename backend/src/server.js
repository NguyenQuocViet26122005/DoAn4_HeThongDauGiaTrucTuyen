require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const pool = require("./config/database");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

async function startServer() {
  try {
    const connection = await pool.getConnection();

    console.log("Kết nối MySQL thành công");

    connection.release();

    server.listen(PORT, () => {
      console.log(`Server đang chạy tại http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Lỗi kết nối MySQL:", error.message);
  }
}

startServer();