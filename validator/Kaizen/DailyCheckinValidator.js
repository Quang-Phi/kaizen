const moment = require("moment");

const { StudentModel } = require("../../models/Kaizen/StudentModel");
const { ClassesModel } = require("../../models/Kaizen/ClassesModel");
const { ConfigModel } = require("../../models/Kaizen/ConfigModel");

class DailyCheckinValidator {
  static async validateCreate(data) {
    try {
      if (!data || Object.keys(data).length === 0) {
        return {
          code: 1,
          message: "Data is required",
        };
      }

      for (const key of Object.keys(data)) {
        const student = data[key];

        const std = await StudentModel.find(["id"], {
          code: student.student_code,
        });

        if (!std || !std.id) {
          return {
            code: 1,
            message: `Student not exist for item ${key}`,
          };
        }

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

        if (
          !student.check_in ||
          !Array.isArray(student.check_in) ||
          student.check_in.length === 0
        ) {
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

          if (
            !checkIn.type_checkin_id ||
            checkIn.type_checkin_id.trim() === ""
          ) {
            return {
              code: 1,
              message: `Type check-in ID is required for student ${student.student_code}`,
            };
          }

          const type = await ConfigModel.find(["id"], {
            id: checkIn.type_checkin_id,
            properties: 2,
          });

          if (!type || !type.id) {
            return {
              code: 1,
              message: `Type check-in ID not exist for student ${student.student_code}`,
            };
          }

          if (!checkIn.class_code || checkIn.class_code.trim() === "") {
            return {
              code: 1,
              message: `Class code is required for student ${student.student_code}`,
            };
          }

          const cls = await ClassesModel.find(["id"], {
            code: checkIn.class_code,
          });
          if (!cls || !cls.id) {
            return {
              code: 1,
              message: "Class not exist!",
            };
          }

          if (!checkIn.reason_id || checkIn.reason_id.trim() === "") {
            return {
              code: 1,
              message: `Reason ID is required for student ${student.student_code}`,
            };
          }

          const rs = await ConfigModel.find(["id"], {
            id: checkIn.reason_id,
            properties: 32,
          });

          if (!rs || !rs.id) {
            return {
              code: 1,
              message: `Reason ID not exist for student ${student.student_code}`,
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

module.exports = { DailyCheckinValidator };
