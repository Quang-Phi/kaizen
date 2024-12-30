const schedule = require('node-schedule');
require('dotenv').config();

const { GetClass } = require('./Commands/GetClass');
// schedule.scheduleJob('* * * * *', GetClass.handle);
// schedule.scheduleJob('* 1 * * *', GetClass.handle);


const { GetTeacher } = require('./Commands/GetTeacher');
// schedule.scheduleJob('*/5 * * * *', GetTeacher.handle);
schedule.scheduleJob('* * * * *', GetTeacher.handle);