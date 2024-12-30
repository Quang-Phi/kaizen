const { ConfigModel } = require('../../models/Kaizen/ConfigModel'); // Đảm bảo đường dẫn và cách xuất đúng

class ConfigController {
    static async getAllConfig(req, res) {
        // Giả sử phương thức getAllConfig trả về danh sách cấu hình từ database
        const request = req.query;
        // await ConfigModel.getAllConfig({ type: requestType });
        const configs = await ConfigModel.getAllConfig({ type: request.type ?? null });

        res.json({
            error: 0,
            data : configs
        });
    }
}

module.exports = ConfigController;
