const mysql = require('mysql2');

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
      console.error(`Error connecting to database ${connectionId}:`, err.message);
      return;
    }
    console.log(`Connected to database ${connectionId}.`);
  });

  return connection;
};

// Xuất ra các kết nối khác nhau
// const connection1 = createConnection(1);
// const connection2 = createConnection(2);

module.exports = { connection };
