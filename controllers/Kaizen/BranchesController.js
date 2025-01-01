const { BranchesModel } = require("../../models/Kaizen/BranchesModel");
const { Response } = require("../../helpers/Response");

class BranchesController {
  static async getList(req, res) {
    try {
      const payload = req.query;
      const area = await BranchesModel.getList(payload);

      res.json({
        error: 0,
        data: area,
      });
    } catch (error) {
      return Response.handleError(res, error);
    }
  }
}

module.exports = BranchesController;
