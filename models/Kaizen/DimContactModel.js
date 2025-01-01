const { Model } = require("../Model");
const { HocVienDealModel } = require("./HocVienDealModel");
const { connection } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");

class DimContactModel extends Model {
  static table = "dim_contact";
  static primaryKey = "id";
  static fillable = [
    "student_id",
    "type_value",
    "type_person",
    "value",
    "created_at",
    "updated_at",
  ];

  static type_value = ["Phone", "Email"];

  static type_person = ["Student", "Family"];

  static async create(data) {
    data.code = data.code;
    data.created_at = moment().format("YYYY-MM-DD HH:mm:ss");
    data.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");

    const filteredData = await super.create(data);

    let sql = `
            INSERT INTO ${this.table} (${filteredData.columns})
            VALUES 
                ${filteredData.placeholders}
        `;
    const conn = await connection(1);
    try {
      const [result, fields] = await conn
        .promise()
        .execute(sql, filteredData.values);
      const [[rs]] = await conn
        .promise()
        .query(
          `SELECT ${this.primaryKey} FROM ${this.table} WHERE id = ${result.insertId} LIMIT 1`
        );

      return rs ?? {};
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
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

  static async delete(where = []) {
    const filteredData = await super.where(where);

    if (!filteredData.wheres) {
      return;
    }

    let sql = `
            DELETE ${this.table}
            FROM ${this.table}
            ${filteredData.wheres ? "WHERE " + filteredData.wheres : ""}
        `;

    const conn = await connection(1);
    try {
      const [rs] = await conn.promise().execute(sql, filteredData.values);

      return rs;
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    } finally {
      await conn.end();
    }
  }

  static async find(select, where, limit = 1) {
    const filteredWhere = await super.where(where);

    let sql = `
            SELECT ${select.join(",")} 
            FROM ${this.table}
            WHERE ${filteredWhere.wheres}
        `;

    sql += ` LIMIT ${limit}`;

    const conn = await connection(1);
    try {
      const [[results]] = await conn
        .promise()
        .execute(sql, filteredWhere.values);

      return results;
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    } finally {
      await conn.end();
    }
  }
}

module.exports = { DimContactModel };
