const moment = require("moment");
const { StudentModel } = require("../../models/Kaizen/StudentModel");
const { ClassesModel } = require("../../models/Kaizen/ClassesModel");
const { ConfigModel } = require("../../models/Kaizen/ConfigModel");

class DailyCheckinValidator {
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

    if (!data.day || (typeof data.day !== "string" && data.day.trim() === "")) {
      return {
        code: 1,
        message: `Day is required ${key ? "for student " + key : ""}`,
      };
    }

    if (!moment(data.day, "YYYY-MM-DD").isValid()) {
      return {
        code: 1,
        message: `Invalid date format ${
          key ? "for item " + key : ""
        }. Required format: YYYY-MM-DD`,
      };
    }

    return {
      code: 0,
      message: "Basic validation passed",
    };
  }

  static async validateCheckInData(item, key) {
    if (!item.class_session) {
      return {
        code: 1,
        message: `Class session is required for student ${item.student_code}`,
      };
    }

    if (!item.type_checkin_id) {
      return {
        code: 1,
        message: `Type check-in ID is required for student ${item.student_code}`,
      };
    }

    const type = await ConfigModel.find(["id"], {
      id: item.type_checkin_id,
      properties: 2,
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

    if (type.id === 4) {
      if (!item.reason_id) {
        return {
          code: 1,
          message: `Reason ID is required for student ${item.student_code}`,
        };
      }
      const rs = await ConfigModel.find(["id"], {
        id: item.reason_id,
        properties: 32,
      });

      if (!rs || !rs.id) {
        return {
          code: 1,
          message: `Reason ID not exist for student ${item.student_code}`,
        };
      }
    }

    if (item.comment !== undefined && item.comment !== null) {
      if (typeof item.comment !== "string") {
        return {
          code: 1,
          message: `Comment must be a string for student ${item.student_code}`,
        };
      }
      if (item.comment.length > 1000) {
        return {
          code: 1,
          message: `Comment length exceeds maximum limit for student ${item.student_code}`,
        };
      }
    }

    return {
      code: 0,
      message: "Check-in validation passed",
    };
  }

  static async validateEvaluationData(item, key) {
    if (
      !item.student_code ||
      (typeof item.student_code !== "string" && item.student_code.trim() === "")
    ) {
      return {
        code: 1,
        message: `Student code is required for item ${key}`,
      };
    }

    const student = await StudentModel.find(["id"], {
      code: item.student_code,
    });

    if (!student || !student.id) {
      return {
        code: 1,
        message: `Student not exist for item ${key}`,
      };
    }

    const fieldValidations = {
      attendance: { properties: 24 },
      learning_attitude: { properties: 26 },
      physical_appearance: { properties: 21 },
      consciousness_personality: { properties: 25 },
      japanese_learning_ability: { properties: 27 },
      mental_health: { properties: 28 },
      disability: { properties: 16 },
      japanese_language_need: { properties: 17 },
      family_influence: { properties: 19 },
      medical_history: { properties: 20 },
      is_registered_elsewhere: { properties: 23 },
      appearance: { properties: 29 },
    };

    for (const [field, config] of Object.entries(fieldValidations)) {
      if (
        item[field] !== undefined &&
        item[field] !== null &&
        item[field] !== ""
      ) {
        const configValue = await ConfigModel.find(["id"], {
          id: item[field],
          properties: config.properties,
        });

        if (!configValue || !configValue.id) {
          return {
            code: 1,
            message: `Invalid ${field.replace(/_/g, " ")} value for student ${
              item.student_code
            }`,
          };
        }
      }
    }

    const varcharFields = [
      "age",
      "desired_major",
      "physical_condition",
      "tattoo",
      "expected_graduation_year",
      "military_requirement",
      "note",
    ];

    for (const field of varcharFields) {
      if (
        item[field] !== undefined &&
        item[field] !== null &&
        item[field] !== ""
      ) {
        if (typeof item[field] !== "string") {
          return {
            code: 1,
            message: `${field.replace(
              /_/g,
              " "
            )} must be a string for student ${item.student_code}`,
          };
        }
        if (item[field].length > 1000) {
          return {
            code: 1,
            message: `${field.replace(
              /_/g,
              " "
            )} length exceeds maximum limit for student ${item.student_code}`,
          };
        }
      }
    }

    return {
      code: 0,
      message: "Evaluation validation passed",
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

        const y = await this.validateBasicData(student, key);
        if (y.code !== 0) {
          return y;
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

  static async validateGetListStudentCheckinByClass(data) {
    try {
      const x = await this.validateBasicData(data);
      if (x.code !== 0) {
        return x;
      }

      const y = this.validatClassSession(data);
      if (y.code !== 0) {
        return y;
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

  static validatClassSession(data) {
    if (typeof data.class_session === "string") {
      try {
        data.class_session = JSON.parse(data.class_session);
      } catch (error) {
        return {
          code: 1,
          message: `Invalid class session format`,
        };
      }
    }

    if (!Array.isArray(data.class_session)) {
      return {
        code: 1,
        message: `Class session must be an array`,
      };
    }

    if (
      !data.class_session.every(
        (session) => typeof session === "number" && Number.isInteger(session)
      )
    ) {
      return {
        code: 1,
        message: `Class session must be an array of integers`,
      };
    }
    return {
      code: 0,
      message: "Validation passed",
    };
  }

  static async evaluation(data) {
    try {
      const x = this.validateMinMax(data);
      if (x.code !== 0) {
        return x;
      }

      for (const key of Object.keys(data)) {
        const student = data[key];

        const y = await this.validateBasicData(student, key);
        if (y.code !== 0) {
          return y;
        }

        if (!student.created_by) {
          return {
            code: 1,
            message: `Created by is required for student ${key}`,
          };
        }

        for (const item of student.evaluation) {
          const z = await this.validateEvaluationData(item, key);
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

  static async getStudentEvaluation(data) {
    try {
      const x = await this.validateBasicData(data);
      if (x.code !== 0) {
        return x;
      }

      if (
        !data.student_code ||
        (typeof data.student_code !== "string" &&
          data.student_code.trim() === "")
      ) {
        return {
          code: 1,
          message: "Student code is required",
        };
      }

      const std = await StudentModel.find(["id"], {
        code: data.student_code,
      });

      if (!std || !std.id) {
        return {
          code: 1,
          message: `Student not exist`,
        };
      }

      const y = this.validatClassSession(data);
      if (y.code !== 0) {
        return y;
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
