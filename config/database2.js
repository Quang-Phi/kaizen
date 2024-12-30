const { Sequelize } = require('sequelize');

const getDbConfig = (connectionId) => {
     return {
         host: process.env[`DB_HOST_${connectionId}`],
         port: process.env[`DB_PORT_${connectionId}`],
         user: process.env[`DB_USERNAME_${connectionId}`],
         password: process.env[`DB_PASSWORD_${connectionId}`],
         database: process.env[`DB_DATABASE_${connectionId}`],
     };
};

const connection = (connectionId) => {
     const dbConfig = getDbConfig(connectionId);
   
     // Kiểm tra kết nối
     const connection = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
          host: dbConfig.host,
          dialect: 'tedious',
          logging: false,
     });
   
     return connection;
   };



module.exports = db2;
