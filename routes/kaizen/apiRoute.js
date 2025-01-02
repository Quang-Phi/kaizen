const express = require("express");
const router = express.Router();

const PTNCoursesController = require("../../controllers/Kaizen/PTN/CoursesController");
const PTNCoursesPointsController = require("../../controllers/Kaizen/PTN/CoursesPointsController");
const PTNCoursesLessonLessonGroupController = require("../../controllers/Kaizen/PTN/CoursesLessonLessonGroupController");
const PTNCoursesPointTypesController = require("../../controllers/Kaizen/PTN/CoursesPointTypesController");
const ConfigController = require("../../controllers/Kaizen/ConfigController");
const StudentController = require("../../controllers/Kaizen/StudentController");
const CoursesController = require("../../controllers/Kaizen/CoursesController");
const AreaController = require("../../controllers/Kaizen/AreaController");
const BranchesController = require("../../controllers/Kaizen/BranchesController");
const ClassRoomController = require("../../controllers/Kaizen/ClassRoomController");
const ClassController = require("../../controllers/Kaizen/ClassController");
const ClassTypesController = require("../../controllers/Kaizen/ClassTypesController");
const TeachersController = require("../../controllers/Kaizen/TeachersController");
const HocVienController = require("../../controllers/Kaizen/HocVienController");
const ProgramController = require("../../controllers/Kaizen/ProgramController");
const DailyCheckinController = require("../../controllers/Kaizen/DailyCheckinController");
const AdmissionCheckinController = require("../../controllers/Kaizen/AdmissionCheckinController");
// Define API routes
router.get("/config.get", ConfigController.getAllConfig);
router.get("/courses", CoursesController.get);
router.get("/area.get", AreaController.getList);
router.get("/branch.get", BranchesController.getList);
router.get("/class_room", ClassRoomController.get);
router.get("/classroom.calendar", ClassRoomController.getCalendar);
// router.post('/classroom.calendar', ClassRoomController.postCalendar);

// Lấy danh sách lớp học đang hoạt động
router.get("/class", ClassController.getAllClass);
router.get("/class/:id", ClassController.getDetail);
router.post("/class", ClassController.create);
router.put("/class", ClassController.update);

router.delete("/class.calendar.:id", ClassController.deleteCalendar);
router.put("/class.calendar", ClassController.updateCalendar);
router.post("/class.calendar", ClassController.calendar);
router.get("/class.calendar", ClassController.getCalendar);
router.get("/class.types", ClassTypesController.getAll);

// Giáo viên
router.get("/teacher", TeachersController.getList);
router.get("/teacher.calendar", TeachersController.getCalendar);
// router.post('/teacher.calendar', TeachersController.getList);

// Học viên
router.post("/student", StudentController.create);
router.put("/student", StudentController.update);
router.get("/student", StudentController.get);
router.get("/student.:code", StudentController.detail);
router.get("/student.:code.histories", StudentController.histories);
router.post("/student.transfer.classes", StudentController.transferClasses);
router.get("/class.student.get", StudentController.getStudentByClass);
router.get("/khaigiang.get", HocVienController.getHocVienKhaiGiang);

// Xếp lớp cho học viên
router.post("/class.student.arrange", StudentController.arrange);

// Lấy danh sách điểm danh nhập học
// router.get("/diem-danh-nhap-hoc/get-list", DiemDanhNhapHocController.getList);
// router.post("/diem-danh-nhap-hoc/update", DiemDanhNhapHocController.update);

router.get("/program", ProgramController.getList);

router.post("/daily-checkin", DailyCheckinController.create); // điểm danh hằng ngày
router.get(
  "/daily-checkin/get-list",
  DailyCheckinController.getListStudentCheckinByClass
); //danh sách học viên theo lớp kèm điểm danh
router.post("/daily-checkin/evaluation", DailyCheckinController.evaluation); // đánh giá học viên hàng ngày
router.get(
  "/daily-checkin/:code/evaluation/",
  DailyCheckinController.getStudentEvaluation
); //đánh giá của học viên theo lớp

router.post("/admission-checkin/create", AdmissionCheckinController.create); // điểm danh nhập học
router.put("/admission-checkin/update", AdmissionCheckinController.update); // điểm danh nhập học

router.get(
  "/admission-checkin/get-list",
  AdmissionCheckinController.getListStudentAdmissionByClass
); //danh sách học viên theo lớp kèm điểm danh nhập học

// PTN
router.get("/ptn/courses", PTNCoursesController.getList);
router.get("/ptn/courses.point_types", PTNCoursesPointTypesController.getList);
router.get(
  "/ptn/courses.lesson_lesson_group",
  PTNCoursesLessonLessonGroupController.getList
);
router.get(
  "/ptn/courses.lesson_lesson_group_by_point_types",
  PTNCoursesLessonLessonGroupController.getLessonGroupByPointTypes
);

router.post("/ptn/courses.points", PTNCoursesPointsController.points);

module.exports = router;
