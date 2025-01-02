const { Validator } = require("./Validator");
const { ConfigModel } = require("../../models/Kaizen/ConfigModel");

class DailyCheckinValidator extends Validator {
  static ALLOWED_CREATE_MAIN_FIELDS = [
    "class_code",
    "day",
    "created_by",
    "check_in",
  ];
  static ALLOWED_CREATE_CHECKIN_FIELDS = [
    "class_session",
    "type_checkin_id",
    "student_code",
    "reason_id",
    "comment",
  ];

  static ALLOWED_GET_LIST_FIELDS = ["class_code", "day", "class_session"];

  static ALLOWED_EVALUATION_MAIN_FIELDS = [
    "class_code",
    "day",
    "created_by",
    "evaluation",
  ];
  static ALLOWED_EVALUATION_DETAIL_FIELDS = [
    "class_session",
    "student_code",
    "attendance",
    "learning_attitude",
    "appearance",
    "physical_appearance",
    "consciousness_personality",
    "japanese_learning_ability",
    "mental_health",
    "age",
    "disability",
    "desired_major",
    "family_influence",
    "physical_condition",
    "tattoo",
    "japanese_language_need",
    "expected_graduation_year",
    "medical_history",
    "is_registered_elsewhere",
    "military_requirement",
    "note",
    "japanese_language_need_other",
    "family_influence_other",
  ];

  static ALLOWED_GET_STUDENT_EVALUATION_FIELDS = [
    "class_code",
    "day",
    "class_session",
    "student_code",
  ];

  static async validateBasicData(data, key = "") {
    const baseCheck = await super.validateBasicData(data, key);
    if (baseCheck.code !== 0) return baseCheck;

    if (!data.day || data.day.trim() === "") {
      return {
        code: 1,
        message: `Day is required ${key ? "for student " + key : ""}`,
      };
    }

    const dateCheck = this.validateDateFormat(data.day);
    if (dateCheck.code !== 0) return dateCheck;

    return {
      code: 0,
      message: "Basic validation passed",
    };
  }

  static async validateCheckInData(item, key) {
    const extraFieldCheck = this.checkExtraFields(
      item,
      this.ALLOWED_CREATE_CHECKIN_FIELDS
    );
    if (extraFieldCheck.code !== 0) return extraFieldCheck;

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

    const studentCheck = await this.validateStudentExists(
      item.student_code,
      key
    );
    if (studentCheck.code !== 0) return studentCheck;

    if (type.id === 4) {
      if (!item.reason_id) {
        return {
          code: 1,
          message: `Reason ID is required for student ${item.student_code}`,
        };
      }
      const reason = await ConfigModel.find(["id"], {
        id: item.reason_id,
        properties: 32,
      });

      if (!reason || !reason.id) {
        return {
          code: 1,
          message: `Reason ID not exist for student ${item.student_code}`,
        };
      }
    }

    if (item.comment !== undefined) {
      const commentCheck = this.validateStringField(item.comment, "Comment");
      if (commentCheck.code !== 0) return commentCheck;
    }

    return {
      code: 0,
      message: "Check-in validation passed",
    };
  }

  static validateClassSession(data) {
    if (typeof data.class_session === "string") {
      try {
        data.class_session = JSON.parse(data.class_session);
      } catch (error) {
        return {
          code: 1,
          message: "Invalid class session format",
        };
      }
    }

    if (!Array.isArray(data.class_session)) {
      return {
        code: 1,
        message: "Class session must be an array",
      };
    }

    if (
      !data.class_session.every(
        (session) => typeof session === "number" && Number.isInteger(session)
      )
    ) {
      return {
        code: 1,
        message: "Class session must be an array of integers",
      };
    }

    return {
      code: 0,
      message: "Validation passed",
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

  static async validateGetListStudentCheckinByClass(data) {
    try {
      const extraFieldCheck = this.checkExtraFields(
        data,
        this.ALLOWED_GET_LIST_FIELDS
      );
      if (extraFieldCheck.code !== 0) return extraFieldCheck;

      const basicCheck = await this.validateBasicData(data);
      if (basicCheck.code !== 0) return basicCheck;

      const sessionCheck = this.validateClassSession(data);
      if (sessionCheck.code !== 0) return sessionCheck;

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

  static async validateEvaluationData(item, key) {
    const detailFieldCheck = this.checkExtraFields(
      item,
      this.ALLOWED_EVALUATION_DETAIL_FIELDS
    );
    if (detailFieldCheck.code !== 0) return detailFieldCheck;

    const studentCheck = await this.validateStudentExists(
      item.student_code,
      ""
    );
    if (studentCheck.code !== 0) return studentCheck;

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

  static async evaluation(data) {
    try {
      const minMaxCheck = this.validateMinMax(data);
      if (minMaxCheck.code !== 0) return minMaxCheck;

      for (const key of Object.keys(data)) {
        const student = data[key];

        const extraFieldCheck = this.checkExtraFields(
          student,
          this.ALLOWED_EVALUATION_MAIN_FIELDS
        );
        if (extraFieldCheck.code !== 0) return extraFieldCheck;

        const basicCheck = await this.validateBasicData(student);
        if (basicCheck.code !== 0) return basicCheck;

        if (!student.created_by) {
          return {
            code: 1,
            message: `Created by is required for student ${key}`,
          };
        }

        for (const item of student.evaluation) {
          const z = await this.validateEvaluationData(item, key);
          if (z.code !== 0) return z;
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
      const extraFieldCheck = this.checkExtraFields(
        data,
        this.ALLOWED_GET_STUDENT_EVALUATION_FIELDS
      );
      if (extraFieldCheck.code !== 0) return extraFieldCheck;

      const basicCheck = await this.validateBasicData(data);
      if (basicCheck.code !== 0) return basicCheck;

      const studentCheck = await this.validateStudentExists(
        data.student_code,
        ""
      );
      if (studentCheck.code !== 0) return studentCheck;

      const sessionCheck = this.validateClassSession(data);
      if (sessionCheck.code !== 0) return sessionCheck;

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
