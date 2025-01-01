const { runWorker } = require('../../workers/runWorker');
const { StudentModel } = require('../../models/Kaizen/StudentModel');
const { RegisterClass } = require('../../models/Kaizen/RegisterClassModel');
const { RegisterClassStudentModel } = require('../../models/Kaizen/RegisterClassStudentModel');
const { HocVienValidator } = require('../../validator/Kaizen/HocVienValidator');
class HocVienController {

    static async getStudentByClass(req, res) {
        try {
            // Tạo các worker cho từng hàm
            // const hocVienWorker = runWorker('hocVienWorker.js', 'getStudentByClass', { filter: {}, page: 1, pageSize: 100 });
            // const countWorker = runWorker('hocVienWorker.js', 'getCountHocVienByClass', { filter: {}, page: 1, pageSize: 100 });

            // // Thực thi các worker đồng thời
            // const [hoc_vien, total] = await Promise.all([hocVienWorker, countWorker]);
            let request = req.body
            const [hoc_vien, total] = await Promise.all([StudentModel.getStudentByClass(request), StudentModel.getCountHocVienByClass(request)]);

            res.json({
                error: 0,
                data: hoc_vien,
                total: total
            });
        } catch (err) {
            res.status(500).json({ error: 1, message: err.message });
        }
    }

    static async getHocVienKhaiGiang(req, res) {

        let request = req.body
        const filter = {...request}
        const [hoc_vien, total] = await Promise.all([StudentModel.getKhaiGiang(filter), StudentModel.getCountKhaiGiang(filter)]);

        res.json({
            error: 0,
            data: hoc_vien,
            total: total
        });
    }

    static async xepLop(req, res) {
        let data = req.body;
        let validator = await HocVienValidator.xepLop(data);
        if (validator.code == 1) {
            return res.status(400).json({
                error: 1,
                message: validator.message
            })
        }

        let register_class_code = await RegisterClass.createRegisterClass({
            class_code: data.class_code,
            student: data.student,
            deal_code: data.deal_code,
            start_date: data.start_date,
            end_date: data.end_date
        });

        RegisterClassStudentModel.addStudent(register_class_code, {student: data.student})
        .then(result => {
            res.status(201).json({error:0, message: 'Thành công!'});
        }).catch(error => {
            res.status(500).json({error:1, message: 'Máy chủ bận!'});
        });

    }
}

module.exports = HocVienController;
