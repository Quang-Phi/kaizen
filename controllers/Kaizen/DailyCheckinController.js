const { DailyCheckinService } = require("../../services/DailyCheckinService");
const {
  DailyCheckinValidator,
} = require("../../validator/Kaizen/DailyCheckinValidator");
const { Response } = require("../../helpers/Response");
const { StudentModel } = require("../../models/Kaizen/StudentModel");

class DailyCheckinController {
  static async create(req, res) {
    try {
      let payload = req.body;
      let validate = await DailyCheckinValidator.create(payload);

      if (validate.code === 1) {
        return Response.validator(res, validate);
      }

      await DailyCheckinService.create(payload);
      return Response.response(res, "Created");
    } catch (error) {
      return Response.handleError(res, error);
    }
  }

  static async getListStudentCheckinByClass(req, res) {
    try {
      let payload = req.query;
      let validate =
        await DailyCheckinValidator.validateGetListStudentCheckinByClass(
          payload
        );

      if (validate.code === 1) {
        return Response.validator(res, validate);
      }

      let page = payload.page ?? 1;
      let pageSize = payload.pageSize ?? 20;

      const classes = await StudentModel.getStudentByClass(
        payload,
        page,
        pageSize
      );
      let students = classes?.data || [];

      if (students.length > 0) {
        const studentCodes = students.map((student) => student.student_code);
        const checkinData = await DailyCheckinService.getListStudentCheckin(
          payload.class_code,
          payload.day,
          studentCodes,
          payload.class_session
        );

        students = students.map((student) => ({
          ...student,
          checkin: checkinData[student.student_code] || {},
        }));
      }

      return res.json({
        error: 0,
        data: students,
        total: classes?.total || 0,
        page: page,
        pageSize: pageSize,
      });
    } catch (error) {
      return Response.handleError(res, error);
    }
  }

  static async evaluation(req, res) {
    try {
      let payload = req.body;
      let validate = await DailyCheckinValidator.evaluation(payload);

      if (validate.code === 1) {
        return Response.validator(res, validate);
      }
      await DailyCheckinService.evaluation(payload);
      return Response.response(res, "Created");
    } catch (error) {
      return Response.handleError(res, error);
    }
  }

  static async getStudentEvaluation(req, res) {
    try {
      let payload = req.query;
      payload.student_code = req.params.code;
      const validate = await DailyCheckinValidator.getStudentEvaluation(
        payload
      );

      if (validate.code === 1) {
        return Response.validator(res, validate);
      }

      const response = await DailyCheckinService.getStudentEvaluation(payload);
      return res.json({
        error: 0,
        data: response || [],
      });
    } catch (error) {
      return Response.handleError(res, error);
    }
  }
}

module.exports = DailyCheckinController;
