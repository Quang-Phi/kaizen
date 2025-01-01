const { Model } = require("../../models/Model");
const { connection } = require("../../config/database");
const { StudentModel } = require("./StudentModel");
const { DealsModel } = require("./DealsModel");
const { HocVienDealModel } = require("./HocVienDealModel");
const moment = require("moment");
const { v4: uuidv4 } = require("uuid");

class DiemDanhNhapHocModel extends Model {
  static table = "enrollment_attendance";

  static primaryKey = "ma";

  static fillable = [
    "ma_hv",
    "id_contact",
    "ma_deal",
    "ngay_nhap_hoc",
    "diem_danh",
    "cap_nhat_gan_nhat",
    "note",
    "ngay_tao",
    "ngay_sua",
  ];

  constructor() {}

  static createPrimaryKey() {
    return "DDNH" + uuidv4();
  }

  static async getList(filter, page = 1, pageSize = 20) {
    try {
      const conn = await connection(1);
      let sql = `
                SELECT 
                    diem_danh_nhap_hoc.id,
                    diem_danh_nhap_hoc.id_deal,
                    hoc_vien.id as id_hoc_vien,
                    hoc_vien.ma_hv,
                    hoc_vien.ten_hv,
                    hoc_vien.id_contact,
                    IFNULL(DATE_FORMAT(diem_danh_nhap_hoc.ngay_nhap_hoc, '%Y-%m-%d'), '') as ngay_nhap_hoc,
                    hoc_vien.ID_SPA,
                    diem_danh_nhap_hoc.diem_danh as id_diem_danh,
                    config.value as diem_danh,
                    (SELECT 
                        JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id_lop_hoc', lop_hoc.id,
                                'ma_lop', lop_hoc.ma,
                                'ten_lop', lop_hoc.ten_lop
                            )
                        ) as lop_hoc_json
                        FROM 
                            lop_hoc as lop_hoc
                        INNER JOIN lop_hoc_hoc_vien ON lop_hoc_hoc_vien.ma_lop = lop_hoc.ma AND lop_hoc_hoc_vien.ma_hv = diem_danh_nhap_hoc.ma_hv
                        INNER JOIN hoc_vien ON hoc_vien.ma_hv = lop_hoc_hoc_vien.ma_hv
                        ORDER BY lop_hoc_hoc_vien.id DESC
                    ) as lop_hoc,
                    diem_danh_nhap_hoc.note
                FROM diem_danh_nhap_hoc
                INNER JOIN hoc_vien ON hoc_vien.ma_hv = diem_danh_nhap_hoc.ma_hv
                LEFT JOIN config ON config.id = diem_danh_nhap_hoc.diem_danh `;
      const where = [];
      const bindings = [];
      if (filter.ngay_nhap_hoc) {
        where.push("diem_danh_nhap_hoc.ngay_nhap_hoc = ?");
        bindings.push(filter.ngay_nhap_hoc);
      }

      if (filter.ten_hv) {
        where.push(`hoc_vien.ten_hv LIKE '?%'`);
        bindings.push(filter.ten_hv);
      }

      if (filter.diem_danh) {
        where.push(`diem_danh_nhap_hoc.diem_danh = ?`);
        bindings.push(filter.diem_danh);
      }

      if (where.length > 0) {
        sql += ` WHERE ${where.join(" AND ")}`;
      }

      const offset = (page - 1) * pageSize;
      sql += " LIMIT ? OFFSET ?";
      bindings.push(pageSize, offset);

      const [rows] = await conn.promise().execute(sql, bindings);

      const rs = await Promise.all(
        rows.map(async (value) => {
          sql = `
                    SELECT 
                        lop_hoc.id,
                        lop_hoc.ma,
                        lop_hoc.ten_lop
                    FROM 
                        lop_hoc as lop_hoc
                    INNER JOIN lop_hoc_hoc_vien ON lop_hoc_hoc_vien.ma_lop = lop_hoc.ma
                    INNER JOIN hoc_vien ON hoc_vien.ma_hv = lop_hoc_hoc_vien.ma_hv
                    WHERE lop_hoc_hoc_vien.ma_hv = ?
                    ORDER BY lop_hoc_hoc_vien.id DESC
                `;

          const [lop_hoc] = await conn.promise().execute(sql, [value.ma_hv]);
          value.lop_hoc = lop_hoc; // Nếu muốn thêm kết quả vào từng phần tử `rows`

          return value;
        })
      );

      return rs;
    } catch (error) {
      console.log("Error fetching config from database: " + error.message);
      throw error;
    } finally {
      await conn.end();
    }
  }

  static async getCountList(filter) {
    const conn = await connection(1);
    let sql = `
            SELECT 
                diem_danh_nhap_hoc.id,
                diem_danh_nhap_hoc.id_deal,
                hoc_vien.id as id_hoc_vien,
                hoc_vien.ma_hv,
                hoc_vien.ten_hv,
                hoc_vien.id_contact,
                IFNULL(DATE_FORMAT(diem_danh_nhap_hoc.ngay_nhap_hoc, '%Y-%m-%d'), '') as ngay_nhap_hoc,
                hoc_vien.id_spa,
                diem_danh_nhap_hoc.diem_danh as id_diem_danh,
                config.value as diem_danh,
                (SELECT 
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id_lop_hoc', lop_hoc.id,
                            'ma_lop', lop_hoc.ma,
                            'ten_lop', lop_hoc.ten_lop
                        )
                    ) as lop_hoc_json
                    FROM 
                        lop_hoc as lop_hoc
                    INNER JOIN lop_hoc_hoc_vien ON lop_hoc_hoc_vien.ma_lop = lop_hoc.ma AND lop_hoc_hoc_vien.ma_hv = diem_danh_nhap_hoc.ma_hv
                    INNER JOIN hoc_vien ON hoc_vien.ma_hv = lop_hoc_hoc_vien.ma_hv
                    ORDER BY lop_hoc_hoc_vien.id DESC
                ) as lop_hoc,
                diem_danh_nhap_hoc.note
            FROM diem_danh_nhap_hoc as diem_danh_nhap_hoc
            INNER JOIN hoc_vien ON hoc_vien.ma_hv = diem_danh_nhap_hoc.ma_hv
            LEFT JOIN config ON config.id = diem_danh_nhap_hoc.diem_danh `;
    const where = [];
    const bindings = [];
    if (filter.ngay_nhap_hoc) {
      where.push("diem_danh_nhap_hoc.ngay_nhap_hoc = ?");
      bindings.push(filter.ngay_nhap_hoc);
    }

    if (filter.ten_hv) {
      where.push(`hoc_vien.ten_hv LIKE '?%'`);
      bindings.push(filter.ten_hv);
    }

    if (filter.diem_danh) {
      where.push(`diem_danh_nhap_hoc.diem_danh = ?`);
      bindings.push(filter.diem_danh);
    }

    if (where.length > 0) {
      sql += ` WHERE ${where.join(" AND ")}`;
    }

    const totalSql = `SELECT COUNT(*) as CNT FROM (${sql}) as count_table`;
    const [totalResult] = await conn.promise().execute(totalSql, bindings);
    const totalRecords = totalResult[0].CNT;

    await conn.end();

    return totalRecords;
  }

  static async createMultiple(data) {
    let student_code = await StudentModel.createMultiple(data);

    await Promise.all(
      student_code.map(async (student) => {
        const result = data.find(
          ({ student_code }) => student_code === student.student_code
        );
        let deal_code = await DealsModel.create(result);

        result.deal_code = deal_code;
        // Bản liên kết khóa ngoại
        HocVienDealModel.create(result);

        // Tạo điểm danh
        this.createDiemDanh(result);
      })
    );
  }

  static async createDiemDanh(data) {
    data[this.primaryKey] = this.createPrimaryKey();
    data.ngay_tao = moment().format("YYYY-MM-DD HH:mm:ss");
    data.ngay_sua = moment().format("YYYY-MM-DD HH:mm:ss");
    const filteredData = await super.create(data);

    let sql = `
            INSERT INTO ${this.table} (${filteredData.columns})
            VALUES ${filteredData.placeholders}
            ON DUPLICATE KEY UPDATE 
                date = VALUES(date),
                actual_date = VALUES(actual_date),
                status = VALUES(status),
                updated_at = VALUES(updated_at)
        `;

    const conn = await connection(1);
    try {
      const [result] = await conn.promise().execute(sql, filteredData.values);

      return result.affectedRows;
    } catch (error) {
      console.error("Error inserting data:", error);
      throw error;
    } finally {
      await conn.end();
    }
  }

  static async isExists(filter) {
    const conn = await connection(1);
    let sql = `
            SELECT COUNT(*) as total FROM ${this.table} 
        `;

    const where = [];
    const bindings = [];
    if (filter.ma_hv) {
      where.push(`${this.table}.ma_hv = ?`);
      bindings.push(filter.ma_hv);
    }

    if (filter.id_contact) {
      where.push(`${this.table}.id_contact = ?`);
      bindings.push(filter.id_contact);
    }

    if (filter.id_deal) {
      where.push(`${this.table}.id_deal = ?`);
      bindings.push(filter.id_deal);
    }

    if (filter.ma_deal) {
      where.push(`${this.table}.ma_deal = ?`);
      bindings.push(filter.ma_deal);
    }

    if (where.length > 0) {
      sql += ` WHERE ${where.join(" AND ")}`;
    }

    sql += " LIMIT 1";

    const [[{ total }], fields] = await conn.promise().query(sql, bindings);

    await conn.end();

    if (total > 0) {
      return true;
    }

    return false;
  }

  static async updated(data, where = []) {
    const dataUpdate = { ...data };
    dataUpdate.ngay_sua = moment().format("YYYY-MM-DD HH:mm:ss");
    const filteredData = await super.updated(dataUpdate, where);

    let sql = `
            UPDATE ${this.table}
            SET ${filteredData.placeholders}
            ${filteredData.wheres ? "WHERE " + filteredData.wheres : ""}
        `;

    const conn = await connection(1);
    try {
      await conn.promise().execute(sql, filteredData.values);

      return true;
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    } finally {
      await conn.end();
    }
  }
}

module.exports = { DiemDanhNhapHocModel };
