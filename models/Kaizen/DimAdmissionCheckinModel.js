const { connection } = require("../../config/database");
const { Model } = require("../Model");

class DimAdmissionCheckinModel extends Model {
  static table = "dim_admission_checkin";
  static primaryKey = "id";
  static fillable = [
    "id",
    "id_daily_checkin",
    "student_code",
    "type_checkin_id",
    "late_admission_date",
    "comment",
    "created_by",
    "updated_by",
    "created_at",
    "updated_at",
  ];

  static async create(data) {
    const conn = await connection(1);
    await conn.promise().beginTransaction();

    try {
      const query = await this.createMultiple(data);
      const [result] = await conn
        .promise()
        .query(
          `INSERT INTO ${this.table} (${query.columns}) VALUES ${query.placeholders}`,
          query.values
        );

      const results = data.map((item, index) => ({
        id: result.insertId + index,
        ...item,
      }));

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
        const whereQuery = await this.where({
          id_daily_checkin: item.id_daily_checkin,
          student_code: item.student_code,
        });

        const [existing] = await conn
          .promise()
          .query(
            `SELECT id FROM ${this.table} WHERE ${whereQuery.wheres}`,
            whereQuery.values
          );

        if (existing && existing[0]) {
          const { id, created_at, ...updateData } = item;

          const updateQuery = await this.updated(updateData, {
            id: existing[0].id,
          });
          await conn
            .promise()
            .query(
              `UPDATE ${this.table} SET ${updateQuery.placeholders} WHERE ${updateQuery.wheres}`,
              updateQuery.values
            );

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
