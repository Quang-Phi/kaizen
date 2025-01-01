const { Path } = require("./Path");
const { channels } = require("../config/logging");
const path = require("node:path");
const moment = require("moment");
const fs = require("node:fs");

class Logs {
  static async logText(channel, text) {
    const log = channels(channel);

    const basename =
      path.basename(log.path, path.extname(log.path)) +
      "-" +
      moment().format("YYYY-MM-DD");

    const dirname = path.dirname(log.path);
    const logPath = `${dirname}/${basename}.log`;
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }

    let content = `[${moment().format(
      "YYYY-MM-DD HH:mm:ss"
    )}] local.INFO: ${text}\n`;

    fs.writeFile(`${logPath}`, content, { flag: "a+" }, (err) => {
      if (err) {
        return console.log(err);
      }

      console.log("The file is saved!");
    });
  }

  static async logError(channel, text) {
    const log = channels(channel);

    const basename =
      path.basename(log.error, path.extname(log.error)) +
      "-" +
      moment().format("YYYY-MM-DD");

    const dirname = path.dirname(log.error);
    const logPath = `${dirname}/${basename}.log`;
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }

    let content = `[${moment().format(
      "YYYY-MM-DD HH:mm:ss"
    )}] local.ERROR: ${text}\n`;

    fs.writeFile(`${logPath}`, content, { flag: "a+" }, (err) => {
      if (err) {
        return console.log(err);
      }

      console.log("The file is saved!");
    });
  }
}

module.exports = { Logs };
