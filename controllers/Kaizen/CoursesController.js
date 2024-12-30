const { CoursesModel } = require('../../models/Kaizen/CoursesModel'); // Đảm bảo đường dẫn và cách xuất đúng

class CoursesController {
     
     static async get(req, res) {
          // Giả sử phương thức getAllConfig trả về danh sách cấu hình từ database
          // const request = req.query;
          const courses = await CoursesModel.get(['code', 'value', 'skill_code'], {}, 'ALL');

          return res.json({
               error: 0,
               data : courses
          });
     }
}

module.exports = CoursesController;
