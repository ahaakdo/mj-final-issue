const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// --- 注册接口 ---
router.post("/register", async (req, res) => {
  const { username, password, real_name, user_type, email, phone } = req.body;

  try {
    // 1. 检查用户名是否存在
    const [existing] = await db.query(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );
    if (existing.length > 0) {
      return res.status(400).json({ code: 400, message: "用户名已存在" });
    }

    // 2. 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. 生成自增编号 (学号或工号)
    let student_number = null;
    let teacher_number = null;

    if (user_type === "student") {
      // 查询当前最大物理学号
      const [rows] = await db.query(
        'SELECT MAX(CAST(student_number AS UNSIGNED)) as maxNum FROM users WHERE user_type = "student"'
      );
      const nextNum = (rows[0].maxNum || 2024000) + 1; // 假设起始号为 2024001
      student_number = nextNum.toString();
    } else if (user_type === "teacher") {
      // 查询当前最大物理工号
      const [rows] = await db.query(
        'SELECT MAX(CAST(teacher_number AS UNSIGNED)) as maxNum FROM users WHERE user_type = "teacher"'
      );
      const nextNum = (rows[0].maxNum || 1000) + 1; // 假设起始工号为 1001
      teacher_number = nextNum.toString();
    }

    // 4. 写入数据库
    // 注意：这里需要包含 student_number 和 teacher_number 字段
    const [result] = await db.query(
      `INSERT INTO users (username, password, real_name, user_type, student_number, teacher_number, email, phone, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        username,
        hashedPassword,
        real_name,
        user_type,
        student_number,
        teacher_number,
        email,
        phone
      ]
    );

    res.json({
      code: 200,
      message: "注册成功",
      data: {
        userId: result.insertId,
        number: user_type === "student" ? student_number : teacher_number
      }
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ code: 500, message: "服务器错误", error: error.message });
  }
});

// 登录
router.post('/login', async (req, res) => {
  const { username, password, user_type } = req.body;

  try {
    // 1. 先查用户
    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (users.length === 0) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    const user = users[0];

    // 2. 【关键逻辑】身份强校验
    // 假设 login_type 的值为 'student' 或 'teacher'
    if (user.user_type !== user_type) {
      // 如果用户是学生，但尝试从老师端登录，直接拦截
      const identityName = user_type === 'teacher' ? '老师' : '学生';
      return res.status(403).json({
        code: 403,
        message: `身份不匹配：该账号不是${identityName}账号，请前往正确的入口登录。`
      });
    }

    // 3. 校验密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    // 4. 生成 Token
    const token = jwt.sign(
      { id: user.id, role: user.user_type },
      'your_secret_key',
      { expiresIn: '24h' }
    );

    res.json({
      code: 200,
      message: '登录成功',
      token,
      data: {
        username: user.username,
        user_type: user.user_type
      }
    });

  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
