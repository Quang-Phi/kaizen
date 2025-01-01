const { Model } = require("../Model");
const { connection } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const { Logs } = require("../../helpers/Logs");

class RegisterClassModel extends Model {
  static table = "register_class";
  static primaryKey = "code";
  static fillable = [
    "id",
    "code",
    "class_code",
    "class_room_code",
    "facilities_code",
    "teacher_code",
    "opening_date",
    "start_date",
    "end_date",
    "status",
    "form_of_study",
    "quantity",
    "actual_number_male",
    "actual_number",
    "actual_number_female",
    "lesson",
    "class_types_id",
    "class_session",
    "subject_teacher",
    "sp_item_log",
    "sharepoint_class_id",
    "created_by",
    "updated_by",
    "created_at",
    "updated_at",
  ];

  constructor() {}

  static createPrimaryKey() {
    return "RL" + uuidv4();
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

  static async createRegisterClass(data) {
    const id = await this.isExists(data);

    if (id) {
      return this.update(data, {
        id: id,
      });
    } else {
      return this.create(data);
    }
  }

  static async isExistsV2(filter) {
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
      const [[results]] = await conn.promise().execute(sql, bindings);
      return results ?? {};
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    } finally {
      await conn.end();
    }
  }

  static async createOnUpdate(data, where) {
    const rs = await this.isExistsV2(where);
    Logs.logText("resp-sharepoint-add", JSON.stringify(data));
    if (rs.id) {
      return await this.update(data, {
        id: rs.id,
      });
    } else {
      return await this.create(data);
    }
  }

  static async getCountActualNumber(id) {
    let sql = `
            SELECT 
                t.gender, 
                (
                    CASE 
                        WHEN t.gender = 1 THEN 'male'
                        WHEN t.gender = 0 THEN 'female'
                        ELSE 'unknown'
                    END
                ) as gender_name,
                count(*) as total
            FROM register_class as rc
            INNER JOIN register_class_student as rcs ON rcs.register_class_code = rc.code AND rcs.status = 'Actived'
            INNER JOIN student as t ON t.code = rcs.student_code
            WHERE rc.id = ? AND rcs.status = 'Actived'
            GROUP BY t.gender
        `;

    const conn = await connection(1);
    try {
      const [results] = await conn.promise().execute(sql, [id]);
      const male = results.find((item) => item.gender === 1) || { total: 0 };
      const female = results.find((item) => item.gender === 0) || { total: 0 };
      const unknown = results.find(
        (item) => item.gender_name === "unknown"
      ) || { total: 0 };
      const total =
        (male?.total || 0) + (female?.total || 0) + (unknown?.total || 0);

      return {
        male: male?.total || 0,
        female: female?.total || 0,
        total: total,
      };
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    } finally {
      await conn.end();
    }
  }
}

module.exports = { RegisterClassModel };
