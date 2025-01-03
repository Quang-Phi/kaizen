const { HttpStatusCode } = require("axios");
const { HttpStatus, HttpMessage, ResponseCode } = require("./Enum");

class Response {
  static validator(res, validator) {
    return res.status(HttpStatus.BAD_REQUEST).json({
      error: 1,
      message: validator.message,
      code: "VALIDATION_ERROR",
      errors: validator.errors || [],
    });
  }

  static response(res, key, data = [], metadata = {}) {
    switch (key) {
      case "Created":
        return res.status(HttpStatus.CREATED).json({
          error: 0,
          message: HttpMessage.CREATED,
          code: ResponseCode.CREATED,
          data,
          metadata,
        });

      case "Updated":
        return res.status(HttpStatus.SUCCESS).json({
          error: 0,
          message: HttpMessage.UPDATED,
          code: ResponseCode.UPDATED,
          metadata,
        });

      case "Deleted":
        return res.status(HttpStatus.SUCCESS).json({
          error: 0,
          message: HttpMessage.DELETED,
          code: ResponseCode.DELETED,
          metadata,
        });

      case "Fail":
        return res.status(HttpStatus.BAD_REQUEST).json({
          error: 1,
          message: HttpMessage.FAIL,
          code: ResponseCode.INTERNAL_ERROR,
          metadata,
        });

      case "Error":
        return res.status(HttpStatus.ERROR).json({
          error: 1,
          message: HttpMessage.ERROR,
          code: ResponseCode.INTERNAL_ERROR,
          metadata,
        });

      default:
        return res.status(HttpStatus.SUCCESS).json({
          error: 0,
          message: HttpMessage.SUCCESS,
          code: ResponseCode.SUCCESS,
          data,
          metadata,
        });
    }
  }

  static handleError(res, error, metadata = {}) {
    console.error("Error:", error);

    if (error.name === "NotFoundError" || error.message.includes("not found")) {
      return res.status(HttpStatus.NOT_FOUND).json({
        error: 1,
        message: HttpMessage.NOT_FOUND,
        code: "RESOURCE_NOT_FOUND",
        metadata,
      });
    }

    if (
      error.name === "ValidationError" ||
      error.message.includes("validation")
    ) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        error: 1,
        message: HttpMessage.VALIDATION_ERROR,
        errors: error.errors || [],
        code: "VALIDATION_ERROR",
        metadata,
      });
    }

    if (
      error.name === "UnauthorizedError" ||
      error.message.includes("unauthorized")
    ) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        error: 1,
        message: HttpMessage.UNAUTHORIZED,
        code: "UNAUTHORIZED",
        metadata,
      });
    }

    if (
      error.name === "ForbiddenError" ||
      error.message.includes("forbidden")
    ) {
      return res.status(HttpStatus.FORBIDDEN).json({
        error: 1,
        message: HttpMessage.FORBIDDEN,
        code: "FORBIDDEN",
        metadata,
      });
    }

    if (error.name === "ConflictError" || error.message.includes("conflict")) {
      return res.status(HttpStatus.CONFLICT).json({
        error: 1,
        message: HttpMessage.CONFLICT,
        code: "CONFLICT",
        metadata,
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        error: 1,
        message: HttpMessage.TOKEN_EXPIRED,
        code: "TOKEN_EXPIRED",
        metadata,
      });
    }

    return res.status(HttpStatus.INTERNAL_SERVER).json({
      error: 1,
      message: HttpMessage.SERVER_ERROR,
      code: "INTERNAL_SERVER_ERROR",
      metadata,
    });
  }

  static unauthorized(res, message = HttpMessage.UNAUTHORIZED) {
    return res.status(HttpStatus.UNAUTHORIZED).json({
      error: 1,
      message,
      code: "UNAUTHORIZED",
    });
  }

  static forbidden(res, message = HttpMessage.FORBIDDEN) {
    return res.status(HttpStatus.FORBIDDEN).json({
      error: 1,
      message,
      code: "FORBIDDEN",
    });
  }

  static tooManyRequests(res, message = HttpMessage.TOO_MANY_REQUESTS) {
    return res.status(HttpStatus.TOO_MANY_REQUESTS).json({
      error: 1,
      message,
      code: "TOO_MANY_REQUESTS",
    });
  }

  static serviceUnavailable(res, message = HttpMessage.SERVICE_UNAVAILABLE) {
    return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      error: 1,
      message,
      code: "SERVICE_UNAVAILABLE",
    });
  }
}

module.exports = { Response };
