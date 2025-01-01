const { CoursesModel } = require("../../models/Kaizen/CoursesModel");
const { Response } = require("../../helpers/Response");

class CoursesController {
  static async get(req, res) {
    try {
      const courses = await CoursesModel.get(
        ["code", "value", "skill_code"],
        {},
        "ALL"
      );

      return res.json({
        error: 0,
        data: courses,
      });
    } catch (error) {
      return Response.handleError(res, error);
    }
  }
}

module.exports = CoursesController;
