const express = require('express');
const router = express.Router();
const db = require('../db'); // 引入刚才建好的数据库连接

// 获取所有运动员
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM players');
    res.json({ code: 200, data: rows });
  } catch (error) {
    res.status(500).json({ code: 500, error: error.message });
  }
});

module.exports = router;
