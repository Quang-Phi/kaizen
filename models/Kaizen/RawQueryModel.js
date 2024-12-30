const { connection } = require('../../config/database');
const { Logs } = require('../../helpers/Logs');

class RawQueryModel {

     static async getRaw(sql, params = []) {

          try {

               const [results] = await connection(1).promise().execute(sql, params);

               return results;
          } catch (error) {
               Logs.logError('default-log', error);
               throw error;
          }
     }
}

module.exports = { RawQueryModel }