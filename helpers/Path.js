
const path = require('node:path');

class Path {

    static storagePath(pathName) 
    {
        let storagePath = path.join(__dirname, '../storage/');
        return storagePath + pathName;
    }
}

module.exports = { Path };
