const { ProgramModel } = require("../../models/Kaizen/ProgramModel");
const { Response } = require("../../helpers/Response");

class ProgramController {
  static async getList(req, res) {
    try {
      const program = await ProgramModel.get(
        ["code", "bitrix_id", "name", "type", "program_code"],
        {}
      );

      return res.json({
        error: 0,
        data: program,
      });
    } catch (error) {
      return Response.handleError(res, error);
    }
  }
}

module.exports = ProgramController;
