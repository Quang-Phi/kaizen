const { update } = require("../controllers/Kaizen/StudentController");
const { DailyCheckinModel } = require("../models/Kaizen/DailyCheckinModel");
const { DimDailyCheckinService } = require("./DimDailyCheckinService");
const { DimDailyEvaluationService } = require("./DimDailyEvaluationService");
const {
  EvaluationOtherOptionServide,
} = require("./EvaluationOtherOptionServide");
const moment = require("moment");

class DailyCheckinService {
  static getCurrentTime() {
    return moment().utcOffset("+07:00").format("YYYY-MM-DD HH:mm:ss");
  }

  static async processMainRecords(payload) {
    const currentTime = this.getCurrentTime();
    const createItems = [];
    const updateItems = [];

    for (const key in payload) {
      const item = payload[key];
      const dailyCheckinItem = {
        class_code: item.class_code,
        day: moment(item.day).format("YYYY-MM-DD"),
        created_by: item.created_by,
        updated_by: item.created_by,
        created_at: currentTime,
        updated_at: currentTime,
      };

      const existingRecord = await DailyCheckinModel.findOne({
        class_code: item.class_code,
        day: moment(item.day).format("YYYY-MM-DD"),
      });

      if (existingRecord) {
        updateItems.push({
          ...dailyCheckinItem,
          id: existingRecord.id,
          created_by: existingRecord.created_by,
          updated_by: item.created_by,
        });
      } else {
        createItems.push(dailyCheckinItem);
      }
    }

    const results = [];
    if (createItems.length > 0) {
      const createdResults = await DailyCheckinModel.create(this.uniqueMainInsertData(createItems));
      results.push(
        ...createdResults.map((item) => ({ ...item, isUpdated: false }))
      );
    }

    if (updateItems.length > 0) {
      const updatedResults = await DailyCheckinModel.update(this.uniqueMainInsertData(updateItems));
      results.push(
        ...updatedResults.map((item) => ({ ...item, isUpdated: true }))
      );
    }

    return results;
  }

  static uniqueMainInsertData(data) {
    return data.reduce((acc, current) => {
      const found = acc.find(
        (item) =>
          item.class_code === current.class_code && item.day === current.day
      );
      if (!found) {
        acc.push(current);
      }
      return acc;
    }, []);
  }

  static processDimData(payload, results, dataKey, type = "main", res = []) {
    const createData = [];
    const updateData = [];
    const currentTime = this.getCurrentTime();

    Object.values(payload).forEach((item) => {
      let resultItem = null;

      resultItem = results.find(
        (r) =>
          r.class_code === item.class_code &&
          moment(r.day).format("YYYY-MM-DD") ===
            moment(item.day).format("YYYY-MM-DD")
      );

      if (resultItem) {
        item[dataKey].forEach((dataItem, index) => {
          let dimData = [];
          let {
            family_influence_other,
            japanese_language_need_other,
            ...rest
          } = dataItem;

          if (type === "other") {
            let i = res.find(
              (r) =>
                r.class_session === dataItem.class_session &&
                r.student_code === dataItem.student_code
            );
            dimData.push({
              text:
                family_influence_other && i.family_influence === 83
                  ? family_influence_other
                  : null,
              orther_id: 83,
              daily_checkin_evaluation_id: i.id,
              created_at: currentTime,
              updated_at: currentTime,
            });

            dimData.push({
              text:
                japanese_language_need_other && i.japanese_language_need === 59
                  ? japanese_language_need_other
                  : null,
              orther_id: 59,
              daily_checkin_evaluation_id: i.id,
              created_at: currentTime,
              updated_at: currentTime,
            });
          } else {
            dimData = {
              ...rest,
              id_daily_checkin: resultItem.id,
              created_by: resultItem.created_by,
              updated_by: resultItem.updated_by,
              created_at: currentTime,
              updated_at: currentTime,
            };
          }

          if (resultItem.isUpdated) {
            updateData.push(dimData);
          } else {
            createData.push(dimData);
          }
        });
      }
    });

    return { createData, updateData };
  }

  static async handleDimData(createData, updateData, service) {
    if (updateData.length > 0) {
      return await service.update(updateData);
    }

    if (createData.length > 0) {
      return await service.create(createData);
    }
  }

  static async create(payload) {
    try {
      const results = await this.processMainRecords(payload);

      const {
        createData: dimCheckinCreateData,
        updateData: dimCheckinUpdateData,
      } = this.processDimData(payload, results, "check_in");

      await this.handleDimData(
        dimCheckinCreateData,
        dimCheckinUpdateData,
        DimDailyCheckinService
      );

      return true;
    } catch (error) {
      throw error;
    }
  }

  static async evaluation(payload) {
    try {
      const results = await this.processMainRecords(payload);

      const {
        createData: dimEvaluationCreateData,
        updateData: dimEvaluationUpdateData,
      } = this.processDimData(payload, results, "evaluation");

      const results2 = await this.handleDimData(
        dimEvaluationCreateData,
        dimEvaluationUpdateData,
        DimDailyEvaluationService
      );

      const { createData: ortherCreateData, updateData: ortherUpdateData } =
        this.processDimData(payload, results, "evaluation", "other", results2);

      const flattenCreateData = ortherCreateData.flat();
      const flattenUpdateData = ortherUpdateData.flat();

      if (flattenCreateData.length > 0 || flattenUpdateData.length > 0) {
        await this.handleDimData(
          flattenCreateData,
          flattenUpdateData,
          EvaluationOtherOptionServide
        );
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  static async getListStudentCheckin(
    class_code,
    day,
    student_codes,
    class_session
  ) {
    try {
      return await DailyCheckinModel.getListStudentCheckin(
        class_code,
        day,
        student_codes,
        class_session
      );
    } catch (error) {
      throw error;
    }
  }

  static async getStudentEvaluation(payload) {
    try {
      return await DailyCheckinModel.getStudentEvaluation(payload);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = { DailyCheckinService };
