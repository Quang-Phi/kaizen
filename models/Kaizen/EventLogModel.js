const { connection } = require('../../config/database');
const { Model } = require('../../models/Model');
const moment = require('moment');

class EventLogModel extends Model {

     static table = 'event_log';

     static primaryKey = 'id';

     static fillable = [
          'id',
          'event_type',
          'entity_type',
          'entity_id',
          'details',          
          'created_by',
          'created_at',
     ]

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

     static async create(data) 
     {
          data.created_at = moment().format('YYYY-MM-DD HH:mm:ss');
          data.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
          const filteredData = await super.create(data);
     
          let sql = `
               INSERT INTO ${this.table} (${filteredData.columns})
               VALUES ${filteredData.placeholders}
          `;
     
          const conn = await connection(1);
          try {
               // const [[{ [this.primaryKey]: code }]] = await conn.promise().execute(sql, filteredData.values);
               // const [[{ [this.primaryKey]: code }]] = await conn.promise().query(`SELECT ${this.primaryKey} FROM ${this.table} WHERE id = ${id} LIMIT 1`);
               const [result, fields] = await conn.promise().execute(sql, filteredData.values);
               // const [[{ [this.primaryKey]: code }]] = await conn.promise().query(`SELECT ${this.primaryKey} FROM ${this.table} WHERE id = ${result.insertId} LIMIT 1`);
               const [[register_class]] = await conn.promise().query(`SELECT id, ${this.primaryKey} FROM ${this.table} WHERE id = ${result.insertId} LIMIT 1`);
     
               return register_class ?? {}
          } catch (error) {
               console.error('Error executing query:', error);
               throw error;
          } finally {
               // Đóng kết nối sau khi sử dụng
               await conn.end();
          }
     }
 
     static async update(data, where = [])
     {
          const dataUpdate = {...data}
          dataUpdate.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
          const filteredData = await super.updated(dataUpdate, where)
     
          let sql = `
               UPDATE ${this.table}
               SET ${filteredData.placeholders}, id = (SELECT @id := id)
               ${filteredData.wheres ? 'WHERE ' + filteredData.wheres : ''}
          `;
     
          const conn = await connection(1);
          try {
               await conn.promise().execute('SET @id := 0;');
               await conn.promise().execute(sql, filteredData.values);
               const [[{['@id']:id}]] = await conn.promise().execute('SELECT @id;');
               const [[result]] = await conn.promise().query(`SELECT id, ${this.primaryKey} FROM ${this.table} WHERE id = ${id} LIMIT 1`);
               
               return result ?? {};
          } catch (error) {
               console.error('Error executing query:', error);
               throw error;
          } finally {
               // Đóng kết nối sau khi sử dụng
               await conn.end(); 
          }
     }

     static async getList(filter, page = 1, pageSize = 20)
     {
          let sql = `
               SELECT 
                    entity_id,
                    details,
                    created_by
               FROM ${this.table} as el
          `;

          let where = [];
          let bindings = [];

          if (filter.event_type) {
               where.push(`el.event_type = ?`);
               bindings.push(filter.event_type);
          }

          if (filter.entity_type) {
               where.push(`el.entity_type = ?`);
               bindings.push(filter.entity_type);
          }

          if (filter.entity_id) {
               where.push(`el.entity_id = ?`);
               bindings.push(filter.entity_id);
          }

          if (where.length > 0) {
               sql += ` WHERE ${where.join(' AND ')}`;
          }

          const offset = (page - 1) * pageSize;
          const totalSql = `SELECT COUNT(*) as CNT FROM (${sql}) as count_table`;
          sql += ` LIMIT ${pageSize} OFFSET ${offset}`;

          const conn = await connection(1); // Get the database connection
          try {
               const [[totalResult], [rows]] = await Promise.all([
                    conn.promise().execute(totalSql, bindings),
                    conn.promise().execute(sql, bindings)
               ]);

               const formattedRows = await Promise.all(rows.map((item) => {
                    try {
                         const details = 
                              typeof item.details === 'string' && item.details.trim()
                                   ? JSON.parse(item.details)
                                   : item.details;
                         
                         item.details = details
                    } catch (err) {
                        item.details = [];
    
                        console.error(`Invalid JSON for event details: ${item}`, err);
                    }
                    return item;
               }));

               return {
                    total: totalResult[0].CNT,
                    data: formattedRows || []
               };
          } catch (error) {
               console.error('Error executing query:', error);
               throw error;
          } finally {
               await conn.end();
          }
     }
}

module.exports = { EventLogModel };