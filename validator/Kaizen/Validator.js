const moment = require("moment");
const { StudentModel } = require("../../models/Kaizen/StudentModel");
const { ClassesModel } = require("../../models/Kaizen/ClassesModel");

class Validator {
  static MAX_DATA_LENGTH = 50;
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

  static validateMinMax(data) {
    if (!data || Object.keys(data).length === 0) {
      return {
        code: 1,
        message: "Data is required",
      };
    }
    if (Object.keys(data).length > this.MAX_DATA_LENGTH) {
      return {
        code: 1,
        message: `Maximum data length is ${this.MAX_DATA_LENGTH}`,
      };
    }

    return {
      code: 0,
      message: "Data validation passed",
    };
  }

  static validateDateFormat(date, fieldName = "Date") {
    if (!moment(date, "YYYY-MM-DD").isValid()) {
      return {
        code: 1,
        message: `Invalid ${fieldName} format. Required format: YYYY-MM-DD`,
      };
    }
    return { code: 0 };
  }

  static async validateStudentExists(studentCode, key) {
    if (
      !studentCode ||
      (typeof studentCode !== "string" && studentCode.trim() === "")
    ) {
      return {
        code: 1,
        message: `Student code is required for item ${key}`,
      };
    }

    const std = await StudentModel.find(["id"], {
      code: studentCode,
    });

    if (!std || !std.id) {
      return {
        code: 1,
        message: `Student not exist for item ${key}`,
      };
    }

    return { code: 0 };
  }

  static validateStringField(value, fieldName, maxLength = 1000) {
    if (value !== undefined && value !== null && value !== "") {
      if (typeof value !== "string") {
        return {
          code: 1,
          message: `${fieldName} must be a string`,
        };
      }
      if (value.length > maxLength) {
        return {
          code: 1,
          message: `${fieldName} length exceeds maximum limit of ${maxLength} characters`,
        };
      }
    }
    return { code: 0 };
  }

  static checkExtraFields(data, allowedFields) {
    const extraFields = Object.keys(data).filter(
      (field) => !allowedFields.includes(field)
    );
    if (extraFields.length > 0) {
      return {
        code: 1,
        message: `Extra fields not allowed: ${extraFields.join(", ")}`,
      };
    }
    return { code: 0 };
  }
}

module.exports = { Validator };
