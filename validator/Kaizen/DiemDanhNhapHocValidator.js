class DiemDanhNhapHocValidator {
  static async create(req) {
    let code = 0;
    if (
      !req.id_contact ||
      !req.ten_hv ||
      !req.ngay_sinh ||
      !req.id_diem_danh ||
      !req.id_modify ||
      !req.id_deal ||
      !req.ngay_nhap_hoc ||
      !req.ma_chuong_trinh ||
      !req.ma_chi_nhanh
    ) {
      code = 1;
      return { code: code, message: "Không đủ tham số" };
    }

    if (![16, 18].includes(req.id_diem_danh)) {
      code = 2;
      return { code: code, message: "Tham số không chính xác" };
    }

    return { code: code };
  }

  static async update(req) {
    let code = 0;
    if (
      !req.ma ||
      !req.ma_hv ||
      !req.ma_deal ||
      !req.id_diem_danh ||
      !req.id_modify ||
      !req.ngay_nhap_hoc
    ) {
      code = 1;
      return { code: code, message: "Không đủ tham số" };
    }

    if (![6, 7, 8, 9].includes(req.id_diem_danh)) {
      code = 1;
      return { code: code, message: "Tham số không chính xác" };
    }

    if ([7, 8, 9].includes(req.id_diem_danh) && !req.note) {
      code = 1;
      return { code: code, message: "Tham số không chính xác" };
    }

    if (req.id_diem_danh == 9 && !req.ngay_nhap_hoc_thuc_te) {
      code = 1;
      return { code: code, message: "Tham số không chính xác" };
    }
  }
}

module.exports = { DiemDanhNhapHocValidator };
