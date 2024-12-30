const { StudentModel } = require('../../models/Kaizen/StudentModel');
const { RegisterClassModel } = require('../../models/Kaizen/RegisterClassModel');
const { RegisterClassStudentModel } = require('../../models/Kaizen/RegisterClassStudentModel');
const { CoursesPointTypesModel } = require('../../models/Kaizen/PTN/CoursesPointTypesModel');

class CoursesPointsValidator {
     
     static async points(req) {
          let code = 0;
          
          const student_code = req.student_code;
          const class_code = req.class_code;
          const courses_point_types = req.courses_point_types;
          const lesson_group = req.lesson_group;

          if (
               !student_code ||
               !class_code ||
               !courses_point_types ||
               !lesson_group
          ) {
               code = 1;
               return {code: code, message: 'Not enough parameters'};
          }

          if (
               !Array.isArray(student_code)
          ) {
               code = 1;
               return {code:code, message: "Student Code must be array"};
          }

          if (
               student_code.length <= 0
          ) {
               code = 1;
               return {code:code, message: "Student Code not null"};
          }

          if (
               !Array.isArray(lesson_group)
          ) {
               code = 1;
               return {code:code, message: "Lesson Group must be array"};
          }

          if (
               lesson_group.length <= 0
          ) {
               code = 1;
               return {code:code, message: "Lesson Group not null"};
          }

          if (
               student_code.length != lesson_group.length
          ) {
               code = 1;
               return {code:code, message: "Student Code and Lesson Group not match!"};
          }

          if (
               student_code.length > 20
          ) {
               code = 1;
               return {code:code, message: "Student Code max 20"};
          }

          if (
               lesson_group.length > 20
          ) {
               code = 1;
               return {code:code, message: "Lesson Group max 20"};
          }

          const students = await StudentModel.get(
               ['code'], 
               {
                    whereIn: {
                         code: student_code
                    }
               }, 
               "ALL"
          );
          if (
               students.length <= 0
          ) {
               code = 1;
               return {code: code, message: 'Students is valid!'};
          }

          const students_valid = student_code.filter(value => {
               const code = value;
               if (students.find(item => item.code == code)) {
                   return false;
               }
   
               return true;
          });

          if (
               students_valid.length > 0
          ) {
               code = 1;
               return {code: code, message: `Student Code ${students_valid.join(',')} not valid!`};
          }

          const register_class_valid = await RegisterClassModel.find(
               ['code'],
               {
                    class_code: class_code
               }
          );
          if (
               !register_class_valid.code
          ) {
               code = 1;
               return {code: code, message: "Class code not exist"};
          }

          const register_class_student = await RegisterClassStudentModel.get(
               ['*'],
               {
                    where: {
                         status: 'Actived'
                    },
                    whereIn: {
                         student_code: student_code
                    }
               },
               "ALL"
          );

          const students_join_class_valid = student_code.filter(value => {
               const code = value;
               if (register_class_student.find(item => (item.student_code == code && item.register_class_code == register_class_valid.code))) {
                   return false;
               }
   
               return true;
          });
          if (
               students_join_class_valid.length > 0
          ) {
               code = 1;
               return {code:code, message: `Student ${students_join_class_valid.join(',')} not join class`}
          }

          const courses_point = await CoursesPointTypesModel.find(
               ['code'],
               {
                    code: courses_point_types
               }
          );
          if (
               !courses_point.code
          ) {
               code = 1;
               return {code: code, message: "Courses Point Types not exist"};
          }
          
          const lesson_group_valid = lesson_group.filter((item) => {
               const value = Object.values(item);
               console.log(value)
               if (
                    !Number.isSafeInteger(value)
               ) {
                    return false;
               }

               return true;
          });
          if (
               lesson_group_valid.length > 0
          ) {
               code = 1;
               return {code: code, message: `Lesson Group ${JSON.stringify(lesson_group_valid)} not valid`};
          }

          const lessonGroupKey = lesson_group.flatMap(item => Object.keys(item));
          console.log(lessonGroupKey);

          return {code: code};
     }
}

module.exports = { CoursesPointsValidator }