const { connection } = require("../../config/database");
const { Model } = require("../Model");

class ProvinceModel extends Model {
  static table = "province";
  static primaryKey = "id";
  static fillable = ["sharepoint_id", "province", "created_at", "updated_at"];

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

      return results ?? {};
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    } finally {
      await conn.end();
    }
  }
}

module.exports = { ProvinceModel };
