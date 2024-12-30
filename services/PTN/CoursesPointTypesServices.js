const { PointTypesModel } = require('../../models/Kaizen/PTN/PointTypesModel');
const { CoursesPointTypesModel } = require('../../models/Kaizen/PTN/CoursesPointTypesModel');

class CoursesPointTypesServices {

     static async getList(params) 
     {
          let rs = await CoursesPointTypesModel.get(
               ['code', 'ptn_courses_code', 'ptn_point_types_code'],
               {
                    where: {
                         ptn_courses_code: params.ptn_courses_code
                    }
               },
               "ALL"
          );

          if (rs.length) {
               let point_types = await PointTypesModel.get(
                    ['*'],
                    {
                         whereIn: {
                              code: [...new Set(rs.map(item => item.ptn_point_types_code))]
                         }
                    },
                    "ALL"
               );
     
               point_types = new Map(
                    point_types.map(item => [item.code, {...item}])
               );
     
               rs = rs.map((item) => {
     
                    const point_types_name = point_types.get(item.ptn_point_types_code)?.name;
                    
                    item.ptn_point_types_name = point_types_name;
                    
                    return item;
               });
          }

          return rs;
     }
}

module.exports = { CoursesPointTypesServices };