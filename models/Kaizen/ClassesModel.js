const { connection } = require('../../config/database');
const { Model } = require('../Model');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
class ClassesModel extends Model {

    static table = 'classes';

    static primaryKey = 'code';

    static fillable = [
        'id',
        'code',
        'name',
        'status',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at'
    ]

    constructor() {
        
    }

    static createPrimaryKey(name) {
        return name.replace(/\s/g, '');
   }

    static async getList(filter, page = 1, pageSize = 20) 
    {
        let sql = `
            WITH m1 as (
                select 
                    distinct(code) as code, 
                    branch_code 
                from 
                    class_room
                ), 
            m2 as (
                SELECT 
                    c.id as id, 
                    c.code as class_code, 
                    c.name as class_name, 
                    class_types.type as class_type, 
                    class_types.id as class_types_id,
                    class_types.value as class_types_value,
                    register_class.form_of_study,
                    register_class.quantity as class_quantity, 
                    register_class.actual_number as actual_number_of_people, 
                    register_class.actual_number_male as male, 
                    register_class.actual_number_female as female, 
                    DATE_FORMAT(register_class.opening_date, '%Y-%m-%d') as opening_date, 
                    DATE_FORMAT(register_class.start_date, '%Y-%m-%d') as start_date, 
                    DATE_FORMAT(register_class.end_date, '%Y-%m-%d') as end_date, 
                    register_class.lesson as lesson, 
                    config.value as status, 
                    config.id as status_id, 
                    register_class.teacher_code, 
                    register_class.class_room_code, 
                    m1.branch_code 
                FROM 
                    ${this.table} as c
                LEFT JOIN config ON config.id = c.status 
                LEFT JOIN register_class ON register_class.class_code = c.code 
                LEFT JOIN class_types ON class_types.id = register_class.class_types_id
                LEFT JOIN m1 ON m1.code = register_class.class_room_code 
            ), 
            m3 as (
                SELECT 
                    m2.*, 
                    a.name as branch_name
                FROM 
                    m2 
                LEFT JOIN branches a ON a.code = m2.branch_code
            ), 
            m4 as (
                SELECT 
                    m3.*, 
                    area.code as area_code, 
                    area.name as area_name 
                FROM 
                    m3 
                LEFT JOIN area ON area.code = m3.branch_code
            ), 
            n as (
                SELECT 
                    a.bitrix_id as teacher_bitrix_id, 
                    a.code as teacher_code, 
                    a.first_name as teacher_first_name, 
                    a.last_name as teacher_last_name, 
                    CONCAT(a.first_name, ' ', a.last_name) as teachers_fullname 
                FROM 
                    teachers a 
                where 
                    a.code is not null and a.code != ''
            ) 
            SELECT 
                m4.id,
                m4.class_code,
                m4.class_name,
                m4.class_type,
                m4.class_types_id,
                m4.class_types_value,
                m4.class_quantity,
                m4.actual_number_of_people,
                m4.male,
                m4.female,
                m4.opening_date,
                m4.start_date,
                m4.end_date,
                m4.lesson,
                m4.status,
                m4.form_of_study,
                m4.status_id,
                n.teacher_bitrix_id,
                m4.teacher_code,
                n.teachers_fullname,
                n.teacher_first_name,
                n.teacher_last_name,
                m4.branch_name,
                m4.branch_code,
                m4.area_name,
                m4.area_code
            FROM 
                m4 
            LEFT JOIN n ON m4.teacher_code = n.teacher_code 
        `;

        const where = [];
        const bindings = [];

        where.push(`m4.status_id = ?`);
        bindings.push(1);

        if (filter.class_name) {
            // where.push(`m4.class_name REGEXP ?`);
            // bindings.push(filter.class_name);
            const escapedClassName = filter.class_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
            where.push(`m4.class_name REGEXP ?`);
            bindings.push(escapedClassName);
        }

        if (filter.where_class_name) {
            where.push(`m4.class_name = ?`);
            bindings.push(filter.where_class_name);
        }

        if (filter.area_code) {
            where.push(`m4.area_code = ?`);
            bindings.push(filter.area_code);
        }

        if (filter.status_id) {
            where.push(`m4.status = ?`);
            bindings.push(filter.status_id);
        }

        if (filter.class_type) {
            where.push(`m4.class_type = ?`);
            bindings.push(filter.class_type);
        }

        if (filter.branch_code) {
            where.push(`m4.branch_code = ?`);
            bindings.push(filter.branch_code);
        }

        if (where.length > 0) {
            sql += ` WHERE ${where.join(' AND ')}`;
        }

        const offset = (page - 1) * pageSize;
        const totalSql = `SELECT COUNT(*) as CNT FROM (${sql}) as count_table`;
        sql += ` LIMIT ${pageSize} OFFSET ${offset}`;

        // Get the database connection
        const conn = await connection(1);
        try {
            const [[totalResult], [rows]] = await Promise.all([
                conn.promise().execute(totalSql, bindings),
                conn.promise().execute(sql, bindings)
            ]);

            return {
                total: totalResult[0].CNT,
                data: rows ?? {}
            };
        } catch (error) {
            console.log('Error fetching config from database: ' + error.message);
            throw error;
        } finally {
            // Đóng kết nối sau khi sử dụng
            await conn.end();
        }
    }

    static async getDetail(id, filter)
    {
        let sql = `
            WITH m1 as (
                select 
                    distinct(code) as code, 
                    branch_code 
                from 
                    class_room
            ), 
            m2 as (
                SELECT 
                    c.id as id, 
                    c.code as class_code, 
                    c.name as class_name, 
                    class_types.type as class_type, 
                    class_types.id as class_types_id,
                    class_types.value as class_types_value,
                    register_class.quantity as class_quantity, 
                    register_class.actual_number as actual_number_of_people, 
                    register_class.actual_number_male as male, 
                    register_class.actual_number_female as female, 
                    IFNULL(register_class.class_session, JSON_ARRAY()) as default_class_session,
                    COALESCE((
                        SELECT 
                            JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'date', rcc.date,
                                    'sessions', COALESCE((
                                        SELECT JSON_ARRAYAGG(
                                            JSON_OBJECT(
                                                'calendar_id', rcc.id,
                                                'class_sessions', cs.class_session,
                                                'class_sessions_status', cs.status,
                                                'courses_code', cs.courses_code,
                                                'courses_name', courses.value,
                                                'teacher_code', cs.teacher_code,
                                                'teacher_nearest', (
                                                    SELECT JSON_OBJECT(
                                                        'code', teachers.code,
                                                        'full_name', CONCAT(teachers.last_name, ' ', teachers.first_name)
                                                    )
                                                    FROM class_sessions cs2
                                                    LEFT JOIN teachers ON teachers.code = cs2.teacher_code
                                                    WHERE cs2.courses_code IN (
                                                        SELECT code
                                                        FROM courses
                                                        WHERE skill_code = (
                                                            SELECT skill_code 
                                                            FROM courses 
                                                            WHERE code = cs.courses_code
                                                        )
                                                    ) AND 
                                                    cs2.register_class_calendar_id IN (
                                                            SELECT 
                                                                id 
                                                            FROM register_class_calendar
                                                            WHERE register_class_calendar.register_class_code = rcc.register_class_code
                                                    ) AND 
                                                    cs2.register_class_calendar_id = cs.register_class_calendar_id AND cs2.teacher_code IS NOT NULL AND cs2.status = 'Actived'
                                                    ORDER BY cs2.class_session DESC
                                                    LIMIT 1
                                                ),
                                                'class_room_code', cs.class_room_code,
                                                'class_room_name', cr.name,
                                                'teacher_first_name', t.first_name,
                                                'teacher_last_name', t.last_name,
                                                'teacher_full_name', CONCAT(t.last_name, ' ', t.first_name)
                                            )
                                        )
                                        FROM class_sessions AS cs
                                        LEFT JOIN teachers AS t ON t.code = cs.teacher_code
                                        LEFT JOIN class_room as cr ON cr.code = cs.class_room_code
                                        LEFT JOIN courses ON courses.code = cs.courses_code
                                        WHERE cs.register_class_calendar_id = rcc.id AND cs.status IN ('Actived')
                                    ), JSON_ARRAY())
                                )
                            )
                        FROM register_class_calendar AS rcc
                        WHERE rcc.register_class_code = register_class.code AND
                        ${filter.date ? 
                            ` rcc.date BETWEEN '${filter.date[0]}' AND '${filter.date[1]}'` :
                            ` rcc.date BETWEEN '${moment().subtract(7, "days").format('YYYY-MM-DD')}' AND '${moment().format('YYYY-MM-DD')}'`
                        }
                    ), JSON_ARRAY()) as register_class_calendar,
                    DATE_FORMAT(register_class.opening_date, '%Y-%m-%d') as opening_date, 
                    DATE_FORMAT(register_class.start_date, '%Y-%m-%d') as start_date, 
                    DATE_FORMAT(register_class.end_date, '%Y-%m-%d') as end_date, 
                    register_class.lesson as lesson, 
                    config.value as status, 
                    config.id as status_id, 
                    register_class.form_of_study,
                    register_class.teacher_code, 
                    register_class.class_room_code, 
                    m1.branch_code 
                FROM 
                    ${this.table} as c
                LEFT JOIN config ON config.id = c.status 
                LEFT JOIN register_class ON register_class.class_code = c.code 
                LEFT JOIN class_types ON class_types.id = register_class.class_types_id
                LEFT JOIN m1 ON m1.code = register_class.class_room_code 
            ), 
            m3 as (
                SELECT 
                    m2.*, 
                    a.name as facility_name,
                    a.code as facility_code
                FROM 
                    m2 
                LEFT JOIN branches a ON a.code = m2.branch_code
            ), 
            m4 as (
                SELECT 
                    m3.*, 
                    area.code as area_code, 
                    area.name as area_name 
                FROM 
                    m3 
                LEFT JOIN area ON area.code = m3.branch_code
            ), 
            n as (
                SELECT 
                    a.bitrix_id as teacher_bitrix_id, 
                    a.code as teacher_code, 
                    a.first_name as teacher_first_name, 
                    a.last_name as teacher_last_name, 
                    CONCAT(a.first_name, ' ', a.last_name) as teachers_fullname 
                FROM 
                    teachers a 
                where 
                    a.code is not null and a.code != ''
            ) 
            SELECT 
                m4.id,
                m4.class_code,
                m4.class_name,
                m4.class_type,
                m4.class_types_id,
                m4.class_types_value,
                m4.class_quantity,
                m4.actual_number_of_people,
                m4.default_class_session,
                m4.register_class_calendar,
                m4.male,
                m4.female,
                m4.opening_date,
                m4.start_date,
                m4.end_date,
                m4.lesson,
                m4.status,
                m4.status_id,
                m4.form_of_study,
                n.teacher_bitrix_id,
                m4.teacher_code,
                n.teachers_fullname as teachers_manage_full_name,
                n.teacher_first_name as teachers_manage_first_name,
                n.teacher_last_name as teachers_manage_last_name,
                m4.facility_name,
                m4.facility_code,
                m4.area_name,
                m4.area_code
            FROM 
                m4 
            LEFT JOIN n ON m4.teacher_code = n.teacher_code 
            WHERE m4.id = ${id} 
            LIMIT 1
        `;

        const conn = await connection(1);
        try {
            const [[rs]] = await conn.promise().execute(sql);
            
            if (rs.default_class_session && typeof rs.default_class_session === 'string' && rs.default_class_session.trim()) {
                rs.default_class_session = JSON.parse(rs.default_class_session)
            }

            if (rs.register_class_calendar && typeof rs.register_class_calendar === 'string' && rs.register_class_calendar.trim()) {
                rs.register_class_calendar = JSON.parse(rs.register_class_calendar)
            }

            return rs ?? {};
        } catch (error) {
            console.error('Error executing query:', error);
            throw error;
        } finally {
            // Đóng kết nối sau khi sử dụng
            await conn.end();
        }
    }

    static async getCalendar(filter, page = 1, pageSize = 20)
    {
        let sql = `
            WITH m1 AS (
                SELECT 
                    DISTINCT(code) AS code, 
                    name,
                    branch_code 
                FROM 
                    class_room
            ), m2 AS (
                SELECT 
                    c.code AS class_code,
                    c.name AS class_name,
                    config.id AS status_id,
                    config.value AS status_value,
                    register_class.class_room_code,
                    register_class.teacher_code,
                    IFNULL(register_class.class_session, JSON_ARRAY()) AS default_class_session,
                    m1.name AS class_room_name,
                    m1.branch_code,
                    COALESCE((
                        SELECT 
                            JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'date', rcc.date,
                                    'sessions', COALESCE((
                                        SELECT 
                                            JSON_ARRAYAGG(
                                                JSON_OBJECT(
                                                    'calendar_id', cs.register_class_calendar_id,
                                                    'class_sessions', cs.class_session,
                                                    'class_sessions_status', cs.status,
                                                    'courses_code', cs.courses_code,
                                                    'courses_name', courses.value,
                                                    'teacher_code', cs.teacher_code,
                                                    'teacher_nearest', (
                                                        SELECT JSON_OBJECT(
                                                            'code', teachers.code,
                                                            'full_name', CONCAT(teachers.last_name, ' ', teachers.first_name)
                                                        )
                                                        FROM class_sessions cs2
                                                        LEFT JOIN teachers ON teachers.code = cs2.teacher_code
                                                        WHERE cs2.courses_code IN (
                                                            SELECT code
                                                            FROM courses
                                                            WHERE skill_code = (
                                                                SELECT skill_code 
                                                                FROM courses 
                                                                WHERE code = cs.courses_code
                                                            )
                                                        ) AND 
                                                        cs2.register_class_calendar_id IN (
                                                            SELECT 
                                                                id 
                                                            FROM register_class_calendar
                                                            WHERE register_class_calendar.register_class_code = rcc.register_class_code
                                                        ) AND 
                                                        cs2.teacher_code IS NOT NULL AND cs2.status = 'Actived'
                                                        ORDER BY cs2.class_session DESC
                                                        LIMIT 1
                                                    ),
                                                    'class_room_code', cs.class_room_code,
                                                    'class_room_name', cr.name,
                                                    'teacher_first_name', t.first_name,
                                                    'teacher_last_name', t.last_name,
                                                    'teacher_full_name', CONCAT(t.last_name, ' ', t.first_name)
                                                )
                                            )
                                        FROM class_sessions AS cs
                                        LEFT JOIN teachers AS t ON t.code = cs.teacher_code
                                        LEFT JOIN class_room as cr ON cr.code = cs.class_room_code
                                        LEFT JOIN courses ON courses.code = cs.courses_code
                                        WHERE cs.register_class_calendar_id = rcc.id AND cs.status IN ('Actived') [filter.teacher_code]
                                    ), JSON_ARRAY())
                                )
                            )
                        FROM register_class_calendar AS rcc
                        WHERE rcc.register_class_code = register_class.code AND 
                        ${filter.date ? 
                            ` rcc.date BETWEEN '${filter.date[0]}' AND '${filter.date[1]}'` :
                            ` rcc.date BETWEEN '${moment().subtract(7, "days").format('YYYY-MM-DD')}' AND '${moment().format('YYYY-MM-DD')}'`
                        }
                    ), JSON_ARRAY()) AS register_class_calendar
                FROM classes AS c
                LEFT JOIN config ON config.id = c.status
                LEFT JOIN register_class ON register_class.class_code = c.code
                LEFT JOIN m1 ON m1.code = register_class.class_room_code
            ), m3 AS (
                SELECT 
                    m2.*, 
                    a.name AS facility_name,
                    a.code AS facility_code
                FROM 
                    m2 
                LEFT JOIN branches a ON a.code = m2.branch_code
            ), 
            teachers_manage as (
                SELECT 
                    a.bitrix_id as teacher_bitrix_id, 
                    a.code as teacher_code, 
                    CONCAT(a.last_name, ' ', a.first_name) as teachers_full_name 
                FROM 
                    teachers a 
                where 
                    a.code is not null and a.code != ''
            ),
            m4 AS (
                SELECT 
                    m3.*, 
                    area.code AS area_code, 
                    area.name AS area_name 
                FROM 
                    m3 
                LEFT JOIN area ON area.code = m3.branch_code
            )
            SELECT 
                m4.class_code,
                m4.class_name,
                m4.status_id,
                m4.status_value,
                m4.class_room_code,
                m4.default_class_session,
                m4.class_room_name,
                m4.branch_code,
                m4.register_class_calendar,
                m4.facility_name,
                m4.facility_code,
                m4.area_code,
                m4.area_name,
                teachers_manage.teachers_full_name as teachers_manage_full_name
            FROM m4
            LEFT JOIN teachers_manage ON m4.teacher_code = teachers_manage.teacher_code 
        
        `;

        const where = [];
        const bindings = [];

        // Giữ nguyên thứ tự bindings
        if (filter.teacher_code) {
            sql = sql.replace('[filter.teacher_code]', ` AND cs.teacher_code = ? `);
            bindings.push(filter.teacher_code);
        } else {
            sql = sql.replace('[filter.teacher_code]', '');
        }

        where.push(`m4.status_id = ?`);
        bindings.push(1);

        if (filter.class_name) {
            // where.push(`m4.class_name REGEXP ?`);
            // bindings.push(filter.class_name);
            const escapedClassName = filter.class_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
            where.push(`m4.class_name REGEXP ?`);
            bindings.push(escapedClassName);
        }

        if (filter.area_code) {
            where.push(`m4.area_code = ?`);
            bindings.push(filter.area_code);
        }

        if (where.length > 0) {
            sql += ` WHERE ${where.join(' AND ')}`;
        }
        
        const offset = (page - 1) * pageSize;
        const totalSql = `SELECT COUNT(*) as CNT FROM (${sql}) as count_table`;

        sql += ` LIMIT ${pageSize} OFFSET ${offset}`;

        // Get the database connection
        const conn = await connection(1);
        try {
            const [[totalResult], [rows]] = await Promise.all([
                conn.promise().execute(totalSql, bindings),
                conn.promise().execute(sql, bindings)
            ]);

            const formattedRows = await Promise.all(rows.map((item) => {
                try {
                    const register_class_calendar = 
                        typeof item.register_class_calendar === 'string' && item.register_class_calendar.trim()
                            ? JSON.parse(item.register_class_calendar)
                            : item.register_class_calendar;
                    
                    item.register_class_calendar = register_class_calendar

                    item.default_class_session = 
                        typeof item.default_class_session === 'string' && item.default_class_session.trim()
                            ? JSON.parse(item.default_class_session)
                            : item.default_class_session;
                } catch (err) {
                    item.register_class_calendar = [];
                    item.default_class_session = [];

                    console.error(`Invalid JSON for register_class_calendar: ${item}`, err);
                }
                return item;
            }));
        
            return {
                total: totalResult[0]?.CNT || 0,
                data: formattedRows || []
                // data: rows
            };
        } catch (error) {
            console.log('Error fetching config from database: ' + error.message);
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

            return results.length > 0 ? results[0] : {};
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

    static async get(select, where, limit = 1)
    {
        const [filteredWhere, filteredWhereNot, filteredwhereIn] = await Promise.all([
            super.where(where.where ?? []),
            super.whereNot(where.whereNot ?? []),
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
        // console.log(sql, bindings)
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
        data[this.primaryKey] = this.createPrimaryKey(data.name);
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
            const [[result]] = await conn.promise().query(`SELECT id, ${this.primaryKey} FROM ${this.table} WHERE id = ${id} LIMIT 1`);

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
        const rs = await this.isExists(where);

        if (rs.id) {
            return this.update({
                name: data.name,
                status: data.status,
                class_types_id: data.class_types_id
            }, {
                id: rs.id
            });
        } else {
            console.log('create');
            return this.create(data);
        }
    }
}

module.exports = { ClassesModel };