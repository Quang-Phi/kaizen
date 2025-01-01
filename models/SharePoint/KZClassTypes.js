const { connection } = require("../../config/database");
const { Model } = require("../Model");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");

class KZClassTypes extends Model {
  static table = "kz_ClassTypes_SP";
  static primaryKey = "ClassTypeID";
  static fillable = ["ClassTypeName", "DaysPerWeek", "PeriodsPerDay", "Type"];

  static async get(select, where = {}) {
    const filteredWhere = await super.where(where);

    let sql = `
               SELECT ${select.join(",")} 
               FROM ${this.table}
               ${filteredWhere.wheres ? "WHERE " + filteredWhere.wheres : ""}
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
}

module.exports = { KZClassTypes };
