const { connection } = require("../../config/database");
const { Model } = require("../Model");

class EvaluationOtherOptionModel extends Model {
  static table = "evaluation_other_option";
  static primaryKey = "id";
  static fillable = [
    "daily_checkin_evaluation_id",
    "orther_id",
    "text",
    "created_at",
    "updated_at",
  ];

  static async create(data) {
    const conn = await connection(1);
    await conn.promise().beginTransaction();
    try {
      const results = [];
      for (const item of data) {
        const [result] = await conn
          .promise()
          .query(`INSERT INTO ${this.table} SET ?`, item);
        results.push({ id: result.insertId, ...item });
      }
      await conn.promise().commit();
      return results;
    } catch (error) {
      console.error("Transaction Error:", error);
      await conn.promise().rollback();
      throw error;
    } finally {
      await conn.end();
    }
  }

  static async update(data) {
    const conn = await connection(1);
    await conn.promise().beginTransaction();

    try {
      const results = [];
      for (const item of data) {
        const [existing] = await conn.promise().query(
          `SELECT id FROM ${this.table} 
             WHERE daily_checkin_evaluation_id = ? AND orther_id = ?`,
          [item.daily_checkin_evaluation_id, item.orther_id]
        );
        if (existing && existing[0]) {
          const { id, created_at, ...updateData } = item;
          await conn
            .promise()
            .query(`UPDATE ${this.table} SET ? WHERE id = ?`, [
              updateData,
              existing[0].id,
            ]);

          results.push({
            id: existing[0].id,
            ...item,
          });
        } else {
          const [result] = await conn
            .promise()
            .query(`INSERT INTO ${this.table} SET ?`, item);

          results.push({
            id: result.insertId,
            ...item,
          });
        }
      }

      await conn.promise().commit();
      return results;
    } catch (error) {
      console.error("Transaction Error:", error);
      await conn.promise().rollback();
      throw error;
    } finally {
      await conn.end();
    }
  }
}

module.exports = { EvaluationOtherOptionModel };
