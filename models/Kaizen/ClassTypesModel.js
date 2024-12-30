const { connection } = require('../../config/database');
const { Model } = require('../Model');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class ClassTypesModel extends Model {

     static table = 'class_types';

     static primaryKey = 'id';

     static fillable = [
          'id',
          'value',
          'type',
          'note',
          'created_at',
          'updated_at'
     ]

     constructor() {
          
     }

     static async get(select, where = {})
     {
          const filteredWhere = await super.where(where);

          let sql = `
               SELECT ${select.join(',')} 
               FROM ${this.table}
               ${filteredWhere.wheres ? 'WHERE ' + filteredWhere.wheres : ''}
          `;
          console.log(sql);
          const conn = await connection(1);
          try {
               const [results] = await conn.promise().execute(sql, filteredWhere.values);

               return results ?? {}
          } catch (error) {
               console.error('Error executing query:', error);
               throw error;
          } finally {
               // Đóng kết nối sau khi sử dụng
               await conn.end();
          }
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
          
          console.log(filteredWhere, sql, "ClassesModel isExists")
          try {
               const [results, fields] = await conn.promise().execute(sql, filteredWhere.values);

               return results.length > 0 ? results[0].id : {};
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
               const [[classes]] = await conn.promise().query(`SELECT ${this.primaryKey} FROM ${this.table} WHERE id = ${result.insertId} LIMIT 1`);

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
               const [[result]] = await conn.promise().query(`SELECT ${this.primaryKey} FROM ${this.table} WHERE id = ${id} LIMIT 1`);

               return result;
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
          const id = await this.isExists(where);
          Logs.logText('resp-sharepoint-add', JSON.stringify(data));
          if (id) {
              console.log('isExists');
              return this.update(data, {
                  id: id
              });
          } else {
              console.log('create');
              return this.create(data);
          }
     }
}

module.exports = { ClassTypesModel }