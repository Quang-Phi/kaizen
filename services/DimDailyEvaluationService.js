const {
  DimDailyEvaluationModel,
} = require("../models/Kaizen/DimDailyEvaluationModel");

class DimDailyEvaluationService {
  static async create(data) {
    try {
      return await DimDailyEvaluationModel.create(data);
    } catch (error) {
      throw error;
    }
  }

  static async update(data) {
    try {
      return await DimDailyEvaluationModel.update(data);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = { DimDailyEvaluationService };
