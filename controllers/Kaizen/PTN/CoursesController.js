// controllers/Kaizen/AreaController.js
const { RawQueryModel } = require('../../../models/Kaizen/RawQueryModel');

class CoursesController {

    static async getList(req, res) {
        
        const rs = await RawQueryModel.getRaw(
            `SELECT code, course_name FROM ptn_courses`
        );

        res.json({
            error: 0,
            data : rs
        });
    }
}

module.exports = CoursesController;
