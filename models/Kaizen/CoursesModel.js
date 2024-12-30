const { connection } = require('../../config/database');
const { Model } = require('../../models/Model');

class CoursesModel extends Model {

     static table = 'courses';

     static primaryKey = 'code';

     static fillable = [
          'id',
          'code',
          'value',
          'skill_code',
          'created_at',
          'updated_at'
     ]

     constructor() {
          
     }

     static async get(select, where, limit = 1)
     {
          const [filteredWhere, filteredwhereIn] = await Promise.all([
               super.where(where.where ?? []),
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
                    [filteredWhere?.wheres, filteredwhereIn?.wheres]
                         .filter(Boolean) // Loại bỏ giá trị null hoặc undefined
                         .join(' AND ') // Nối các điều kiện bằng AND
                         ? ` WHERE ` + 
                              [filteredWhere?.wheres, filteredwhereIn?.wheres]
                              .filter(Boolean)
                              .join(' AND ')
                         : ''
               }
          `;

          if (limit != 'ALL') {
               sql += ` LIMIT ${limit}`;
          }

          const bindings = filteredWhere.values.concat(filteredwhereIn.values)
          console.log(sql, bindings)
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

module.exports = { CoursesModel };