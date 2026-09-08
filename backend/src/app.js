const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Backend hệ thống đấu giá trực tuyến đang hoạt động",
  });
});

module.exports = app;