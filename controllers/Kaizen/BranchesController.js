const { BranchesModel } = require('../../models/Kaizen/BranchesModel');

class BranchesController {
    static async getList(req, res) {
        const payload = req.query;
        const area = await BranchesModel.getList(payload);

        res.json({
            error: 0,
            data : area
        });
    }
}

module.exports = BranchesController;
