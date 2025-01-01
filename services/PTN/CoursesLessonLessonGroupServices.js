const { RawQueryModel } = require("../../models/Kaizen/RawQueryModel");
const { PtnLessonModel } = require("../../models/Kaizen/PTN/PtnLessonModel");
const {
  PtnLessonLessonGroupModel,
} = require("../../models/Kaizen/PTN/PtnLessonLessonGroupModel");
const {
  PtnLessonGroupModel,
} = require("../../models/Kaizen/PTN/PtnLessonGroupModel");

class CoursesLessonLessonGroupServices {
  static async getList(params) {
    let rs = await PtnLessonLessonGroupModel.get(
      ["*"],
      {
        where: {
          ptn_courses_point_types_code: params.ptn_courses_point_types_code,
          ptn_lesson_group_code: params.ptn_lesson_group_code,
        },
      },
      "ALL"
    );

    if (rs.length) {
      let ptn_lesson = await PtnLessonModel.get(
        ["*"],
        {
          whereIn: {
            code: [...new Set(rs.map((item) => item.ptn_lesson_code))],
          },
        },
        "ALL"
      );

      ptn_lesson = new Map(ptn_lesson.map((item) => [item.code, { ...item }]));

      rs = rs.map((item) => {
        const ptn_lesson_value =
          ptn_lesson.get(item.ptn_lesson_code)?.value || null;
        item.ptn_lesson_name = ptn_lesson_value;

        return item;
      });
    }

    return rs;
  }

  static async getLessonGroupByPointTypes(params) {
    let rs = await RawQueryModel.getRaw(
      `
                    SELECT 
                         ptn_lesson_group_code
                    FROM ptn_lesson_lesson_group
                    ${
                      params.ptn_courses_point_types_code
                        ? "WHERE ptn_courses_point_types_code =?"
                        : ""
                    }
                    GROUP BY ptn_lesson_group_code
               `,
      params.ptn_courses_point_types_code
        ? [params.ptn_courses_point_types_code]
        : []
    );

    if (rs.length) {
      let lesson_group_code = await PtnLessonGroupModel.get(
        ["*"],
        {
          whereIn: {
            code: [...new Set(rs.map((item) => item.ptn_lesson_group_code))],
          },
        },
        "ALL"
      );

      lesson_group_code = new Map(
        lesson_group_code.map((item) => [item.code, { ...item }])
      );

      rs = rs.map((item) => {
        const lesson_group_name =
          lesson_group_code.get(item.ptn_lesson_group_code)?.name || null;

        item.ptn_lesson_group_name = lesson_group_name;

        return item;
      });
    }

    return rs;
  }
}

module.exports = { CoursesLessonLessonGroupServices };
