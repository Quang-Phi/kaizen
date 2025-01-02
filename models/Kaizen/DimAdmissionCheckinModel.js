const { connection } = require("../../config/database");
const { Model } = require("../Model");

class DimAdmissionCheckinModel extends Model {
  static table = "dim_admission_checkin";
  static primaryKey = "id";
  static fillable = [
    "id",
    "id_daily_checkin",
    "student_code",
    "comment",
    "type_checkin_id",
    "created_by",
    "updated_by",
    "created_at",
    "updated_at",
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
          console.error("SQL Error:", sqlError);
          await conn.promise().rollback();
          throw sqlError;
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

  static async update(data) {
    const conn = await connection(1);
    await conn.promise().beginTransaction();

    try {
      const results = [];
      for (const item of data) {
        const [existing] = await conn.promise().query(
          `SELECT id FROM ${this.table} 
             WHERE id_daily_checkin = ? AND student_code = ?`,
          [item.id_daily_checkin, item.student_code]
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

module.exports = { DimAdmissionCheckinModel };
