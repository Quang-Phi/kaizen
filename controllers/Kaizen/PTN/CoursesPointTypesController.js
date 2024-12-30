// controllers/Kaizen/PTN/CoursesPointTypesController.js
const { CoursesPointTypesServices } = require('../../../services/PTN/CoursesPointTypesServices');
const { Response } = require('../../../helpers/Response');

class CoursesPointTypesController {

    static async getList(req, res) {
        
        const payload = req.query;

        try {
            const rs = await CoursesPointTypesServices.getList(payload);

            return Response.response(res, '', rs);
        } catch (error) {
            console.log(error)
            return Response.response(res, 'Error');
        }
        
    }
}

module.exports = CoursesPointTypesController;
