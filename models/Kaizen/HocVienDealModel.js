const { Model } = require("../Model");
const { connection } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");

class HocVienDealModel extends Model {
  static table = "student_deal";
  static primaryKey = "id";
  static fillable = ["deal_code", "student_code", "created_at", "updated_at"];

  constructor() {}

  static async create(data) {
    data.created_at = moment().format("YYYY-MM-DD HH:mm:ss");
    data.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");
    const filteredData = await super.create(data);

    let sql = `
            INSERT INTO ${this.table} (${filteredData.columns})
            VALUES ${filteredData.placeholders}
            ON DUPLICATE KEY UPDATE 
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
}

module.exports = { HocVienDealModel };
