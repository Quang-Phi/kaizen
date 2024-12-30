const moment = require("moment");

class DailyCheckinValidator {
  static async validateCreate(data) {
    let code = 0;
    let message = "Validation passed";

    if (!data || Object.keys(data).length === 0) {
      return {
        code: 1,
        message: "Data is required",
      };
    }

    for (const key of Object.keys(data)) {
      const student = data[key];

      if (!student.student_code || student.student_code.trim() === "") {
        return {
          code: 1,
          message: `Student code is required for item ${key}`,
        };
      }

      if (!student.day || student.day.trim() === "") {
        return {
          code: 1,
          message: `Day is required for student ${student.student_code}`,
        };
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(student.day)) {
        return {
          code: 1,
          message: `Invalid date format for student ${student.student_code}. Required format: YYYY-MM-DD`,
        };
      }

      const date = moment(student.day, "YYYY-MM-DD", true);
      if (!date.isValid()) {
        return {
          code: 1,
          message: `Invalid date for student ${student.student_code}. Required format: YYYY-MM-DD`,
        };
      }

      if (!student.created_by || student.created_by.trim() === "") {
        return {
          code: 1,
          message: `Created by is required for student ${student.student_code}`,
        };
      }

      if (!student.check_in || !Array.isArray(student.check_in) || student.check_in.length === 0) {
        return {
          code: 1,
          message: `Check-in is required and must be an array for student ${student.student_code}`,
        };
      }

      for (const checkIn of student.check_in) {
        if (!checkIn.class_session || checkIn.class_session.trim() === "") {
          return {
            code: 1,
            message: `Class session is required for student ${student.student_code}`,
          };
        }

        if (!checkIn.type_checkin_id || checkIn.type_checkin_id.trim() === "") {
          return {
            code: 1,
            message: `Type check-in ID is required for student ${student.student_code}`,
          };
        }

        if (!checkIn.class_code || checkIn.class_code.trim() === "") {
          return {
            code: 1,
            message: `Class code is required for student ${student.student_code}`,
          };
        }

        if (!checkIn.reason_id || checkIn.reason_id.trim() === "") {
          return {
            code: 1,
            message: `Reason ID is required for student ${student.student_code}`,
          };
        }

        if (checkIn.comment !== undefined && checkIn.comment !== null) {
          if (typeof checkIn.comment !== "string") {
            return {
              code: 1,
              message: `Comment must be a string for student ${student.student_code}`,
            };
          }
          if (checkIn.comment.length > 1000) {
            return {
              code: 1,
              message: `Comment length exceeds maximum limit for student ${student.student_code}`,
            };
          }
        }
      }
    }

    return {
      code: code,
      message: message,
    };
  }
}

module.exports = { DailyCheckinValidator };