const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");
// 获取所有课程
/**
 * 获取排球课程列表
 * GET /api/courses
 */
router.get("/", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "未登录" });
    }

    const decoded = jwt.verify(token, "volleyball_2026_secret");
    const studentId = decoded.id; // 获取当前学生 ID

    const sql = `
      SELECT
        v.id AS c_id, v.course_name AS c_course_name, v.credits AS c_credits,
        v.capacity AS c_capacity, v.current_students AS c_current_students,
        v.location AS c_location, v.schedule AS c_schedule, v.start_date AS c_start_date,
        v.end_date AS c_end_date, v.study_date AS c_study_date, v.finish_date AS c_finish_date,
        v.description AS c_description, v.tags AS c_tags, v.requirements AS c_requirements,
        v.syllabus AS c_syllabus, v.difficulty AS c_difficulty, v.time AS c_time,
        v.recommend AS c_recommend, v.is_visible AS c_is_visible,
        v.status,
        t.id AS t_id, t.real_name AS t_real_name, t.title AS t_teacher_position,
        t.teaching_year AS t_teaching_year, t.avatar AS t_avatar, t.introduction AS t_introduction,
        cat.id AS cat_id, cat.name AS cat_name, cat.description AS cat_description,
        -- 获取报名表信息，前缀设为 s_
        s.id AS s_id, s.student_id AS s_student_id, s.course_id AS s_course_id,
        s.apply_time AS s_signup_time, s.apply_type AS s_status
      FROM v_courses v
             LEFT JOIN teachers t ON v.teacher_id = t.id
             LEFT JOIN course_categories cat ON v.category_id = cat.id
             -- 关键：根据当前登录学生 ID 关联报名表
             LEFT JOIN course_signups s ON v.id = s.course_id AND s.student_id = ?
      WHERE v.is_visible = TRUE
      ORDER BY v.created_at DESC;
    `;

    // 传入 studentId 填充 SQL 中的问号
    const [rows] = await db.query(sql, [studentId]);

    const formattedData = rows.map(row => {
      const item = {
        course: {
          status: row.status
        },
        teacher: {},
        category: {},
        signup: null // 初始化为 null
      };

      Object.keys(row).forEach(key => {
        if (key.startsWith("c_")) {
          item.course[key.replace("c_", "")] = row[key];
        } else if (key.startsWith("t_")) {
          item.teacher[key.replace("t_", "")] = row[key];
        } else if (key.startsWith("cat_")) {
          item.category[key.replace("cat_", "")] = row[key];
        } else if (key.startsWith("s_")) {
          // 如果 s_id 存在，说明有报名记录，则填充 signup 对象
          if (row.s_id) {
            if (!item.signup) item.signup = {};
            item.signup[key.replace("s_", "")] = row[key];
          }
        }
      });

      return item;
    });

    res.json({
      code: 200,
      message: "Success",
      data: formattedData
    });
  } catch (error) {
    console.error("SQL Error:", error.message);
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ code: 403, message: "Token 无效" });
    }
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
});

router.get("/categories", async (req, res) => {
  try {
    // 执行 SQL 查询获取所有字段
    const [rows] = await db.query("SELECT * FROM course_categories");

    // 返回标准响应结构
    res.json({
      code: 200,
      data: rows,
      message: "Success"
    });
  } catch (error) {
    console.error("Fetch course categories error:", error);

    // 错误处理
    res.status(500).json({
      code: 500,
      data: null,
      message: "Internal Server Error",
      error: error.message
    });
  }
});
async function getStudentIdByUsername(username) {
  const [rows] = await db.query("SELECT id FROM students WHERE username = ?", [username]);
  return rows.length > 0 ? rows[0].id : null;
}
// 申请（退课，选课）
router.post("/apply", async (req, res) => {
  const connection = await db.getConnection();
  try {
    const {
      username,
      course_id, // 此时 course_id 可以是数字或数组 [101, 102]
      application_type,
      apply_reason,
      urgent,
      special_message,
      phone,
      email,
      material
    } = req.body;

    if (!username || !course_id) {
      return res
        .status(400)
        .json({ code: 400, message: "Missing username or course_id" });
    }

    const student_id = await getStudentIdByUsername(username);
    if (!student_id) {
      return res.status(404).json({ code: 404, message: "学生信息不存在" });
    }

    // 统一转为数组处理
    const courseIds = Array.isArray(course_id) ? course_id : [course_id];

    await connection.beginTransaction();
    const successIds = [];
    const skippedIds = [];

    for (const id of courseIds) {
      // 1. 查重
      const [existing] = await connection.query(
        "SELECT id FROM course_signups WHERE student_id = ? AND course_id = ?",
        [student_id, id]
      );

      if (existing.length > 0) {
        skippedIds.push(id);
        continue;
      }

      // 2. 插入
      const sql = `
        INSERT INTO course_signups (
          student_id, course_id, application_type, apply_reason,
          urgent, special_message, phone, email, material,
          apply_type, apply_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "pending", NOW());
      `;
      const params = [
        student_id,
        id,
        application_type || "0",
        apply_reason || "",
        urgent || 1,
        special_message || "",
        phone || "",
        email || "",
        Array.isArray(material) ? JSON.stringify(material) : material || null
      ];
      console.log(params);
      await connection.query(sql, params);
      successIds.push(id);
    }

    await connection.commit();
    res.json({
      code: 200,
      message: "处理完成",
      data: { success: successIds, skipped: skippedIds }
    });
  } catch (error) {
    await connection.rollback();
    console.error("Apply Error:", error.message);
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  } finally {
    connection.release();
  }
});

router.post("/withdraw", async (req, res) => {
  try {
    const {
      username,
      course_id,
      withdraw_reason,
      material,
      urgent
    } = req.body;

    if (!username || !course_id) {
      return res.status(400).json({ code: 400, message: "Missing info" });
    }

    const student_id = await getStudentIdByUsername(username);
    if (!student_id) {
      return res.status(404).json({ code: 404, message: "学生信息不存在" });
    }

    const courseIds = Array.isArray(course_id) ? course_id : [course_id];

    // 建议直接写全 CURRENT_TIMESTAMP，并移除多余的换行或特殊空格
    const sql = `
      UPDATE course_signups
      SET
        apply_type = "pending",
        apply_reason = ?,
        material = ?,
        urgent = ?,
        apply_time = NOW(),
        updated_at = NOW()
      WHERE student_id = ?
        AND course_id IN (?)
    `;
    // 注意：你之前的代码里写的是 apply_type != "reject"，
    // 但通常表字段名是 status，请确认你的数据库字段名到底是哪个。
    const [result] = await db.query(sql, [
      withdraw_reason || "申请退课",
      Array.isArray(material) ? JSON.stringify(material) : material || null,
      urgent ?? 1,
      student_id,
      courseIds
    ]);

    if (result.affectedRows === 0) {
      return res.json({
        code: 400,
        message: "未找到可退课的记录或申请已在处理中"
      });
    }

    res.json({
      code: 200,
      message: `成功提交 ${result.affectedRows} 门课程的退课申请`,
      data: { affectedRows: result.affectedRows }
    });
  } catch (error) {
    // 这里打印完整的 error 对象能看到更具体的报错位置
    console.error("Withdraw Error:", error);
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
});

module.exports = router;
