const express = require("express");
const router = express.Router();
const db = require("../db");

// 获取所有课程
/**
 * 获取排球课程列表
 * GET /api/courses
 */
router.get("/", async (req, res) => {
  try {
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
        cat.id AS cat_id, cat.name AS cat_name, cat.description AS cat_description
      FROM v_courses v
             LEFT JOIN teachers t ON v.teacher_id = t.id
             LEFT JOIN course_categories cat ON v.category_id = cat.id
      WHERE v.is_visible = TRUE
      ORDER BY v.created_at DESC;
    `;

    const [rows] = await db.query(sql);
    const formattedData = rows.map(row => {
      const item = {
        course: {},
        teacher: {},
        category: {},
        status: row.status
      };

      Object.keys(row).forEach(key => {
        if (key.startsWith("c_")) {
          item.course[key.replace("c_", "")] = row[key];
        } else if (key.startsWith("t_")) {
          item.teacher[key.replace("t_", "")] = row[key];
        } else if (key.startsWith("cat_")) {
          item.category[key.replace("cat_", "")] = row[key];
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
    res.status(500).json({ code: 500, message: "Internal Server Error" });
  }
});

// 申请（退课，选课）
router.post("/apply", async (req, res) => {
  try {
    const {
      student_id,
      course_id,
      application_type,
      apply_reason,
      urgent,
      special_message,
      phone,
      email,
      material
    } = req.body;

    // 1. 基础校验
    if (!student_id || !course_id) {
      return res
        .status(400)
        .json({ code: 400, message: "Missing student_id or course_id" });
    }

    // 2. 查重逻辑：检查该学生是否已经报过这门课
    const checkSql =
      "SELECT id FROM course_signups WHERE student_id = ? AND course_id = ?";
    const [existing] = await db.query(checkSql, [student_id, course_id]);

    if (existing.length > 0) {
      return res.json({
        code: 400,
        message: "您已报名过该课程，请勿重复提交"
      });
    }

    // 3. 插入新记录
    // 这里的问号数量必须和 params 数组长度一致
    const sql = `
      INSERT INTO course_signups (
        student_id, course_id, application_type, apply_reason,
        urgent, special_message, phone, email, material,
        apply_type, apply_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "pending", NOW());
    `;

    // params 数组：共 10 个元素，对应上面 SQL 的 10 个问号
    const params = [
      student_id,
      course_id,
      application_type || "0",
      apply_reason || "",
      urgent || 1,
      special_message || "",
      phone || "",
      email || "",
      material || null
    ];

    const [result] = await db.query(sql, params);

    res.json({
      code: 200,
      message: "Success",
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error("Apply Error:", error.message);
    res.status(500).json({
      code: 500,
      message: "Internal Server Error",
      error: error.message
    });
  }
});

router.post("/withdraw", async (req, res) => {
  try {
    const {
      student_id,
      course_id,
      withdraw_reason,
      material,
      expire_time,
      urgent
    } = req.body;

    if (!student_id || !course_id) {
      return res.status(400).json({ code: 400, message: "Missing info" });
    }

    // 1. 先检查是否存在该记录，以及是否已经是退课状态
    const checkSql = `
      SELECT application_type, apply_type
      FROM course_signups
      WHERE student_id = ? AND course_id = ?
    `;
    const [existing] = await db.query(checkSql, [student_id, course_id]);

    if (existing.length === 0) {
      return res.json({
        code: 404,
        message: "未找到对应的报名记录"
      });
    }

    const currentRecord = existing[0];

    // 2. 判断逻辑：如果 application_type 已经是 1（退课），则拦截
    // 注意：这里用 == "1" 还是 1 取决于你数据库定义，VARCHAR 通常用字符串比较
    if (currentRecord?.application_type === "1") {
      return res.json({
        code: 400,
        message: "您已提交过退课申请，请等待老师审核"
      });
    }

    // 3. 执行更新逻辑
    const sql = `
      UPDATE course_signups
      SET
        application_type = "1",
        apply_reason = ?,
        material = ?,
        urgent = ?,
        special_message = "",
        expire_time = ?,
        apply_type = "pending",
        apply_time = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE student_id = ? AND course_id = ? AND apply_type != "reject";
    `;

    const [result] = await db.query(sql, [
      withdraw_reason || "申请退课",
      material || null,
      urgent || 1,
      expire_time || null,
      student_id,
      course_id
    ]);

    if (result.affectedRows === 0) {
      return res.json({
        code: 400,
        message: "申请失败（记录可能已被拒绝或状态异常）"
      });
    }

    res.json({
      code: 200,
      message: "Success",
      data: { message: "退课申请已提交，等待审核" }
    });
  } catch (error) {
    console.error("Withdraw Error:", error.message);
    res.status(500).json({
      code: 500,
      message: "Internal Server Error"
    });
  }
});

module.exports = router;
