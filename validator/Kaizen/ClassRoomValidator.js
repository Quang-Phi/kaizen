const moment = require('moment');

class ClassRoomValidator {

     static async getCalendar(req)
     {
          let code = 0;

          const date = req.date;
          if (
               date &&
               !Array.isArray(date) &&
               !moment(date[0], "YYYY-MM-DD").isValid() &&
               !moment(date[1], "YYYY-MM-DD").isValid()
          ) {
               code = 1;
               return {code: code, message: 'Date not valid!'};
          }

          return {code: code};
     }

     static async postCalendar(req)
     {
          let code = 0;
          const dates = req.dates;
          const class_session = req.class_session;
          if (
               !dates &&
               !class_session
          ) {
               code = 1;
               return {code: code, message: 'Not enough parameters'};
          }

          if (
               !Array.isArray(dates)
          ) {
               code = 1;
               return {code: code, message: 'Dates not valid'};
          }

          if (
               dates.length == 0
          ) {
               code = 1;
               return {code: code, message: 'Dates not valid'};
          }

          if (
               !Array.isArray(class_session)
          ) {
               code = 1;
               return {code: code, message: 'Class Session not valid'};
          }

          if (
               dates.length != class_session.length
          ) {
               code = 1;
               return {code: code, message: 'Dates and Class Session not valid'};
          }

          // Lấy ra các giá trị không hợp lệ
          const invalidDates = dates.filter(value => {
               const isValid = moment(value, "YYYY-MM-DD", true).isValid();
               return !isValid; // Chỉ giữ giá trị không hợp lệ
          });
          
          if (
               invalidDates.length > 0
          ) {
               code = 1;
               return {code: code, message: `Date ${invalidDates.join(',')} not valid!`};
          }

          // Lấy ra các item không hợp lệ
          const invalid_class_session = class_session.filter(item => {

               if (
                    !item.class_room_code
               ) {
                    return false;
               }

               if (
                    !item.class_code
               ) {
                    return false;
               }
               
               if (
                    item.teacher_code === ""
               ) {
                    return true;
               }

               const isValid = item.class_session.every(
                    (value) => value < 0 || value > 12
               );
            
               if (!isValid) {
                    return false;
               }

               return true;
          });

          if (
               invalid_class_session.length > 0
          ) {
               code = 1;
               return {code: code, message: 'Class Session not match!'};
          }


          return {code: code};
     }
}

module.exports = { ClassRoomValidator }