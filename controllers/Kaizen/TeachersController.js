const { TeachersModel } = require("../../models/Kaizen/TeachersModel");
const { TeachersService } = require("../../services/TeachersService");
const {
  TeachersValidator,
} = require("../../validator/Kaizen/TeachersValidator");
const { Response } = require("../../helpers/Response");

class TeachersController {
  static async getList(req, res) {
    try {
      const payload = req.query;
      let validator = await TeachersValidator.getList(payload);
      if (validator.code == 1) {
        return Response.validator(res, validator);
      }
      const teachers = await TeachersService.getList(payload);

      return res.json({
        error: 0,
        data: teachers.data || [],
        total: teachers.total || 0,
        page: teachers.page,
        pageSize: teachers.pageSize,
      });
    } catch (error) {
      return Response.handleError(res, error);
    }
  }

  static async getCalendar(req, res) {
    try {
      const payload = req.query;
      let page = payload.page ?? 1;
      let pageSize = payload.pageSize ?? 20;
      let validator = await TeachersValidator.getCalendar(payload);
      if (validator.code == 1) {
        return Response.validator(res, validator);
      }
      const teacher_calendar = await TeachersModel.getCalendar(
        payload,
        page,
        pageSize
      );

      return res.json({
        error: 0,
        data: teacher_calendar.data,
        total: teacher_calendar.total,
        page: page,
        pageSize: pageSize,
      });
    } catch (error) {
      return Response.handleError(res, error);
    }
  }
}

module.exports = TeachersController;
