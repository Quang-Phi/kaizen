const { connection } = require('../../config/database');
const { Model } = require('../../models/Model');
const { v4: uuidv4 } = require('uuid');
class BranchesModel extends Model {

    static table = 'branches';

    static primaryKey = 'code';

    static fillable = [
        'bitrix_id',
        'sharepoint_id',
        'code',
        'code_genarate',
        'name',
        'address',
        'manager',
        'status',
        'note',
        'phone_number',
        'area_code',
        'established_date'
    ]

    constructor() {
        
    }

    static createPrimaryKey() {
        return 'BRANCH' + uuidv4();
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

    static async getList(filter) 
    {
        let sql = `
            SELECT 
                ${this.table}.name as branch_name,
                ${this.table}.code as branch_code
            FROM ${this.table}
        `;

        const where = [];
        const bindings = [];
        if (filter.area_code) {
            where.push(`${this.table}.area_code = ?`);
            bindings.push(filter.area_code);
        }

        if (where.length > 0) {
            sql += ` WHERE ${where.join(' AND ')}`;
        }

        // Get the database connection
        const conn = await connection(1);
        try {
            const [rows] = await conn.promise().execute(sql, bindings);
            
            return rows;
        } catch (error) {
            console.log('Error fetching config from database: ' + error.message);
        } finally {
            await conn.end();
        }
    }

    static async get(select, where = {})
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

            return results ?? {}
        } catch (error) {
            console.error('Error executing query:', error);
            throw error;
        } finally {
            // Đóng kết nối sau khi sử dụng
            await conn.end();
        }
    }
}

module.exports = { BranchesModel };