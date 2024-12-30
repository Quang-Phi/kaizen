// worker.js
const { parentPort, workerData } = require('node:worker_threads');
const { DimContactModel } = require('../../models/Kaizen/DimContactModel');

async function executeCreate(data) {
    try {
        console.log(workerData.data);
        const data = workerData.data

        // const whereContact = {student_code: data.student_code, type_value: data.type_value, type_person: data.type_person, value: data.value};
        // const contact_id = await DimContactModel.find(['id'], whereContact)
        // let result = {};
        // if (contact_id) {
        //     result = await DimContactModel.update({}, whereContact)
        // } else {
        //     result = await DimContactModel.create(workerData.data)
        // }
        const whereContact = {student_id: data.student_id, type_value: data.type_value, type_person: data.type_person};
        const isDelete = await DimContactModel.delete(whereContact);
        console.log(isDelete)
        const result = await DimContactModel.create(workerData.data)
        
        parentPort.postMessage(result); // Gửi kết quả về main thread
    } catch (err) {
        parentPort.postMessage({ error: 1, message: err.message }); // Gửi lỗi nếu có
    }
}

const action = workerData.type;
switch (action) {
    case 'create':
        executeCreate(); // Xử lý tác vụ 'create'
        break;
    default:
        parentPort.postMessage({ error: 1, message: `Unknown action: ${action.type}` });
}
