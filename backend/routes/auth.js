const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateNumber = role => {
  const prefix = role === "teacher" ? "T" : "S";
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${prefix}${date}${random}`;
};

router.post("/register", async (req, res) => {
  const { username, password, real_name, role, phone, email } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ msg: "用户名、密码和角色不能为空" });
  }

  const isTeacher = role === "teacher";
  const tableName = isTeacher ? "teachers" : "students";
  const idColumn = isTeacher ? "teacher_number" : "student_number";

  try {
    // 1. 自动生成编号
    const autoNumber = generateNumber(role);

    // 2. 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. 写入数据库
    const sql = `INSERT INTO ${tableName} (username, password, real_name, ${idColumn}, phone, email) VALUES (?, ?, ?, ?, ?, ?)`;
    await db.execute(sql, [
      username,
      hashedPassword,
      real_name,
      autoNumber,
      phone,
      email
    ]);

    res.status(201).json({
      code: 200,
      msg: "注册成功",
      data: {
        username,
        real_name,
        role,
        generated_number: autoNumber // 返回生成的编号给前端
      }
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ msg: "注册失败，用户名可能已被占用", error: err.message });
  }
});
// 登录
router.post("/login", async (req, res) => {
  const { username, password, role } = req.body;
  const tableName = role === "teacher" ? "teachers" : "students";

  try {
    // 1. 查询用户
    const [rows] = await db.execute(
      `SELECT * FROM ${tableName} WHERE username = ?`,
      [username]
    );
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ code: 401, msg: "用户不存在" });
    }

    let isMatch = false;

    // 2. 核心兼容逻辑
    // 如果数据库里的密码是以 $2b$ 或 $2a$ 开头的，说明是 bcrypt 加密过的
    if (user.password.startsWith("$2b$") || user.password.startsWith("$2a$")) {
      isMatch = await bcrypt.compare(password, user.password);
    }

    // 3. 如果加密比对没过，或者是明文，则直接尝试字符串比对
    if (!isMatch) {
      isMatch = password === user.password;
    }

    if (!isMatch) {
      return res.status(401).json({ msg: "密码错误" });
    }

    // 4. 签发 Token
    const token = jwt.sign(
      { id: user.id, role: role, username: user.username },
      "volleyball_2026_secret",
      { expiresIn: "24h" }
    );

    res.json({
      code: 200,
      msg: "登录成功",
      token,
      user: { id: user.id, name: user.real_name, role: role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "服务器内部错误" });
  }
});

module.exports = router;
