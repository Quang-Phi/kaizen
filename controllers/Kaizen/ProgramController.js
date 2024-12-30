const { ProgramModel } = require('../../models/Kaizen/ProgramModel');

class ProgramController {
    static async getList(req, res) 
    {
        const program = await ProgramModel.get(['code', 'bitrix_id', 'name', 'type', 'program_code'], {});

        res.json({
            error: 0,
            data: program,
        });
    }
}

module.exports = ProgramController;