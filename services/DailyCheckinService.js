const { DailyCheckinModel } = require("../models/Kaizen/DailyCheckinModel");
const { DimDailyCheckinService } = require("./DimDailyCheckinService");
const moment = require("moment");

class DailyCheckinService {
  static async create(payload) {
    try {
      const currentTime = moment()
        .utcOffset("+07:00")
        .format("YYYY-MM-DD HH:mm:ss");
      const processedData = [];

      Object.keys(payload).forEach((key) => {
        const item = payload[key];

        const dailyCheckinItem = {
          student_code: item.student_code,
          day: item.day,
          created_by: item.created_by,
          created_at: currentTime,
          updated_at: currentTime,
        };
        processedData.push(dailyCheckinItem);
      });
      const dailyCheckinResults = await DailyCheckinModel.create(processedData);

      const dimCheckinData = [];
      Object.values(payload).forEach((item, parentIndex) => {
        item.check_in.forEach((checkIn) => {
          dimCheckinData.push({
            ...checkIn,
            id_daily_checkin: dailyCheckinResults[parentIndex].id,
            created_at: currentTime,
            updated_at: currentTime,
          });
        });
      });

      await DimDailyCheckinService.create(dimCheckinData);

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = { DailyCheckinService };