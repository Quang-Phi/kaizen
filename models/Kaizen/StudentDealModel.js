const { Model } = require("../Model");
const { connection } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");

class StudentDealModel extends Model {
  static table = "student_deal";
  static primaryKey = "id";
  static fillable = [
    "id",
    "deal_code",
    "student_code",
    "status",
    "student_id",
    "created_at",
    "updated_at",
  ];

  constructor() {}

  static async get(select, where) {
    const filteredWhere = await super.where(where);

    let sql = `
            SELECT ${select.join(",")} 
            FROM ${this.table}
            WHERE ${filteredWhere.wheres}
        `;

    const conn = await connection(1);
    try {
      const [results] = await conn.promise().execute(sql, filteredWhere.values);

      return results ?? {};
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    } finally {
      await conn.end();
    }
  }

  static async create(data) {
    data.created_at = moment().format("YYYY-MM-DD HH:mm:ss");
    data.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");

    const filteredData = await super.create(data);

    let sql = `
            INSERT INTO ${this.table} (${filteredData.columns})
            VALUES ${filteredData.placeholders}
            ON DUPLICATE KEY UPDATE 
                status = VALUES(status),
                updated_at = VALUES(updated_at)
        `;

    const conn = await connection(1);
    try {
      const [result] = await conn.promise().execute(sql, filteredData.values);

      return result.affectedRows;
    } catch (error) {
      console.error("Error inserting data:", error);
    } finally {
      await conn.end();
    }
  }

  static async update(data, where = []) {
    const dataUpdate = { ...data };
    dataUpdate.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");
    const filteredData = await super.updated(dataUpdate, where);

    let sql = `
            UPDATE ${this.table}
            SET ${filteredData.placeholders}, id = (SELECT @id := id)
            ${filteredData.wheres ? "WHERE " + filteredData.wheres : ""}
        `;

    const conn = await connection(1);
    try {
      await conn.promise().execute("SET @id := 0;");
      await conn.promise().execute(sql, filteredData.values);
      const [[{ ["@id"]: id }]] = await conn.promise().execute("SELECT @id;");

      const [[{ [this.primaryKey]: code }]] = await conn
        .promise()
        .query(
          `SELECT ${this.primaryKey} FROM ${this.table} WHERE id = ${id} LIMIT 1`
        );

      return code;
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    } finally {
      await conn.end();
    }
  }
}

module.exports = { StudentDealModel };
