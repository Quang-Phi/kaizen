const { connection } = require("../../config/database");
const { Model } = require("../Model");

class DailyCheckinModel extends Model {
  static table = "daily_checkin";
  static primaryKey = "id";
  static fillable = [
    "id",
    "day",
    "student_code",
    "created_by",
    "updated_by",
    "created_at",
    "updated_at"
  ];

  static async create(data) {
    const conn = await connection(1);
    await conn.promise().beginTransaction();
    
    try {
      const results = [];
      for (const item of data) {
        try {
          const [result] = await conn
          .promise()
          .query(`INSERT INTO ${this.table} SET ?`, item);

          results.push({
            id: result.insertId,
            ...item,
          });
        } catch (sqlError) {
          console.error('SQL Error:', sqlError);
          await conn.promise().rollback();
          throw sqlError;
        }
      }
      await conn.promise().commit();
      return results;
    } catch (error) {
      console.error('Transaction Error:', error);
      await conn.promise().rollback();
      throw error;
    } finally {
      await conn.end();
    }
}
}

module.exports = { DailyCheckinModel };
