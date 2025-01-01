const {
  DimDailyCheckinModel,
} = require("../models/Kaizen/DimDailyCheckinModel");

class DimDailyCheckinService {
  static async create(data) {
    try {
      return await DimDailyCheckinModel.create(data);
    } catch (error) {
      throw error;
    }
  }

  static async update(data) {
    try {
      return await DimDailyCheckinModel.update(data);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = { DimDailyCheckinService };
