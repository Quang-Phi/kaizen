// worker.js
const { parentPort, workerData } = require("node:worker_threads");
const {
  RegisterClassStudentModel,
} = require("../../models/Kaizen/RegisterClassStudentModel");

async function executeCreate(data) {
  try {
    // Lấy hàm cần gọi từ RegisterClassStudentModel
    const data = workerData.data;
    const exist = await RegisterClassStudentModel.isExists({
      register_class_code: data.register_class_code,
      student_code: data.student_code,
    });

    let result = {};
    if (exist) {
      result = await RegisterClassStudentModel.updated(data, {
        register_class_code: data.register_class_code,
        student_code: data.student_code,
        status: data.status,
      });
    } else {
      result = await RegisterClassStudentModel.create(data);
    }

    parentPort.postMessage(result); // Gửi kết quả về main thread
  } catch (err) {
    parentPort.postMessage({ error: 1, message: err.message }); // Gửi lỗi nếu có
  }
}

const action = workerData.type;
switch (action) {
  case "create":
    executeCreate(); // Xử lý tác vụ 'create'
    break;
  default:
    parentPort.postMessage({
      error: 1,
      message: `Unknown action: ${action.type}`,
    });
}
