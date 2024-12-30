const { connection } = require('../../config/database');
const { Model } = require('../Model');

class ProgramModel extends Model {

    static table = 'program';

    static primaryKey = 'code';

    static fillable = [
        'code',
        'bitrix_id',
        'sharepoint_id',
        'name',
        'type',
        'program_code'
    ];

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
            
            const [[results]] = await conn.promise().execute(sql, filteredWhere.values);

            return results ?? {};
        } catch (error) {
            console.error('Error executing query:', error);
            throw error;
        } finally {
            // Đóng kết nối sau khi sử dụng
            await conn.end();
        }
    }

    static async get(select, where)
    {
        const filteredWhere = await super.where(where);

        let sql = `
            SELECT ${select.join(',')} 
            FROM ${this.table}
            ${filteredWhere.wheres ? 'WHERE ' + filteredWhere.wheres : ''}
        `;

        const conn = await connection(1);
        try {
            
            const [results] = await conn.promise().execute(sql, filteredWhere.values);

            return results ?? {};
        } catch (error) {
            console.error('Error executing query:', error);
            throw error;
        } finally {
            // Đóng kết nối sau khi sử dụng
            await conn.end();
        }
    }
}

module.exports = { ProgramModel }