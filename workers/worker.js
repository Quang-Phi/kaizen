const { parentPort, workerData } = require("node:worker_threads");
const path = require("path");

async function executeTask() {
  try {
    // Chuyển đổi hàm từ chuỗi thành hàm thực thi
    const workerFunction = new Function(
      "return " + workerData.workerFunction
    )();

    const result = await workerFunction(workerData.workerData);
    parentPort.postMessage(result); // Gửi kết quả về main thread
  } catch (err) {
    parentPort.postMessage({ error: 1, message: err.message }); // Gửi lỗi nếu có
  }
}

executeTask();
