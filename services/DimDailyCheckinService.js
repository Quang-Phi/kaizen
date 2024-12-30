const { DimDailyCheckinModel } = require("../models/Kaizen/DimDailyCheckinModel");

class DimDailyCheckinService {
  static async create(dimCheckinData) {
    try {
      await DimDailyCheckinModel.create(dimCheckinData);
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = { DimDailyCheckinService };