const express = require('express');
const router = express.Router();

const PTNCoursesController  = require('../../controllers/Kaizen/PTN/CoursesController');
const PTNCoursesPointsController  = require('../../controllers/Kaizen/PTN/CoursesPointsController');
const PTNCoursesLessonLessonGroupController  = require('../../controllers/Kaizen/PTN/CoursesLessonLessonGroupController');
const PTNCoursesPointTypesController  = require('../../controllers/Kaizen/PTN/CoursesPointTypesController');
const ConfigController = require('../../controllers/Kaizen/ConfigController');
const StudentController = require('../../controllers/Kaizen/StudentController');
const DiemDanhNhapHocController = require('../../controllers/Kaizen/DiemDanhNhapHocController');
const DiemDanhHangNgayController = require('../../controllers/Kaizen/DiemDanhHangNgayController');
const CoursesController = require('../../controllers/Kaizen/CoursesController');
const AreaController = require('../../controllers/Kaizen/AreaController');
const BranchesController = require('../../controllers/Kaizen/BranchesController');
const ClassRoomController = require('../../controllers/Kaizen/ClassRoomController');
const ClassController = require('../../controllers/Kaizen/ClassController');
const ClassTypesController = require('../../controllers/Kaizen/ClassTypesController');
const TeachersController = require('../../controllers/Kaizen/TeachersController');
const HocVienController = require('../../controllers/Kaizen/HocVienController');
const ProgramController = require('../../controllers/Kaizen/ProgramController');
const DailyCheckinController = require('../../controllers/Kaizen/DailyCheckinController');


// Define API routes
router.get('/config.get', ConfigController.getAllConfig);
router.get('/courses', CoursesController.get);
router.get('/area.get', AreaController.getList);
router.get('/branch.get', BranchesController.getList);
router.get('/class_room', ClassRoomController.get);
router.get('/classroom.calendar', ClassRoomController.getCalendar);
// router.post('/classroom.calendar', ClassRoomController.postCalendar);

// Lấy danh sách lớp học đang hoạt động
router.get('/class', ClassController.getAllClass);
router.get('/class/:id', ClassController.getDetail);
router.post('/class', ClassController.create);
router.put('/class', ClassController.update);

router.delete('/class.calendar.:id', ClassController.deleteCalendar);
router.put('/class.calendar', ClassController.updateCalendar);
router.post('/class.calendar', ClassController.calendar);
router.get('/class.calendar', ClassController.getCalendar);
router.get('/class.types', ClassTypesController.getAll);

// Giáo viên
router.get('/teacher', TeachersController.getList);
router.get('/teacher.calendar', TeachersController.getCalendar);
// router.post('/teacher.calendar', TeachersController.getList);

// Học viên
router.post('/student', StudentController.create);
router.put('/student', StudentController.update);
router.get('/student', StudentController.get);
router.get('/student.:code', StudentController.detail);
router.get('/student.:code.histories', StudentController.histories);
router.post('/student.transfer.classes', StudentController.transferClasses);
router.get('/class.student.get', StudentController.getHocVienByClass);
router.get('/khaigiang.get', HocVienController.getHocVienKhaiGiang);


// Xếp lớp cho học viên
router.post('/class.student.arrange', StudentController.arrange);

// Lấy danh sách điểm danh nhập học
router.get('/diem-danh-nhap-hoc/get-list', DiemDanhNhapHocController.getList);

router.post('/rollcall.add', DiemDanhNhapHocController.create);

router.post('/diem-danh-nhap-hoc/update', DiemDanhNhapHocController.update);
// Lấy danh sách điểm danh hằng ngày
router.get('/rollcall.daily.get', DiemDanhHangNgayController.getList);
router.get('/rollcall.get', DiemDanhHangNgayController.getList);

// Tạo điểm danh hằng ngày
router.post('/rollcall.daily.add', DiemDanhHangNgayController.create);
router.get('/program', ProgramController.getList);
// router.post('/', userController.createUser);
// router.get('/:id', userController.getUserById);
// router.put('/:id', userController.updateUser);
// router.delete('/:id', userController.deleteUser);

router.post('/daily-checkin', DailyCheckinController.create);

// PTN
router.get('/ptn/courses', PTNCoursesController.getList);
router.get('/ptn/courses.point_types', PTNCoursesPointTypesController.getList);
router.get('/ptn/courses.lesson_lesson_group', PTNCoursesLessonLessonGroupController.getList);
router.get('/ptn/courses.lesson_lesson_group_by_point_types', PTNCoursesLessonLessonGroupController.getLessonGroupByPointTypes);

router.post('/ptn/courses.points', PTNCoursesPointsController.points);

module.exports = router;
