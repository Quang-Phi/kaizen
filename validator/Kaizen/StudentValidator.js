const { ClassesModel } = require("../../models/Kaizen/ClassesModel");
const moment = require("moment");
const { StudentModel } = require("../../models/Kaizen/StudentModel");
class StudentValidator {
  static async arrange(req) {
    let code = 0;

    const class_code = req.class_code;
    if (!class_code || !req.student) {
      code = 1;
      return { code: code, message: "Không đủ tham số" };
    }

    const classes = await ClassesModel.find(["code"], { code: class_code });
    if (!classes?.code) {
      code = 1;
      return { code: code, message: "Class not exists" };
    }

    return { code: code };
  }

  static async transferClasses(req) {
    let code = 0;

    const before_class = req.before_class;
    const student_code = req.student_code;
    const after_class = req.after_class;
    const updated_by = req.updated_by;
    const note = req.note;
    const transfer_date = req.transfer_date;

    if (
      !before_class ||
      !student_code ||
      !after_class ||
      !note ||
      !updated_by ||
      !Number.isSafeInteger(updated_by)
    ) {
      code = 1;
      return { code: code, message: "Not enough parameters" };
    }

    if (before_class === after_class) {
      code = 1;
      return { code: code, message: "Class not duplicate" };
    }

    if (transfer_date && !moment(transfer_date, "YYYY-MM-DD").isValid()) {
      code = 1;
      return { code: code, message: "Transfer Date not valid!" };
    }

    const classes = await ClassesModel.get(
      ["code"],
      {
        whereIn: {
          code: [before_class, after_class],
        },
      },
      "ALL"
    );
    if (classes.length < 2) {
      code = 1;
      return { code: code, message: "Class not found" };
    }

    const student = await StudentModel.find(["code"], {
      code: student_code,
    });

    if (!student?.code) {
      code = 1;
      return { code: code, message: "Student not found" };
    }

    return { code: code };
  }

  static async create(req) {
    let code = 0;

    const schools_id = req.schools_id;
    const ms_first_name = req?.ms_first_name;
    const ms_last_name = req?.ms_last_name;
    const date_graduation = req.date_graduation;
    const level = req.level;

    if (
      !req.first_name ||
      !req.last_name ||
      !req.contact_id ||
      !Number.isSafeInteger(req.contact_id) ||
      !req.dob ||
      !req.native_place ||
      !req.deal_id ||
      !Number.isSafeInteger(req.deal_id) ||
      !req.deal_opening_date ||
      !req.deal_program_bitrix_id ||
      !req.created_by ||
      !Number.isSafeInteger(req.created_by) ||
      !req.created_by_username ||
      !req.deal_branch_id
    ) {
      code = 1;
      return { code: code, message: "Not enough parameters" };
    }

    if (![0, 1].includes(req.gender)) {
      code = 1;
      return { code: code, message: "Not enough parameters" };
    }

    if (
      !moment(req.dob, "YYYY-MM-DD").isValid() ||
      !moment(req.deal_opening_date, "YYYY-MM-DD").isValid()
    ) {
      code = 1;
      return { code: code, message: "Date not valid" };
    }

    if (!Array.isArray(req.phone)) {
      code = 1;
      return { code: code, message: "Phone not valid" };
    }

    if (req.hasOwnProperty("email") && !Array.isArray(req.email)) {
      code = 1;
      return { code: code, message: "Email not valid" };
    }

    if (!ms_first_name && !ms_last_name) {
      code = 1;
      return { code: code, message: "MS is required!" };
    }

    if (schools_id && !Number.isSafeInteger(schools_id)) {
      code = 1;
      return { code: code, message: "Schools is interger" };
    }

    if (date_graduation && !moment(date_graduation, "YYYY-MM-DD").isValid()) {
      code = 1;
      return { code: code, message: "Date Graduation not valid" };
    }

    if (level && !Number.isSafeInteger(level)) {
      code = 1;
      return { code: code, message: "Level is interger" };
    }

    return { code: code };
  }

  static async update(req) {
    let code = 0;
    const schools_id = req.schools_id;
    const ms_first_name = req?.ms_first_name;
    const ms_last_name = req?.ms_last_name;
    const date_graduation = req.date_graduation;
    const level = req.level;

    if (
      !req.contact_id ||
      !Number.isSafeInteger(req.contact_id) ||
      !req.deal_id ||
      !Number.isSafeInteger(req.deal_id) ||
      !req.deal_opening_date ||
      !req.deal_program_bitrix_id ||
      !req.updated_by ||
      !Number.isSafeInteger(req.updated_by) ||
      !req.updated_by_username ||
      !req.deal_branch_id
    ) {
      code = 1;
      return { code: code, message: "Not enough parameters" };
    }

    if (req.gender && ![0, 1].includes(req.gender)) {
      code = 1;
      return { code: code, message: "Not enough parameters" };
    }

    if (req.dob && !moment(req.dob, "YYYY-MM-DD").isValid()) {
      code = 1;
      return { code: code, message: "Date of Birth not valid" };
    }

    if (
      req.deal_opening_date &&
      !moment(req.deal_opening_date, "YYYY-MM-DD").isValid()
    ) {
      code = 1;
      return { code: code, message: "Deal Openning Date not valid" };
    }

    if (req.phone && !Array.isArray(req.phone)) {
      code = 1;
      return { code: code, message: "Phone not valid" };
    }

    if (req.hasOwnProperty("email") && !Array.isArray(req.email)) {
      code = 1;
      return { code: code, message: "Email not valid" };
    }

    if (!ms_first_name && !ms_last_name) {
      code = 1;
      return { code: code, message: "MS is required!" };
    }

    if (schools_id && !Number.isSafeInteger(schools_id)) {
      code = 1;
      return { code: code, message: "Schools is interger" };
    }

    if (date_graduation && !moment(date_graduation, "YYYY-MM-DD").isValid()) {
      code = 1;
      return { code: code, message: "Date Graduation not valid" };
    }

    if (level && !Number.isSafeInteger(level)) {
      code = 1;
      return { code: code, message: "Level is interger" };
    }

    return { code: code };
  }
}

module.exports = { StudentValidator };
