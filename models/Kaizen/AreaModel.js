const { connection } = require("../../config/database");
const { Model } = require("../../models/Model");
const { v4: uuidv4 } = require("uuid");

class AreaModel extends Model {
  static table = "area";
  static primaryKey = "code";
  static fillable = ["name", "location"];

  static createPrimaryKey() {
    return "AREA" + uuidv4();
  }

  static async getList() {
    const sql = `
            SELECT 
                *
            FROM ${this.table}
        `;

    const conn = await connection(1);
    try {
      const [rows] = await conn.promise().execute(sql);

      return rows;
    } catch (error) {
      console.log("Error fetching config from database: " + error.message);
    } finally {
      await conn.end();
    }
  }
}

module.exports = { AreaModel };
