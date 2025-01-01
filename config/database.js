const mysql = require("mysql2");

// Hàm lấy thông tin kết nối dựa trên ID kết nối (ví dụ: 1, 2)
const getDbConfig = (connectionId) => {
  return {
    host: process.env[`DB_HOST_${connectionId}`],
    port: process.env[`DB_PORT_${connectionId}`],
    user: process.env[`DB_USERNAME_${connectionId}`],
    password: process.env[`DB_PASSWORD_${connectionId}`],
    database: process.env[`DB_DATABASE_${connectionId}`],
  };
};

// Hàm tạo kết nối cơ sở dữ liệu
const connection = (connectionId) => {
  const dbConfig = getDbConfig(connectionId);
  const connection = mysql.createConnection(dbConfig);

  // Kiểm tra kết nối
  connection.connect((err) => {
    if (err) {
      console.error(
        `Error connecting to database ${connectionId}:`,
        err.message
      );
      return;
    }
  });

  return connection;
};

module.exports = { connection };
