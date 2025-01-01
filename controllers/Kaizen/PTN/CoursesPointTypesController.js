// controllers/Kaizen/PTN/CoursesPointTypesController.js
const {
  CoursesPointTypesServices,
} = require("../../../services/PTN/CoursesPointTypesServices");
const { Response } = require("../../../helpers/Response");

class CoursesPointTypesController {
  static async getList(req, res) {
    try {
      const payload = req.query;
      const rs = await CoursesPointTypesServices.getList(payload);

      return Response.response(res, "", rs);
    } catch (error) {
      return Response.handleError(res, error);
    }
  }
}

module.exports = CoursesPointTypesController;
