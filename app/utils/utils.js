const fs = require("fs");
const path = require("path");
const logger = require("./logger");

exports.clearLogs = (rootPath) => {
    const logPath = path.join(rootPath, process.env.SYSINFO_PATH);
    try {
        fs.unlinkSync(logPath);
    }
    catch (ex) {
        logger.error(ex);
    }   
}

