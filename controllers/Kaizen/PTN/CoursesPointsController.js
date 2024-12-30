// controllers/Kaizen/AreaController.js
const { RawQueryModel } = require('../../../models/Kaizen/RawQueryModel');
const { Response } = require('../../../helpers/Response');
const { CoursesPointsValidator } = require('../../../validator/Kaizen/CoursesPointsValidator');


class CoursesPointsController {

     static async points(req, res) {
          const payload = req.body;
          let validator = await CoursesPointsValidator.points(payload);
          if (validator.code == 1) {
               return res.status(400).json({
                    error: 1,
                    message: validator.message
               });
          }
          let rs = {}
          return Response.response(res, 'Created', rs ?? []);
     }
}

module.exports = CoursesPointsController;
