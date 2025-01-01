class HocVienValidator {
  static async xepLop(req) {
    let code = 0;
    if (
      !req.class_code ||
      !req.deal_code ||
      !req.class_room_code ||
      !req.start_date ||
      !req.end_date ||
      !req.student
    ) {
      code = 1;
      return { code: code, message: "Không đủ tham số" };
    }

    return { code: code };
  }
}

module.exports = { HocVienValidator };
