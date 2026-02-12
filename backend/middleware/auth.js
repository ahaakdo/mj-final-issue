const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  // 1. 从 header 中获取 token
  // 格式通常是 "Bearer <token>"
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ code: 401, message: "未提供 Token，拒绝访问" });
  }

  // 2. 验证 token
  jwt.verify(token, "你的密钥_SECRET_KEY", (err, user) => {
    if (err) {
      return res
        .status(403)
        .json({ code: 403, message: "Token 已失效或不正确" });
    }

    // 3. 验证通过，把用户信息存入 req 对象
    // 这样你在路由函数里就能通过 req.user.id 拿到学生 ID 了
    req.user = user;

    // 4. 放行，进入下一个环节
    next();
  });
};

module.exports = { authenticateToken };
