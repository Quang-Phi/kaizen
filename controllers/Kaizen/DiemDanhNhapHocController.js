const { DiemDanhNhapHocModel } = require('../../models/Kaizen/DiemDanhNhapHocModel'); // Đảm bảo đường dẫn và cách xuất đúng
const { DiemDanhNhapHocValidator } = require('../../validator/Kaizen/DiemDanhNhapHocValidator');
class DiemDanhNhapHocController {
    static async getList(req, res) {
        try {
            let request = req.body;
            let page = req.body.page ?? 1;
            let pageSize = req.body.pageSize ?? 20;
            const [diem_danh, total] = await Promise.all([DiemDanhNhapHocModel.getList(request, page, pageSize), DiemDanhNhapHocModel.getCountList(request)]);
    
            res.json({
                error: 0,
                data: diem_danh,
                total: total,
                page: page,
                pageSize: pageSize
            });
        } catch (err) {
            res.status(500).json({ error: 1, message: err.message });
        }
    }

    static async create(req, res) {
        let validator = await DiemDanhNhapHocValidator.create(req.body);
        if (validator.code == 1) {
            return res.status(400).json({
                error: 1,
                message: validator.message
            })
        }

        let data = req.body;
        DiemDanhNhapHocModel.createMultiple([
            {id_contact: data.id_contact, ten_hv: data.ten_hv, ngay_sinh: data.ngay_sinh ,id_deal: data.id_deal, ngay_nhap_hoc: data.ngay_nhap_hoc, diem_danh: data.diem_danh ?? null, cap_nhat_gan_nhat: data.id_modify, ma_chuong_trinh: data.ma_chuong_trinh, ngay_khai_giang: data.ngay_khai_giang, ma_chi_nhanh: data.ma_chi_nhanh}
        ]).then(result => {
            res.status(201).json({error:0, message: 'Thành công!'});
        }).catch(error => {
            console.error('Insert failed:', error);
            res.status(500).json({error:1, message: 'Máy chủ bận!'});
        });
    }

    static async update(req, res) {
        let data = req.body;
        let validator = await DiemDanhNhapHocValidator.update(data);
        if (validator.code == 1) {
            return res.status(400).json({
                error: 1,
                message: validator.message
            })
        }

        DiemDanhNhapHocModel.updated(data, {ma_deal: data.ma_deal, ma_hv: data.ma_hv, ngay_diem_danh: data.ngay_diem_danh});
    }
}

module.exports = DiemDanhNhapHocController;