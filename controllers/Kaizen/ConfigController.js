const { ConfigModel } = require("../../models/Kaizen/ConfigModel");
const { Response } = require("../../helpers/Response");

class ConfigController {
  static async getAllConfig(req, res) {
    try {
      const request = req.query;
      const configs = await ConfigModel.getAllConfig({
        type: request.type ?? null,
      });

      return res.json({
        error: 0,
        data: configs,
      });
    } catch (error) {
      return Response.handleError(res, error);
    }
  }
}

module.exports = ConfigController;
