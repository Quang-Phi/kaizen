const moment = require("moment");

class TeachersValidator {
  static async getList(req) {
    let code = 0;

    const total_class_sessions = req.total_class_sessions;
    if (
      total_class_sessions &&
      !Array.isArray(total_class_sessions) &&
      !moment(total_class_sessions[0], "YYYY-MM-DD").isValid() &&
      !moment(total_class_sessions[1], "YYYY-MM-DD").isValid()
    ) {
      code = 1;
      return { code: code, message: "Date Total Class Sessions not valid!" };
    }

    return { code: code };
  }

  static async getCalendar(req) {
    let code = 0;

    const date = req.date;
    if (!date) {
      code = 1;
      return { code: code, message: "Not enough parameters" };
    }

    if (!Array.isArray(date)) {
      code = 1;
      return { code: code, message: "Date is array" };
    }

    if (
      !moment(date[0], "YYYY-MM-DD").isValid() &&
      !moment(date[date.length - 1], "YYYY-MM-DD").isValid()
    ) {
      code = 1;
      return { code: code, message: "Date not valid" };
    }

    return { code: code };
  }
}

module.exports = { TeachersValidator };
