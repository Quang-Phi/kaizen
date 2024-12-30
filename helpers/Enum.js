const HttpStatus = {
     ERROR: 404,
     SUCCESS: 200,
     CREATED: 201,
     UPDATED: 204,
     BAD_REQUEST: 400,
};
 
const HttpMessage = {
     ERROR: 'Server Internal Error',
     SUCCESS: 'Server Response Success',
};

module.exports = { HttpStatus, HttpMessage };