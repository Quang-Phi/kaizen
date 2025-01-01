// controllers/Kaizen/AreaController.js
const { AreaModel } = require("../../models/Kaizen/AreaModel");
const { Response } = require("../../helpers/Response");
class AreaController {
  static async getList(req, res) {
    try {
      const area = await AreaModel.getList();
      return res.json({
        error: 0,
        data: area,
      });
    } catch (error) {
      return Response.handleError(res, error);
    }
  }
}

module.exports = AreaController;
