const { StudentValidator } = require('../../validator/Kaizen/StudentValidator');
const { RegisterClassModel } = require('../../models/Kaizen/RegisterClassModel');
const { RegisterClassStudentModel } = require('../../models/Kaizen/RegisterClassStudentModel');
const { StudentModel } = require('../../models/Kaizen/StudentModel');
const { StudentDealModel } = require('../../models/Kaizen/StudentDealModel');
const { DealsModel } = require('../../models/Kaizen/DealsModel');
const { ProgramModel } = require('../../models/Kaizen/ProgramModel');
const { ProvinceModel } = require('../../models/Kaizen/ProvinceModel');
const { BranchesModel } = require('../../models/Kaizen/BranchesModel');
const { Helpers } = require('../../helpers/Helpers');
const { Logs } = require('../../helpers/Logs');
const { ClassesModel } = require('../../models/Kaizen/ClassesModel');
const { EventLogModel } = require('../../models/Kaizen/EventLogModel');
const { UsersModel } = require('../../models/Kaizen/UsersModel');
const { SchoolsModel } = require('../../models/Kaizen/SchoolsModel');
const { ConfigModel } = require('../../models/Kaizen/ConfigModel');
const moment = require('moment');

class StudentController {
    static async arrange(req, res)
    {
        let data = req.body;

        // console.log(JSON.stringify(data), 'StudentController arrange');
    
        let validator = await StudentValidator.arrange(data);
        if (validator.code == 1) {
            return res.status(400).json({
                error: 1,
                message: validator.message
            });
        }

        // payload data
        const student = data.student;
        const class_code = data.class_code;

        // student
        const register_class_student = await RegisterClassStudentModel.get(
            ['register_class_code', 'student_code'], 
            {
                wheres: {
                    status: 'Actived'
                },
                whereIn: {
                    student_code: student
                }
            },
            'ALL'
        );

        if (register_class_student.length)
        {
            const listRegisterClass = [...new Set(register_class_student.map(item => item.register_class_code))];
            let listClassCode = await RegisterClassModel.get(
                ['code', 'class_code'], 
                {
                    whereNot: {
                        class_code: class_code
                    },
                    whereIn: {
                        code: listRegisterClass,
                    }
                },
                "ALL"
            );

            if (listClassCode.length) {
                let classes = await ClassesModel.get(
                    ['code', 'name'],
                    {
                        where: {
                            status: 1
                        },
                        whereIn: {
                            code: [...new Set(listClassCode.map(item => item.class_code))]
                        }
                    },
                    'ALL'
                );
    
                // Tạo Map nhanh hơn find
                const [studentMap, classesMap] = await Promise.all([
                    new Map(register_class_student.map(student => [student.register_class_code, student])),
                    new Map(classes.map(cls => [cls.code, cls]))
                ]);
    
                const updatedListClassCode = listClassCode.map((item) => {
                    // Tìm thông tin từ Map
                    const matchingStudent = studentMap.get(item.code);
                    const matchingClasses = classesMap.get(item.class_code);
    
                    // Nếu tìm thấy, thêm trường mới vào item
                    return {
                        ...item,
                        student_code: matchingStudent?.student_code,
                        classes_name: matchingClasses?.name
                    };
                });
    
                const errStudent = updatedListClassCode.filter((item) => {
    
                    if (student.includes(item.student_code)) {
                        return true;
                    }
    
                    return false
                });
    
                if (errStudent.length) {
                    return res.status(400).json({
                        error: 1,
                        message: `${errStudent.map(item => `Học viên ${item.student_code} đang học lớp ${item.classes_name}`).join("\n")}`
                    });
                }
            }
        }

        try {
            const register_class = await RegisterClassModel.createOnUpdate({
                class_code: data.class_code,
                student: data.student,
                start_date: data.start_date ?? null,
                end_date: data.end_date ?? null
            }, {
                class_code: data.class_code
            });

            const countActualNumber = await RegisterClassModel.getCountActualNumber(register_class.id);

            await Promise.all([
                RegisterClassModel.update({
                    actual_number_male: countActualNumber.male,
                    actual_number_female: countActualNumber.female,
                    actual_number: countActualNumber.total
                }, {id: register_class.id}),
                RegisterClassStudentModel.addStudent(register_class.code, {student: data.student})
            ]);
            
            return res.status(201).json({error:0, message: 'Thành công!'});
        } catch (error) {
            console.log('HocVienController xepLop ' + error);
            return res.status(500).json({error:1, message: 'Máy chủ bận!'});
        }
        
    }

    static async transferClasses(req, res)
    {
        const payload = req.body;
        let validator = await StudentValidator.transferClasses(payload);
        if (validator.code == 1) {
            return res.status(400).json({
                error: 1,
                message: validator.message
            });
        }

        const before_class = payload.before_class;
        const student_code = payload.student_code;
        const after_class = payload.after_class;
        const updated_by = payload.updated_by;
        const note = payload.note;
        const transfer_date = payload.transfer_date;

        let register_class = await RegisterClassModel.get(
            ['code', 'class_code'],
            {
                whereIn: {
                    class_code: [before_class,after_class]
                }
            },
            'ALL'
        );

        register_class = new Map(
            register_class.map(item => [item.class_code, item.code])
        );

        const before_register_class_code = register_class.get(before_class);
        const after_register_class_code = register_class.get(after_class);

        const is_before_register_class_code = await RegisterClassStudentModel.find(
            ['*'],
            {
                register_class_code: before_register_class_code,
                status: 'Actived'
            }
        );
        if (!is_before_register_class_code?.id) {
            return res.status(400).json({
                error: 1,
                message: "Student not join classes"
            });
        }

        const beforeCountActualNumber = await RegisterClassModel.getCountActualNumber(before_register_class_code);
        const afterCountActualNumber = await RegisterClassModel.getCountActualNumber(after_register_class_code);

        await Promise.all([
            EventLogModel.create({
                event_type: 'transfer_class',
                entity_type: 'student',
                entity_id: student_code,
                details: JSON.stringify({
                    student_code: student_code,
                    before_register_class_code: before_register_class_code,
                    after_register_class_code: after_register_class_code,
                    transfer_date: transfer_date ? transfer_date : moment().format('YYYY-MM-DD HH:mm:ss'),
                    note: note,
                }),
                created_by: updated_by  
            }),
            RegisterClassStudentModel.createOnUpdate(
                {
                    register_class_code: before_register_class_code,
                    student_code: student_code,
                    status: 'Deactived',
                    created_by: updated_by,
                    updated_by: updated_by
                },
                {
                    register_class_code: before_register_class_code,
                    student_code: student_code
                }
            ),
            RegisterClassStudentModel.createOnUpdate(
                {
                    register_class_code: after_register_class_code,
                    student_code: student_code,
                    status: 'Actived',
                    created_by: updated_by,
                    updated_by: updated_by
                },
                {
                    register_class_code: after_register_class_code,
                    student_code: student_code
                }
            ),
            RegisterClassModel.update({
                actual_number_male: beforeCountActualNumber.male,
                actual_number_female: beforeCountActualNumber.female,
                actual_number: beforeCountActualNumber.total
            }, {code: before_register_class_code}),
            RegisterClassModel.update({
                actual_number_male: afterCountActualNumber.male,
                actual_number_female: afterCountActualNumber.female,
                actual_number: afterCountActualNumber.total
            }, {code: afterCountActualNumber}),
        ]);

        return res.status(200).json({
            error: 0,
            message: 'Success!'
        });
    }

    static async get(req, res)
    {
        let request = req.query;
        console.log(JSON.stringify(request), 'StudentController get');
        
        const page = request.page ?? 1;
        // if (!request.search) {
        //     page = request.page;
        // }

        let pageSize = request.pageSize ?? 20;

        try {
            // const [hoc_vien, total] = await Promise.all([
            //     StudentModel.getList(request, page, pageSize),
            //     StudentModel.getCountList(request)
            // ]);

            const hoc_vien = await StudentModel.getList(request, page, pageSize);

            return res.json({
                error: 0,
                data: hoc_vien.data,
                total: hoc_vien.total,
                page: page,
                pageSize: pageSize

            });
        } catch (error) {
            return res.status(500).json({ error: 1, message: error.message });
        }
    }

    static async detail(req, res)
    {
        const code = req.params.code;

        if (typeof code !== 'string') { 
            return res.status(400).json({
                error: 1,
                message: 'Code wrong!'
            });
        }

        const student_detail = await StudentModel.getDetail(code, {});

        return res.json({
            error: 0,
            data: student_detail
        });
    }

    static async histories(req, res)
    {
        const code = req.params.code;

        if (typeof code !== 'string') { 
            return res.status(400).json({
                error: 1,
                message: 'Code wrong!'
            });
        }

        const payload = req.query;
        let page = payload.page ?? 1;
        let pageSize = payload.pageSize ?? 20;

        const student_histories = await StudentModel.getHistories(
            {
                code: code,
            }, 
            page, 
            pageSize
        );

        return res.json({
            error: 0,
            data: student_histories?.data ?? [],
            total: student_histories?.total ?? 0,
            page: page,
            pageSize: pageSize

        });
    }

    static async create(req, res)
    {
        console.log(JSON.stringify(req.body), 'StudentController create');

        let data = req.body;
        let validator = await StudentValidator.create(data);
        if (validator.code == 1) {
            return res.status(400).json({
                error: 1,
                message: validator.message
            });
        }

        try {
            let student = await StudentModel.find(['id', 'code', 'first_name', 'last_name'], {
                contact_id: data.contact_id
            });

            // trùng 1 thời điểm không được tạo 2 deals
            if (student?.code) {
                return res.status(400).json({
                    error: 1,
                    message: "Student is exist"
                });
            }

            let deals = await DealsModel.find(['id'], {deal_id: data.deal_id});
            if (deals?.id) {
                return res.status(400).json({
                    error: 1,
                    message: "Deals is exist"
                });
            }

            let schools = {};
            if (data.schools_id) {
                schools = await SchoolsModel.find(
                    ['id'], 
                    {
                        bitrix_id: data.schools_id
                    }
                );
                
                if (!schools?.id) {
                    return res.status(400).json({
                        error: 1,
                        message: "Schools not found"
                    });
                }
            }

            let level = {};
            if (data.level) {
                level = await ConfigModel.find(
                    ['id'], 
                    {
                        bitrix_id: data.level,
                        properties: 18
                    }
                );

                if (!level?.id) {
                    return res.status(400).json({
                        error: 1,
                        message: "Level not found"
                    });
                }
            }

            const [program, branches, province_id] = await Promise.all([
                ProgramModel.find(['code','sharepoint_id', 'type'], {
                    bitrix_id: data.deal_program_bitrix_id
                }),
                BranchesModel.find(['code', 'code_genarate', 'sharepoint_id'], {
                    bitrix_id: data.deal_branch_id,
                }),
                ProvinceModel.find(['sharepoint_id'], {
                    province: data.deal_province
                })
            ]);

            if (!program?.code) {
                return res.status(400).json({
                    error: 1,
                    message: "Program not found"
                });
            }

            if (!program?.type) {
                return res.status(400).json({
                    error: 1,
                    message: "Program Type not found"
                });
            }
            
            if (!branches?.code_genarate) {
                return res.status(400).json({
                    error: 1,
                    message: "Branches not found"
                });
            }

            // {
            //     "id": 16,
            //     "branchCode": "KY SU               ",
            //     "branchName": "KỸ SƯ",
            //     "address": null,
            //     "representationName": null,
            //     "representationRoll": null,
            //     "note": null,
            //     "shortCode": "KS"
            // },
            // {
            //     "id": 11,
            //     "branchCode": "DU HOC              ",
            //     "branchName": "DU HỌC",
            //     "address": null,
            //     "representationName": null,
            //     "representationRoll": null,
            //     "note": null,
            //     "shortCode": "DHS"
            // },
            if (['kysu', 'dubikysu'].includes(program.code)) {
                branches.sharepoint_id = 16;
            } else if (['luuhoc', 'luuhockaigo'].includes(program.code)) {
                branches.sharepoint_id = 11;
            }

            if (!province_id) {
                return res.status(400).json({
                    error: 1,
                    message: "Province not found"
                });
            }

            data.first_name = data.first_name.toUpperCase();
            data.last_name = data.last_name.toUpperCase();
            data.email = data.email ? data.email : [];

            let maHocVien = null;
            if (program.type == 'PY') {
                const results = await Helpers.curl_sp({
                    path: "/api/v1/Trainnee/CreateCVHocVien",
                    body: {
                        hoDem: data.first_name,
                        dienThoaiDiDong: data.phone.join(","),
                        email: data.email.join(","),
                        ten: data.last_name,
                        idChiNhanh: branches.sharepoint_id,
                        idChuongTrinh: program.sharepoint_id,
                        contactID: data.contact_id,
                        dealID: data.deal_id,
                        CreateBy: data.created_by_username,
                    }
                }, "POST");
                console.log(JSON.stringify(results))
                // Logs.logText('resp-sharepoint-add', JSON.stringify(results));
        
                if (!results) {
                    return res.status(400).json({
                        error: 1, 
                        message: "API SP not send result",
                    });
                }
        
                if (!results.succeeded) {
                    return res.status(400).json({
                        error: 1, 
                        message: results.message,
                    });
                }

                maHocVien = results.data.maHocVien;
            } else {
                maHocVien = await StudentModel.createPrimaryKey({
                    branch_code: branches.code_genarate,
                    program_type: program.type
                });
            }

            // const maHocVien = 'DNa24100059';

            data.code = maHocVien;
            data.updated_by = data.updated_by ?? data.created_by;
            student = await StudentModel.createStudent({
                code: data.code,
                first_name: data.first_name,
                last_name: data.last_name,
                contact_id: data.contact_id,
                ...(schools?.id && { schools_id: schools.id }),
                dob: data.dob,
                gender: data.gender,
                ...(data.date_graduation && { date_graduation: data.date_graduation }),
                native_place: data.native_place,
                status: 41,
                ...(level?.id && { level: level.id }),
                created_by: data.created_by,
                updated_by: data.updated_by,
                phone_num: data.phone,
                email: data.email
            });
            
            const rs = Helpers.curl({
                url: process.env.BITRIX_URL + 'crm.contact.update',
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: {
                    "ID": data.contact_id,
                    "FIELDS": {
                        "UF_CRM_1701697275": student.code
                    }
                }
            });
            
            const ms = await UsersModel.createOnUpdate(
                {
                    first_name: data.ms_first_name || null,
                    last_name: data.ms_last_name || null
                },
                {
                    first_name: data.ms_first_name || null,
                    last_name: data.ms_last_name || null
                }
            );
            // UsersModel
            const deal_code = await DealsModel.create({
                deal_id: data.deal_id,
                opening_date: data.deal_opening_date,
                branch_code: branches.code ?? null,
                program_code: program.code,
                ms_note: data.deal_ms_note ?? null,
                ms_id: ms?.id ?? null,
                created_by: data.created_by,
                updated_by: data.updated_by,
            });

            const result = await StudentDealModel.create({
                student_code: student.code, 
                deal_code: deal_code,
                student_id: student.id
            });
        
            res.status(201).json({
                error: 0,
                data: {
                    student_code: student.code
                },
                message: 'Thành công!'
            });
        } catch (error) {
            console.log('StudentController create error ' + error);
            res.status(500).json({
                error:1, 
                message: 'Máy chủ bận!'
            });
        }
    }

    static async update(req, res)
    {
        console.log(JSON.stringify(req.body), 'StudentController update');
        let data = req.body;
        let validator = await StudentValidator.update(data);
        if (validator.code == 1) {
            return res.status(400).json({
                error: 1,
                message: validator.message
            });
        }

        try {
            let student = await StudentModel.find(['id', 'code', 'first_name', 'last_name', 'contact_id', 'dob', 'gender'], {
                contact_id: data.contact_id
            });
    
            if (!student?.code) {
                return res.status(400).json({
                    error: 1,
                    message: "Student not exist"
                });
            }
    
            let deals = await DealsModel.find(['deal_id', 'code', 'program_code'], {deal_id: data.deal_id});
            if (deals?.deal_id) {
                return res.status(400).json({
                    error: 1,
                    message: "Deals is exist!"
                });
            }

            let schools = {};
            if (data.schools_id) {

                schools = await SchoolsModel.find(
                    ['id'], 
                    {
                        bitrix_id: data.schools_id
                    }
                );

                if (!schools?.id) {
                    return res.status(400).json({
                        error: 1,
                        message: "Schools not found"
                    });
                }
            }

            let level = {};
            if (data.level) {
                level = await ConfigModel.find(
                    ['id'], 
                    {
                        bitrix_id: data.level,
                        properties: 18
                    }
                );
    
                if (!level?.id) {
                    return res.status(400).json({
                        error: 1,
                        message: "Level not found"
                    });
                }
            }
    
            const [program, branches, student_deal] = await Promise.all([
                // Deals payload
                ProgramModel.find(['code','sharepoint_id', 'type'], {
                    bitrix_id: data.deal_program_bitrix_id
                }),
                BranchesModel.find(['code', 'code_genarate', 'sharepoint_id'], {
                    bitrix_id: data.deal_branch_id,
                }),
                // 
                StudentDealModel.get(['deal_code', 'student_code'], {
                    student_code: student.code,
                    // deal_code: deals.code,
                    status: "Actived"
                }),
            ]);
    
            if (!program?.code) {
                return res.status(400).json({
                    error: 1,
                    message: "Program not found"
                });
            }
    
            if (!program?.type) {
                return res.status(400).json({
                    error: 1,
                    message: "Program Type not found"
                });
            }
            
            if (!branches?.code_genarate) {
                return res.status(400).json({
                    error: 1,
                    message: "Branches not found"
                });
            }
    
            if (['kysu', 'dubikysu'].includes(program.code)) {
                branches.sharepoint_id = 16;
            } else if (['luuhoc', 'luuhockaigo'].includes(program.code)) {
                branches.sharepoint_id = 11;
            }
    
            data.first_name = data.first_name ? data.first_name.toUpperCase() : student.first_name.toUpperCase();
            data.last_name = data.last_name ? data.last_name.toUpperCase() : student.last_name.toUpperCase();
            data.dob = data.dob ? data.dob : student.dob;
            data.gender = data.gender ? data.gender : student.gender;
            data.created_by = data.created_by ? data.created_by : data.updated_by;
    
            // let currentProgram = ProgramModel.find(['code','sharepoint_id', 'type'], {
            //     bitrix_id: deals.program_code
            // });
    
            // if (currentProgram?.type) {
            //     return res.status(400).json({
            //         error: 1,
            //         message: "Current Deals not type PY or PTN!"
            //     });
            // }
    
            // if (currentProgram.type == 'PTN') {
            //     let payload = {
            //         "dealID": deals.deal_id,
            //         "contactID": student.contact_id
            //     };
    
            //     const results = await Helpers.curl_sp({
            //         path: "/api/v1/Trainnee/DeleteCVHocVien",
            //         body: payload
            //     }, "DELETE");
    
            //     console.log("DELETE", JSON.stringify(results))
            // }
    
            // Chương trình thay đổi
            if (program.type == 'PY') {
                
                if (data.code.match(/^DB/)) {
                    let payload = {
                        hoDem: data.first_name,
                        dienThoaiDiDong: data.phone.join(","),
                        email: data.email.join(","),
                        ten: data.last_name,
                        idChiNhanh: branches.sharepoint_id,
                        idChuongTrinh: program.sharepoint_id,
                        contactID: student.contact_id,
                        dealID: data.deal_id,
                        CreateBy: data.updated_by_username,
                        ngaySinh: data.dob
                    };
    
                    const results = await Helpers.curl_sp_v2({
                        path: "/api/v1/Trainnee/CreateCVHocVien",
                        body: payload
                    }, "POST");
                    console.log(JSON.stringify(results))
                    // Logs.logText('resp-sharepoint-add', JSON.stringify(results));
            
                    if (!results) {
                        return res.status(400).json({
                            error: 1, 
                            message: "API SP not send result",
                        });
                    }
            
                    if (!results.succeeded) {
                        return res.status(400).json({
                            error: 1, 
                            message: results.message,
                        });
                    }
        
                    student.code = results.data.maHocVien;
    
                } else {
    
                    let payload = {
                        maHocVien: data.code,
                        hoDem: data.first_name,
                        dienThoaiDiDong: data.phone.join(","),
                        email: data.email.join(","),
                        ten: data.last_name,
                        idChiNhanh: branches.sharepoint_id,
                        idChuongTrinh: program.sharepoint_id,
                        contactID: student.contact_id,
                        dealID: data.deal_id,
                        CreateBy: data.updated_by_username,
                        ngaySinh: data.dob
                    };
        
                    const results = await Helpers.curl_sp_v2({
                        path: "/api/v1/Trainnee/UpdateCVHocVien",
                        body: payload
                    }, "PUT");
                    console.log("Updated Student", results);
            
                    if (!results) {
                        return res.status(400).json({
                            error: 1, 
                            message: "API SP not send result",
                        });
                    }
            
                    if (!results.succeeded) {
                        return res.status(400).json({
                            error: 1, 
                            message: results.message,
                        });
                    }
                }
                
            } else {
                console.log(student_deal, 'student_deal');
                const updatedStudentDealModel = student_deal.map(function(item, key) {
                    StudentDealModel.update({
                        status: 'Deactived'
                    }, {
                        deal_code: item.deal_code,
                        student_code: item.student_code
                    });
                });
    
                await Promise.all(updatedStudentDealModel);
    
                student.code = await StudentModel.createPrimaryKey({
                    branch_code: branches.code_genarate,
                    program_type: program.type
                });
            }
    
            // data.updated_by = data.updated_by ?? data.created_by;
            student = await StudentModel.updateStudent({
                code: student.code,
                first_name: data.first_name,
                last_name: data.last_name,
                contact_id: student.contact_id,
                ...(schools?.id && { schools_id: schools.id }),
                dob: data.dob,
                gender: data.gender,
                ...(data.date_graduation && { date_graduation: data.date_graduation }),
                native_place: data.native_place,
                status: 41,
                ...(level?.id && { level: level.id }),
                created_by: data.created_by,
                updated_by: data.updated_by,
                phone_num: data.phone,
                email: data.email
            });
    
            const rs = Helpers.curl({
                url: process.env.BITRIX_URL + 'crm.contact.update',
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: {
                    "ID": student.contact_id,
                    "FIELDS": {
                        "UF_CRM_1701697275": student.code
                    }
                }
            });

            const ms = await UsersModel.createOnUpdate(
                {
                    first_name: data.ms_first_name || null,
                    last_name: data.ms_last_name || null
                },
                {
                    first_name: data.ms_first_name || null,
                    last_name: data.ms_last_name || null
                }
            );
    
            // var result = _.pluck(users,'student_code').join(",");
            let dataDealCreate = {
                deal_id: data.deal_id,
                opening_date: data.deal_opening_date,
                branch_code: branches.code ?? null,
                program_code: program.code,
                created_by: data.created_by,
                updated_by: data.updated_by,
            }
    
            if (data.deal_ms_note) {
                dataDealCreate.ms_note = data.deal_ms_note;
            }

            dataDealCreate.ms_id = ms?.id ?? null;
    
            const deal_code = await DealsModel.create(dataDealCreate);

            const result = await StudentDealModel.create({
                student_id: student.id,
                student_code: student.code,
                deal_code: deal_code
            });
        
            res.status(201).json({
                error: 0,
                data: {
                    student_code: student.code
                },
                message: 'Thành công!'
            });
        } catch (error) {
            console.log('StudentController error ' + error);
            res.status(500).json({
                error:1, 
                message: 'Máy chủ bận!'
            });
        }
    }

    static async delete(req, res)
    {
        console.log(req)
    }

    static async getHocVienByClass(req, res)
    {
        try {
            // Tạo các worker cho từng hàm
            // const hocVienWorker = runWorker('hocVienWorker.js', 'getHocVienByClass', { filter: {}, page: 1, pageSize: 100 });
            // const countWorker = runWorker('hocVienWorker.js', 'getCountHocVienByClass', { filter: {}, page: 1, pageSize: 100 });

            // // Thực thi các worker đồng thời
            // const [hoc_vien, total] = await Promise.all([hocVienWorker, countWorker]);
            let payload = req.query
            let page = payload.page ?? 1;
            let pageSize = payload.pageSize ?? 20;

            const classes = await StudentModel.getHocVienByClass(payload, page, pageSize);

            return res.json({
                error: 0,
                data: classes?.data || [],
                total: classes?.total || 0,
                page: page,
                pageSize: pageSize
            });
        } catch (err) {
            return res.status(500).json({ error: 1, message: err.message });
        }
    }
}

module.exports = StudentController;