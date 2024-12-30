// worker.js
const { parentPort, workerData } = require('node:worker_threads');
const { RegisterClassStudentModel } = require('../../models/Kaizen/RegisterClassStudentModel');

async function executeCreate(data) {
    try {
        // Lấy hàm cần gọi từ RegisterClassStudentModel
        const data = workerData.data

        // const functionToCall = RegisterClassStudentModel[functionName].bind(RegisterClassStudentModel);

        // Kiểm tra xem functionToCall có phải là một hàm không
        // if (typeof functionToCall !== 'function') {
        //     throw new Error(`Function ${functionName} is not defined in RegisterClassStudentModel`);
        // }
        // 'register_class_code',
        // 'student_code',
        // 'teacher_code',
        // const whereContact = {student_code: data.student_code, type_value: data.type_value, type_person: data.type_person};
        const exist = await RegisterClassStudentModel.isExists({
            register_class_code: data.register_class_code,
            student_code: data.student_code
        });
        
        let result = {}
        if (exist) {
            result = await RegisterClassStudentModel.updated(data, {
                register_class_code: data.register_class_code,
                student_code: data.student_code,
                status: data.status,
            });
        } else {
            result = await RegisterClassStudentModel.create(data)
        }

        // const result = await RegisterClassStudentModel.create(workerData.data)

        // Gọi hàm và truyền các tham số
        // const result = await functionToCall(workerData.data);
        
        parentPort.postMessage(result); // Gửi kết quả về main thread
    } catch (err) {
        parentPort.postMessage({ error: 1, message: err.message }); // Gửi lỗi nếu có
    }
}

const action = workerData.type;
console.log(action, 'test')
switch (action) {
    case 'create':
        executeCreate(); // Xử lý tác vụ 'create'
        break;
    default:
        parentPort.postMessage({ error: 1, message: `Unknown action: ${action.type}` });
}
