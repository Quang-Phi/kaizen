const { Utilities } = require("../../helpers/Utilities");
const { Logs } = require("../../helpers/Logs");
const { Helpers } = require("../../helpers/Helpers");
const { TeachersModel } = require("../../models/Kaizen/TeachersModel");
const {
  TeachersPositionConfig,
} = require("../../models/Kaizen/Dim/TeachersPositionConfig");
const { ConfigModel } = require("../../models/Kaizen/ConfigModel");
const { ClassesRoomModel } = require("../../models/Kaizen/ClassesRoomModel");
const { KZClassTypes } = require("../../models/SharePoint/KZClassTypes");
const moment = require("moment");
const { BranchesModel } = require("../../models/Kaizen/BranchesModel");

class GetTeacher {
  static signature = "cmd:GetTeacher";

  static description = "Command Synchronize Teacher";

  static async handle(params) {
    console.group("%c***** Start *****", "color: green; font-weight: bold;");
    console.info(
      "%cSignature: %c%s",
      "color: blue; font-weight: bold;",
      "color: #444;",
      GetTeacher.signature
    );
    console.info(
      "%cDescription: %c%s",
      "color: blue; font-weight: bold;",
      "color: #444;",
      GetTeacher.description
    );

    const results = await Helpers.curl_sp_v2(
      {
        path: "/api/v1/Trainnee/GetAllTeacher",
      },
      "GET"
    );

    const data = results.data;

    if (data) {
      const [KZ_ClassTypes, branches, config] = await Promise.all([
        KZClassTypes.get(["*"]),
        BranchesModel.get(["*"]),
        ConfigModel.getAllConfig({
          type: ["teachers_status", "teachers_position", "teachers_type"],
        }),
      ]);

      let total = 0;
      for (const value of data) {
        await Utilities.delay(500);

        const teacherID = value.teacherID;
        let code = value.maGiaoVien;
        const startDate = value.startDate
          ? moment(value.startDate).format("YYYY-MM-DD")
          : null;
        const endDate = value.quitJobDate
          ? moment(value.quitJobDate).format("YYYY-MM-DD")
          : null;
        const department = value.deparment;
        let work_time = value?.workTime;
        const created_at = value.created
          ? moment(value.created).format("YYYY-MM-DD H:mm:ss")
          : null;
        const full_name = value.teacherName;
        const match = full_name.match(/\S+(?=\s*$)/);
        const last_name = full_name.replace(/\s*\S+\s*$/, "").trim() ?? null;
        const first_name = match[0] ?? null;
        const status = config.find((item) => {
          return item.properties == 11 && item.value == value.status;
        });
        const position = config.find((item) => {
          return item.properties == 10 && item.value == value.teacherFunction;
        });

        const type = config.find((item) => {
          return item.type == 13 && item.value == value.type;
        });

        const branch_code = branches.find((item) => {
          return item.sharepoint_id == value.branchID;
        });

        let bitrix_id = null;
        let email = null;
        let birthday = null;
        let gender = null;

        if (code) {
          const rs = await Helpers.curl({
            url:
              process.env.BITRIX_URL + `user.get?ADMIN_MODE=Y&XML_ID=${code}`,
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: {},
          });

          const result = rs.data.result;
          const resultData = result[0] ?? {};
          bitrix_id = resultData.ID ?? null;
          email = resultData.EMAIL ?? null;
          birthday = resultData.PERSONAL_BIRTHDAY
            ? moment(resultData.PERSONAL_BIRTHDAY).format("YYYY-MM-DD")
            : null;

          if (result[0]?.PERSONAL_GENDER == "F") {
            gender = 1;
          } else if (result[0]?.PERSONAL_GENDER == "M") {
            gender = 0;
          }
        }

        if (work_time) {
          const groups = work_time.split("|");

          work_time = groups
            .flatMap((group) => group.split("-").map(Number))
            .filter((num) => !isNaN(num) && num !== 0);
        }

        total++;
        const payload = {
          sharepoint_id: teacherID,
          bitrix_id: bitrix_id,
          code: code,
          first_name: first_name,
          last_name: last_name,
          gender: gender,
          birthday: birthday,
          note: value.note,
          status: status?.id ? status.id : null,
          email: email,
          start_date: startDate,
          end_date: endDate,
          type: type?.id ? type.id : null,
          department: department,
          branch_code: branch_code?.code ? branch_code.code : null,
          work_time:
            typeof work_time === "Array" ? JSON.stringify(work_time) : null,
          MaNhanVien: code,
          created_at: created_at,
        };
        Logs.logText("req-commands-get-teacher", JSON.stringify(payload));
        const teacher = await TeachersModel.createOnUpdate(payload, {
          sharepoint_id: teacherID,
        });

        await TeachersPositionConfig.createOnUpdate(
          {
            teachers_id: teacher.id,
            config_id: position?.id ? position.id : null,
          },
          {
            teachers_id: teacher.id,
            config_id: position?.id ? position.id : null,
          }
        );
      }
    }

    console.info("%c***** End *****", "color: red; font-weight: bold;");
    console.groupEnd();
  }
}

module.exports = { GetTeacher };
