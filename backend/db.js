const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'mjfinal',
  waitForConnections: true,
  connectionLimit: 10
});

// 导出 Promise 版本的池
module.exports = pool.promise();
