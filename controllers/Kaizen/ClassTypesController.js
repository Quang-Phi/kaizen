const { ClassTypesModel } = require('../../models/Kaizen/ClassTypesModel');
const { ClassTypesCoursesModel } = require('../../models/Kaizen/ClassTypesCoursesModel');
const { CoursesModel } = require('../../models/Kaizen/CoursesModel');
const { Logs } = require('../../helpers/Logs');

class ClassTypesController {
     static async getAll(req, res)
     {
          // Giả sử phương thức getAllConfig trả về danh sách cấu hình từ database
          const request = req.query;

          let where = {};
          if (request.type) {
               where.type = request.type
          }

          let class_type = await ClassTypesModel.get(['id', 'value', 'type'], where);
          
          let class_types_courses = await ClassTypesCoursesModel.get(
               ['*'],
               {
                    whereIn: {
                         class_types_id: [...new Set(class_type.map(item => item.id))]
                    }
               },
               'ALL'
          );
          const class_types_courses_key_by = {};
          class_types_courses.forEach(item => {
               if (!class_types_courses_key_by[item.class_types_id]) {
                    class_types_courses_key_by[item.class_types_id] = [];
               }
               class_types_courses_key_by[item.class_types_id].push(item);
          });

          // console.log(key_by)

          let courses = await CoursesModel.get(
               ['*'],
               {
                    whereIn: {
                         id: [...new Set(class_types_courses.map(item => item.courses_id))]
                    }
               },
               'ALL'
          );
          courses = new Map(
               courses.map(item => [item.id, item.skill_code])
          );

          Logs.logText('class-create', JSON.stringify(class_types_courses));
          class_type = class_type.map(item => {
               const subject_teacher = {};

               const class_types_id = item.id;

               if (class_types_courses_key_by[class_types_id]) {
                    class_types_courses_key_by[class_types_id].forEach(item => {
                         // 
                         const skill_code = courses.get(item.courses_id);
                         if (skill_code != 'khác') {
                              subject_teacher['tiếngnhật'] = null;
                         }
                         
                         subject_teacher[skill_code] = null;
                    });
               }

               item.subject_teacher = subject_teacher;
               // const subject_teacher = class_types_courses.find(item => item.class_types_id === class_types_id);
               return item;
          });
          // console.log(class_types_courses, courses)
          return res.json({
               error: 0,
               data : class_type
          });
     }
}

module.exports = ClassTypesController;
