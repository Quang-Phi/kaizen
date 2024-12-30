const { Path } = require("../helpers/Path")

const logging = () => {
    return {
        "resp-sharepoint-add": {
            'error': Path.storagePath('logs/student/error/error-response.log'),
            'path': Path.storagePath('logs/student/add/response.log')
        },
        "req-commands-get-class": {
            'error': Path.storagePath('logs/commands/get-class/error/error-req-commands-get-class.log'),
            'path': Path.storagePath('logs/commands/get-class/request/req-commands-get-class.log')
        },
        "req-commands-get-teacher": {
            'error': Path.storagePath('logs/commands/get-teacher/error/error-req-commands-get-teacher.log'),
            'path': Path.storagePath('logs/commands/get-teacher/request/req-commands-get-teacher.log')
        },
        "class-create": {
            'error': Path.storagePath('logs/class/create/error/error-class-create.log'),
            'path': Path.storagePath('logs/class/create/class-create.log')
        },
        "class-calendar": {
            'error': Path.storagePath('logs/class/calendar/error/error-class-calendar.log'),
            'path': Path.storagePath('logs/class/calendar/class-calendar.log')
        },
        "default-log": {
            'error': Path.storagePath('logs/default-log/error/error-default-log.log'),
            'path': Path.storagePath('logs/default-log/default-log.log')
        }
    }
}

const channels = (name) => {
    return logging()[name];
}

module.exports = { channels };
