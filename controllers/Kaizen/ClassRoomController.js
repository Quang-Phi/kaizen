const { ClassesRoomModel } = require('../../models/Kaizen/ClassesRoomModel');
const { ClassroomBlockCalendar } = require('../../models/Kaizen/ClassroomBlockCalendar');
const { ClassroomSessionsBlock } = require('../../models/Kaizen/ClassroomSessionsBlock');
const { ClassRoomValidator } = require('../../validator/Kaizen/ClassRoomValidator');
const { Response } = require('../../helpers/Response');
const { RegisterClassModel } = require('../../models/Kaizen/RegisterClassModel');
const { RegisterClassCalendarModel } = require('../../models/Kaizen/RegisterClassCalendarModel');
const { ClassSessionsModel } = require('../../models/Kaizen/ClassSessionsModel');

class ClassRoomController {
    
    static async get(req, res) {
        // Giả sử phương thức getAllConfig trả về danh sách cấu hình từ database
        let payload = req.query;
        let page = payload.page ?? 1;
        let pageSize = payload.pageSize ?? 20;

        const [classesRoom, total] = await Promise.all([
            ClassesRoomModel.getList(payload, page, pageSize), 
            ClassesRoomModel.getListCount(payload)
        ]);

        res.json({
            error: 0,
            data: classesRoom,
            total: total,
            page: page,
            pageSize: pageSize
        });
    }

    static async getCalendar(req, res) {
        
        const payload = req.query;
        let page = payload.page ?? 1;
        let pageSize = payload.pageSize ?? 20;
        let validator = await ClassRoomValidator.getCalendar(payload);
        if (validator.code == 1) {
            return res.status(400).json({
                error: 1,
                message: validator.message
            });
        }

        try {
            const classroom_calendar = await ClassesRoomModel.getCalendar(payload, page, pageSize);

            res.json({
                error: 0,
                data: classroom_calendar.data,
                total: classroom_calendar.total,
                page: page,
                pageSize: pageSize
            });
        } catch (error) {
            res.json({
                error: 1,
                message: "Server internal error!",
                data: [],
                total: 0,
                page: page,
                pageSize: pageSize
            });
        }
    }

    static async postCalendar(req, res) {

        const payload = req.body;
        let validator = await ClassRoomValidator.postCalendar(payload);
        if (validator.code == 1) {
            return Response.validator(res, validator);
        }

        const dates = payload.dates;
        const class_session = payload.class_session;

        dates.forEach(async (date, index) => {
            const class_session_item = class_session[index];
            const teacher_code = class_session_item.teacher_code;
            const class_room_code = class_session_item.class_room_code;
            const class_code = class_session_item.class_code;
            const note = class_session_item.note;
            const class_session_item_item = class_session_item.class_session;
            
            const register_class = await RegisterClassModel.find(
                ['code'],
                {
                    class_code: class_code
                }
            );
            if (register_class?.code) {
                const calendar = await RegisterClassCalendarModel.find(
                    ['id'],
                    {
                        register_class_code: register_class.code,
                        date: date
                    }
                );

                if (calendar?.id) {
                    await ClassSessionsModel.createOnUpdate();
                }
            }
            console.log(class_session_item)
        });
        // ClassroomBlockCalendar.
        // ClassroomSessionsBlock
    }
}

module.exports = ClassRoomController;