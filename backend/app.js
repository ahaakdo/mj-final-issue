const express = require("express");
const cors = require("cors");
const playerRouter = require("./routes/players");
const matchRouter = require("./routes/matches");
const authRouter = require("./routes/auth");
const courseRouter = require("./routes/course");

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // 解析表单格式
// 挂载路由
// 访问时会自动带上前缀，例如：http://localhost:3000/api/players
app.use("/api/players", playerRouter);
app.use("/api/matches", matchRouter);
app.use("/api/auth", authRouter);
app.use("/api/courses", courseRouter);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`服务器已在端口 ${PORT} 启动`);
});
