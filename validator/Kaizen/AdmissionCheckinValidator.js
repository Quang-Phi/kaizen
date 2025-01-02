const { Validator } = require("./Validator");
const { ConfigModel } = require("../../models/Kaizen/ConfigModel");

class AdmissionCheckinValidator extends Validator {
  static ALLOWED_CREATE_MAIN_FIELDS = ["class_code", "created_by", "check_in"];
  static ALLOWED_CREATE_CHECKIN_FIELDS = [
    "type_checkin_id",
    "student_code",
    "late_admission_date",
    "comment",
  ];

  static ALLOWED_GET_LIST_FIELDS = ["class_code"];

  static async validateCheckInData(item, key) {
    const extraFieldCheck = this.checkExtraFields(
      item,
      this.ALLOWED_CREATE_CHECKIN_FIELDS
    );
    if (extraFieldCheck.code !== 0) {
      return extraFieldCheck;
    }

    if (!item.type_checkin_id) {
      return {
        code: 1,
        message: `Type check-in ID is required for student ${item.student_code}`,
      };
    }

    if (item.type_checkin_id == 9) {
      if (!item.late_admission_date || item.late_admission_date.trim() === "") {
        return {
          code: 1,
          message: `Late admission date is required for student ${key}`,
        };
      }

      const dateCheck = this.validateDateFormat(
        item.late_admission_date,
        "Late admission date"
      );
      if (dateCheck.code !== 0) return dateCheck;
    }

    const type = await ConfigModel.find(["id"], {
      id: item.type_checkin_id,
      properties: 3,
    });

    if (!type || !type.id) {
      return {
        code: 1,
        message: `Type check-in ID not exist for student ${item.student_code}`,
      };
    }

    const studentCheck = await this.validateStudentExists(
      item.student_code,
      key
    );
    if (studentCheck.code !== 0) return studentCheck;

    if (item.comment !== undefined) {
      const commentCheck = this.validateStringField(item.comment, "Comment");
      if (commentCheck.code !== 0) return commentCheck;
    }

    return {
      code: 0,
      message: "Check-in validation passed",
    };
  }

  static async create(data) {
    try {
      const minMaxCheck = this.validateMinMax(data);
      if (minMaxCheck.code !== 0) return minMaxCheck;

      for (const key of Object.keys(data)) {
        const student = data[key];

        const extraFieldCheck = this.checkExtraFields(
          student,
          this.ALLOWED_CREATE_MAIN_FIELDS
        );
        if (extraFieldCheck.code !== 0) return extraFieldCheck;

        const basicCheck = await this.validateBasicData(student, key);
        if (basicCheck.code !== 0) return basicCheck;

        if (!student.created_by) {
          return {
            code: 1,
            message: `Created by is required for student ${key}`,
          };
        }

        if (
          !student.check_in ||
          !Array.isArray(student.check_in) ||
          student.check_in.length === 0
        ) {
          return {
            code: 1,
            message: `Check-in is required and must be an array for student ${key}`,
          };
        }

        for (const item of student.check_in) {
          const checkInCheck = await this.validateCheckInData(item, key);
          if (checkInCheck.code !== 0) return checkInCheck;
        }
      }

      return {
        code: 0,
        message: "Validation passed",
      };
    } catch (error) {
      console.error("Validation error:", error);
      return {
        code: 1,
        message: "Internal validation error",
      };
    }
  }

  static async validateGetListStudentAdmissionByClass(data) {
    try {
      const extraFieldCheck = this.checkExtraFields(
        data,
        this.ALLOWED_GET_LIST_FIELDS
      );

      if (extraFieldCheck.code !== 0) return extraFieldCheck;

      const basicCheck = await this.validateBasicData(data);
      if (basicCheck.code !== 0) return basicCheck;

      return {
        code: 0,
        message: "Validation passed",
      };
    } catch (error) {
      console.error("Validation error:", error);
      return {
        code: 1,
        message: "Internal validation error",
      };
    }
  }
}

module.exports = { AdmissionCheckinValidator };
