class DiemDanhHangNgayValidator {
  static async create(req) {
    let code = 0;
    if (!req.ma_hv || !req.id_diem_danh || !req.id_modify || !req.ma_deal) {
      code = 1;
      return { code: code, message: "Không đủ tham số" };
    }

    if (![3, 4, 5].includes(req.id_diem_danh)) {
      code = 1;
      return { code: code, message: "Tham số không chính xác" };
    }

    if (
      req.id_diem_danh == 4 &&
      (!req.don_nghi_phep.ly_do ||
        !req.don_nghi_phep.bat_dau ||
        !req.don_nghi_phep.ket_thuc ||
        !req.don_nghi_phep.status)
    ) {
      code = 1;
      return { code: code, message: "Tham số không chính xác" };
    }

    if (req.id_diem_danh == 5 && req.note) {
      code = 1;
      return { code: code, message: "Tham số không chính xác" };
    }

    if (req.id_diem_danh != 4 && !req.ngay_diem_danh) {
      code = 1;
      return { code: code, message: "Tham số không chính xác" };
    }

    return { code: code };
  }
}

module.exports = { DiemDanhHangNgayValidator };
