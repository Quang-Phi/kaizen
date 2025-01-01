const { parentPort, workerData } = require("node:worker_threads");
const { HocVienModel } = require("../models/Kaizen/HocVienModel");

async function executeTask() {
  try {
    // Lấy hàm cần gọi từ HocVienModel
    const functionName = workerData.workerFunction;
    const functionToCall = HocVienModel[functionName];

    // Kiểm tra xem functionToCall có phải là một hàm không
    if (typeof functionToCall !== "function") {
      throw new Error(
        `Function ${functionName} is not defined in HocVienModel`
      );
    }

    // Gọi hàm và truyền các tham số
    const result = await functionToCall(
      workerData.filter,
      workerData.page,
      workerData.pageSize
    );
    parentPort.postMessage(result); // Gửi kết quả về main thread
  } catch (err) {
    parentPort.postMessage({ error: 1, message: err.message }); // Gửi lỗi nếu có
  }
}

executeTask();
