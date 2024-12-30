const { ClassValidator } = require('../../validator/Kaizen/ClassValidator');
const { ClassesModel } = require('../../models/Kaizen/ClassesModel');
const { RegisterClassModel } = require('../../models/Kaizen/RegisterClassModel');
const { RegisterClassCalendarModel } = require('../../models/Kaizen/RegisterClassCalendarModel');
const { Logs } = require('../../helpers/Logs');
const { ClassSessionsModel } = require('../../models/Kaizen/ClassSessionsModel');
const { Response } = require('../../helpers/Response');

class ClassController {
    static async getAllClass(req, res) {
        // Giả sử phương thức getAllConfig trả về danh sách cấu hình từ database
        let payload = req.query;
        let page = payload.page ?? 1;
        let pageSize = payload.pageSize ?? 100;

        const classes = await ClassesModel.getList(payload, page, pageSize);

        res.json({
            error: 0,
            data: classes?.data || [],
            total: classes?.total || 0,
            page: page,
            pageSize: pageSize
        });
    }

    static async getDetail(req, res, next)
    {
        const id = parseInt(req.params.id, 10); // Parse ID as an integer

        if (isNaN(id)) { 
            return res.status(400).json({
                error: 1,
                message: 'ID not integer!'
            });
        }
        
        const classes_detail = await ClassesModel.getDetail(id, {});
        
        return res.json({
            error: 0,
            data: classes_detail,
        });
    }

    static async create(req, res) {
        const payload = req.body;

        Logs.logText('class-create', JSON.stringify(payload));

        let validator = await ClassValidator.create(payload);
        if (validator.code == 1) {
            return Response.validator(res, validator);
        }

        try {
            let created_by = payload.created_by;
            let updated_by = payload.updated_by ? payload.updated_by : payload.created_by;

            const classes = await ClassesModel.create({
                name: payload.name,
                status: 1,
                created_by: created_by,
                updated_by: updated_by,
            });

            const register_data = {
                class_code: classes.code,
                class_room_code: payload.class_room_code,
                teacher_code: payload.teacher_code,
                opening_date: payload.opening_date,
                start_date: payload.start_date,
                end_date: payload.end_date,
                form_of_study: payload.form_of_study,
                quantity: payload.quantity,
                class_types_id: payload.class_types_id,
                subject_teacher: JSON.stringify(payload.subject_teacher),
                created_by: created_by,
                updated_by: updated_by,
                lesson: payload.lesson,
                class_session: JSON.stringify(payload.class_session)
            };
            await RegisterClassModel.createOnUpdate(register_data, {
                class_code: classes.code
            });

            return res.status(201).json({
                error: 0, 
                message: 'Thành công!',
                data: {
                    classes: {
                        "code": classes.code,
                    }
                },
            });
        } catch (error) {
            Logs.logError('class-create', error);
            return res.status(500).json({
                error:1, 
                message: 'Máy chủ bận!'
            });
        }
        
    }

    static async update(req, res) {
        
        const payload = req.body;

        let validator = await ClassValidator.update(payload);
        if (validator.code == 1) {
            return res.status(400).json({
                error: 1,
                message: validator.message
            });
        }

        const class_code = payload.class_code;
        const lesson = payload.lesson;

        try {

            await RegisterClassModel.update(
                {
                    lesson: lesson
                },
                {
                    class_code: class_code
                }
            );

            Response.response(res, 'Created');
        } catch (error) {
            Response.response(res, 'Error');
        }
        
    }

    static async calendar(req, res)
    {
        const payload = req.body;

        Logs.logText('class-calendar', JSON.stringify(payload));

        let validator = await ClassValidator.calendar(payload);
        if (validator.code == 1) {
            return res.status(400).json({
                error: 1,
                message: validator.message
            });
        }

        const class_code = payload.class_code;
        const class_session = payload.class_session;
        const created_by = payload.created_by;
        const updated_by = payload.updated_by ? payload.updated_by : payload.created_by;

        const register_class = await RegisterClassModel.find(['code', 'class_code'], {class_code: class_code});
        if (!register_class?.code) {
            return res.status(500).json({
                error: 1, 
                message: 'Class not register!'
            });
        }

        const class_room_code = [...new Set(class_session.map(item => item.class_room_code))];
        if (class_room_code.length) {
            const uniqueDates = [...new Set(class_session.map(item => item.date))];
            // lấy lịch dạy của ngày hôm đó
            const isExistsRegisterClassCalendar = await RegisterClassCalendarModel.get(
                ['id', "register_class_code", "DATE_FORMAT(date, '%Y-%m-%d') as date"], 
                {
                    whereNot: {
                        register_class_code: register_class.code,
                    },
                    whereIn: {
                        date: uniqueDates,
                    }
                },
                "ALL"
            );

            // lịch theo ngày
            if (isExistsRegisterClassCalendar.length)
            {
                const listCalendar = [...new Set(isExistsRegisterClassCalendar.map(item => item.id))];
                // const listRoom = [...new Set(class_session.map(item => item.class_room_code))];
                // kiểm tra danh sách phòng
                let isExistsClassSessions = await ClassSessionsModel.get(
                    ['*'],
                    {
                        whereIn: {
                            // class_room_code: listRoom,
                            status: ['Actived', 'Locked'],
                            register_class_calendar_id: listCalendar
                        }
                    },
                    "ALL"
                );

                const registerClassCalendarMap = new Map(
                    isExistsRegisterClassCalendar.map(item => [item.id, item.date])
                );

                isExistsClassSessions = await Promise.all(isExistsClassSessions.map((item) => {
                    // item.date = isExistsRegisterClassCalendar.find(item1 => item1.id == item.register_class_calendar_id)?.date;
                    item.date = registerClassCalendarMap.get(item.register_class_calendar_id) || null;
                    return item
                }));

                // kiểm tra ngay đó có trùng phòng hoặc lớp chưa
                let errorClassSession = {};
                Logs.logText("class-calendar", "class_session " + JSON.stringify(class_session));
                class_session.map((item) => {
                    const date = item.date;
                    const teacher_code = item.teacher_code;
                    const class_room_code = item.class_room_code;
                    const item_class_session = item.class_session;
                    
                    // const itemIsExistsClassSessions = isExistsClassSessions.find(item => {
                    //     console.log('isExistsClassSessions item', item);
                        
                    //     return (item.class_room_code == class_room_code || item.teacher_code == teacher_code) && 
                    //     item.date == date && 
                    //     item_class_session.includes(item.class_session)
                    // });
                    isExistsClassSessions.forEach(item => {    
                        if (
                            (item.class_room_code == class_room_code || item.teacher_code == teacher_code) && 
                            item.date == date && 
                            item_class_session.includes(item.class_session)
                        ) {
                            if (errorClassSession[`${item.date}_${item.class_session}`]) {
                                errorClassSession[`${item.date}_${item.class_session}`] += `\nNgày ${item.date} tiết ${item.class_session}: Giáo viên hoặc phòng đã được xếp!`;
                            } else {
                                errorClassSession[`${item.date}_${item.class_session}`] = `Ngày ${item.date} tiết ${item.class_session}: Giáo viên hoặc phòng đã được xếp!`;
                            }
                        }

                        if (
                            (item.status == 'Locked') &&
                            item.date == date && 
                            item_class_session.includes(item.class_session)
                        ) {

                            if (errorClassSession[`${item.date}_${item.class_session}`]) {
                                errorClassSession[`${item.date}_${item.class_session}`] += `\nNgày ${item.date} tiết ${item.class_session}: Đã được khóa!`;
                            } else {
                                errorClassSession[`${item.date}_${item.class_session}`] = `Ngày ${item.date} tiết ${item.class_session}: Đã được khóa!`;
                            }
                        }
                    });
                });
                // Logs.logText("class-calendar", "isExistsClassSessions " + JSON.stringify(isExistsClassSessions));
                Logs.logText("class-calendar", "errorClassSession " + JSON.stringify(errorClassSession));
                if (Object.keys(errorClassSession).length > 0)
                {
                    const errorMessage = [];
                    Object.entries(errorClassSession).forEach(([key, value]) => {
                        errorMessage.push(value)
                    });
                    return res.status(400).json({
                        error: 1,
                        // message: `${errorClassSession.map(item => `Date ${item.date} section ${item.class_session} teacher or room is full`).join("\n")}`
                        message: errorMessage.join("\n")
                    });
                }
            }
        }

        for (const item of class_session) {
            // giá trị undefined sẽ bị lọc bỏ vì courses_code tồn tại sẽ không cần có teacher_code,class_room_code
            const date = item.date;
            const teacher_code = item.teacher_code;
            const class_room_code = item.class_room_code;
            const courses_code = item.courses_code;
            const note = item.note;
            const status = item.status;
            const register_class_code = register_class.code;

            const registerClassCalendar = await RegisterClassCalendarModel.createOnUpdate(
                {
                    register_class_code: register_class_code,
                    date: date,
                    // class_session: JSON.stringify(class_session),
                    created_by: created_by,
                    updated_by: updated_by,
                },
                { register_class_code: register_class_code, date: date }
            );

            const item_class_session = item.class_session;
            const calendar_id = registerClassCalendar.id;
            for (const value of item_class_session) {
                await ClassSessionsModel.createOnUpdate(
                    {
                        register_class_calendar_id: calendar_id,
                        teacher_code: teacher_code,
                        class_room_code: class_room_code,
                        courses_code: courses_code,
                        class_session: value,
                        note: note,
                        status: status === undefined ? 'Actived' : status
                    }, 
                    {register_class_calendar_id: calendar_id, class_session: value}
                );
            }
        }

        Response.response(res, 'Created');
    }

    static async deleteCalendar(req, res)
    {
        const id = req.params.id;
        const payload = req.body;
        // Logs.logText('class-calendar', JSON.stringify(payload));
        let validator = await ClassValidator.deleteCalendar(id, payload);
        if (validator.code == 1) {
            return res.status(400).json({
                error: 1,
                message: validator.message
            });
        }

        try {
            const rs = await RegisterClassCalendarModel.find(['id'], {id: id});
            if (!rs?.id) {
                return res.status(400).json({
                    error: 1,
                    message: 'Calendar not exists'
                });
            }

            const class_session = payload.class_session;
            for (const value of class_session) {
                await ClassSessionsModel.update(
                    {
                        status: 'Deactived'
                    },
                    {register_class_calendar_id: id, class_session: value}
                );
            }

            // HTTP 200 or HTTP 204
            return res.status(200).json({
                error: 0,
                message: 'Success!'
            });
        } catch (error) {
            Logs.logError("class-calendar", error.message)
            return res.status(500).json({
                error: 0,
                message: error.message
            });
        }
    }

    static async getCalendar(req, res)
    {
        let payload = req.query;
        let page = payload.page ?? 1;
        let pageSize = payload.pageSize ?? 20;

        let validator = await ClassValidator.getCalendar(payload);
        if (validator.code == 1) {
            return res.status(400).json({
                error: 1,
                message: validator.message
            });
        }
        try {
            const classes_calendar = await ClassesModel.getCalendar(payload, page, pageSize);

            res.json({
                error: 0,
                data: classes_calendar.data,
                total: classes_calendar.total,
                page: page,
                pageSize: pageSize
            });
        } catch (error) {
            console.log(`ClassController getCalendar ${error.message}`);
            res.status(500).json({
                error: 0,
                data: classes_calendar.data,
                total: classes_calendar.total,
                page: page,
                pageSize: pageSize
            });
        }
        
    }

    // static async updateCalendar(req, res)
    // {
    //     const id = req.params.id;
    //     const payload = req.body;
    //     let validator = await ClassValidator.updateCalendar(id, payload);
    //     if (validator.code == 1) {
    //         return res.status(400).json({
    //             error: 1,
    //             message: validator.message
    //         });
    //     }

    //     try {
    //         const class_session = payload.class_session;

    //         const rs = await RegisterClassCalendarModel.find(["id", "register_class_code", "DATE_FORMAT(date, '%Y-%m-%d') as date"], {id: id});
    //         if (!rs?.id) {
    //             return res.status(400).json({
    //                 error: 1,
    //                 message: 'Calendar not exists'
    //             });
    //         }

    //         const isExistsRegisterClassCalendar = await RegisterClassCalendarModel.get(
    //             ['id', "register_class_code", "DATE_FORMAT(date, '%Y-%m-%d') as date"], 
    //             {
    //                 whereNot: {
    //                     register_class_code: rs.register_class_code,
    //                 },
    //                 whereIn: {
    //                     date: [
    //                         rs.date
    //                     ],
    //                 }
    //             },
    //             "ALL"
    //         );

    //         // lịch theo ngày
    //         if (isExistsRegisterClassCalendar.length)
    //         {
    //             const listCalendar = [...new Set(isExistsRegisterClassCalendar.map(item => item.id))];
    //             const listRoom = [...new Set(class_session.map(item => item.class_room_code))];
    //             // kiểm tra danh sách phòng
    //             let isExistsClassSessions = await ClassSessionsModel.get(
    //                 ['*'],
    //                 {
    //                     whereIn: {
    //                         // class_room_code: listRoom,
    //                         register_class_calendar_id: listCalendar
    //                     }
    //                 },
    //                 "ALL"
    //             );

    //             const registerClassCalendarMap = new Map(
    //                 isExistsRegisterClassCalendar.map(item => [item.id, item.date])
    //             );

    //             isExistsClassSessions = await Promise.all(isExistsClassSessions.map((item) => {
    //                 // item.date = isExistsRegisterClassCalendar.find(item1 => item1.id == item.register_class_calendar_id)?.date;
    //                 item.date = registerClassCalendarMap.get(item.register_class_calendar_id) || null;
    //                 return item
    //             }));

    //             // kiểm tra ngay đó có trùng phòng hoặc lớp chưa
    //             const errorClassSession = [];
    //             class_session.map((item) => {
    //                 const date = item.date;
    //                 const teacher_code = item.teacher_code;
    //                 const class_room_code = item.class_room_code;
    //                 const item_class_session = item.class_session;
    //                 const itemIsExistsClassSessions = isExistsClassSessions.find(item => 
    //                     (item.class_room_code == class_room_code || item.teacher_code == teacher_code) && 
    //                     item.date == date && 
    //                     item_class_session.includes(item.class_session)
    //                 );
    //                 if (itemIsExistsClassSessions) {
    //                     errorClassSession.push(itemIsExistsClassSessions)
    //                 }
    //             });
    //             // console.log(errorClassSession);
    //             if (errorClassSession.length > 0)
    //             {
    //                 return res.status(400).json({
    //                     error: 1,
    //                     message: `
    //                         ${errorClassSession.map(item => `Date ${item.date} section ${item.class_session} is full`).join("\n")}
    //                     `
    //                 });
    //             }
    //         }

    //         for (const item of class_session) {
    //             const teacher_code = item.teacher_code;
    //             const class_room_code = item.class_room_code;
    //             const class_session = item.class_session;

    //             await ClassSessionsModel.createOnUpdate(
    //                 {
    //                     register_class_calendar_id: id,
    //                     teacher_code: teacher_code,
    //                     class_room_code: class_room_code,
    //                     class_session: class_session,
    //                     status: 'Actived'
    //                 },
    //                 {register_class_calendar_id: id, class_session: class_session}
    //             );
    //         }

    //         // HTTP 200 or HTTP 204
    //         return res.status(200).json({
    //             error: 0,
    //             message: 'Success!'
    //         });
    //     } catch (error) {
    //         Logs.logError("class-calendar", error.message)
    //         return res.status(500).json({
    //             error: 0,
    //             message: error.message
    //         });
    //     }
    // }
    static async updateCalendar(req, res)
    {
        const payload = req.body;
        let validator = await ClassValidator.updateCalendar(payload);
        if (validator.code == 1) {
            return Response.validator(res, validator);
        }

        try {
            const {
                class_session_old,
                class_session_new,
                created_by,
                updated_by = created_by
            } = payload;

            const [
                calendar_ids,
                class_session_old_class_sessions
            ] = await Promise.all([
                [...new Set(class_session_old.map(item => item.calendar_id))],
                [
                    ...new Set(
                        class_session_old.flatMap(item => item.class_session)
                    )
                ]
            ]);

            const is_exist_class_session_old = await ClassSessionsModel.get(
                ['*'],
                {
                    whereIn: {
                        register_class_calendar_id: calendar_ids,
                        class_session: class_session_old_class_sessions,
                        status: ["Actived", "Locked"]
                    }
                },
                "ALL"
            );

            if (is_exist_class_session_old.length == 0) {
                return Response.validator(res, {
                    message: 'Calendar not exists'
                });
            }
            // class_session_old
            // const {
            //     class_session
            // } = class_session_new
            const [
                class_code_ids,
                class_room_code_ids
            ] = await Promise.all([
                [...new Set(class_session_new.map(item => item.class_code))],
                [
                    ...new Set(
                        class_session_new.flatMap((item) => { 
                            const { class_session } = item;
                            // item.class_room_code
                            return class_session.map(item => item.class_room_code);
                        })
                    )
                ]
            ]);
            
            const register_class = await RegisterClassModel.get(
                ['code', 'class_code'], 
                {
                    whereIn: {
                        class_code: class_code_ids
                    }
                },
                "ALL"
            );
            if (register_class.length == 0) {
                return Response.validator(res, {
                    message: 'Class not register'
                });
            }
    
            if (class_room_code_ids.length) {
                const uniqueDates = [...new Set(
                    class_session_new.flatMap((item) => { 
                        const { class_session } = item;
                        // item.class_room_code
                        return class_session.map(item => item.date);
                    })
                )];

                // lấy lịch dạy của ngày hôm đó
                const isExistsRegisterClassCalendar = await RegisterClassCalendarModel.get(
                    ['id', "register_class_code", "DATE_FORMAT(date, '%Y-%m-%d') as date"], 
                    {
                        whereNotIn: {
                            register_class_code: [...new Set(register_class.map(item => item.code))]
                        },
                        whereIn: {
                            date: uniqueDates,
                        }
                    },
                    "ALL"
                );

                if (isExistsRegisterClassCalendar.length)
                {
                    const listCalendar = [...new Set(isExistsRegisterClassCalendar.map(item => item.id))];
                    let isExistsClassSessions = await ClassSessionsModel.get(
                        ['*'],
                        {
                            whereIn: {
                                // class_room_code: listRoom,
                                status: ['Actived', 'Locked'],
                                register_class_calendar_id: listCalendar
                            }
                        },
                        "ALL"
                    );

                    const registerClassCalendarMap = new Map(
                        isExistsRegisterClassCalendar.map(item => [item.id, item.date])
                    );

                    isExistsClassSessions = await Promise.all(isExistsClassSessions.map((item) => {
                        // item.date = isExistsRegisterClassCalendar.find(item1 => item1.id == item.register_class_calendar_id)?.date;
                        item.date = registerClassCalendarMap.get(item.register_class_calendar_id) || null;
                        return item
                    }));
                    console.log(isExistsClassSessions);
                    // kiểm tra ngay đó có trùng phòng hoặc lớp chưa
                    let errorClassSession = {};
                    class_session_new.map((item) => {
                        const { class_code, class_session } = item;

                        const item_class_session = new Map(
                            class_session.map(item => [item.date, item])
                        );
                        
                        isExistsClassSessions.forEach(item => {    

                            const { date, class_room_code, status, teacher_code, note, courses_code, class_session } = item_class_session.get(item.date);
                            if (
                                (item.class_room_code == class_room_code || item.teacher_code == teacher_code) && 
                                item.date == date && 
                                class_session.includes(item.class_session)
                            ) {
                                if (errorClassSession[`${item.date}_${item.class_session}`]) {
                                    errorClassSession[`${item.date}_${item.class_session}`] += `\nNgày ${item.date} tiết ${item.class_session}: Giáo viên hoặc phòng đã được xếp!`;
                                } else {
                                    errorClassSession[`${item.date}_${item.class_session}`] = `Ngày ${item.date} tiết ${item.class_session}: Giáo viên hoặc phòng đã được xếp!`;
                                }
                            }
    
                            if (
                                (item.status == 'Locked') &&
                                item.date == date && 
                                class_session.includes(item.class_session)
                            ) {
                                if (errorClassSession[`${item.date}_${item.class_session}`]) {
                                    errorClassSession[`${item.date}_${item.class_session}`] += `\nNgày ${item.date} tiết ${item.class_session}: Đã được khóa!`;
                                } else {
                                    errorClassSession[`${item.date}_${item.class_session}`] = `Ngày ${item.date} tiết ${item.class_session}: Đã được khóa!`;
                                }
                            }
                        });
                    });

                    if (Object.keys(errorClassSession).length > 0)
                    {
                        const errorMessage = [];
                        Object.entries(errorClassSession).forEach(([key, value]) => {
                            errorMessage.push(value)
                        });

                        return Response.validator(res, {
                            message: errorMessage.join("\n")
                        })
                    }
                }
            }

            // {
            //     Esu142: {
            //         code: 'RLfbf3ea99-a0b3-489d-ab9a-de7ddc62468b',
            //         class_code: 'Esu142'
            //     }
            // }
            const register_class_codes = new Map(
                register_class.map(item => [item.class_code, item])
            );
            console.log(register_class_codes)
            class_session_old.forEach(async (item, index) => {
                const { calendar_id, class_session } = item;
                const index_class_session_new = class_session_new[index];
                if (
                    !index_class_session_new
                ) {
                    return Response.validator(res, {
                        message: "Class Session New not item!"
                    });
                }

                for (const value of class_session) {
                    await ClassSessionsModel.createOnUpdate(
                        {
                            status: "Locked",
                            class_session: value
                        },
                        {
                            register_class_calendar_id: calendar_id
                        }
                    );
                }
                
                const { class_code } = index_class_session_new;

                for (const item of index_class_session_new.class_session) {
                    // giá trị undefined sẽ bị lọc bỏ vì courses_code tồn tại sẽ không cần có teacher_code,class_room_code
                    const date = item.date;
                    const teacher_code = item.teacher_code;
                    const class_room_code = item.class_room_code;
                    const courses_code = item.courses_code;
                    const note = item.note;
                    const status = item.status;
                    const register_class_code = register_class_codes.get(class_code);
                    console.log(register_class_code)
                    if (!register_class_code.code) {
                        continue;
                    }

                    const registerClassCalendar = await RegisterClassCalendarModel.createOnUpdate(
                        {
                            register_class_code: register_class_code.code,
                            date: date,
                            created_by: created_by,
                            updated_by: updated_by,
                        },
                        { 
                            register_class_code: register_class_code.code, 
                            date: date 
                        }
                    );
        
                    const item_class_session = item.class_session;
                    const calendar_id = registerClassCalendar.id;
                    for (const value of item_class_session) {
                        console.log(value)
                        await ClassSessionsModel.createOnUpdate(
                            {
                                register_class_calendar_id: calendar_id,
                                teacher_code: teacher_code,
                                class_room_code: class_room_code,
                                courses_code: courses_code,
                                class_session: value,
                                note: note,
                                status: status === undefined ? 'Actived' : status
                            }, 
                            {
                                register_class_calendar_id: calendar_id, 
                                class_session: value
                            }
                        );
                    }
                }
            });

            return Response.response(res, 'Created');
        } catch (error) {
            console.log(error)
            return Response.response(res, 'Error');
        }
    }
}

module.exports = ClassController;
