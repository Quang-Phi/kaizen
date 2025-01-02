const { connection } = require("../../config/database");
const { Model } = require("../Model");

class DimDailyEvaluationModel extends Model {
  static table = "dim_daily_evaluation";
  static primaryKey = "id";
  static fillable = [
    "id",
    "id_daily_checkin",
    "student_code",
    "class_session",
    "attendance",
    "learning_attitude",
    "physical_appearance",
    "consciousness_personality",
    "japanese_learning_ability",
    "mental_health",
    "age",
    "disability",
    "appearance",
    "desired_major",
    "family_influence",
    "physical_condition",
    "tattoo",
    "japanese_language_need",
    "expected_graduation_year",
    "medical_history",
    "is_registered_elsewhere",
    "military_requirement",
    "note",
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
        const [existing] = await conn.promise().query(
          `SELECT id FROM ${this.table} 
             WHERE id_daily_checkin = ? AND student_code = ? AND class_session = ?`,
          [item.id_daily_checkin, item.student_code, item.class_session]
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

module.exports = { DimDailyEvaluationModel };
