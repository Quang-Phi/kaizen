const moment = require("moment");
const { StudentModel } = require("../../models/Kaizen/StudentModel");
const { ClassesModel } = require("../../models/Kaizen/ClassesModel");
const { ConfigModel } = require("../../models/Kaizen/ConfigModel");

class AdmissionCheckinValidator {
  static async validateBasicData(data, key = "") {
    if (!data) {
      return {
        code: 1,
        message: "Data is required",
      };
    }

    if (key && Object.keys(data).length === 0) {
      return {
        code: 1,
        message: "Data is required",
      };
    }

    if (
      !data.class_code ||
      (typeof data.class_code !== "string" && data.class_code.trim() === "")
    ) {
      return {
        code: 1,
        message: `Class code is required ${key ? "for item " + key : ""}`,
      };
    }

    const cls = await ClassesModel.find(["id"], {
      code: data.class_code,
    });

    if (!cls || !cls.id) {
      return {
        code: 1,
        message: "Class not exist!",
      };
    }

    return {
      code: 0,
      message: "Basic validation passed",
    };
  }

  static async validateCheckInData(item, key) {
    if (!item.type_checkin_id) {
      return {
        code: 1,
        message: `Type check-in ID is required for student ${item.student_code}`,
      };
    }

    if (item.type_checkin_id == 9) {
      if (
        !item.late_admission_date ||
        (typeof item.late_admission_date !== "string" && item.late_admission_date.trim() === "")
      ) {
        return {
          code: 1,
          message: `Late admission date is required ${key ? "for student " + key : ""}`,
        };
      }

      if (!moment(item.late_admission_date, "YYYY-MM-DD").isValid()) {
        return {
          code: 1,
          message: `Invalid date format ${
            key ? "for item " + key : ""
          }. Required format: YYYY-MM-DD`,
        };
      }
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

    if (
      !item.student_code ||
      (typeof item.student_code !== "string" && item.student_code.trim() === "")
    ) {
      return {
        code: 1,
        message: `Student code is required for item ${key}`,
      };
    }

    const std = await StudentModel.find(["id"], {
      code: item.student_code,
    });

    if (!std || !std.id) {
      return {
        code: 1,
        message: `Student not exist for item ${key}`,
      };
    }
    return {
      code: 0,
      message: "Check-in validation passed",
    };
  }

  static validateMinMax(data) {
    if (!data || Object.keys(data).length === 0) {
      return {
        code: 1,
        message: "Data is required",
      };
    }
    if (Object.keys(data).length > 20) {
      return {
        code: 1,
        message: "Maximum data length is 20",
      };
    }

    return {
      code: 0,
      message: "Data validation passed",
    };
  }

  static async create(data) {
    try {
      const x = this.validateMinMax(data);
      if (x.code !== 0) {
        return x;
      }

      for (const key of Object.keys(data)) {
        const student = data[key];
        const x = await this.validateBasicData(student, key);
        if (x.code !== 0) {
          return x;
        }

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
          const z = await this.validateCheckInData(item, key);
          if (z.code !== 0) {
            return z;
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

  static async validateGetListStudentAdmissionByClass(data) {
    try {
      const x = await this.validateBasicData(data);
      if (x.code !== 0) {
        return x;
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

module.exports = { AdmissionCheckinValidator };
