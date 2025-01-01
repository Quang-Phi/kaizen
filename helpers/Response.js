const { HttpStatus, HttpMessage } = require("./Enum");

class Response {
  static validator(res, validator) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      error: 1,
      message: validator.message,
    });
  }

  static response(res, key, data = []) {
    switch (key) {
      case "Created":
        res.status(HttpStatus.CREATED).json({
          error: 0,
          message: HttpMessage.SUCCESS,
        });
        break;
      case "Fail":
        res.status(HttpStatus.ERROR).json({
          error: 0,
          message: HttpMessage.FAIL,
        });
        break;
      case "Error":
        res.status(HttpStatus.ERROR).json({
          error: 0,
          message: HttpMessage.ERROR,
        });
        break;
      default:
        res.status(HttpStatus.SUCCESS).json({
          error: 0,
          data: data,
          message: HttpMessage.SUCCESS,
        });
        break;
    }

    return res;
  }

  static handleError(res, error) {
    if (error.name === "NotFoundError" || error.message.includes("not found")) {
      return this.response(res, "NotFound", {
        error: 1,
        message: error.message || "Resource not found",
      });
    }

    if (
      error.name === "ValidationError" ||
      error.message.includes("validation")
    ) {
      return this.response(res, "BadRequest", {
        error: 1,
        message: error.message || "Invalid input data",
      });
    }

    if (error.code && error.code.startsWith("ER_")) {
      return this.response(res, "DatabaseError", {
        error: 1,
        message: "Database operation failed",
      });
    }

    return this.response(res, "ServerError", {
      error: 1,
      message: "Internal server error",
    });
  }
}

module.exports = { Response };
