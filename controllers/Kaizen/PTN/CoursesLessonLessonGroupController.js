// controllers/Kaizen/PTN/CoursesPointTypesController.js
const { CoursesLessonLessonGroupServices } = require('../../../services/PTN/CoursesLessonLessonGroupServices');
const { CoursesLessonLessonGroupValidator } = require('../../../validator/Kaizen/CoursesLessonLessonGroupValidator');
const { Response } = require('../../../helpers/Response');

class CoursesLessonLessonGroupController {

     static async getList(req, res) {

          const payload = req.query;
          let validator = await CoursesLessonLessonGroupValidator.getList(payload);
          if (validator.code == 1) {
               return res.status(400).json({
                    error: 1,
                    message: validator.message
               });
          }

          try {
               const rs = await CoursesLessonLessonGroupServices.getList(payload);

               return Response.response(res, '', rs);
          } catch (error) {
               console.log(error)
               return Response.response(res, 'Error');
          }
     }

     static async getLessonGroupByPointTypes(req, res) {

          const payload = req.query;
          let validator = await CoursesLessonLessonGroupValidator.getLessonGroupByPointTypes(payload);
          if (validator.code == 1) {
               return res.status(400).json({
                    error: 1,
                    message: validator.message
               });
          }
          console.log(validator)
          try {
               const rs = await CoursesLessonLessonGroupServices.getLessonGroupByPointTypes(payload);

               return Response.response(res, '', rs);
          } catch (error) {
               console.log(error)
               return Response.response(res, 'Error');
          }
     }
}

module.exports = CoursesLessonLessonGroupController;
