const { connection } = require('../../../config/database');
const { Logs } = require('../../../helpers/Logs');
const { Model } = require('../../Model');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class PtnLessonGroupModel extends Model {

     static table = 'ptn_lesson_group';

     static primaryKey = 'code';

     static fillable = [
          'id',
          'code',
          'name',
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
}

module.exports = { PtnLessonGroupModel }