const { Model } = require('../../models/Model');
const { connection } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class DonNghiPhepModel extends Model {

    static table = 'don_nghi_phep';

    static primaryKey = 'ma';

    static fillable = [
        'ma_hv',
        'ly_do',
        'status',
        'ngay_nghi',
        'bat_dau',
        'ket_thuc',
        'ngay_tao',
        'ngay_sua'
    ]

    constructor() {
        
    }

    static createPrimaryKey() {
        return 'DNP' + uuidv4();
    }

    // Chưa code xong
    static async createMultiple(data) {

        const arr = [].concat(data);
        const dataCreate = arr.map((value) => {
            value.ma_hv = this.createPrimaryKey();
            value.ngay_tao = moment().format('YYYY-MM-DD HH:mm:ss');
            value.ngay_sua = moment().format('YYYY-MM-DD HH:mm:ss');
            return value; 
        });
        const filteredData = await super.createMultiple(dataCreate)
        return
        let sql = `
            INSERT INTO ${this.table} (${filteredData.columns})
            VALUES ${filteredData.placeholders}
            ON DUPLICATE KEY UPDATE 
                ngay_nhap_hoc = VALUES(ngay_nhap_hoc),
                cap_nhat_gan_nhat = VALUES(cap_nhat_gan_nhat),
                diem_danh = VALUES(diem_danh),
                ngay_sua = VALUES(ngay_sua)
        `;
    }

    static async create(data) {
        data[this.primaryKey] = this.createPrimaryKey();
        data.ngay_tao = moment().format('YYYY-MM-DD HH:mm:ss');
        data.ngay_sua = moment().format('YYYY-MM-DD HH:mm:ss');
        const filteredData = await super.create(data)

        let sql = `
            INSERT INTO ${this.table} (${filteredData.columns})
            VALUES ${filteredData.placeholders}
            RETURNING ${this.primaryKey}
        `;

        const conn = await connection(1);
        try {
            const [[{ [this.primaryKey]: ma_don }]] = await conn.promise().execute(sql, filteredData.values);

            return ma_don;
        } catch (error) {
            console.error('Error inserting data:', error);
        } finally {
            await conn.end();
        }
    }
}

module.exports = { DonNghiPhepModel };