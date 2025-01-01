const { connection } = require('../../../config/database');
const { Logs } = require('../../../helpers/Logs');
const { Model } = require('../../Model');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class StudentTranscriptModel extends Model {

     static table = 'student_transcript';

     static primaryKey = 'id';

     static fillable = [
          'id',
          'register_class_student_id',
          'k1',
          'k2',
          'k3',
          'k4',
          'k5',
          'k6',
          'created_by',
          'updated_by',
          'created_at',
          'updated_at'
     ]

     constructor() {

     }

     static async find(select, where, limit = 1)
     {
          const filteredWhere = await super.where(where);

          let sql = `
               SELECT ${select.join(',')} 
               FROM ${this.table}
               ${filteredWhere.wheres ? 'WHERE ' + filteredWhere.wheres : ''}
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

     static async get(select, where, limit = 1)
     {
          const [filteredWhere, filteredWhereNot, filteredwhereNotIn, filteredwhereIn] = await Promise.all([
               super.where(where.where ?? []),
               super.whereNot(where.whereNot ?? []),
               super.whereNotIn(where.whereNotIn, []),
               super.whereIn(where.whereIn ?? [])
          ]);
     
          let sql = `
               SELECT ${select.join(',')} 
               FROM ${this.table}
               ${
                    // (
                    //      filteredWhere?.wheres ||
                    //      filteredwhereIn?.wheres
                    // ) ? 
                    //      ` WHERE `
                    // : ``
                    // (filteredWhere?.wheres) ? filteredWhere.wheres : ``
                    // (filteredwhereIn?.wheres) ? filteredwhereIn.wheres : ``
                    [filteredWhere?.wheres, filteredWhereNot?.wheres, filteredwhereIn?.wheres]
                         .filter(Boolean) // Loại bỏ giá trị null hoặc undefined
                         .join(' AND ') // Nối các điều kiện bằng AND
                         ? ` WHERE ` + 
                              [filteredWhere?.wheres, filteredWhereNot?.wheres, filteredwhereNotIn?.wheres, filteredwhereIn?.wheres]
                              .filter(Boolean)
                              .join(' AND ')
                         : ''
               }
          `;
 
          if (limit != 'ALL') {
               sql += ` LIMIT ${limit}`;
          }
     
          const bindings = filteredWhere.values.concat(filteredWhereNot.values, filteredwhereNotIn.values, filteredwhereIn.values)

          const conn = await connection(1);
          try {
               const [rs] = await conn.promise().execute(sql, bindings);
     
               return rs ?? [];
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

          const filteredData = await super.createV2(data);

          let columns = filteredData.columns;

          let updateColumns = columns
               .filter((column) => {
                    return (column != this.primaryKey && column != 'created_at');
               })
               .map(column => `${column} = VALUES(${column})`)
               .join(', ');

          let sql = `
               INSERT INTO ${this.table} (${columns.join(', ')})
               VALUES ${filteredData.placeholders}
               ON DUPLICATE KEY UPDATE ${updateColumns}
          `;

          const conn = await connection(1);
          try {
               
               const [result, fields] = await conn.promise().execute(sql, filteredData.values);
               const [[classes]] = await conn.promise().query(`SELECT id, ${this.primaryKey} FROM ${this.table} WHERE id = ${result.insertId} LIMIT 1`);

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
               ${filteredData.wheres ? 'WHERE ' + filteredData.wheres : ''}
          `;

          const conn = await connection(1);
          try {
               await conn.promise().execute('SET @id := 0;');
               await conn.promise().execute(sql, filteredData.values);
               const [[{['@id']:id}]] = await conn.promise().execute('SELECT @id;');
               const [[result]] = await conn.promise().query(`
                    SELECT id, ${this.primaryKey} 
                    FROM ${this.table} 
                    WHERE id = ${id} LIMIT 1
               `);
     
               return result ?? {};
          } catch (error) {
               console.error('Error executing query:', error);
               throw error;
          } finally {
               await conn.end(); 
          }
     }
     
     static async createOnUpdate(data, where) 
     {
          const rs = await this.isExists(where);
          if (rs.id) {
               return this.update({
                    register_class_student_id: data.register_class_student_id,
                    k1: data.k1,
                    k2: data.k2,
                    k3: data.k3,
                    k4: data.k4,
                    k5: data.k5,
                    k6: data.k6,
                    updated_by: data.updated_by,
                    updated_at: data.updated_at
               }, {
                    id: rs.id
               });
          } else {
               return this.create(data);
          }
     }
}

module.exports = { StudentTranscriptModel }