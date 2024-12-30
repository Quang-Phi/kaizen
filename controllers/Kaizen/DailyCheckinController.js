const { DailyCheckinService } = require("../../services/DailyCheckinService");
const {
  DailyCheckinValidator,
} = require("../../validator/Kaizen/DailyCheckinValidator");
const { Response } = require("../../helpers/Response");

class DailyCheckinController {
  static async create(req, res) {
    let validate = await DailyCheckinValidator.validateCreate(req.body);

    if (validate.code === 1) {
      return Response.validator(res, validate);
    }

    return DailyCheckinService.create(req.body)
      .then((result) => {
        return Response.response(res, "Created");
      })
      .catch((error) => {
        return Response.response(res, "Error");
      });
  }

  static async getList(req, res) {}
}

module.exports = DailyCheckinController;
