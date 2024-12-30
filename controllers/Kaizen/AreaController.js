// controllers/Kaizen/AreaController.js
const { AreaModel } = require('../../models/Kaizen/AreaModel');
class AreaController {
    static async getList(req, res) {
        
        const area = await AreaModel.getList();

        res.json({
            error: 0,
            data : area
        });
    }
}

module.exports = AreaController;
