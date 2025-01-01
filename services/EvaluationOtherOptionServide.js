const {
  EvaluationOtherOptionModel,
} = require("../models/Kaizen/EvaluationOtherOptionModel");

class EvaluationOtherOptionServide {
  static async create(data) {
    try {
      return await EvaluationOtherOptionModel.create(data);
    } catch (error) {
      throw error;
    }
  }

  static async update(data) {
    try {
      return await EvaluationOtherOptionModel.update(data);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = { EvaluationOtherOptionServide };
