const HttpStatus = {
  ERROR: 404,
  SUCCESS: 200,
  CREATED: 201,
  UPDATED: 204,
  BAD_REQUEST: 400,
  INTERNAL_SERVER: 500,
};

const HttpMessage = {
  ERROR: "Server Internal Error",
  FAIL: "Server Fail Request",
  SUCCESS: "Server Response Success",
  CREATED: "Created successfully",
  BAD_REQUEST: "Bad request",
  NOT_FOUND: "Resource not found",
  SERVER_ERROR: "Internal server error",
};

module.exports = { HttpStatus, HttpMessage };
