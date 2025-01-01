const { StudentValidator } = require("../../validator/Kaizen/StudentValidator");
const {
  RegisterClassModel,
} = require("../../models/Kaizen/RegisterClassModel");
const {
  RegisterClassStudentModel,
} = require("../../models/Kaizen/RegisterClassStudentModel");
const { StudentModel } = require("../../models/Kaizen/StudentModel");
const { StudentDealModel } = require("../../models/Kaizen/StudentDealModel");
const { DealsModel } = require("../../models/Kaizen/DealsModel");
const { ProgramModel } = require("../../models/Kaizen/ProgramModel");
const { ProvinceModel } = require("../../models/Kaizen/ProvinceModel");
const { BranchesModel } = require("../../models/Kaizen/BranchesModel");
const { Helpers } = require("../../helpers/Helpers");
const { ClassesModel } = require("../../models/Kaizen/ClassesModel");
const { EventLogModel } = require("../../models/Kaizen/EventLogModel");
const { UsersModel } = require("../../models/Kaizen/UsersModel");
const { SchoolsModel } = require("../../models/Kaizen/SchoolsModel");
const { ConfigModel } = require("../../models/Kaizen/ConfigModel");
const { Response } = require("../../helpers/Response");
const moment = require("moment");

class StudentController {
  static async arrange(req, res) {
    let data = req.body;

    let validator = await StudentValidator.arrange(data);
    if (validator.code == 1) {
      return Response.validator(res, validator);
    }

    const student = data.student;
    const class_code = data.class_code;

    // student
    const register_class_student = await RegisterClassStudentModel.get(
      ["register_class_code", "student_code"],
      {
        wheres: {
          status: "Actived",
        },
        whereIn: {
          student_code: student,
        },
      },
      "ALL"
    );

    if (register_class_student.length) {
      const listRegisterClass = [
        ...new Set(
          register_class_student.map((item) => item.register_class_code)
        ),
      ];
      let listClassCode = await RegisterClassModel.get(
        ["code", "class_code"],
        {
          whereNot: {
            class_code: class_code,
          },
          whereIn: {
            code: listRegisterClass,
          },
        },
        "ALL"
      );

      if (listClassCode.length) {
        let classes = await ClassesModel.get(
          ["code", "name"],
          {
            where: {
              status: 1,
            },
            whereIn: {
              code: [...new Set(listClassCode.map((item) => item.class_code))],
            },
          },
          "ALL"
        );

        const [studentMap, classesMap] = await Promise.all([
          new Map(
            register_class_student.map((student) => [
              student.register_class_code,
              student,
            ])
          ),
          new Map(classes.map((cls) => [cls.code, cls])),
        ]);

        const updatedListClassCode = listClassCode.map((item) => {
          const matchingStudent = studentMap.get(item.code);
          const matchingClasses = classesMap.get(item.class_code);

          return {
            ...item,
            student_code: matchingStudent?.student_code,
            classes_name: matchingClasses?.name,
          };
        });

        const errStudent = updatedListClassCode.filter((item) => {
          if (student.includes(item.student_code)) {
            return true;
          }

          return false;
        });

        if (errStudent.length) {
          return res.status(400).json({
            error: 1,
            message: `${errStudent
              .map(
                (item) =>
                  `Học viên ${item.student_code} đang học lớp ${item.classes_name}`
              )
              .join("\n")}`,
          });
        }
      }
    }

    try {
      const register_class = await RegisterClassModel.createOnUpdate(
        {
          class_code: data.class_code,
          student: data.student,
          start_date: data.start_date ?? null,
          end_date: data.end_date ?? null,
        },
        {
          class_code: data.class_code,
        }
      );

      const countActualNumber = await RegisterClassModel.getCountActualNumber(
        register_class.id
      );

      await Promise.all([
        RegisterClassModel.update(
          {
            actual_number_male: countActualNumber.male,
            actual_number_female: countActualNumber.female,
            actual_number: countActualNumber.total,
          },
          { id: register_class.id }
        ),
        RegisterClassStudentModel.addStudent(register_class.code, {
          student: data.student,
        }),
      ]);

      return Response.response(res);
    } catch (error) {
      return Response.handleError(res, error);
    }
  }

  static async transferClasses(req, res) {
    const payload = req.body;
    let validator = await StudentValidator.transferClasses(payload);
    if (validator.code == 1) {
      return Response.validator(res, validator);
    }

    const before_class = payload.before_class;
    const student_code = payload.student_code;
    const after_class = payload.after_class;
    const updated_by = payload.updated_by;
    const note = payload.note;
    const transfer_date = payload.transfer_date;

    let register_class = await RegisterClassModel.get(
      ["code", "class_code"],
      {
        whereIn: {
          class_code: [before_class, after_class],
        },
      },
      "ALL"
    );

    register_class = new Map(
      register_class.map((item) => [item.class_code, item.code])
    );

    const before_register_class_code = register_class.get(before_class);
    const after_register_class_code = register_class.get(after_class);

    const is_before_register_class_code = await RegisterClassStudentModel.find(
      ["*"],
      {
        register_class_code: before_register_class_code,
        status: "Actived",
      }
    );
    if (!is_before_register_class_code?.id) {
      return res.status(400).json({
        error: 1,
        message: "Student not join classes",
      });
    }

    const beforeCountActualNumber =
      await RegisterClassModel.getCountActualNumber(before_register_class_code);
    const afterCountActualNumber =
      await RegisterClassModel.getCountActualNumber(after_register_class_code);

    await Promise.all([
      EventLogModel.create({
        event_type: "transfer_class",
        entity_type: "student",
        entity_id: student_code,
        details: JSON.stringify({
          student_code: student_code,
          before_register_class_code: before_register_class_code,
          after_register_class_code: after_register_class_code,
          transfer_date: transfer_date
            ? transfer_date
            : moment().format("YYYY-MM-DD HH:mm:ss"),
          note: note,
        }),
        created_by: updated_by,
      }),
      RegisterClassStudentModel.createOnUpdate(
        {
          register_class_code: before_register_class_code,
          student_code: student_code,
          status: "Deactived",
          created_by: updated_by,
          updated_by: updated_by,
        },
        {
          register_class_code: before_register_class_code,
          student_code: student_code,
        }
      ),
      RegisterClassStudentModel.createOnUpdate(
        {
          register_class_code: after_register_class_code,
          student_code: student_code,
          status: "Actived",
          created_by: updated_by,
          updated_by: updated_by,
        },
        {
          register_class_code: after_register_class_code,
          student_code: student_code,
        }
      ),
      RegisterClassModel.update(
        {
          actual_number_male: beforeCountActualNumber.male,
          actual_number_female: beforeCountActualNumber.female,
          actual_number: beforeCountActualNumber.total,
        },
        { code: before_register_class_code }
      ),
      RegisterClassModel.update(
        {
          actual_number_male: afterCountActualNumber.male,
          actual_number_female: afterCountActualNumber.female,
          actual_number: afterCountActualNumber.total,
        },
        { code: afterCountActualNumber }
      ),
    ]);

    return Response.response(res);
  }

  static async get(req, res) {
    try {
      let request = req.query;
      const page = request.page ?? 1;
      let pageSize = request.pageSize ?? 20;
      const hoc_vien = await StudentModel.getList(request, page, pageSize);

      return res.json({
        error: 0,
        data: hoc_vien.data,
        total: hoc_vien.total,
        page: page,
        pageSize: pageSize,
      });
    } catch (error) {
      return Response.handleError(res, error);
    }
  }

  static async detail(req, res) {
    try {
      const code = req.params.code;

      if (typeof code !== "string") {
        return res.status(400).json({
          error: 1,
          message: "Code wrong!",
        });
      }

      const student_detail = await StudentModel.getDetail(code, {});

      return res.json({
        error: 0,
        data: student_detail,
      });
    } catch (error) {
      return Response.handleError(res, error);
    }
  }

  static async histories(req, res) {
    try {
      const code = req.params.code;

      if (typeof code !== "string") {
        return res.status(400).json({
          error: 1,
          message: "Code wrong!",
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
        pageSize: pageSize,
      });
    } catch (error) {
      return Response.handleError(res, error);
    }
  }

  static async create(req, res) {
    try {
      let data = req.body;
      let validator = await StudentValidator.create(data);
      if (validator.code == 1) {
        return Response.validator(res, validator);
      }

      let student = await StudentModel.find(
        ["id", "code", "first_name", "last_name"],
        {
          contact_id: data.contact_id,
        }
      );

      if (student?.code) {
        return res.status(400).json({
          error: 1,
          message: "Student is exist",
        });
      }

      let deals = await DealsModel.find(["id"], { deal_id: data.deal_id });
      if (deals?.id) {
        return res.status(400).json({
          error: 1,
          message: "Deals is exist",
        });
      }

      let schools = {};
      if (data.schools_id) {
        schools = await SchoolsModel.find(["id"], {
          bitrix_id: data.schools_id,
        });

        if (!schools?.id) {
          return res.status(400).json({
            error: 1,
            message: "Schools not found",
          });
        }
      }

      let level = {};
      if (data.level) {
        level = await ConfigModel.find(["id"], {
          bitrix_id: data.level,
          properties: 18,
        });

        if (!level?.id) {
          return res.status(400).json({
            error: 1,
            message: "Level not found",
          });
        }
      }

      const [program, branches, province_id] = await Promise.all([
        ProgramModel.find(["code", "sharepoint_id", "type"], {
          bitrix_id: data.deal_program_bitrix_id,
        }),
        BranchesModel.find(["code", "code_genarate", "sharepoint_id"], {
          bitrix_id: data.deal_branch_id,
        }),
        ProvinceModel.find(["sharepoint_id"], {
          province: data.deal_province,
        }),
      ]);

      if (!program?.code) {
        return res.status(400).json({
          error: 1,
          message: "Program not found",
        });
      }

      if (!program?.type) {
        return res.status(400).json({
          error: 1,
          message: "Program Type not found",
        });
      }

      if (!branches?.code_genarate) {
        return res.status(400).json({
          error: 1,
          message: "Branches not found",
        });
      }

      if (["kysu", "dubikysu"].includes(program.code)) {
        branches.sharepoint_id = 16;
      } else if (["luuhoc", "luuhockaigo"].includes(program.code)) {
        branches.sharepoint_id = 11;
      }

      if (!province_id) {
        return res.status(400).json({
          error: 1,
          message: "Province not found",
        });
      }

      data.first_name = data.first_name.toUpperCase();
      data.last_name = data.last_name.toUpperCase();
      data.email = data.email ? data.email : [];

      let maHocVien = null;
      if (program.type == "PY") {
        const results = await Helpers.curl_sp(
          {
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
            },
          },
          "POST"
        );

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
          program_type: program.type,
        });
      }

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
        email: data.email,
      });

      const rs = Helpers.curl({
        url: process.env.BITRIX_URL + "crm.contact.update",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: {
          ID: data.contact_id,
          FIELDS: {
            UF_CRM_1701697275: student.code,
          },
        },
      });

      const ms = await UsersModel.createOnUpdate(
        {
          first_name: data.ms_first_name || null,
          last_name: data.ms_last_name || null,
        },
        {
          first_name: data.ms_first_name || null,
          last_name: data.ms_last_name || null,
        }
      );

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

      await StudentDealModel.create({
        student_code: student.code,
        deal_code: deal_code,
        student_id: student.id,
      });

      return res.status(201).json({
        error: 0,
        data: {
          student_code: student.code,
        },
        message: "Success!",
      });
    } catch (error) {
      return Response.handleError(res, error);
    }
  }

  static async update(req, res) {
    try {
      let data = req.body;
      let validator = await StudentValidator.update(data);
      if (validator.code == 1) {
        return Response.validator(res, validator);
      }
      let student = await StudentModel.find(
        [
          "id",
          "code",
          "first_name",
          "last_name",
          "contact_id",
          "dob",
          "gender",
        ],
        {
          contact_id: data.contact_id,
        }
      );

      if (!student?.code) {
        return res.status(400).json({
          error: 1,
          message: "Student not exist",
        });
      }

      let deals = await DealsModel.find(["deal_id", "code", "program_code"], {
        deal_id: data.deal_id,
      });
      if (deals?.deal_id) {
        return res.status(400).json({
          error: 1,
          message: "Deals is exist!",
        });
      }

      let schools = {};
      if (data.schools_id) {
        schools = await SchoolsModel.find(["id"], {
          bitrix_id: data.schools_id,
        });

        if (!schools?.id) {
          return res.status(400).json({
            error: 1,
            message: "Schools not found",
          });
        }
      }

      let level = {};
      if (data.level) {
        level = await ConfigModel.find(["id"], {
          bitrix_id: data.level,
          properties: 18,
        });

        if (!level?.id) {
          return res.status(400).json({
            error: 1,
            message: "Level not found",
          });
        }
      }

      const [program, branches, student_deal] = await Promise.all([
        // Deals payload
        ProgramModel.find(["code", "sharepoint_id", "type"], {
          bitrix_id: data.deal_program_bitrix_id,
        }),
        BranchesModel.find(["code", "code_genarate", "sharepoint_id"], {
          bitrix_id: data.deal_branch_id,
        }),

        StudentDealModel.get(["deal_code", "student_code"], {
          student_code: student.code,
          status: "Actived",
        }),
      ]);

      if (!program?.code) {
        return res.status(400).json({
          error: 1,
          message: "Program not found",
        });
      }

      if (!program?.type) {
        return res.status(400).json({
          error: 1,
          message: "Program Type not found",
        });
      }

      if (!branches?.code_genarate) {
        return res.status(400).json({
          error: 1,
          message: "Branches not found",
        });
      }

      if (["kysu", "dubikysu"].includes(program.code)) {
        branches.sharepoint_id = 16;
      } else if (["luuhoc", "luuhockaigo"].includes(program.code)) {
        branches.sharepoint_id = 11;
      }

      data.first_name = data.first_name
        ? data.first_name.toUpperCase()
        : student.first_name.toUpperCase();
      data.last_name = data.last_name
        ? data.last_name.toUpperCase()
        : student.last_name.toUpperCase();
      data.dob = data.dob ? data.dob : student.dob;
      data.gender = data.gender ? data.gender : student.gender;
      data.created_by = data.created_by ? data.created_by : data.updated_by;

      if (program.type == "PY") {
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
            ngaySinh: data.dob,
          };

          const results = await Helpers.curl_sp_v2(
            {
              path: "/api/v1/Trainnee/CreateCVHocVien",
              body: payload,
            },
            "POST"
          );

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
            ngaySinh: data.dob,
          };

          const results = await Helpers.curl_sp_v2(
            {
              path: "/api/v1/Trainnee/UpdateCVHocVien",
              body: payload,
            },
            "PUT"
          );

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
        const updatedStudentDealModel = student_deal.map(function (item, key) {
          StudentDealModel.update(
            {
              status: "Deactived",
            },
            {
              deal_code: item.deal_code,
              student_code: item.student_code,
            }
          );
        });

        await Promise.all(updatedStudentDealModel);

        student.code = await StudentModel.createPrimaryKey({
          branch_code: branches.code_genarate,
          program_type: program.type,
        });
      }

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
        email: data.email,
      });

      const rs = Helpers.curl({
        url: process.env.BITRIX_URL + "crm.contact.update",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: {
          ID: student.contact_id,
          FIELDS: {
            UF_CRM_1701697275: student.code,
          },
        },
      });

      const ms = await UsersModel.createOnUpdate(
        {
          first_name: data.ms_first_name || null,
          last_name: data.ms_last_name || null,
        },
        {
          first_name: data.ms_first_name || null,
          last_name: data.ms_last_name || null,
        }
      );

      let dataDealCreate = {
        deal_id: data.deal_id,
        opening_date: data.deal_opening_date,
        branch_code: branches.code ?? null,
        program_code: program.code,
        created_by: data.created_by,
        updated_by: data.updated_by,
      };

      if (data.deal_ms_note) {
        dataDealCreate.ms_note = data.deal_ms_note;
      }

      dataDealCreate.ms_id = ms?.id ?? null;

      const deal_code = await DealsModel.create(dataDealCreate);

      const result = await StudentDealModel.create({
        student_id: student.id,
        student_code: student.code,
        deal_code: deal_code,
      });

      return res.status(201).json({
        error: 0,
        data: {
          student_code: student.code,
        },
        message: "Thành công!",
      });
    } catch (error) {
      return Response.handleError(res, error);
    }
  }

  static async getStudentByClass(req, res) {
    try {
      let payload = req.query;
      let page = payload.page ?? 1;
      let pageSize = payload.pageSize ?? 20;

      const classes = await StudentModel.getStudentByClass(
        payload,
        page,
        pageSize
      );

      return res.json({
        error: 0,
        data: classes?.data || [],
        total: classes?.total || 0,
        page: page,
        pageSize: pageSize,
      });
    } catch (err) {
      return Response.handleError(res, err);
    }
  }
}

module.exports = StudentController;
