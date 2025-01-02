const HttpStatus = {
  SUCCESS: 200,
  CREATED: 201,
  UPDATED: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  ERROR: 404,
  INTERNAL_SERVER: 500,
  SERVICE_UNAVAILABLE: 503,
};

const HttpMessage = {
  SUCCESS: "Request successful",
  CREATED: "Resource created successfully",
  UPDATED: "Resource updated successfully",
  DELETED: "Resource deleted successfully",
  FAIL: "Request failed",
  ERROR: "An error occurred",
  BAD_REQUEST: "Invalid request",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Access forbidden",
  NOT_FOUND: "Resource not found",
  CONFLICT: "Resource conflict",
  VALIDATION_ERROR: "Validation error",
  TOKEN_EXPIRED: "Token has expired",
  TOO_MANY_REQUESTS: "Too many requests",
  SERVER_ERROR: "Internal server error",
  SERVICE_UNAVAILABLE: "Service temporarily unavailable",
};

const ResponseCode = {
  SUCCESS: "SUCCESS",
  CREATED: "CREATED",
  UPDATED: "UPDATED",
  DELETED: "DELETED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
};

module.exports = { HttpStatus, HttpMessage, ResponseCode };
