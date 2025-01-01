const { connection } = require("../../config/database");
const { Model } = require("../../models/Model");
const { DimConfigModel } = require("./Dim/DimConfigModel");
class ConfigModel extends Model {
  static table = "config";
  static primaryKey = "id";
  static fillable = ["id", "bitrix_id", "properties", "value"];


  static async getAllConfig(filter) {
    const conn = await connection(1);

    let types = filter.type;

    let sql = `
            SELECT *
            FROM config
        `;

    if (filter.type) {
      let type = await DimConfigModel.get(
        ["id"],
        {
          whereIn: {
            type: types,
          },
        },
        "ALL"
      );
      type = [...new Set(type.map((item) => item.id))];
      sql += ` WHERE properties IN (${type})`;
    }

    try {
      const [rows] = await conn.promise().execute(sql);

      return rows;
    } catch (error) {
      console.log("Error fetching config from database: " + error.message);
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
      const [[rs]] = await conn.promise().execute(sql, filteredWhere.values);

      return rs ?? {};
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    } finally {
      await conn.end();
    }
  }

  static async get(select, where, limit = 1) {
    const [filteredWhere, filteredWhereNot, filteredwhereIn] =
      await Promise.all([
        super.where(where.where ?? []),
        super.whereNot(where.whereNot ?? []),
        super.whereIn(where.whereIn ?? []),
      ]);

    let sql = `
            SELECT ${select.join(",")} 
            FROM ${this.table}
            ${
              [
                filteredWhere?.wheres,
                filteredWhereNot?.wheres,
                filteredwhereIn?.wheres,
              ]
                .filter(Boolean) // Loại bỏ giá trị null hoặc undefined
                .join(" AND ") // Nối các điều kiện bằng AND
                ? ` WHERE ` +
                  [
                    filteredWhere?.wheres,
                    filteredWhereNot?.wheres,
                    filteredwhereIn?.wheres,
                  ]
                    .filter(Boolean)
                    .join(" AND ")
                : ""
            }
        `;

    if (limit != "ALL") {
      sql += ` LIMIT ${limit}`;
    }

    const bindings = filteredWhere.values.concat(
      filteredWhereNot.values,
      filteredwhereIn.values
    );
    const conn = await connection(1);
    try {
      const [rs] = await conn.promise().execute(sql, bindings);

      return rs ?? [];
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    } finally {
      await conn.end();
    }
  }

  static async create(data) {
    data[this.primaryKey] = this.createPrimaryKey();
    data.created_at = moment().format("YYYY-MM-DD HH:mm:ss");
    data.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");
    const filteredData = await super.create(data);

    let sql = `
            INSERT INTO ${this.table} (${filteredData.columns})
            VALUES ${filteredData.placeholders}
        `;

    const conn = await connection(1);
    try {
      const [result, fields] = await conn
        .promise()
        .execute(sql, filteredData.values);
      const [[register_class]] = await conn
        .promise()
        .query(
          `SELECT id, ${this.primaryKey} FROM ${this.table} WHERE id = ${result.insertId} LIMIT 1`
        );

      return register_class ?? {};
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
      const [[result]] = await conn
        .promise()
        .query(
          `SELECT id, ${this.primaryKey} FROM ${this.table} WHERE id = ${id} LIMIT 1`
        );

      return result ?? {};
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    } finally {
      await conn.end();
    }
  }

  static async isExists(filter) {
    let sql = `
            SELECT id FROM ${this.table}
        `;

    const where = [];
    const bindings = [];
    if (filter.code) {
      where.push(`${this.table}.code = ?`);
      bindings.push(filter.code);
    }

    if (filter.class_code) {
      where.push(`${this.table}.class_code = ?`);
      bindings.push(filter.class_code);
    }

    if (filter.deal_code) {
      where.push(`${this.table}.deal_code = ?`);
      bindings.push(filter.deal_code);
    }

    if (filter.class_room_code) {
      where.push(`${this.table}.class_room_code = ?`);
      bindings.push(filter.class_room_code);
    }

    if (filter.start_date) {
      where.push(`${this.table}.start_date >= ?`);
      bindings.push(filter.start_date);
    }

    if (filter.end_date) {
      where.push(`${this.table}.end_date <= ?`);
      bindings.push(filter.end_date);
    }

    if (where.length > 0) {
      sql += ` WHERE ${where.join(" AND ")}`;
    }

    sql += " LIMIT 1";
    const conn = await connection(1);
    try {
      const [results, fields] = await conn.promise().execute(sql, bindings);
      return results.length > 0 ? results[0].id : null;
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    } finally {
      await conn.end();
    }
  }
}

module.exports = { ConfigModel };
