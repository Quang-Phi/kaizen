const { RawQueryModel } = require("../../../models/Kaizen/RawQueryModel");
const { Response } = require("../../../helpers/Response");
const {
  CoursesPointsValidator,
} = require("../../../validator/Kaizen/CoursesPointsValidator");
const {
  StudentTranscriptServices,
} = require("../../../services/PTN/StudentTranscriptServices");

class CoursesPointsController {
  static async points(req, res) {
    try {
      const payload = req.body;
      let validator = await CoursesPointsValidator.points(payload);
      if (validator.code == 1) {
        return Response.validator(res, validator);
      }
      const rs = await StudentTranscriptServices.createOnUpdate(payload);
      if (!rs) {
        return Response.response(res, "Fail", rs ?? []);
      }

      return Response.response(res, "Created", rs ?? []);
    } catch (err) {
      return Response.handleError(res, err);
    }
  }
}

module.exports = CoursesPointsController;
