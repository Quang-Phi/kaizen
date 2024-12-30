const moment = require('moment');
const { ClassesRoomModel }  = require('../../models/Kaizen/ClassesRoomModel');
const { RegisterClassModel } = require('../../models/Kaizen/RegisterClassModel');
const { CoursesModel } = require('../../models/Kaizen/CoursesModel');
const { TeachersModel } = require('../../models/Kaizen/TeachersModel');
const { ClassTypesModel } = require('../../models/Kaizen/ClassTypesModel');
const { Utilities } = require('../../helpers/Utilities');
const { ClassesModel } = require('../../models/Kaizen/ClassesModel');
const { SkillsModel } = require('../../models/Kaizen/SkillsModel');
class ClassValidator {
    static async create(req) {
        let code = 0;

        const name = req.name;
        const class_room_code = req.class_room_code;
        const teacher_code = req.teacher_code;
        const opening_date = req.opening_date;
        const start_date = req.start_date;
        const form_of_study = req.form_of_study;
        const end_date = req.end_date;
        const quantity = req.quantity;
        const lesson = req.lesson;
        const class_types_id = req.class_types_id;
        const subject_teacher = req.subject_teacher;
        const class_session = req.class_session;
        const created_by = req.created_by;

        if (
            !name ||
            // !class_room_code || 
            !teacher_code ||
            !opening_date || 
            !start_date ||
            !end_date || 
            !form_of_study ||
            !quantity || 
            !lesson ||
            !class_types_id ||
            !subject_teacher ||
            !class_session ||
            !created_by
        ) {
            code = 1;
            return {code: code, message: 'Not enough parameters'};
        }

        // if (!["PY", "PTN"].includes(type)) {
        //     code = 1;
        //     return {code: code, message: 'Type không chính xác'};
        // }

        if (!moment(opening_date, "YYYY-MM-DD").isValid()) {
            code = 1;
            return {code: code, message: 'Opening Date not valid!'};
        }

        if (!moment(start_date, "YYYY-MM-DD").isValid()) {
            code = 1;
            return {code: code, message: 'Start Date not valid!'};
        }

        if (!moment(end_date, "YYYY-MM-DD").isValid()) {
            code = 1;
            return {code: code, message: 'End Date not valid!'};
        }

        if (!Number.isSafeInteger(quantity)) {
            code = 1;
            return {code: code, message: 'Quantity not integer!'};
        }

        if (!Number.isSafeInteger(lesson)) {
            code = 1;
            return {code: code, message: 'Lesson not integer!'};
        }

        if (!Number.isSafeInteger(class_types_id)) {
            code = 1;
            return {code: code, message: 'Class Types not integer!'};
        }

        if (
            !Array.isArray(class_session)
        ) {
            code = 1;
            return {code: code, message: 'Class Session not match!'};
        }

        if (
            typeof subject_teacher != 'object'
        ) {
            code = 1;
            return {code: code, message: 'Subject Teacher not array!'};
        }
        const key_subject_teacher = Object.keys(subject_teacher);
        const skill = await SkillsModel.get(
            ['*'],
            {
                whereIn: {
                    code: key_subject_teacher
                }
            },
            'ALL'
        );

        if (skill.length <= 0) {
            code = 1;
            return {code: code, message: 'Subject Teacher is valid!'};
        }

        const skills_valid = key_subject_teacher.filter((value) => {
            const skill_code = value;
            if (skill.find(item => item.code == skill_code)) {
                return false;
            }

            return true;
        });

        if (skills_valid.length > 0) {
            code = 1;
            return {code: code, message: `Subject Teacher ${skills_valid.join(',')} not valid!`};
        }

        const class_session_valid = class_session.filter((item) => {
            if (
                !Number.isSafeInteger(item.weekdays) ||
                ![1,2,3,4,5,6,7].includes(item.weekdays) ||
                !Array.isArray(item.class_session)
            ) {
                return false;
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
            class_session_valid.length > 0
        ) {
            code = 1;
            return {code: code, message: 'Class Session not match!'};
        }

        const teacher = await TeachersModel.find(['id'], {code:teacher_code});
        if (!teacher.id) {
            code = 1;
            return {code: code, message: 'Teacher does not exist!'};
        }

        const class_types = await ClassTypesModel.find(['id'], {id: class_types_id});
        if (!class_types.id) {
            code = 1;
            return {code: code, message: 'Class Types does not exist!'};
        }

        if (class_room_code) {
            const [ClassRoom, RegisterClass] = await Promise.all([
                ClassesRoomModel.find(["code", "IF(capacity IS NULL OR capacity = 0, 0, capacity) AS capacity"], { code: class_room_code }),
                RegisterClassModel.find(["count(*) as total"], { class_room_code: class_room_code }),
            ]);

            if (!ClassRoom.code) {
                code = 1;
                return {code: code, message: 'Class room does not exist!'};
            }
    
            if (ClassRoom.capacity <= RegisterClass.total) {
                code = 1;
                return {code:code, message: "Class room is full!"};
            }
        }

        // const [teacher_manager] = await Promise.all([
        //     RegisterClassModel.find(["count(*) as total"], { teacher_code: teacher_code })
        // ]);
        // if (teacher_manager.total >= 1) {
        //     code = 1;
        //     return {code:code, message: "Teacher is full workfload!"};
        // }

        if (!["Online", "Offline"].includes(form_of_study)) {
            code = 1;
            return {code: code, message: 'Form Of Study does not exist'};
        }

        return {code: code};
    }

    static async update(req) {

        let code = 0;

        const class_code = req.class_code;
        const lesson = req.lesson;
        if (
            !class_code
        ) {
            code = 1;
            return {code: code, message: 'Not enough parameters'};
        }

        if (
            lesson &&
            !Number.isSafeInteger(lesson)
        ) {
            code = 1;
            return {code: code, message: 'Lession is integer'};
        }

        const classes = await RegisterClassModel.find(
            ['id'], 
            {
                class_code: class_code
            }
        );
        if (
            !classes?.id
        ) {
            code = 1;
            return {code: code, message: 'Classes not exist'};
        }

        return {code: code};
    }

    static async calendar(req) {
        let code = 0;

        const class_code = req.class_code;
        // const teacher_code = req.teacher_code;
        // const date = req.date;
        const class_session = req.class_session;
        const created_by = req.created_by;
        if (
            !class_code ||
            // !teacher_code || 
            !class_session ||
            !created_by
        ) {
            code = 1;
            return {code: code, message: 'Not enough parameters'};
        }

        // if (!["PY", "PTN"].includes(type)) {
        //     code = 1;
        //     return {code: code, message: 'Type không chính xác'};
        // }

        // if (!moment(form_date, "YYYY-MM-DD").isValid()) {
        //     code = 1;
        //     return {code: code, message: 'Start date not valid!'};
        // }

        // if (!moment(to_date, "YYYY-MM-DD").isValid()) {
        //     code = 1;
        //     return {code: code, message: 'End date not valid!'};
        // }

        // if (to_date < form_date) {
        //     code = 1;
        //     return {code: code, message: 'Start date, End date not valid!'};
        // }

        if (
            !Array.isArray(class_session)
        ) {
            code = 1;
            return {code: code, message: 'Class Session not match!'};
        }

        if (
            class_session.length > 7
        ) {
            code = 1;
            return {code: code, message: 'API support max 7 days'};
        }
        
        let courses = [];
        const class_room_code = [...new Set(class_session.map(item => item.courses_code))];
        if (class_room_code.length) {
            courses = await CoursesModel.get(['code'], {
                whereIn: { 
                    code: class_room_code,
                }
            }, 'ALL');
            courses = [...new Set(courses.map(course => course.code))]; 
        }

        // Filter không thỏa điều kiện
        const class_session_valid = class_session.filter((item) => {
            const { date, status, courses_code, teacher_code, class_room_code, class_session } = item;

            // Kiểm tra ngày
            if (!date || !moment(date, "YYYY-MM-DD").isValid()) {
                return true;
            }

            if (!["Actived", "Locked"].includes(status)) {
                return true;
            }

            // Kiểm tra mã khóa học
            if (courses_code && !courses.includes(courses_code)) {
                return true;
            }

            // Kiểm tra giáo viên và phòng học
            if (!courses_code && (!teacher_code || !class_room_code)) {
                return true;
            }

            // Kiểm tra các giá trị trong class_session nằm ngoài khoảng 0-12
            return class_session.some(value => value < 0 || value > 12);
        });

        if (
            class_session_valid.length > 0
        ) {
            code = 1;
            return {code: code, message: `Class Session ${JSON.stringify(class_session_valid)}  not match!`};
        }

        const classes = await ClassesModel.find(['id'], {code: class_code});
        if (!classes.id) {
            code = 1;
            return {code: code, message: 'Class not exist!'};
        }

        // const [ClassRoom, RegisterClass, teacher_manager] = await Promise.all([
        //     ClassesRoomModel.find(["code", "IF(capacity IS NULL OR capacity = 0, 0, capacity) AS capacity"], { code: class_room_code }),
        //     RegisterClassModel.find(["count(*) as total"], { class_room_code: class_room_code }),
        //     RegisterClassModel.find(["count(*) as total"], { teacher_code: teacher_code })
        // ]);
        // if (!ClassRoom.code) {
        //     code = 1;
        //     return {code: code, message: 'Class room does not exist!'};
        // }

        // if (ClassRoom.capacity <= RegisterClass.total) {
        //     code = 1;
        //     return {code:code, message: "Class room is full!"};
        // }

        // !form_date || 
        // !to_date ||
        // const dateInteger = await Utilities.datediff(form_date, to_date);
        // for (let i = 0; i <= dateInteger; i++) {
        //     const date = moment(form_date).add(i, "days").format("YYYY-MM-DD");
        //     const [teacher_calendar] = await Promise.all([
        //         RegisterClassCalendarModel.find(["class_session"], { teacher_code: teacher_code, date: date })
        //     ]);

        //     if (!teacher_calendar.class_session) {
        //         continue;
        //     }
        //     console.log(teacher_calendar)
        //     const class_session = JSON.parse(teacher_calendar.class_session);
        //     console.log(class_session)
        //     class_session.map
        //     // if (teacher_calendar >= 1) {
        //     //     code = 1;
        //     //     return {code:code, message: "Teacher is full workfload!"};
        //     // }
        // }
        // class_session.map(async (item)=> {
        //     const date = item.date;
        //     const teacher_code = item.teacher_code;
        //     const payload_class_session = item.class_session;
            
        //     const teacher_calendar = await RegisterClassCalendarModel.find(["class_session"], { teacher_code: teacher_code, date: date });
        //     if (!teacher_calendar.class_session) {
        //         return false;
        //     }
        //     console.log(teacher_calendar)
        //     const class_session = JSON.parse(teacher_calendar.class_session);
        //     const isValid = payload_class_session.filter((value) => {
        //         return class_session.includes(value)
        //     });
        //     console.log(isValid)
        // });

        return {code: code};
    }

    static async getCalendar(req)
    {
        let code = 0;

        const date = req.date;
        console.log(date)
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

    static async deleteCalendar(id, req)
    {
        let code = 0;
        const class_session = req.class_session;
        console.log(id)
        if (
            !id ||
            !class_session
        ) {
            code = 1;
            return {code: code, message: 'Not enough parameters'};
        }

        if (
            !Array.isArray(class_session)
        ) {
            code = 1;
            return {code: code, message: 'Class Session not array'};
        }

        if (
            class_session.length == 0
        ) {
            code = 1;
            return {code: code, message: 'Class Session not empty'};
        }

        const class_session_valid = class_session.filter((value) => {
            return (value < 0 || value > 12);
        });
    
        if (
            class_session_valid.length > 0
        ) {
            code = 1;
            return {code: code, message: `Class Session ${JSON.stringify(class_session_valid)}  not match!`};
        }

        return {code:code};
    }

    static async updateCalendar(req)
    {
        let code = 0;
        const class_session_old = req.class_session_old;
        const class_session_new = req.class_session_new;
        if (
            !class_session_old ||
            !class_session_new
        ) {
            code = 1;
            return {code: code, message: 'Not enough parameters'};
        }

        if (
            !Array.isArray(class_session_old)
        ) {
            code = 1;
            return {code: code, message: 'Class Session Old not array'};
        }

        if (
            !Array.isArray(class_session_new)
        ) {
            code = 1;
            return {code: code, message: 'Class Session New not array'};
        }

        if (
            class_session_old.length == 0
        ) {
            code = 1;
            return {code: code, message: 'Class Session Empty not array'};
        }

        if (
            class_session_new.length == 0
        ) {
            code = 1;
            return {code: code, message: 'Class Session New not array'};
        }

        if (
            class_session_old.length != class_session_new.length
        ) {
            code = 1;
            return {code: code, message: 'Class Session Old and Class Session New not match'};
        }

        const class_session_old_valid = class_session_old.filter((item) => {
            const { calendar_id, class_session } = item;
            if (
                !class_session ||
                !calendar_id
            ) {
                return true;
            }

            return class_session.some(value => value < 1 || value > 12);
        });
    
        if (
            class_session_old_valid.length > 0
        ) {
            code = 1;
            return {code: code, message: `Class Session Old ${JSON.stringify(class_session_old_valid)}  not match!`};
        }

        const class_session_new_valid = class_session_new.filter((item) => {
            const { class_code, class_session } = item;

            if (
                !class_code
            ) {
                return true;
            }

            const class_session_valid = class_session.filter((item) => {
                const { date, status, note, courses_code, class_session } = item;

                if (
                    !moment(date, "YYYY-MM-DD").isValid()
                ) {
                    return true;
                }

                if (
                    !['Actived','Locked'].includes(status)
                ) {
                    return true;
                }

                if (
                    !note
                ) {
                    return true;
                }

                return class_session.some(value => value < 0 || value > 12);
            });

            if (class_session_valid.length > 0) {
                return true;
            }

            return false;
        });

        if (
            class_session_new_valid.length > 0
        ) {
            code = 1;
            return {code: code, message: `Class Session New ${JSON.stringify(class_session_new_valid)}  not match!`};
        }

        return {code:code};
    }
}

module.exports = { ClassValidator }