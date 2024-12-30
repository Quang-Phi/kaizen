const { connection } = require('../../config/database');
const { Model } = require('../Model');
const moment = require('moment');

class MicroserviceModel extends Model {

    static table = 'microservice';

    static primaryKey = 'id';

    static fillable = [
        'module',
        'config',
        'note',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at'
    ];

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
            const [[results]] = await conn.promise().execute(sql, filteredWhere.values);

            return results
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

        const filteredData = await super.create(data)

        let sql = `
            INSERT INTO ${this.table} (${filteredData.columns})
            VALUES 
                ${filteredData.placeholders}
            ON DUPLICATE KEY UPDATE 
                config = VALUES(config),
                note = VALUES(note),
                created_by = VALUES(created_by),
                updated_by = VALUES(updated_by),
                updated_at = VALUES(updated_at);
        `;

        const conn = await connection(1);
        try {
            const [result, fields] = await conn.promise().execute(sql, filteredData.values);
            const [[{ [this.primaryKey]: code }]] = await conn.promise().query(`SELECT ${this.primaryKey} FROM ${this.table} WHERE id = ${result.insertId} LIMIT 1`);
            
            return code;
        } catch (error) {
            console.error('Error executing query:', error);
            throw error;
        } finally {
            // Đóng kết nối sau khi sử dụng
            await conn.end();
        }
    }

    static async update(data, where = []) {

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
            console.log(id);
            const [[{ [this.primaryKey]: code }]] = await conn.promise().query(`SELECT ${this.primaryKey} FROM ${this.table} WHERE id = ${id} LIMIT 1`);

            return code;
        } catch (error) {
            console.error('Error executing query:', error);
            throw error;
        } finally {
            // Đóng kết nối sau khi sử dụng
            await conn.end(); 
        }
    }
}

module.exports = { MicroserviceModel }