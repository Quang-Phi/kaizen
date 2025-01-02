const { connection } = require("../../config/database");
const { Model } = require("../Model");
const moment = require("moment");

class DailyCheckinModel extends Model {
  static table = "daily_checkin";
  static primaryKey = "id";
  static fillable = [
    "id",
    "day",
    "class_code",
    "created_by",
    "updated_by",
    "created_at",
    "updated_at",
  ];

  static async create(items) {
    const conn = await connection(1);
    await conn.promise().beginTransaction();

    try {
      const query = await this.createMultiple(items);
      const [result] = await conn
        .promise()
        .query(
          `INSERT INTO ${this.table} (${query.columns}) VALUES ${query.placeholders}`,
          query.values
        );

      const results = items.map((item, index) => ({
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

  static async update(items) {
    const conn = await connection(1);
    await conn.promise().beginTransaction();

    try {
      const results = [];
      for (const item of items) {
        const { id, created_at, ...updateData } = item;

        const query = await this.updated(updateData, { id });
        await conn
          .promise()
          .query(
            `UPDATE ${this.table} SET ${query.placeholders} WHERE ${query.wheres}`,
            query.values
          );

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
      const query = await this.where(conditions);

      const [rows] = await conn
        .promise()
        .query(
          `SELECT * FROM ${this.table} WHERE ${query.wheres}`,
          query.values
        );

      return rows[0] || null;
    } catch (error) {
      console.error("Transaction Error:", error);
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
        LEFT JOIN teachers as c ON c.id = b.updated_by
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
          class_session: class_session,
          type_checkin_id: record.type_checkin_id,
        };
      });

      return checkinMap;
    } catch (error) {
      console.error("Transaction Error:", error);
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
          SELECT a.* , b.text as family_influence_other, c.text as japanese_language_need_other
            FROM dim_daily_evaluation AS a
          LEFT JOIN evaluation_other_option AS b 
            ON b.orther_id = a.family_influence 
              AND b.daily_checkin_evaluation_id = a.id
          LEFT JOIN evaluation_other_option AS c 
            ON c.orther_id = a.japanese_language_need 
              AND c.daily_checkin_evaluation_id = a.id
        )
       SELECT a.id, m1.* FROM ${this.table} AS a 
        LEFT JOIN m1 ON a.id = m1.id_daily_checkin
        WHERE a.class_code = ?
        AND a.day = ?
        AND m1.class_session = ?
        AND m1.student_code = ?`,
        [
          payload.class_code,
          day,
          payload.class_session[0],
          payload.student_code,
        ]
      );

      if (response.length === 0) {
        return [];
      }

      response[0].class_session = payload.class_session;
      return response[0];
    } catch (error) {
      console.error("Transaction Error:", error);
      throw error;
    } finally {
      await conn.end();
    }
  }
}

module.exports = { DailyCheckinModel };
