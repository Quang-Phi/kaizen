const { connection } = require("../../config/database");
const { Logs } = require("../../helpers/Logs");
const { Model } = require("../../models/Model");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
class TeachersModel extends Model {
  static table = "teachers";
  static primaryKey = "code";
  static fillable = [
    "id",
    "sharepoint_id",
    "bitrix_id",
    "code",
    "first_name",
    "last_name",
    "gender",
    "birthday",
    "note",
    "nationality",
    "status",
    "email",
    "start_date",
    "end_date",
    "type",
    "level",
    "specialized",
    "created_by",
    "updated_by",
    "created_at",
    "updated_at",
    "nationality",
    "department",
    "isQuitJob",
    "branch_code",
    "GroupID",
    "work_time",
    "Quota1Day",
    "Quota1Week",
    "MaNhanVien",
    "Working_type_id",
  ];

  static createPrimaryKey() {
    return "T" + uuidv4();
  }

  static async find(select, where, limit = 1) {
    const filteredWhere = await super.where(where);

    let sql = `
            SELECT ${select.join(",")} 
            FROM ${this.table}
            ${filteredWhere.wheres ? "WHERE " + filteredWhere.wheres : ""}
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

  static async getList(filter, page = 1, pageSize = 20) {
    let sql = `
            -- Get teacher
            WITH m1 as (
                SELECT
                    techers.bitrix_id,
                    techers.id, 
                    techers.code, 
                    techers.first_name,
                    techers.last_name,
                    DATE_FORMAT(techers.birthday, '%Y-%m-%d') as birthday,
                    techers.email,
                    DATE_FORMAT(techers.start_date, '%Y-%m-%d') as start_date,
                    DATE_FORMAT(techers.end_date, '%Y-%m-%d') as end_date,
                    techers.branch_code,
                    CASE
                        WHEN techers.gender = 0 THEN 'Nam'
                        WHEN techers.gender = 1 THEN 'Nữ'
                        ELSE techers.gender
                    END as gender,
                    status.id as status_id,
                    status.value as status,
                    level.value as level,
                    specialized.value as specialized,
                    nationality.value as nationality,
                    techers.work_time,
                    GREATEST(DATEDIFF(NOW(), techers.start_date), 1) as seniority
                FROM ${this.table} as techers
                LEFT JOIN config as status ON status.id = techers.status
                LEFT JOIN config as level ON level.id = techers.level
                LEFT JOIN config as specialized ON specialized.id = techers.specialized
                LEFT JOIN config as nationality ON nationality.id = techers.nationality
            )
            -- Get Branches
            , m2 as (
                SELECT 
                    m1.*, 
                    a.name as branch_name
                FROM 
                    m1
                LEFT JOIN branches a ON a.code = m1.branch_code
            )
            -- Get Area
            , m3 as (
                SELECT 
                    m2.*, 
                    area.code as area_code, 
                    area.name as area_name 
                FROM 
                    m2 
                LEFT JOIN area ON area.code = m2.branch_code
            )
            [filter.total_class_sessions]
            SELECT 
                m3.bitrix_id,
                m3.id, 
                m3.code, 
                m3.first_name,
                m3.last_name,
                m3.birthday as birthday,
                m3.email,
                m3.start_date as start_date,
                m3.end_date as end_date,
                m3.gender,
                m3.status,
                m3.status_id,
                m3.level,
                m3.specialized,
                m3.nationality,
                m3.work_time,
                m3.seniority,
                m3.branch_name,
                m3.branch_code,
                m3.area_name,
                m3.area_code
                [filter.total_class_sessions]
            FROM m3
            [filter.total_class_sessions]
        `;

    const where = [];
    let bindings = [];
    if (filter.full_name) {
      const full_name = filter.full_name;
      const match = full_name.match(/\S+(?=\s*$)/);

      if (match) {
        const last_name = match[0]; // Lấy từ cuối cùng làm last_name
        const first_name = full_name.replace(/\s*\S+\s*$/, "").trim(); // Phần còn lại làm first_name

        const whereFullName = [];
        const bindingsFullName = [];

        if (first_name) {
          const escaped_first_name = first_name.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          ); // Escape special characters
          whereFullName.push(`m3.first_name REGEXP ? OR m3.last_name REGEXP ?`);
          bindingsFullName.push(escaped_first_name);
          bindingsFullName.push(escaped_first_name);
        }
        if (last_name) {
          const escaped_last_name = last_name.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          ); // Escape special characters
          whereFullName.push(`m3.first_name REGEXP ? OR m3.last_name REGEXP ?`);
          bindingsFullName.push(escaped_last_name);
          bindingsFullName.push(escaped_last_name);
        }

        where.push(`(${whereFullName.join(" OR ")})`);
        bindings = [...bindings, ...bindingsFullName];
      }
    }

    if (filter.status) {
      where.push(`m3.status_id = ?`);
      bindings.push(filter.status);
    }

    if (
      filter.total_class_sessions &&
      filter.total_class_sessions[0] &&
      filter.total_class_sessions[1]
    ) {
      sql = sql.replace(
        "[filter.total_class_sessions]",
        ` 
                    , total_class_sessions as (
                        SELECT cs.teacher_code,count(cs.id) as total 
                        FROM class_sessions as cs
                        LEFT JOIN register_class_calendar rcc_1 ON rcc_1.id = cs.register_class_calendar_id                
                        WHERE cs.teacher_code is not null AND rcc_1.date BETWEEN '${filter.total_class_sessions[0]}' AND '${filter.total_class_sessions[1]}'
                        GROUP BY cs.teacher_code
                    )
                `
      );
      sql = sql.replace(
        "[filter.total_class_sessions]",
        `
                    , IFNULL(m1.total, 0) as total_class_sessions
                `
      );
      sql = sql.replace(
        "[filter.total_class_sessions]",
        ` 
                    LEFT JOIN total_class_sessions as m1 ON m1.teacher_code = m3.code
                `
      );
    } else {
      sql = sql.replaceAll("[filter.total_class_sessions]", "");
    }

    if (filter.area_code) {
      where.push(`m3.area_code = ?`);
      bindings.push(filter.area_code);
    }

    if (filter.branch_code) {
      where.push(`m3.branch_code = ?`);
      bindings.push(filter.branch_code);
    }

    if (where.length > 0) {
      sql += ` WHERE ${where.join(" AND ")}`;
    }

    const totalSql = `SELECT COUNT(*) as CNT FROM (${sql}) as count_table`;
    if (pageSize != "ALL") {
      const offset = (page - 1) * pageSize;
      sql += ` LIMIT ${pageSize} OFFSET ${offset}`;
    }

    const conn = await connection(1);
    try {
      const [[totalResult], [rows]] = await Promise.all([
        conn.promise().execute(totalSql, bindings),
        conn.promise().execute(sql, bindings),
      ]);

      const formattedRows = await Promise.all(
        rows.map((item) => {
          try {
            const work_time =
              typeof item.work_time === "string" && item.work_time.trim()
                ? JSON.parse(item.work_time)
                : item.work_time;

            item.work_time = work_time;
          } catch (err) {
            item.work_time = [];

            console.error(`Invalid JSON for teachers: ${item}`, err);
          }
          return item;
        })
      );

      return {
        total: totalResult[0]?.CNT || 0,
        data: formattedRows || [],
      };
    } catch (error) {
      console.log("Error fetching config from database: " + error.message);
      throw error;
    } finally {
      await conn.end();
    }
  }

  static async getCalendar(filter, page = 1, pageSize = 20) {
    let sql = `
            WITH m2 AS (
                SELECT 
                    t.code AS teacher_code,
                    t.first_name AS teacher_first_name,
                    t.last_name AS teacher_last_name,
                    CONCAT(t.last_name, ' ', t.first_name) as teacher_full_name,
                    config.id AS status_id,
                    config.value AS status_value,
                    t.branch_code,
                    t.work_time,
                    COALESCE((
                        SELECT 
                            JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'date', rcc.date,
                                    'sessions', COALESCE((
                                        SELECT 
                                            JSON_ARRAYAGG(
                                                JSON_OBJECT(
                                                    'calendar_id', cs_1.register_class_calendar_id,
                                                    'class_sessions', cs_1.class_session,
                                                    'class_sessions_status', cs_1.status,
                                                    'courses_code', cs_1.courses_code,
                                                    'courses_name', courses.value,
                                                    'teacher_code', cs_1.teacher_code,
                                                    'class_code', c_1.code,
                                                    'class_name', c_1.name,
                                                    'teacher_nearest', (
                                                        SELECT JSON_OBJECT(
                                                            'code', teachers.code,
                                                            'full_name', CONCAT(teachers.last_name, ' ', teachers.first_name)
                                                        )
                                                        FROM class_sessions cs2
                                                        LEFT JOIN teachers ON teachers.code = cs2.teacher_code
                                                        WHERE cs2.courses_code IN (
                                                            SELECT code
                                                            FROM courses
                                                            WHERE skill_code = (
                                                                SELECT skill_code 
                                                                FROM courses 
                                                                WHERE code = cs.courses_code
                                                            )
                                                        ) AND 
                                                        cs2.register_class_calendar_id IN (
                                                            SELECT 
                                                                id 
                                                            FROM register_class_calendar
                                                            WHERE register_class_calendar.register_class_code = rcc.register_class_code
                                                        ) AND 
                                                        cs2.teacher_code IS NOT NULL AND cs2.status = 'Actived'
                                                        ORDER BY cs2.class_session DESC
                                                        LIMIT 1
                                                    ),
                                                    'class_room_code', cs_1.class_room_code,
                                                    'class_room_name', cr.name,
                                                    'teacher_first_name', t.first_name,
                                                    'teacher_last_name', t.last_name,
                                                    'teacher_full_name', CONCAT(t.last_name, ' ', t.first_name)
                                                )
                                            )
                                        FROM class_sessions AS cs_1
                                        LEFT JOIN teachers ON teachers.code = cs_1.teacher_code
                                        LEFT JOIN class_room as cr ON cr.code = cs_1.class_room_code
                                        LEFT JOIN courses ON courses.code = cs_1.courses_code
                                        LEFT JOIN register_class_calendar as rcc_1 ON rcc_1.id = cs_1.register_class_calendar_id
                                        LEFT JOIN register_class as rc_1 ON rc_1.code = rcc_1.register_class_code
                                        LEFT JOIN classes as c_1 ON c_1.code = rc_1.class_code
                                        WHERE cs_1.register_class_calendar_id = rcc.id AND cs_1.status = 'Actived'
                                    ), JSON_ARRAY())
                                )
                            )
                        FROM register_class_calendar AS rcc
                        LEFT JOIN class_sessions AS cs ON cs.register_class_calendar_id = rcc.id 
                        WHERE cs.teacher_code = t.code AND
                        ${
                          filter.date
                            ? ` rcc.date BETWEEN '${filter.date[0]}' AND '${
                                filter.date[filter.date.length - 1]
                              }'`
                            : ` rcc.date BETWEEN '${moment()
                                .subtract(7, "days")
                                .format("YYYY-MM-DD")}' AND '${moment().format(
                                "YYYY-MM-DD"
                              )}'`
                        }
                    ), JSON_ARRAY()) AS register_class_calendar
                FROM ${this.table} AS t
                LEFT JOIN config ON config.id = t.status
            )
            [filter.total_class_sessions]
            -- Get Branches
            , m3 as (
                SELECT 
                    m2.*, 
                    a.name as branch_name
                FROM 
                    m2
                LEFT JOIN branches a ON a.code = m2.branch_code
            )
            -- Get Area
            , m4 as (
                SELECT 
                    m3.*, 
                    area.code as area_code, 
                    area.name as area_name 
                FROM 
                    m3 
                LEFT JOIN area ON area.code = m3.branch_code
            )
            SELECT 
                m4.teacher_code,
                m4.teacher_first_name,
                m4.teacher_last_name,
                m4.teacher_full_name,
                m4.status_id,
                m4.status_value,
                m4.register_class_calendar,
                m4.work_time,
                m4.branch_code,
                m4.branch_name
                [filter.total_class_sessions]
            FROM m4        
            [filter.total_class_sessions]
        `;

    const where = [];
    const bindings = [];

    where.push(`m4.status_id = ?`);
    bindings.push(38);

    if (filter.full_name) {
      const full_name = filter.full_name;
      const match = full_name.match(/\S+(?=\s*$)/);

      if (match) {
        const last_name = match[0]; // Lấy từ cuối cùng làm last_name
        const first_name = full_name.replace(/\s*\S+\s*$/, "").trim(); // Phần còn lại làm first_name

        const whereFullName = [];
        const bindingsFullName = [];

        if (first_name) {
          const escaped_first_name = first_name.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          ); // Escape special characters
          whereFullName.push(`m2.first_name REGEXP ? OR m2.last_name REGEXP ?`);
          bindingsFullName.push(escaped_first_name);
          bindingsFullName.push(escaped_first_name);
        }
        if (last_name) {
          const escaped_last_name = last_name.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          ); // Escape special characters
          whereFullName.push(`m2.first_name REGEXP ? OR m2.last_name REGEXP ?`);
          bindingsFullName.push(escaped_last_name);
          bindingsFullName.push(escaped_last_name);
        }

        where.push(`(${whereFullName.join(" OR ")})`);
        bindings = [...bindings, ...bindingsFullName];
      }
    }

    if (filter.total_class_sessions) {
      sql = sql.replace(
        "[filter.total_class_sessions]",
        ` 
                    , total_class_sessions as (
                        SELECT cs.teacher_code,count(cs.id) as total       
                        FROM class_sessions as cs              
                        WHERE cs.teacher_code is not null
                        GROUP BY cs.teacher_code
                    )
                `
      );
      sql = sql.replace(
        "[filter.total_class_sessions]",
        `
                    , IFNULL(m1.total, 0) as total_class_sessions
                `
      );
      sql = sql.replace(
        "[filter.total_class_sessions]",
        ` 
                    LEFT JOIN total_class_sessions as m1 ON m1.teacher_code = m4.teacher_code
                `
      );
    } else {
      sql = sql.replaceAll("[filter.total_class_sessions]", "");
    }

    if (filter.area_code) {
      where.push(`m4.area_code = ?`);
      bindings.push(filter.area_code);
    }

    if (filter.branch_code) {
      where.push(`m4.branch_code = ?`);
      bindings.push(filter.branch_code);
    }

    if (where.length > 0) {
      sql += ` WHERE ${where.join(" AND ")}`;
    }

    const offset = (page - 1) * pageSize;
    const totalSql = `SELECT COUNT(*) as CNT FROM (${sql}) as count_table`;

    sql += ` LIMIT ${pageSize} OFFSET ${offset}`;

    const conn = await connection(1);
    try {
      const [[totalResult], [rows]] = await Promise.all([
        conn.promise().execute(totalSql, bindings),
        conn.promise().execute(sql, bindings),
      ]);

      const formattedRows = await Promise.all(
        rows.map((item) => {
          try {
            const register_class_calendar =
              typeof item.register_class_calendar === "string" &&
              item.register_class_calendar.trim()
                ? JSON.parse(item.register_class_calendar)
                : item.register_class_calendar;

            item.register_class_calendar = register_class_calendar.map(
              (item) => {
                if (item?.sessions) {
                  item.sessions.sort(
                    (a, b) => a.class_sessions - b.class_sessions
                  );
                  return item;
                }

                return item;
              }
            );

            const work_time =
              typeof item.work_time === "string" && item.work_time.trim()
                ? JSON.parse(item.work_time)
                : item.work_time;

            item.work_time = work_time;
          } catch (err) {
            item.register_class_calendar = [];
            item.work_time = [];

            console.error(
              `Invalid JSON for register_class_calendar: ${item}`,
              err
            );
          }
          return item;
        })
      );

      return {
        total: totalResult[0]?.CNT || 0,
        data: formattedRows || [],
      };
    } catch (error) {
      console.log("Error fetching config from database: " + error.message);
    } finally {
      await conn.end();
    }
  }

  static async isExists(where) {
    const filteredWhere = await super.where(where);

    let sql = `
            SELECT id
            FROM ${this.table} 
            ${filteredWhere.wheres ? " WHERE " + filteredWhere.wheres : ""}
        `;

    sql += " LIMIT 1";

    const conn = await connection(1);
    try {
      const [results] = await conn.promise().execute(sql, filteredWhere.values);

      return results.length > 0 ? results[0] : {};
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    } finally {
      await conn.end();
    }
  }

  static async create(data) {
    if (!data.hasOwnProperty(this.primaryKey)) {
      data[this.primaryKey] = this.createPrimaryKey(data.name);
    }

    if (!data.created_at) {
      data.created_at = moment().format("YYYY-MM-DD HH:mm:ss");
    }

    if (!data.updated_at) {
      data.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");
    }

    const filteredData = await super.createV2(data);

    let columns = filteredData.columns;

    let updateColumns = columns
      .filter((column) => {
        return column != this.primaryKey && column != "created_at";
      })
      .map((column) => `${column} = VALUES(${column})`)
      .join(", ");

    let sql = `
            INSERT INTO ${this.table} (${columns.join(", ")})
            VALUES ${filteredData.placeholders}
            ON DUPLICATE KEY UPDATE ${updateColumns}
        `;

    const conn = await connection(1);
    try {
      const [result, fields] = await conn
        .promise()
        .execute(sql, filteredData.values);
      const [[classes]] = await conn
        .promise()
        .query(
          `SELECT id, ${this.primaryKey} FROM ${this.table} WHERE id = ${result.insertId} LIMIT 1`
        );

      return classes ?? {};
    } catch (error) {
      console.error("Error inserting data:", error);
      throw error;
    } finally {
      await conn.end();
    }
  }

  static async update(data, where) {
    let dataUpdate = { ...data };
    dataUpdate.updated_at = moment().format("YYYY-MM-DD HH:mm:ss");

    dataUpdate = Object.keys(dataUpdate).reduce((acc, key) => {
      if (this.primaryKey != key && key != "created_at") {
        acc[key] = dataUpdate[key];
      }
      return acc;
    }, {});

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

      return result;
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    } finally {
      await conn.end();
    }
  }

  static async createOnUpdate(data, where) {
    const rs = await this.isExists(where);

    Logs.logText("resp-sharepoint-add", JSON.stringify(data));
    Logs.logText("resp-sharepoint-add", JSON.stringify(rs));
    if (rs.id) {
      return await this.update(
        {
          sharepoint_id: data.sharepoint_id,
          bitrix_id: data.bitrix_id,
          code: data.code,
          first_name: data.first_name,
          last_name: data.last_name,
          gender: data.gender,
          birthday: data.birthday,
          note: data.note,
          status: data.status,
          email: data.email,
          start_date: data.start_date,
          end_date: data.end_date,
          type: data.type,
          department: data.department,
          branch_code: data.branch_code,
          work_time: data.work_time,
          MaNhanVien: data.MaNhanVien,
          type: data.type,
        },
        {
          id: rs.id,
        }
      );
    } else {
      return await this.create(data);
    }
  }
}

module.exports = { TeachersModel };
