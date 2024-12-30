const { DailyCheckinService } = require("../../services/DailyCheckinService");
const {
  DailyCheckinValidator,
} = require("../../validator/Kaizen/DailyCheckinValidator");
const { Response } = require("../../helpers/Response");

class DailyCheckinController {
  static async create(req, res) {
    let validate = await DailyCheckinValidator.validateCreate(req.body);

    if (validate.code == 1) {
      Response.validator(res, validate);
    }

    DailyCheckinService.create(req.body)
      .then((result) => {``
        Response.response(res, "Created");
      })
      .catch((error) => {
        Response.response(res, "Error");
      });
  }
}

module.exports = DailyCheckinController;
