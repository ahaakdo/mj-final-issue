const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取所有比赛
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM matches ORDER BY date DESC');
    res.json({ code: 200, data: rows });
  } catch (error) {
    res.status(500).json({ code: 500, error: error.message });
  }
});

module.exports = router;
