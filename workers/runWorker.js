// runWorker.js
const { Worker } = require("node:worker_threads");
const path = require("node:path");

function runWorker(filename, workerFunction, workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.resolve(__dirname, filename), {
      workerData: { workerFunction: workerFunction, ...workerData },
    });

    worker.on("message", (result) => resolve(result));
    worker.on("error", (err) => {
      reject(err);
    });
    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

function runWorkerV2(filename, workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.resolve(__dirname, filename), {
      workerData: { ...workerData },
    });

    worker.on("message", (result) => resolve(result));
    worker.on("error", (err) => {
      reject(err);
    });
    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

module.exports = { runWorker, runWorkerV2 };
