class CoursesLessonLessonGroupValidator {
     static async getList(req) {
          let code = 0;
          const ptn_lesson_group_code = req.ptn_lesson_group_code;
          const ptn_courses_point_types_code = req.ptn_courses_point_types_code;
          if (
               !ptn_lesson_group_code ||
               !ptn_courses_point_types_code
          ) {
               code = 1;
               return {code: code, message: 'Not enough parameters'};
          }

          return {code: code};
     }

     static async getLessonGroupByPointTypes(req) {

          let code = 0;
          const ptn_courses_point_types_code = req.ptn_courses_point_types_code;
          if (
               !ptn_courses_point_types_code
          ) {
               code = 1;
               return {code: code, message: 'Not enough parameters'};
          }

          return {code: code};
     }
}

module.exports = { CoursesLessonLessonGroupValidator }