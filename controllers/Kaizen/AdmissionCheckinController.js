const {
  AdmissionCheckinService,
} = require("../../services/AdmissionCheckinService");
const {
  AdmissionCheckinValidator,
} = require("../../validator/Kaizen/AdmissionCheckinValidator");
const { Response } = require("../../helpers/Response");
const { StudentModel } = require("../../models/Kaizen/StudentModel");

class AdmissionCheckinController {
  static async create(req, res) {
    try {
      let payload = req.body;
      let validate = await AdmissionCheckinValidator.create(payload);

      if (validate.code === 1) {
        return Response.validator(res, validate);
      }

      await AdmissionCheckinService.create(payload);
      return Response.response(res, "Created");
    } catch (error) {
      return Response.handleError(res, error);
    }
  }

  static async update(req, res) {
    try {
      let payload = req.body;
      let validate = await AdmissionCheckinValidator.create(payload);

      if (validate.code === 1) {
        return Response.validator(res, validate);
      }

      await AdmissionCheckinService.update(payload);
      return Response.response(res, "Updated");
    } catch (error) {
      return Response.handleError(res, error);
    }
  }

  static async getListStudentAdmissionByClass(req, res) {
    try {
      let payload = req.query;
      let validate =
        await AdmissionCheckinValidator.validateGetListStudentAdmissionByClass(
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
        const checkinData = await AdmissionCheckinService.getListStudentAdmission(
          payload.class_code,
          studentCodes,
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
}

module.exports = AdmissionCheckinController;
