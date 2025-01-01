const {
  DailyAttendanceModel,
} = require("../../models/Kaizen/DailyAttendanceModel");
const {
  DiemDanhNhapHocModel,
} = require("../../models/Kaizen/DiemDanhNhapHocModel");
const {
  DiemDanhHangNgayValidator,
} = require("../../validator/Kaizen/DiemDanhHangNgayValidator");

class DiemDanhHangNgayController {
  static async getList(req, res) {
    try {
      let request = req.body;
      let page = req.body.page ?? 1;
      let pageSize = req.body.pageSize ?? 20;
      const [diem_danh, total] = await Promise.all([
        DailyAttendanceModel.getList(request, page, pageSize),
        DailyAttendanceModel.getCountList(request),
      ]);

      res.json({
        error: 0,
        data: diem_danh,
        total: total,
        page: page,
        pageSize: pageSize,
      });
    } catch (err) {
      res.status(500).json({ error: 1, message: err.message });
    }
  }

  static async create(req, res) {
    let data = req.body;
    let validator = await DiemDanhHangNgayValidator.create(data);
    if (validator.code == 1) {
      return res.status(400).json({
        error: 1,
        message: validator.message,
      });
    }

    const isDiemDanhNhapHoc = await DiemDanhNhapHocModel.isExists({
      ma_hv: data.ma_hv,
      ma_deal: data.ma_deal,
    });
    if (isDiemDanhNhapHoc) {
      return res
        .status(404)
        .json({ error: 1, message: "Vui lòng điểm danh nhập học!" });
    }

    DailyAttendanceModel.createMultiple([
      {
        ma_hv: data.ma_hv,
        diem_danh: data.id_diem_danh,
        don_nghi_phep: data.don_nghi_phep ?? {},
        note: data.note ?? null,
        ngay_diem_danh: data.ngay_diem_danh,
        cap_nhat_gan_nhat: data.id_modify,
        ma_deal: data.ma_deal,
      },
    ])
      .then((result) => {
        res.status(201).json({ error: 0, message: "Thành công!" });
      })
      .catch((error) => {
        console.error("Insert failed:", error);
        res.status(500).json({ error: 1, message: "Máy chủ bận!" });
      });
  }
}

module.exports = DiemDanhHangNgayController;
