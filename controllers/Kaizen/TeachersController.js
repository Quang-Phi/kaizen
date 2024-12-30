const { TeachersModel } = require('../../models/Kaizen/TeachersModel');
const { TeachersService } = require('../../services/TeachersService');
const { TeachersValidator } = require('../../validator/Kaizen/TeachersValidator');
class TeachersController {
    static async getList(req, res) {
        
        const payload = req.query;
        let validator = await TeachersValidator.getList(payload);
        if (validator.code == 1) {
            return res.status(400).json({
                error: 1,
                message: validator.message
            });
        }
        // const full_name = payload.full_name;

        // if (full_name) {
        //     // Sử dụng regex để lấy từ cuối cùng (last_name)
        //     const match = full_name.match(/\S+(?=\s*$)/);

        //     if (match) {
        //         payload.last_name = match[0]; // Lấy từ cuối cùng làm last_name
        //         payload.first_name = full_name.replace(/\s*\S+\s*$/, '').trim(); // Phần còn lại làm first_name

        //         console.log("First Name:", payload.first_name);
        //         console.log("Last Name:", payload.last_name);
        //     } else {
        //         return res.status(400).json({error:0, message: 'Full Name not match'});
        //     }
        // }

        try {
            const teachers = await TeachersService.getList(payload);

            res.json({
                error: 0,
                data: teachers.data || [],
                total: teachers.total || 0,
                page: teachers.page,
                pageSize: teachers.pageSize
            });
        } catch (error) {
            res.status(500).json({
                error: 1,
                message: "Server internal error!",
                data: [],
                total: 0,
            });
        }
    }

    static async getCalendar(req, res) {
        
        const payload = req.query;
        let page = payload.page ?? 1;
        let pageSize = payload.pageSize ?? 20;
        let validator = await TeachersValidator.getCalendar(payload);
        if (validator.code == 1) {
            return res.status(400).json({
                error: 1,
                message: validator.message
            });
        }

        try {
            const teacher_calendar = await TeachersModel.getCalendar(payload, page, pageSize);

            res.json({
                error: 0,
                data: teacher_calendar.data,
                total: teacher_calendar.total,
                page: page,
                pageSize: pageSize
            });
        } catch (error) {
            res.status(500).json({
                error: 1,
                message: "Server internal error!",
                data: [],
                total: 0,
                page: page,
                pageSize: pageSize
            });
        }
        
    }
}

module.exports = TeachersController;