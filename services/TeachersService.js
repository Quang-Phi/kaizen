const { TeachersModel } = require('../models/Kaizen/TeachersModel');
const { RawQueryModel } = require('../models/Kaizen/RawQueryModel');
const { Logs } = require('../helpers/Logs');

class TeachersService {

     static async getList(payload) {

          const area_code = payload.area_code;
          const branch_code = payload.branch_code;
          const page = payload.page ?? 1;
          let pageSize = payload.pageSize ?? 20;
          if (
               pageSize > 1000
          ) {
               pageSize = 20;
          }

          try {
               let teachers = await TeachersModel.getList(payload, page, pageSize);
               
               if (teachers.data && teachers.data.length <= 0) {
                    return {
                         page: page,
                         pageSize: pageSize,
                         data: [],
                         total: teachers.total
                    };
               }
               const techers_ids = [...new Set(teachers.data.map(item => item.id))];
               const positions = await RawQueryModel.getRaw(
                    `
                         SELECT 
                              tpc.id,
                              tpc.teachers_id,
                              config.value
                         FROM teachers_position_config as tpc
                         LEFT JOIN config ON config.id = tpc.config_id
                         WHERE tpc.teachers_id IN (${techers_ids.map(() => '?').join(', ')})
                    `,
                    techers_ids
               );
               teachers.data = teachers.data.map((item) => {
                    const teachers_id = item.id;
                    item.position = positions.filter(item => item.teachers_id == teachers_id);
                    return item;
               });

               return {
                    page: page,
                    pageSize: pageSize,
                    data: teachers.data,
                    total: teachers.total
               };
          } catch (error) {
               Logs.logError('default-log', error);
               throw error;
          }
     }

}

module.exports = { TeachersService };