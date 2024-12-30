const { Model } = require('../Model');
const { connection } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { DonNghiPhepModel } = require('./DonNghiPhepModel');
class DailyAttendanceModel extends Model {

    static table = 'daily_attendance';

    static primaryKey = 'id';

    static fillable = [
        'class_code',
        'student_code',
        'note',
        'date',
        'status',
        'note',
        'leave_request_code',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at'
    ]

    constructor() {
        
    }

    static createPrimaryKey() {
        return 'DDNH' + uuidv4();
    }

    static async getList(filter, page = 1, pageSize = 20) {
        let sql = `
            SELECT 
                register_class_student.area_name,
                register_class_student.branch_name,
                register_class_student.class_name,
                DATE_FORMAT(register_class_student.enrollment_attendance_date, '%Y-%m-%d') as enrollment_attendance_date,
                DATE_FORMAT(register_class_student.enrollment_attendance_actual_date, '%Y-%m-%d') as enrollment_attendance_actual_date,
                student.name as student_name,
                DATE_FORMAT(student.birthday, '%Y-%m-%d') as birthday,
                JSON_OBJECT(
                    'code', leave_request.code,
                    'start_date', DATE_FORMAT(leave_request.start_date, '%Y-%m-%d'),
                    'end_date', DATE_FORMAT(leave_request.end_date, '%Y-%m-%d'),
                    'reason', leave_request.reason,
                    'status_id', leave_request.status_id,
                    'status', leave_request.status
                ) as leave_request
            FROM (
                SELECT  
                    register_class_student.student_code,
                    classes.name as class_name,
                    branches.name as branch_name,
                    area.name as area_name,
                    enrollment_attendance.date as enrollment_attendance_date,
                    enrollment_attendance.actual_date as enrollment_attendance_actual_date
                FROM register_class_student
                JOIN enrollment_attendance on enrollment_attendance.student_code = register_class_student.student_code
                JOIN classes on classes.code = enrollment_attendance.student_code
                join branches on branches.code = classes.branch_code
                join area on area.code = branches.area_code
            ) as register_class_student
            JOIN student ON student.code = register_class_student.student_code
            JOIN daily_attendance on daily_attendance.student_code = student.code
            LEFT JOIN (
                SELECT 
                    leave_request.code, 
                    leave_request.start_date, 
                    leave_request.end_date, 
                    leave_request.reason, 
                    config.id as status_id,
                    config.value as status
                FROM leave_request
                LEFT JOIN config ON config.id = leave_request.status 
            ) as leave_request ON leave_request.code = daily_attendance.leave_request_code
        `;

        const where = [];
        const bindings = [];
        // if (filter.ngay_diem_danh) {
        //     where.push('register_class_student.enrollment_attendance_date = ?');
        //     bindings.push(filter.ngay_nhap_hoc);
        // }
        
        if (filter.student_name) {
            where.push(`student.name LIKE '?%'`);
            bindings.push(filter.student_name);
        }

        if (filter.class_code) {
            where.push(`register_class_student.register_class_code = ?`);
            bindings.push(filter.class_code);
        }

        if (where.length > 0) {
            sql += ` WHERE ${where.join(' AND ')}`;
        }

        const offset = (page - 1) * pageSize;
        sql += ' LIMIT ? OFFSET ?';
        bindings.push(pageSize, offset);

        const conn = await connection(1);
        try {
            const [result] = await conn.promise().execute(sql, bindings);

            return result;
        } catch (error) {
            console.error('Error executing query:', error);
            throw error;
        } finally {
            // Đóng kết nối sau khi sử dụng
            await conn.end();
        }
    }

    static async getCountList(filter) {
        
        let sql = `
            SELECT 
                register_class_student.area_name,
                register_class_student.branch_name,
                register_class_student.class_name,
                DATE_FORMAT(register_class_student.enrollment_attendance_date, '%Y-%m-%d') as enrollment_attendance_date,
                DATE_FORMAT(register_class_student.enrollment_attendance_actual_date, '%Y-%m-%d') as enrollment_attendance_actual_date,
                student.name as student_name,
                DATE_FORMAT(student.birthday, '%Y-%m-%d') as birthday,
                JSON_OBJECT(
                    'code', leave_request.code,
                    'start_date', DATE_FORMAT(leave_request.start_date, '%Y-%m-%d'),
                    'end_date', DATE_FORMAT(leave_request.end_date, '%Y-%m-%d'),
                    'reason', leave_request.reason,
                    'status_id', leave_request.status_id,
                    'status', leave_request.status
                ) as leave_request
            FROM (
                SELECT  
                    register_class_student.student_code,
                    classes.name as class_name,
                    branches.name as branch_name,
                    area.name as area_name,
                    enrollment_attendance.date as enrollment_attendance_date,
                    enrollment_attendance.actual_date as enrollment_attendance_actual_date
                FROM register_class_student
                JOIN enrollment_attendance on enrollment_attendance.student_code = register_class_student.student_code
                JOIN classes on classes.code = enrollment_attendance.student_code
                join branches on branches.code = classes.branch_code
                join area on area.code = branches.area_code
            ) as register_class_student
            JOIN student ON student.code = register_class_student.student_code
            JOIN daily_attendance on daily_attendance.student_code = student.code
            LEFT JOIN (
                SELECT 
                    leave_request.code, 
                    leave_request.start_date, 
                    leave_request.end_date, 
                    leave_request.reason, 
                    config.id as status_id,
                    config.value as status
                FROM leave_request
                LEFT JOIN config ON config.id = leave_request.status 
            ) as leave_request ON leave_request.code = daily_attendance.leave_request_code
        `;

        const where = [];
        const bindings = [];
        // if (filter.ngay_diem_danh) {
        //     where.push('register_class_student.enrollment_attendance_date = ?');
        //     bindings.push(filter.ngay_nhap_hoc);
        // }
        
        if (filter.student_name) {
            where.push(`student.name LIKE '?%'`);
            bindings.push(filter.student_name);
        }

        if (filter.class_code) {
            where.push(`register_class_student.register_class_code = ?`);
            bindings.push(filter.class_code);
        }

        if (where.length > 0) {
            sql += ` WHERE ${where.join(' AND ')}`;
        }

        const conn = await connection(1); // Get the database connection
        try {
            const totalSql = `SELECT COUNT(*) as CNT FROM (${sql}) as count_table`;
            const [totalResult] = await conn.promise().execute(totalSql, bindings);
            const totalRecords = totalResult[0].CNT;

            await conn.end();

            return totalRecords;
        } catch (error) {
            throw error;
        } finally {
            await conn.end();
        }
    }

    static async createMultiple(data) {
        // const arr = [].concat(data);
        // const dataCreate = arr.map((value) => {
        //     value.ma_hv = 'DDNH' + uuidv4();
        //     value.ngay_tao = moment().format('YYYY-MM-DD HH:mm:ss');
        //     value.ngay_sua = moment().format('YYYY-MM-DD HH:mm:ss');
        //     return value; 
        // });
        // const filteredData = await super.createMultiple(dataCreate)
        await Promise.all(data.map(async (v, k) => {
            if (v.diem_danh == 4) {
                let dataCreate = v.don_nghi_phep;
                const { bat_dau, ket_thuc } = dataCreate;
                const start = moment(bat_dau);
                const end = moment(ket_thuc);
                const intDate = end.diff(start, 'days') + 1;
                
                dataCreate.ma_hv = v.ma_hv;
                dataCreate.ngay_nghi = intDate;
                const ma_don = await DonNghiPhepModel.create(dataCreate);
                for (let i = 0; i < intDate; i++) {
                    let diemdanhCreate = v;
                    diemdanhCreate.ngay_diem_danh = start.clone().add(i, 'days').format('YYYY-MM-DD HH:mm:ss');
                    diemdanhCreate.ma_don_nghi_phep = ma_don;
                    this.create(diemdanhCreate);
                }

                return;
            }

            this.create(v);
        }));
    }

    static async create(data) {
        data[this.primaryKey] = this.createPrimaryKey();
        data.ngay_tao = moment().format('YYYY-MM-DD HH:mm:ss');
        data.ngay_sua = moment().format('YYYY-MM-DD HH:mm:ss');

        const filteredData = await super.create(data);

        let sql = `
            INSERT INTO ${this.table} (${filteredData.columns})
            VALUES ${filteredData.placeholders}
            ON DUPLICATE KEY UPDATE 
                diem_danh = VALUES(diem_danh),
                ma_don_nghi_phep = VALUES(ma_don_nghi_phep),
                note = VALUES(note),
                cap_nhat_gan_nhat = VALUES(cap_nhat_gan_nhat),
                ngay_sua = VALUES(ngay_sua)
        `;

        const conn = await connection(1);
        try {
            const [result] = await conn.promise().execute(sql, filteredData.values);

            return result.affectedRows
        } catch (error) {
            console.error('Error inserting data:', error);
        } finally {
            await conn.end();
        }
    }
}

module.exports = { DailyAttendanceModel }