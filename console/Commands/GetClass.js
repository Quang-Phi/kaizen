const { Utilities } = require("../../helpers/Utilities");
const { Logs } = require("../../helpers/Logs");
const { Helpers } = require("../../helpers/Helpers");
const { ClassesModel } = require("../../models/Kaizen/ClassesModel");
const {
  RegisterClassModel,
} = require("../../models/Kaizen/RegisterClassModel");
const { ClassesRoomModel } = require("../../models/Kaizen/ClassesRoomModel");
const { ClassTypesModel } = require("../../models/Kaizen/ClassTypesModel");
const moment = require("moment");
const { BranchesModel } = require("../../models/Kaizen/BranchesModel");
const { TeachersModel } = require("../../models/Kaizen/TeachersModel");

class GetClass {
  static signature = "cmd:getclass";

  static description = "Command Synchronize Class";

  static async handle(params) {
    console.group("%c***** Start *****", "color: green; font-weight: bold;");
    console.info(
      "%cSignature: %c%s",
      "color: blue; font-weight: bold;",
      "color: #444;",
      GetClass.signature
    );
    console.info(
      "%cDescription: %c%s",
      "color: blue; font-weight: bold;",
      "color: #444;",
      GetClass.description
    );

    const results = await Helpers.curl_sp_v2(
      {
        path: "/api/v1/Trainnee/GetAllClass",
      },
      "GET"
    );

    const data = results.data;

    Logs.logText("req-commands-get-class", JSON.stringify(data));
    if (data) {
      const [ClassTypes, Branches] = await Promise.all([
        ClassTypesModel.get(["*"]),
        BranchesModel.get(["*"]),
      ]);

      for (const value of data) {
        await Utilities.delay(500);

        let classes = {};
        classes.name = value.className;
        classes.status = value.isActived ? 1 : 2;
        const rsKZ_ClassTypes = ClassTypes.find((item) => {
          return item.value === value.classTypeName;
        });

        await Utilities.delay(200);

        // Đợi tạo hoặc cập nhật Classes
        const ClassesRes = await ClassesModel.createOnUpdate(classes, {
          name: classes.name,
        });

        let ClassesRoomData = {};
        const rsClassesRoom = Branches.find(
          ({ sharepoint_id }) => sharepoint_id === value.branchID
        );
        ClassesRoomData.branch_code = rsClassesRoom.code;
        ClassesRoomData.name = value.roomName;

        if (ClassesRoomData.name) {
          const ClassesRoom = await ClassesRoomModel.createOnUpdate(
            ClassesRoomData,
            {
              name: ClassesRoomData.name,
            }
          );

          ClassesRoomData.code = ClassesRoom.code ?? null;
        }

        let teacher_code = {};
        if (value.teachersJoinClasses && value.teachersJoinClasses.length > 0) {
          const teachersJoinClasses = value.teachersJoinClasses.filter(
            ({ id, role, isClosed, handOverDate }) => {
              return (
                id > 0 &&
                role == "Giáo viên chủ nhiệm" &&
                isClosed == false &&
                handOverDate == null
              );
            }
          );
          Logs.logText(
            "req-commands-get-class",
            JSON.stringify(teachersJoinClasses)
          );
          if (teachersJoinClasses[0]?.id) {
            teacher_code = await TeachersModel.find(["code"], {
              sharepoint_id: teachersJoinClasses[0].teacherID,
            });
          }
        }

        await Utilities.delay(200);

        // Đợi tạo hoặc cập nhật RegisterClass
        Logs.logText("req-commands-get-class", JSON.stringify(ClassesRes));
        await RegisterClassModel.createOnUpdate(
          {
            class_code: ClassesRes.code,
            class_room_code: ClassesRoomData.code ?? null,
            teacher_code: teacher_code.code ?? null,
            opening_date: value.openingDate
              ? moment(value.openingDate).format("YYYY-MM-DD")
              : null,
            start_date: value.startDate
              ? moment(value.startDate).format("YYYY-MM-DD")
              : null,
            end_date: value.endDate
              ? moment(value.endDate).format("YYYY-MM-DD")
              : null,
            quantity: value.traineeQuantity,
            class_types_id: rsKZ_ClassTypes.id,
            created_by: 0,
            updated_by: 0,
            lesson: value.currentLessonNumber,
            sharepoint_class_id: value.classID,
            sp_item_log: JSON.stringify(value),
          },
          {
            class_code: ClassesRes.code,
            sharepoint_class_id: value.classID,
          }
        );
      }
    }

    console.info("%c***** End *****", "color: red; font-weight: bold;");
    console.groupEnd();
  }
}

module.exports = { GetClass };
