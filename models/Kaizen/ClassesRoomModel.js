const { connection } = require('../../config/database');
const { Model } = require('../Model');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class ClassesRoomModel extends Model {

     static table = 'class_room';

     static primaryKey = 'code';

     static fillable = [
          'id',
          'code',
          'name',
          'branch_code',
          'capacity',
          'type',
          'created_at',
          'updated_at'
     ]

     constructor() {
          
     }

     static createPrimaryKey(name) {
          return name.replace(/\s/g, '');
     }

     static async find(select, where, limit = 1)
     {
          const filteredWhere = await super.where(where);

          let sql = `
               SELECT ${select.join(',')} 
               FROM ${this.table}
               WHERE ${filteredWhere.wheres}
          `;

          sql += ` LIMIT ${limit}`;

          const conn = await connection(1);
          try {
               const [[rs]] = await conn.promise().execute(sql, filteredWhere.values);

               return rs ?? {};
          } catch (error) {
               console.error('Error executing query:', error);
               throw error;
          } finally {
               // Đóng kết nối sau khi sử dụng
               await conn.end();
          }
     }

     static async getCalendar(filter, page = 1, pageSize = 20) {

          let sql = `
               WITH room_dates AS(
                    SELECT 
                         rcc.date
                    FROM register_class_calendar AS rcc
                    LEFT JOIN class_sessions cs ON cs.register_class_calendar_id = rcc.id
                    GROUP BY rcc.date                                                         
               ),
               room_dates_2 AS (
                    SELECT 
                              rcc.id,
                         rcc.date,
                         cs.class_room_code
                    FROM register_class_calendar AS rcc
                    LEFT JOIN class_sessions cs ON cs.register_class_calendar_id = rcc.id
               ), class_by_calendar as (
                    SELECT 
                         rc.class_code,
                         c.name as class_name,
                         rcc.id as calendar_id
                    FROM
                         register_class_calendar rcc
                    LEFT JOIN register_class rc ON rc.code = rcc.register_class_code
                    LEFT JOIN classes c ON c.code = rc.class_code
                    WHERE rc.class_code IS NOT NULL
               ), m2 AS (
                    SELECT 
                         cr.code AS classroom_code,
                         cr.name AS classroom_name,
                         cr.branch_code,
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
                                                                 'class_name', cbc.class_name,
                                                                 'class_code', cbc.class_code,
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
                                                                                WHERE code = cs_1.courses_code
                                                                           )
                                                                      ) AND 
                                                                      cs2.register_class_calendar_id IN (
                                                                           SELECT 
                                                                                id 
                                                                           FROM register_class_calendar
                                                                      ) AND cs2.teacher_code IS NOT NULL AND cs2.status = 'Actived'
                                                                      ORDER BY cs2.class_session DESC
                                                                      LIMIT 1
                                                                 ),
                                                                 'class_room_code', cs_1.class_room_code,
                                                                 'class_room_name', cr.name,
                                                                 'teacher_first_name', t_1.first_name,
                                                                 'teacher_last_name', t_1.last_name,
                                                                 'teacher_full_name', CONCAT(t_1.last_name, ' ', t_1.first_name)
                                                            )
                                                       )
                                                  FROM class_sessions AS cs_1
                                                  LEFT JOIN class_by_calendar cbc ON cbc.calendar_id = cs_1.register_class_calendar_id
                                                  LEFT JOIN teachers as t_1 ON t_1.code = cs_1.teacher_code
                                                  LEFT JOIN class_room as cr_1 ON cr_1.code = cs_1.class_room_code
                                                  LEFT JOIN courses ON courses.code = cs_1.courses_code
                                                  WHERE cs_1.register_class_calendar_id IN (
                                                       SELECT 
                                                            rd_2.id
                                                       FROM room_dates_2 rd_2
                                                       WHERE rd_2.class_room_code = cr.code AND rd_2.date = rcc.date
                                                  ) AND cr_1.code = cr.code AND cs_1.status = 'Actived' [filter.class_code]
                                             ), JSON_ARRAY())
                                        )
                                   )
                              FROM room_dates AS rcc
                              WHERE 
                              ${filter.date ? 
                                   ` rcc.date BETWEEN '${filter.date[0]}' AND '${filter.date[1]}'` :
                                   ` rcc.date BETWEEN '${moment().subtract(7, "days").format('YYYY-MM-DD')}' AND '${moment().format('YYYY-MM-DD')}'`
                              }
                         ), JSON_ARRAY()) AS register_class_calendar
                    FROM ${this.table} AS cr
               )
               -- [filter.total_class_sessions]
               SELECT 
                    m2.classroom_code,
                    m2.classroom_name,
                    m2.register_class_calendar
                    -- [filter.total_class_sessions]
               FROM m2        
               -- [filter.total_class_sessions]
          `;

          const where = [];
          const bindings = [];

          if (filter.class_code) {
               sql = sql.replace('[filter.class_code]', 'AND cbc.class_code =?');
               bindings.push(filter.class_code);
          } else {
               sql = sql.replace('[filter.class_code]', '');
          }

          if (filter.full_name) {
               // Sử dụng regex để lấy từ cuối cùng (last_name)
               const full_name = filter.full_name;
               const match = full_name.match(/\S+(?=\s*$)/);

               if (match) {
                    const last_name = match[0]; // Lấy từ cuối cùng làm last_name
                    const first_name = full_name.replace(/\s*\S+\s*$/, '').trim(); // Phần còn lại làm first_name

                    const whereFullName = [];
                    const bindingsFullName = [];

                    if (first_name) {
                         const escaped_first_name = first_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
                         whereFullName.push(`m2.first_name REGEXP ? OR m2.last_name REGEXP ?`)
                         bindingsFullName.push(escaped_first_name);
                         bindingsFullName.push(escaped_first_name);
                    }
                    if (last_name) {
                         const escaped_last_name = last_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
                         whereFullName.push(`m2.first_name REGEXP ? OR m2.last_name REGEXP ?`)
                         bindingsFullName.push(escaped_last_name);
                         bindingsFullName.push(escaped_last_name);
                    }

                    where.push(`(${whereFullName.join(' OR ')})`);
                    bindings = [...bindings, ...bindingsFullName];
                    console.log(bindings)
               }
          }

          // if (filter.total_class_sessions) {
          //      sql = sql.replace(
          //           '[filter.total_class_sessions]', 
          //           ` 
          //           , total_class_sessions as (
          //                SELECT cs.teacher_code,count(cs.id) as total 
          //                FROM class_sessions as cs
          //                WHERE cs.teacher_code is not null
          //                GROUP BY cs.teacher_code
          //           )
          //           `
          //      );
          //      sql = sql.replace(
          //           '[filter.total_class_sessions]', 
          //           `
          //           , IFNULL(m1.total, 0) as total_class_sessions
          //           `
          //      );
          //      sql = sql.replace(
          //           '[filter.total_class_sessions]', 
          //           ` 
          //           LEFT JOIN total_class_sessions as m1 ON m1.teacher_code = m2.teacher_code
          //           `
          //      );
          // } else {
          //      sql = sql.replaceAll('[filter.total_class_sessions]', '');
          // }

          if (where.length > 0) {
               sql += ` WHERE ${where.join(' AND ')}`;
          }

          const offset = (page - 1) * pageSize;
          const totalSql = `SELECT COUNT(*) as CNT FROM (${sql}) as count_table`;

          sql += ` LIMIT ${pageSize} OFFSET ${offset}`;

          // Get the database connection
          const conn = await connection(1);
          try {
               const [[totalResult], [rows]] = await Promise.all([
                    conn.promise().execute(totalSql, bindings),
                    conn.promise().execute(sql, bindings)
               ]);
     
               const formattedRows = await Promise.all(rows.map((item) => {
                    try {
                         const register_class_calendar = 
                              typeof item.register_class_calendar === 'string' && item.register_class_calendar.trim()
                                   ? JSON.parse(item.register_class_calendar)
                                   : item.register_class_calendar;
                    
                         item.register_class_calendar = register_class_calendar.map((item) => {
                         
                         if (item?.sessions) {
                              item.sessions.sort((a, b) => a.class_sessions - b.class_sessions);
                              return item;
                         }

                         return item;
                    });

                    } catch (err) {
                         item.register_class_calendar = [];

                         console.error(`Invalid JSON for register_class_calendar: ${item}`, err);
                    }

                    return item;
               }));
          
               return {
                    total: totalResult[0]?.CNT || 0,
                    data: formattedRows || []
                    // data: rows
               };
          } catch (error) {
               console.log('Error fetching config from database: ' + error.message);
          } finally {
               await conn.end();
          }
     }

     static async getList(filter, page = 1, pageSize = 20) 
     {
          let sql = `
               SELECT      
                    ${this.table}.*,
                    branches.name as branch_name,
                    area.name as area_name
               FROM ${this.table}
               LEFT JOIN branches ON branches.code = ${this.table}.branch_code
               LEFT JOIN area ON area.code = branches.area_code
          `;
     
          const where = [];
          const bindings = [];
          if (filter.branch_code) {
               where.push(`${this.table}.branch_code = ?`);
               bindings.push(filter.branch_code);
          }

          if (filter.area_code) {
               where.push("area.code = ?");
               bindings.push(filter.area_code);
          }

          if (where.length > 0) {
               sql += ` WHERE ${where.join(' AND ')}`;
          }

          if (pageSize != 'ALL') {
               const offset = (page - 1) * pageSize;
               sql += ` LIMIT ${pageSize} OFFSET ${offset}`;
          }
     
          // Get the database connection
          const conn = await connection(1);
          try {
               const [rows] = await conn.promise().execute(sql, bindings);
     
               return rows;
          } catch (error) {
               console.log('Error fetching config from database: ' + error.message);
          }
     }
 
     static async getListCount(filter)
     {
          let sql = `
               SELECT      
                    ${this.table}.*,
                    branches.name as branch_name,
                    area.name as area_name
               FROM ${this.table}
               LEFT JOIN branches ON branches.code = ${this.table}.branch_code
               LEFT JOIN area ON area.code = branches.area_code
          `;
     
          const where = [];
          const bindings = [];
          if (filter.branch_code) {
               where.push(`${this.table}.branch_code = ?`);
               bindings.push(filter.branch_code);
          }

          if (filter.area_code) {
               where.push("area.code = ?");
               bindings.push(filter.area_code);
          }
     
          if (where.length > 0) {
               sql += ` WHERE ${where.join(' AND ')}`;
          }
     
          // Get the database connection
          const conn = await connection(1);
          try {
               const totalSql = `SELECT COUNT(*) as CNT FROM (${sql}) as count_table`;
               const [totalResult] = await conn.promise().execute(totalSql, bindings);
               const totalRecords = totalResult[0].CNT;
     
               await conn.end();
     
               return totalRecords;
          } catch (error) {
               console.log('Error fetching config from database: ' + error.message);
          }
     }

     static async isExists(where) 
     {
          const filteredWhere = await super.where(where);
      
          const conn = await connection(1); // Sử dụng connection pool nếu được
          const sql = `
              SELECT id
              FROM ${this.table} 
              ${filteredWhere.wheres ? 'WHERE ' + filteredWhere.wheres : ''}
              LIMIT 1
          `;
          console.log(sql, filteredWhere);
          try {
               const [results] = await conn.promise().execute(sql, filteredWhere.values);

               return results[0] ?? {}; // Trả về đối tượng rỗng nếu không tìm thấy
          } catch (error) {
               console.error('Error executing query:', {
                    query: sql,
                    values: filteredWhere.values,
                    error: error.message,
               });
               throw error;
          } finally {
               await conn.end();
          }
     }
 
     static async create(data) 
     {
          data[this.primaryKey] = this.createPrimaryKey(data.name);
          data.created_at = moment().format('YYYY-MM-DD HH:mm:ss');
          data.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
 
          const filteredData = await super.createV2(data);
 
          let columns = filteredData.columns;
          let updateColumns = columns
               .filter(column => column !== this.primaryKey || column !== 'created_at')
               .map(column => `${column} = VALUES(${column})`)
               .join(', ');

          let sql = `
               INSERT INTO ${this.table} (${columns.join(', ')})
               VALUES ${filteredData.placeholders}
               ON DUPLICATE KEY UPDATE ${updateColumns}
          `;

          const conn = await connection(1);
          try {

               const [result] = await conn.promise().execute(sql, filteredData.values);
               const [[classes]] = await conn.promise().query(`
                    SELECT id, ${this.primaryKey} 
                    FROM ${this.table} 
                    WHERE id = ${result.insertId} 
                    LIMIT 1
               `);
               
               return classes ?? {}
          } catch (error) {
               console.error('Error inserting data:', error);
          } finally {
               await conn.end();
          }
     }
 
     static async update(data, where)
     {
          const dataUpdate = {...data}
          dataUpdate.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
          const filteredData = await super.updated(dataUpdate, where)
          
          let sql = `
               UPDATE ${this.table}
               SET ${filteredData.placeholders}, id = (SELECT @id := id)
               ${filteredData.wheres ? ' WHERE ' + filteredData.wheres : ''}
          `;
     
          const conn = await connection(1);
          try {
               await conn.promise().execute('SET @id := 0;');
               await conn.promise().execute(sql, filteredData.values);
               const [[{['@id']:id}]] = await conn.promise().execute('SELECT @id;');
               const [[result]] = await conn.promise().query(`
                    SELECT id, ${this.primaryKey} 
                    FROM ${this.table} 
                    WHERE id = ${id} 
                    LIMIT 1
               `);

               return result ?? {};
          } catch (error) {
               console.error('Error executing query:', error);
               throw error;
          } finally {
               // Đóng kết nối sau khi sử dụng
               await conn.end(); 
          }
     }
 
     static async createOnUpdate(data, where) 
     {
          const rs = await this.isExists(where);

          if (rs?.id) {
               return this.update({
                    branch_code: data.branch_code,
                    name: data.name,
                    // type: data.type
               }, {
                    id: rs.id
               });
          } else {
               console.log('create');
               return this.create(data);
          }
     }

     
}

module.exports = { ClassesRoomModel };