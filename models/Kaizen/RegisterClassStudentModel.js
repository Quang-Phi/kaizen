const { Model } = require('../Model');
const { connection } = require('../../config/database');
const { runWorkerV2 } = require('../../workers/runWorker');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class RegisterClassStudentModel extends Model {
    
    static table = 'register_class_student';

    static primaryKey = 'id';

    static fillable = [
        'register_class_code',
        'student_code',
        'teacher_code',
        'lesson',
        'status',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at'
    ]

    constructor() {

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
        console.log(sql)
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
            let [result] = await conn.promise().execute(sql, filteredData.values);
            // const [[{ [this.primaryKey]: code }]] = await conn.promise().query(`SELECT ${this.primaryKey} FROM ${this.table} WHERE id = ${result.insertId} LIMIT 1`);
            // const [[ rs ]] = await conn.promise().query(`SELECT ${this.primaryKey} FROM ${this.table} WHERE id = ${result.insertId} LIMIT 1`);
            console.log(result , 'test 123');
            // return id
        } catch (error) {
            console.error('Error executing query:', error);
            throw error;
        } finally {
            // Đóng kết nối sau khi sử dụng
            await conn.end();
        }
    }

    // Không dùng
    static async delete(class_code) {
        let sql = `
            DELETE FROM ${this.table} WHERE register_class_code = ?;
        `;

        const conn = await connection(1);
        try {
            await conn.promise().execute(sql, [class_code]);
            
            return true
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
        const dataUpdate = {...where}
        const filteredData = await super.where(dataUpdate)

        let sql = `
            SELECT COUNT(*) as total FROM ${this.table} 
            ${filteredData.wheres ? 'WHERE ' + filteredData.wheres : ''}
        `;

        const conn = await connection(1);
        try {
            const [[rs]] = await conn.promise().execute(sql, filteredData.values);

            if (rs.total) {
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error executing query:', error);
            return false;
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

    static async addStudent(class_code, data) 
    {
        // let isDelete = await this.delete(class_code);
        // if (!isDelete) {
        //     return isDelete;
        // }

        let students = data.student;
        students = await Promise.all(students.map(async (item, index) => {
            let new_item = {}
            new_item.register_class_code = class_code;
            new_item.student_code = item;
            new_item.status = 'Actived';

            const results = await runWorkerV2('Kaizen/RegisterClassStudentWorker.js', {
                type: 'create', 
                data: new_item
            });

            return results;
        }));

        // const results = runWorker('RegisterClassStudentWorker.js', 'create', { filter: {}, page: 1, pageSize: 100 });
    }

    static async createOnUpdate(data, where) 
    {
        const rs = await this.find(['*'], where);

        if (rs?.id) {
            return this.update({
                status: data.status,
                updated_by: data.updated_by
            }, {
                id: rs.id
            });
        } else {
            console.log('create');
            return this.create(data);
        }
    }
}

module.exports = { RegisterClassStudentModel }