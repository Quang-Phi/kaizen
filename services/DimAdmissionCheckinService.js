const {
  DimAdmissionCheckinModel,
} = require("../models/Kaizen/DimAdmissionCheckinModel");

class DimAdmissionCheckinService {
  static async create(data) {
    try {
      return await DimAdmissionCheckinModel.create(data);
    } catch (error) {
      throw error;
    }
  }

  static async update(data) {
    try {
      return await DimAdmissionCheckinModel.update(data);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = { DimAdmissionCheckinService };
