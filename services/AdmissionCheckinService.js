const moment = require("moment");
const {
  AdmissionCheckinModel,
} = require("../models/Kaizen/AdmissionCheckinModel");
const { DimAdmissionCheckinService } = require("./DimAdmissionCheckinService");
const e = require("express");

class AdmissionCheckinService {
  static getCurrentTime() {
    return moment().utcOffset("+07:00").format("YYYY-MM-DD HH:mm:ss");
  }

  static async createMainRecords(payload) {
    const currentTime = this.getCurrentTime();
    const createItems = [];

    for (const key in payload) {
      const item = payload[key];
      const dailyCheckinItem = {
        class_code: item.class_code,
        created_by: item.created_by,
        updated_by: item.created_by,
        created_at: currentTime,
        updated_at: currentTime,
      };

      createItems.push(dailyCheckinItem);
    }
    return await AdmissionCheckinModel.create(
      this.uniqueMainInsertData(createItems)
    );
  }

  static uniqueMainInsertData(data) {
    return data.reduce((acc, current) => {
      const found = acc.find((item) => item.class_code === current.class_code);
      if (!found) {
        acc.push(current);
      }
      return acc;
    }, []);
  }

  static processDimData(payload, results, dataKey) {
    const data = [];
    const currentTime = this.getCurrentTime();

    Object.values(payload).forEach((item) => {
      let resultItem =
        results.find((r) => r.class_code === item.class_code) || {};
      if (resultItem) {
        item[dataKey].forEach((dataItem, index) => {
          let dimData = {};
          dimData = {
            ...dataItem,
            id_daily_checkin: resultItem.id,
            late_admission_date:
              dataItem.type_checkin_id == 9
                ? moment(dataItem.late_admission_date, "YYYY-MM-DD").format(
                    "YYYY-MM-DD"
                  )
                : null,
            created_by: resultItem.created_by,
            updated_by: resultItem.updated_by,
            created_at: currentTime,
            updated_at: currentTime,
          };
          data.push(dimData);
        });
      }
    });
    return data;
  }

  static async updateMainRecords(payload) {
    const currentTime = this.getCurrentTime();
    const updateItems = [];

    for (const key in payload) {
      const item = payload[key];
      const existingRecord = await AdmissionCheckinModel.findOne({
        class_code: item.class_code,
      });

      if (existingRecord) {
        const admissionCheckinItem = {
          ...existingRecord,
          updated_by: item.created_by,
          updated_at: currentTime,
        };

        updateItems.push(admissionCheckinItem);
      }
    }

    return await AdmissionCheckinModel.update(
      this.uniqueMainInsertData(updateItems)
    );
  }

  static async getListStudentAdmission(class_code, student_codes) {
    try {
      return await AdmissionCheckinModel.getListStudentAdmission(
        class_code,
        student_codes
      );
    } catch (error) {
      throw error;
    }
  }

  static async create(payload) {
    try {
      const results = await this.createMainRecords(payload);
      const data = this.processDimData(payload, results, "check_in");
      await DimAdmissionCheckinService.create(data);

      return true;
    } catch (error) {
      throw error;
    }
  }

  static async update(payload) {
    try {
      const results = await this.updateMainRecords(payload);

      const data = this.processDimData(payload, results, "check_in");
      await DimAdmissionCheckinService.update(data);

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = { AdmissionCheckinService };
