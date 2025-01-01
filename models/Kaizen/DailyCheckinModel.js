const { connection } = require("../../config/database");
const { Model } = require("../Model");
const moment = require("moment");

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
    "updated_at",
  ];

  static async create(items) {
    const conn = await connection(1);
    await conn.promise().beginTransaction();

    try {
      const results = [];
      for (const item of items) {
        const [result] = await conn
          .promise()
          .query(`INSERT INTO ${this.table} SET ?`, item);

        results.push({
          id: result.insertId,
          ...item,
        });
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

  static async update(items) {
    const conn = await connection(1);
    await conn.promise().beginTransaction();

    try {
      const results = [];
      for (const item of items) {
        const { id, created_at, ...updateData } = item;
        await conn
          .promise()
          .query(`UPDATE ${this.table} SET ? WHERE id = ?`, [updateData, id]);

        results.push(item);
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

  static async findOne(conditions) {
    const conn = await connection(1);
    try {
      let query = `SELECT * FROM ${this.table} WHERE 1=1`;
      const values = [];

      Object.entries(conditions).forEach(([key, value]) => {
        query += ` AND ${key} = ?`;
        values.push(value);
      });

      const [rows] = await conn.promise().query(query, values);
      return rows[0] || null;
    } catch (error) {
      console.error("Query Error:", error);
      throw error;
    } finally {
      await conn.end();
    }
  }

  static async getListStudentCheckin(
    class_code,
    day,
    student_codes,
    class_session
  ) {
    day = moment(day).format("YYYY-MM-DD");
    const conn = await connection(1);
    try {
      const [response] = await conn.promise().query(
        `SELECT 
          c.first_name,
          c.last_name,
          b.student_code,
          b.reason_id, 
          b.comment, 
          b.class_session, 
          b.type_checkin_id 
        FROM ${this.table} AS a 
        LEFT JOIN dim_daily_checkin as b ON b.id_daily_checkin = a.id 
        LEFT JOIN teachers as c ON c.id = a.created_by
        WHERE a.class_code = ? 
        AND a.day = ? 
        AND b.student_code IN (?) 
        AND b.class_session = ?`,
        [class_code, day, student_codes, class_session[0]]
      );

      const checkinMap = {};
      response.forEach((record) => {
        checkinMap[record.student_code] = {
          created_by: record.last_name + " " + record.first_name,
          reason_id: record.reason_id,
          comment: record.comment,
          class_session: record.class_session,
          type_checkin_id: record.type_checkin_id,
        };
      });

      return checkinMap;
    } catch (error) {
      console.error("Query Error:", error);
      throw error;
    } finally {
      await conn.end();
    }
  }

  static async getStudentEvaluation(payload) {
    let day = moment(payload.day).format("YYYY-MM-DD");
    const conn = await connection(1);
    try {
      const [response] = await conn.promise().query(
        `
        WITH m1 AS (
          SELECT a.* , b.text as family_influence_text, c.text as japanese_language_need_text
          FROM dim_daily_evaluation AS a
         LEFT JOIN evaluation_other_option AS b ON b.orther_id = a.family_influence 
          LEFT JOIN evaluation_other_option AS c ON c.orther_id = a.japanese_language_need
        )
       SELECT a.id, m1.* FROM ${this.table} AS a 
        LEFT JOIN m1 ON a.id = m1.id_daily_checkin
        WHERE a.class_code = ?
        AND a.day = ?
        AND m1.class_session = ?
        AND m1.student_code = ?`,
        [payload.class_code, day, payload.class_session[0], payload.student_code]
      );
      return response[0];
    } catch (error) {
      console.error("Query Error:", error);
      throw error;
    } finally {
      await conn.end();
    }
  }
}

module.exports = { DailyCheckinModel };
