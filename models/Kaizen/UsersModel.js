const { connection } = require('../../config/database');
const { Model } = require('../Model');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

class UsersModel extends Model {

     static table = 'users';

     static primaryKey = 'id';

     static fillable = [
          'id',
          'first_name',
          'last_name',
          'created_at',
          'updated_at'
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
 
     static async get(select, where, limit = 1)
     {
          const [filteredWhere, filteredWhereNot, filteredwhereIn] = await Promise.all([
               super.where(where.where ?? []),
               super.whereNot(where.whereNot ?? []),
               super.whereIn(where.whereIn ?? [])
          ]);
     
          console.log(filteredWhereNot, 'filteredWhereNot')
     
          let sql = `
               SELECT ${select.join(',')} 
               FROM ${this.table}
               ${
                    [filteredWhere?.wheres, filteredWhereNot?.wheres, filteredwhereIn?.wheres]
                         .filter(Boolean) // Loại bỏ giá trị null hoặc undefined
                         .join(' AND ') // Nối các điều kiện bằng AND
                         ? ` WHERE ` + 
                              [filteredWhere?.wheres, filteredWhereNot?.wheres, filteredwhereIn?.wheres]
                              .filter(Boolean)
                              .join(' AND ')
                         : ''
               }
          `;
     
          if (limit != 'ALL') {
               sql += ` LIMIT ${limit}`;
          }
     
          const bindings = filteredWhere.values.concat(filteredWhereNot.values, filteredwhereIn.values)
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
 
     static async isExists(where) 
     {
          const filteredWhere = await super.where(where);

          const conn = await connection(1);
          let sql = `
               SELECT id
               FROM ${this.table} 
               ${filteredWhere.wheres ? ' WHERE ' + filteredWhere.wheres : ''}
          `;

          sql += " LIMIT 1";
          
          try {
               const [results, fields] = await conn.promise().execute(sql, filteredWhere.values);

               return results.length > 0 ? results[0] : {};
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

          if (rs.id) {
              return await this.update(data, {
                  id: rs.id
              });
          } else {
              return await this.create(data);
          }
     }
}

module.exports = { UsersModel }