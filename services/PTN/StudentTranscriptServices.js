const {
  RegisterClassModel,
} = require("../../models/Kaizen/RegisterClassModel");
const {
  StudentTranscriptModel,
} = require("../../models/Kaizen/PTN/StudentTranscriptModel");
const {
  RegisterClassStudentModel,
} = require("../../models/Kaizen/RegisterClassStudentModel");

class StudentTranscriptServices {
  static async createOnUpdate(payload) {
    const student_code = payload.student_code;
    const class_code = payload.class_code;
    const courses_point_types = payload.courses_point_types;
    const lesson_group = payload.lesson_group;
    const register_class = await RegisterClassModel.find(["*"], {
      where: {
        code: class_code,
      },
    });
    const register_class_code = register_class.code;
    if (!register_class_code) {
      return false;
    }

    let register_class_student = await RegisterClassStudentModel.get(
      ["*"],
      {
        where: {
          status: "Actived",
          register_class_code: register_class_code,
        },
        whereIn: {
          student_code: student_code,
        },
      },
      "ALL"
    );
    register_class_student = new Map(
      register_class_student.map((item) => [item.student_code, { ...item }])
    );
    student_code.forEach((value, key) => {
      const item_value_student_code = value;
      const item_lesson_group = lesson_group[key];
    });
    return true;
  }
}

module.exports = { StudentTranscriptServices };
