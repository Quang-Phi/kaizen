const { HttpStatus, HttpMessage } = require('./Enum');

class Response {

     static validator(res, validator)
     {
          return res.status(HttpStatus.BAD_REQUEST).json({
               error: 1,
               message: validator.message
          });
     }

     static response(res, key, data = []) 
     {

          switch (key) {
               case 'Created':
                    res.status(HttpStatus.CREATED).json({
                         error: 0,
                         message: HttpMessage.SUCCESS
                    });
                    break;
               case 'Error':
                    res.status(HttpStatus.ERROR).json({
                         error: 0,
                         message: HttpMessage.ERROR
                    });
                    break;
               default:
                    res.status(HttpStatus.SUCCESS).json({
                         error: 0,
                         data: data,
                         message: HttpMessage.SUCCESS
                    });
                    break;
          }

          return res;
     }
}

module.exports = { Response };