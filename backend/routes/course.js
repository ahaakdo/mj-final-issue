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

module.exports = router;
