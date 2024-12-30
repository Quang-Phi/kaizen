const { Model } = require('../Model');
const { connection } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class DealsModel extends Model {

    static table = 'deals';

    static primaryKey = 'code';

    static fillable = [
        'code',
        'deal_id',
        'program_code',
        'opening_date',
        'branch_code',
        'ms_note',
        'ms_id',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at',
    ]

    constructor() {
        
    }

    static createPrimaryKey() {
        return 'DEALS' + uuidv4();
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

    static async create(data) {
        data[this.primaryKey] = this.createPrimaryKey();
        data.created_at = moment().format('YYYY-MM-DD HH:mm:ss');
        data.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');

        console.log('DealsModel create')
        console.log(data)

        const filteredData = await super.createV2(data);

        let columns = filteredData.columns;
        // let updateColumns = columns.map(column => `${column} = VALUES(${column})`).join(', ');
        let updateColumns = columns
            .filter(column => column !== this.primaryKey) // Lọc bỏ `this.primaryKey`
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
            // const [[{ [this.primaryKey]: code }]] = await conn.promise().query(`SELECT ${this.primaryKey} FROM ${this.table} WHERE id = ${result.insertId} LIMIT 1`);
            const [[{ [this.primaryKey]: code }]] = await conn.promise().query(`SELECT ${this.primaryKey} FROM ${this.table} WHERE id = ${result.insertId} LIMIT 1`);

            return code
        } catch (error) {
            console.error('Error inserting data:', error);
            throw error;
        } finally {
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
            SET ${filteredData.placeholders}
            ${filteredData.wheres ? 'WHERE ' + filteredData.wheres : ''}
        `;

        const conn = await connection(1);
        try {
            await conn.promise().execute(sql, filteredData.values);

            return true;
        } catch (error) {
            console.error('Error executing query:', error);
            return false;
        } finally {
            // Đóng kết nối sau khi sử dụng
            await conn.end(); 
        }
    }
}

module.exports = { DealsModel };