const { Model } = require('../Model');
const { DimContactModel } = require('./DimContactModel');
const { runWorkerV2 } = require('../../workers/runWorker');
const { connection } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { EventLogModel } = require('./EventLogModel');
const { RegisterClassModel } = require('./RegisterClassModel');

class StudentModel extends Model {

    static table = 'student';

    static primaryKey = 'code';

    static fillable = [
        'name',
        'first_name',
        'last_name',
        'contact_id',
        'schools_id',
        'dob',
        'gender',
        'date_graduation',
        'native_place',
        'note',
        'status',
        'level',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at'
    ]

    constructor() {

    }

    static async createPrimaryKey(data) 
    {
        const year = moment().format('YY');
        const full_year = moment().format('YYYY');
        const month = moment().format('MM');

        // Không được tính theo deal active vì sẽ có thể xảy ra 2 contact khác mà trùng mã
        let sql = `
            SELECT 
                COUNT(student_deal.student_id) AS total
            FROM deals
            INNER JOIN program ON program.code = deals.program_code AND program.type = 'PTN' 
            INNER JOIN student_deal ON student_deal.deal_code = deals.code 
            INNER JOIN ${this.table} ON ${this.table}.code = student_deal.student_code 
            WHERE deals.created_at BETWEEN '${full_year}-01-01' AND '${full_year}-12-31'
        `;

        const conn = await connection(1);
        try {
            const [[result]] = await conn.promise().execute(sql);
            let total = result.total + 1;

            if (full_year == 2024) {
                total = total + 806;
            }

            if (total.toString().length > 4) {
                return `DB${data.branch_code}${year}${month}${total}`;
            } 

            var str = new Array((4 - total.toString().length) + 1).join( '0' );
            str = `${str}${total}`.trim();
            return `DB${data.branch_code}${year}${month}${str}`;
        } catch (error) {
            console.error('Error executing query:', error);
            throw error;
        } finally {
            // Đóng kết nối sau khi sử dụng
            await conn.end();
        }
        
    }

    // Lấy học viên đã xếp lớp
    static async getHocVienByClass(filter, page = 1, pageSize = 100)
    {
        let sql = `
            SELECT 
                rcs.register_class_code,
                t.id as id, 
                t.code as student_code,
                CONCAT(t.last_name, ' ' , t.first_name) as student_full_name,
                t.first_name as student_first_name, 
                t.last_name as student_last_name, 
                DATE_FORMAT(t.dob, '%Y-%m-%d') as student_birthday,
                (
                    CASE
                        WHEN t.gender = 0 THEN 'Nam'
                        WHEN t.gender = 1 THEN 'Nữ'
                        ELSE 'Không xác định'
                    END
                ) AS student_gender,
                t.native_place as student_native_place,
                class_room.id as class_room_id,
                class_room.code as class_room_code,
                classes.code as class_code,
                classes.name as class_name,
                branches.name as branch_name,
                area.name as area_name
            FROM register_class_student as rcs
            INNER JOIN ${this.table} as t ON  t.code = rcs.student_code
            INNER JOIN register_class ON register_class.code = rcs.register_class_code 
            LEFT JOIN class_room ON class_room.code = register_class.class_room_code 
            LEFT JOIN classes ON classes.code = register_class.class_code
            LEFT JOIN branches ON branches.code = class_room.branch_code 
            LEFT JOIN area ON  area.code = branches.area_code 
        `;

        let where = [];
        let bindings = [];
        
        where.push('rcs.status = ?');
        bindings.push('Actived');

        where.push('rcs.student_code IS NOT NULL');
        
        if (filter.class_code) {
            where.push('classes.code = ?');
            bindings.push(filter.class_code);
        }

        if (filter.search) {
            const full_name = filter.search;
            const match = full_name.match(/\S+(?=\s*$)/);

            if (match) {
                const last_name = match[0]; // Lấy từ cuối cùng làm last_name
                const first_name = full_name.replace(/\s*\S+\s*$/, '').trim(); // Phần còn lại làm first_name

                console.log("First Name:", last_name);
                console.log("Last Name:", first_name);
                const whereFullName = [];
                const bindingsFullName = [];
                if (first_name) {
                    const escaped_first_name = first_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
                    whereFullName.push(`t.first_name REGEXP ? OR t.last_name REGEXP ?`)
                    bindingsFullName.push(escaped_first_name);
                    bindingsFullName.push(escaped_first_name);
                }

                if (last_name) {
                    const escaped_last_name = last_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
                    whereFullName.push(`t.first_name REGEXP ? OR t.last_name REGEXP ?`)
                    bindingsFullName.push(escaped_last_name);
                    bindingsFullName.push(escaped_last_name);
                }

                const escaped_code = filter.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
                bindings.push(escaped_code);

                where.push(`(t.code REGEXP ? OR ${whereFullName.join(' OR ')})`);
                bindings = [...bindings, ...bindingsFullName];
            } else {
                const escaped_code = filter.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
                where.push('(t.code REGEXP ? OR )');
                bindings.push(escaped_code);
            }
        }
        
        // if (filter.diem_danh) {
        //     const placeholders = Array.isArray(filter.diem_danh) ? filter.diem_danh.map(() => '?').join(',') : '?';
        //     console.log(placeholders)
        //     where.push(`diem_danh_nhap_hoc.diem_danh IN (${placeholders})`);
        //     bindings.push(...(Array.isArray(filter.diem_danh) ? filter.diem_danh : [filter.diem_danh]));
        // }

        if (where.length > 0) {
            sql += ` WHERE ${where.join(' AND ')}`;
        }

        const offset = (page - 1) * pageSize;
        const totalSql = `SELECT COUNT(*) as CNT FROM (${sql}) as count_table`;
        sql += ` LIMIT ${pageSize} OFFSET ${offset}`;
        
        const conn = await connection(1); // Get the database connection
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

    static async getKhaiGiang(filter, page = 1, pageSize = 20) {

        let sql = `
            SELECT 
                hoc_vien.id as id_hv, hoc_vien.ma_hv as ma_hv, hoc_vien.ten_hv, hoc_vien.id_contact, deals.id_deal as id_deal, deals.ma_deal, deals.ngay_khai_giang as ngay_khai_giang, chi_nhanh.ten_chi_nhanh as deal_chi_nhanh
            FROM ${this.table}
            INNER JOIN hoc_vien_deal ON hoc_vien_deal.ma_hv = ${this.table}.${this.primaryKey}
            INNER JOIN deals ON deals.ma_deal = hoc_vien_deal.ma_deal
            INNER JOIN chi_nhanh ON chi_nhanh.ma = deals.ma_chi_nhanh
        `;

        let filteredWhere = await this.where(filter);

        if (filteredWhere.wheres) {
            sql += ` WHERE ${filteredWhere.wheres}`;
        } 

        const conn = await connection(1);
        try {
            const [result] = await conn.promise().execute(sql, filteredWhere.values);

            return result;
        } catch (error) {
            console.error('Error executing query:', error);
            throw error;
        } finally {
            // Đóng kết nối sau khi sử dụng
            await conn.end();
        }
    }

    static async getCountKhaiGiang(filter) {

        let sql = `
            SELECT 
                hoc_vien.id as id_hv, hoc_vien.ma_hv as ma_hv, hoc_vien.ten_hv, hoc_vien.id_contact, deals.id_deal as id_deal, deals.ma_deal, deals.ngay_khai_giang as ngay_khai_giang, chi_nhanh.ten_chi_nhanh as deal_chi_nhanh
            FROM ${this.table}
            INNER JOIN hoc_vien_deal ON hoc_vien_deal.ma_hv = ${this.table}.${this.primaryKey}
            INNER JOIN deals ON deals.ma_deal = hoc_vien_deal.ma_deal
            INNER JOIN chi_nhanh ON chi_nhanh.ma = deals.ma_chi_nhanh
        `;

        let filteredWhere = await this.where(filter);

        if (filteredWhere.wheres) {
            sql += ` WHERE ${filteredWhere.wheres}`;
        } 

        const conn = await connection(1);
        try {
            
            const totalSql = `SELECT COUNT(*) as CNT FROM (${sql}) as count_table`;
            const [totalResult] = await conn.promise().execute(totalSql, filteredWhere.values);
            const totalRecords = totalResult[0].CNT;

            return totalRecords;
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
        // data.code = this.createPrimaryKey();
        data.code = data.code;
        data.created_at = moment().format('YYYY-MM-DD HH:mm:ss');
        data.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');

        const filteredData = await super.create(data)
        console.log(data);
        let sql = `
            INSERT INTO ${this.table} (${filteredData.columns})
            VALUES 
                ${filteredData.placeholders}
            ON DUPLICATE KEY UPDATE 
                first_name = VALUES(first_name),
                last_name = VALUES(last_name),
                dob = VALUES(dob),
                gender = VALUES(gender),
                native_place = VALUES(native_place),
                updated_by = VALUES(updated_by),
                updated_at = VALUES(updated_at);
        `;

        const conn = await connection(1);
        try {
            const [result, fields] = await conn.promise().execute(sql, filteredData.values);
            const [[student]] = await conn.promise().query(`SELECT id, contact_id, ${this.primaryKey} FROM ${this.table} WHERE id = ${result.insertId} LIMIT 1`);
            
            return student;
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

            const [[result]] = await conn.promise().query(`SELECT id, contact_id, ${this.primaryKey} FROM ${this.table} WHERE id = ${id} LIMIT 1`);
            console.log(result, 'update update update update')
            return result;
        } catch (error) {
            console.error('Error executing query:', error);
            return false;
        } finally {
            // Đóng kết nối sau khi sử dụng
            await conn.end(); 
        }
    }

    static async createStudent(data)
    {
        console.log('createStudent')
        console.log(data)
        const conn = await connection(1);
        try {
            await conn.promise().beginTransaction();

            const student = await this.create({
                first_name: data.first_name,
                last_name: data.last_name,
                contact_id: data.contact_id,
                dob: data.dob,
                gender: data.gender,
                native_place: data.native_place,
                created_by: data.created_by,
                updated_by: data.updated_by,
                code: data.code
            });
            console.log('createStudent student')
            console.log(student)
            const phone_num = data.phone_num.map(phone => {
                runWorkerV2('Kaizen/DimContactWorker.js', {
                    type: 'create', 
                    data: {
                        student_id: student.id,
                        type_value: DimContactModel.type_value[0], type_person: DimContactModel.type_person[0], value: phone
                    }
                });
            });

            const email = data.email.map(email => {
                runWorkerV2('Kaizen/DimContactWorker.js', {
                    type: 'create', 
                    data: {
                        student_id: student.id,
                        type_value: DimContactModel.type_value[1], type_person: DimContactModel.type_person[0], value: email
                    }
                });
            });

            await Promise.all([...phone_num, ...email]);

            await conn.promise().commit();

            console.log('Inserted student, phones, and emails successfully.');
            return student;
        } catch (error) {
            // Rollback nếu có lỗi xảy ra
            await conn.promise().rollback();
            console.error('Error during insert:', error);

            return false;
        } finally {
            await conn.promise().end();
        }
    }

    static async updateStudent(data)
    {    
        const conn = await connection(1);
        try {
            await conn.promise().beginTransaction();

            const updateFields = {};
            for (const key in data) {
                if (key == 'contact_id') {
                    continue;
                }

                if (data[key] !== undefined && data[key] !== null) {
                    updateFields[key] = data[key];
                }
            }

            const student = await this.update(updateFields, {
                contact_id: data.contact_id
            });
            console.log('updateStudent')
            console.log(student)
            const phone_num = data.phone_num.map(phone => {
                runWorkerV2('Kaizen/DimContactWorker.js', {
                    type: 'create', data: {
                        student_id: student.id,
                        type_value: DimContactModel.type_value[0], type_person: DimContactModel.type_person[0], value: phone
                    }
                });
            });

            const email = data.email.map(email => {
                runWorkerV2('Kaizen/DimContactWorker.js', {
                    type: 'create', 
                    data: {
                        student_id: student.id,
                        type_value: DimContactModel.type_value[1], type_person: DimContactModel.type_person[0], value: email
                    }
                });
            });

            await Promise.all([...phone_num, ...email]);

            await conn.promise().commit();

            console.log('Inserted student, phones, and emails successfully.');
            return student;
        } catch (error) {
            // Rollback nếu có lỗi xảy ra
            await conn.promise().rollback();
            console.error('Error during insert:', error);

            return false;
        } finally {
            await conn.promise().end();
        }
    }

    static async createMultiple(data) 
    {
        const arr = [].concat(data);
        const dataCreate = arr.map((value) => {
            value.code = this.createPrimaryKey();
            value.created_at = moment().format('YYYY-MM-DD HH:mm:ss');
            value.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
            return value; 
        });
        const filteredData = await super.createMultiple(dataCreate)
        let sql = `
            INSERT INTO ${this.table} (${filteredData.columns})
            VALUES 
                ${filteredData.placeholders}
            ON DUPLICATE KEY UPDATE 
                name = VALUES(name),
                birthday = VALUES(ngay_sinh),
                note = VALUES(note),
                updated_by = VALUES(updated_by),
                updated_at = VALUES(updated_at)
            RETURNING ${filteredData.columns}
        `;

        const conn = await connection(1);

        try {
            const [result] = await conn.promise().execute(sql, filteredData.values);
            return result.map((v, k) => {
                if (v.ma_hv !== data[k].ma_hv) {
                    data[k].ma_hv = v.ma_hv
                }
                return v;
            });
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

    static async getDetail(code, filter)
    {
        let sql = `
            SELECT 
                t.id,
                t.code, 
                CONCAT(t.last_name, ' ',t.first_name) as fullname,
                t.first_name, 
                t.last_name, 
                t.contact_id, 
                config.id as status_id,
                config.value as status_value,
                DATE_FORMAT(t.dob, '%Y-%m-%d') as dob,
                TIMESTAMPDIFF(YEAR, t.dob, CURDATE()) AS age,
                t.gender as gender_id, 
                (CASE 
                    WHEN t.gender = 0 THEN 'Nam'
                    WHEN t.gender = 1 THEN 'Nữ'
                    ELSE 'Không xác định'
                END) as gender,
                DATE_FORMAT(t.date_graduation, '%Y-%m-%d') as date_graduation,
                t.native_place, 
                program.type,
                branches.code as branch_code,
                branches.name as branch_name,
                program.code as program_code,
                program.name as program_name,
                schools.name as schools_name,
                CONCAT(ms.last_name, ' ', ms.first_name) as ms_full_name,
                t.level as student_level_id,
                le.value as student_level
            FROM ${this.table} as t
            LEFT JOIN config ON config.id = t.status
            LEFT JOIN config as le ON le.id = t.level
            LEFT JOIN student_deal ON student_deal.student_code = t.code AND student_deal.status = 'Actived'
            LEFT JOIN deals ON deals.code = student_deal.deal_code
            LEFT JOIN users as ms ON ms.id = deals.ms_id
            LEFT JOIN program ON program.code = deals.program_code
            LEFT JOIN branches ON branches.code = deals.branch_code 
            LEFT JOIN schools ON schools.id = t.schools_id
        `;

        let where = [];
        let bindings = [];
        
        where.push(`t.code = ?`);
        bindings.push(code);

        if (where.length > 0) {
            sql += ` WHERE ${where.join(' AND ')}`;
        }

        const conn = await connection(1); // Get the database connection
        try {
            const [[rs]] = await conn.promise().execute(sql, bindings);

            return rs ?? {};
        } catch (error) {
            console.error('Error executing query:', error);
            throw error;
        } finally {
            await conn.end();
        }
    }

    static async getHistories(filter, page = 1, pageSize = 20)
    {
        if (!filter?.code) {
            return [];
        }

        const logs = await EventLogModel.getList(
            {
                event_type: 'transfer_class',
                entity_type: 'student',
                entity_id: filter.code
            },
            page,
            pageSize
        );

        let data = logs.data;
        if (data.length) {
            // Trích xuất mã `before_register_class_code` và `after_register_class_code`
            const register_class_codes = data.flatMap(item => {
                const details = item.details;
                return [details.before_register_class_code, details.after_register_class_code];
            });
            // before_class_name
            // after_class_name
            const conn = await connection(1);
            

            try {
                let [classes] = await conn.promise().execute(`
                    SELECT
                        rc.code,
                        classes.name as class_name
                    FROM register_class as rc
                    LEFT JOIN classes ON classes.code = rc.class_code
                    WHERE rc.code IN (${Object.keys(register_class_codes).map(() => '?').join(', ')})
                `, register_class_codes);

                classes = new Map(
                    classes.map(item => [item.code, item.class_name])
                );

                data = data.map((item) => {

                    item.details.before_class_name = classes.get(item.details.before_register_class_code) ?? null;
                    item.details.after_class_name = classes.get(item.details.after_register_class_code) ?? null;

                    return item;
                });
            } catch (error) {
                console.error('Error executing query:', error);
                throw error;
            } finally {
                await conn.end();
            }

            
        }

        return {
            total: logs.total ?? 0,
            data: data ?? []
        }
    }

    static async getList(filter, page = 1, pageSize = 20)
    {
        let sql = `
            SELECT 
                t.id,
                t.code, 
                CONCAT(t.last_name, ' ',t.first_name) as fullname,
                t.first_name, 
                t.last_name, 
                t.contact_id, 
                config.id as status_id,
                config.value as status_value,
                DATE_FORMAT(t.dob, '%Y-%m-%d') as dob,
                TIMESTAMPDIFF(YEAR, t.dob, CURDATE()) AS age,
                --  DATE_FORMAT(NOW(), '%Y') - DATE_FORMAT(t.dob, '%Y') - (DATE_FORMAT(NOW(), '00-%m-%d') < DATE_FORMAT(student.dob, '00-%m-%d')) AS age1,
                t.gender as gender_id, 
                (CASE 
                    WHEN t.gender = 0 THEN 'Nam'
                    WHEN t.gender = 1 THEN 'Nữ'
                    ELSE 'Không xác định'
                END) as gender,
                t.native_place, program.type,
                branches.code as branch_code,
                branches.name as branch_name,
                program.code as program_code,
                program.name as program_name
            FROM ${this.table} as t
            LEFT JOIN config ON config.id = t.status
            LEFT JOIN student_deal ON student_deal.student_code = t.code
            LEFT JOIN deals ON deals.code = student_deal.deal_code
            LEFT JOIN program ON program.code = deals.program_code
            LEFT JOIN branches ON branches.code = deals.branch_code 
        `;

        let where = [];
        let bindings = [];
        if (filter.status) {
            where.push(`t.status = ?`);
            bindings.push(filter.status);
        } else {
            where.push(`t.status = ?`);
            // Đang học
            bindings.push(41);
        }

        if (filter.search) {
            const full_name = filter.search;
            const match = full_name.match(/\S+(?=\s*$)/);

            if (match) {
                const last_name = match[0]; // Lấy từ cuối cùng làm last_name
                const first_name = full_name.replace(/\s*\S+\s*$/, '').trim(); // Phần còn lại làm first_name

                console.log("First Name:", last_name);
                console.log("Last Name:", first_name);
                const whereFullName = [];
                const bindingsFullName = [];
                if (first_name) {
                    const escaped_first_name = first_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
                    whereFullName.push(`t.first_name REGEXP ? OR t.last_name REGEXP ?`)
                    bindingsFullName.push(escaped_first_name);
                    bindingsFullName.push(escaped_first_name);
                }

                if (last_name) {
                    const escaped_last_name = last_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
                    whereFullName.push(`t.first_name REGEXP ? OR t.last_name REGEXP ?`)
                    bindingsFullName.push(escaped_last_name);
                    bindingsFullName.push(escaped_last_name);
                }

                const escaped_code = filter.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
                bindings.push(escaped_code);

                where.push(`(t.code REGEXP ? OR ${whereFullName.join(' OR ')})`);
                bindings = [...bindings, ...bindingsFullName];
            } else {
                const escaped_code = filter.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
                where.push('(t.code REGEXP ? OR )');
                bindings.push(escaped_code);
            }
        }

        if (filter.type) {
            where.push(`program.type = ?`);
            bindings.push(filter.type);
        }

        if (filter.branch_code) {
            where.push(`branches.code = ?`);
            bindings.push(filter.branch_code);
        }

        if (filter.program_code) {
            where.push(`program.code = ?`);
            bindings.push(filter.program_code)
        }

        if (where.length > 0) {
            sql += ` WHERE ${where.join(' AND ')}`;
        }

        const offset = (page - 1) * pageSize;
        const totalSql = `SELECT COUNT(*) as CNT FROM (${sql}) as count_table`;
        sql += ` LIMIT ${pageSize} OFFSET ${offset}`;

        // console.log(JSON.stringify(bindings), 'test');

        const conn = await connection(1); // Get the database connection
        try {
            // const [result] = await conn.promise().execute(sql, bindings);
            const [[totalResult], [rows]] = await Promise.all([
                conn.promise().execute(totalSql, bindings),
                conn.promise().execute(sql, bindings)
            ]);

            return {
                total: totalResult[0].CNT,
                data: rows ?? {}
            };
        } catch (error) {
            console.error('Error executing query:', error);
            throw error;
        } finally {
            await conn.end();
        }
    }
}

module.exports = { StudentModel };