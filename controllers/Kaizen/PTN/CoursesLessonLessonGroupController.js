const {
  CoursesLessonLessonGroupServices,
} = require("../../../services/PTN/CoursesLessonLessonGroupServices");
const {
  CoursesLessonLessonGroupValidator,
} = require("../../../validator/Kaizen/CoursesLessonLessonGroupValidator");
const { Response } = require("../../../helpers/Response");

class CoursesLessonLessonGroupController {
  static async getList(req, res) {
    const payload = req.query;
    let validator = await CoursesLessonLessonGroupValidator.getList(payload);
    if (validator.code == 1) {
      return Response.validator(res, validator);
    }

    try {
      const rs = await CoursesLessonLessonGroupServices.getList(payload);

      return Response.response(res, "", rs);
    } catch (error) {
      return Response.handleError(res, error);
    }
  }

  static async getLessonGroupByPointTypes(req, res) {
    const payload = req.query;
    let validator =
      await CoursesLessonLessonGroupValidator.getLessonGroupByPointTypes(
        payload
      );
    if (validator.code == 1) {
      return Response.validator(res, validator);
    }
    try {
      const rs =
        await CoursesLessonLessonGroupServices.getLessonGroupByPointTypes(
          payload
        );

      return Response.response(res, "", rs);
    } catch (error) {
      return Response.handleError(res, error);
    }
  }
}

module.exports = CoursesLessonLessonGroupController;
