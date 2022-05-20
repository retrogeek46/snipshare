const { networkInterfaces } = require("os");
const express = require("express");
const cors = require("cors");
// const https = require("https");
const http = require("http");
const fs = require("fs");
const app = express();
const nativeImage = require("electron").nativeImage;
const { keyboard, Key, mouse, Point, left, right, up, down, screen } = require("@nut-tree/nut-js");
const systemInfo = require("./services/systemMonitor.js");
const keyboardQmk = require("./services/keyboard.js");
const logger = require("./utils/logger");

app.use(cors());

const key = fs.readFileSync(__dirname + "/../ssl_cert/key.pem");
const cert = fs.readFileSync(__dirname + "/../ssl_cert/cert.pem");
const options = {
    key: key,
    cert: cert,
};

const systemInfoInterval = 500;
let systemInfoTimer = null;

const server = async (electronObj) => {
    // const server = https.createServer(options, app);
    const server = http.createServer(app);
    const socket = require("socket.io");
    const io = socket(server, {
        cors: {
            origin: "https://localhost:3444",
            methods: ["GET", "POST"],
        },
    });

    mouse.config.autoDelayMs = 1;
    // mouse.config.mouseSpeed = 500;

    io.on("connection", async (socket) => {
        socket.on("disconnect", (msg) => {
            logger.info(socket.id + " disconnected due to " + msg);
        });
        socket.on("connected", (msg) => {
            logger.info(`got ${msg}, client connected`);
        });
        socket.on("fromWeb", (msg) => {
            // create native image from buffer
            let img = nativeImage.createFromDataURL(msg);
            this.emitMessage("snipShare", img.toDataURL());
        });
        socket.on("fromAndroid", async (msg) => {
            // create native image from buffer
            logger.info(`got ${msg}`);
            await keyboard.type(Key[Number(msg)]);
        });
        socket.on("startDraw", async (msg) => {
            logger.info(msg);
            const height = msg.split("|")[0];
            const width = msg.split("|")[1];
            electronObj.initDrawWindow(height, width);
        });
        socket.on("draw", async (msg) => {
            // logger.info(msg);
            let currentPos = await mouse.getPosition();
            const x = currentPos.x - parseFloat(msg.split("|")[0]);
            const y = currentPos.y - parseFloat(msg.split("|")[1]);
            // logger.info(`x: ${x}, y: ${y}`);
            // await mouse.move([new Point(x, y)]);
            await mouse.drag([new Point(x, y)]);
            // electronObj.testMethod(`x: ${x}, y: ${y}`)
        });
        // socket.onAny(async (event, ...args) => {
        //     logger.info(`got ${event}`);
        //     // await mouse.move(right(500));
        // });
    });

    exports.startSystemInfoTimer = async () => {
        logger.info("Starting system info timer");
        systemInfoTimer = setInterval(async () => {
            const systemData = await systemInfo.getSystemInfo();
            // logger.info(systemData);
            const systemInfoValues = systemData["HKCU\\SOFTWARE\\HWiNFO64\\VSB"]["values"];
            // logger.info(systemData["HKCU\\SOFTWARE\\HWiNFO64\\VSB"]);

            let cpuVoltage = systemInfoValues["Value2"]["value"];
            let cpuTempRaw = systemInfoValues["ValueRaw4"]["value"];
            let cpuUsageRaw = systemInfoValues["ValueRaw3"]["value"];
            let cpuTemp = cpuTempRaw.toString() + "C";
            let cpuUsage = cpuUsageRaw.toString() + "%";
            if (Number(cpuTempRaw) > 60) {
                keyboardQmk.updateKeyboard(12);
            } else {
                keyboardQmk.updateKeyboard(13);
            }
            keyboardQmk.updateKeyboard(14,parseInt(cpuUsageRaw));
            // let cpuVoltage = systemInfoValues["Value2"]["value"];
            const msg = `CPU Temp: ${cpuTemp}, CPU Voltage: ${cpuVoltage}, CPU Usage: ${cpuUsage}`;
            // logger.sysinfo(msg);
            this.emitMessage("systemInfo", msg);
        }, systemInfoInterval);
    }

    exports.stopSystemInfoTimer = () => {
        logger.info("Stopping system info timer");
        clearInterval(systemInfoTimer);
    }

    // exports.startSystemInfoTimer = async () => {
    //     const systemData = await systemInfo.getSystemInfo();
    //     // logger.info(systemData);
    //     const systemInfoValues = systemData["HKCU\\SOFTWARE\\HWiNFO64\\VSB"]["values"];
    //     const msg = `CPU Voltage: ${systemInfoValues["Value2"]["value"]}`;
    //     logger.info(msg);
    //     this.emitMessage("systemInfo", msg);
    // };

    app.get("/", (req, res) => {
        res.sendFile(__dirname + "/static/index.html");
    });

    app.get("/connect", (req, res) => {
        res.send("hi");
    });

    exports.emitMessage = (tag, message) => {
        io.emit(tag, message);
    };

    const port = 3456;

    exports.getServerIP = () => {
        try {
            const nets = networkInterfaces();
            const results = Object.create(null); // Or just '{}', an empty object

            for (const name of Object.keys(nets)) {
                for (const net of nets[name]) {
                    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
                    if (net.family === "IPv4" && !net.internal) {
                        if (!results[name]) {
                            results[name] = [];
                        }
                        results[name].push(net.address);
                    }
                }
            }
            // logger.info(results);
            if (!("Ethernet" in results)) {
                // logger.info(results[0][0]);
                return (
                    results["vEthernet (New Virtual Switch)"][0] +
                    ":" +
                    String(port)
                );
            }
                return results["Ethernet"][0] + ":" + String(port);
        } catch (ex) {
            logger.error(ex);
            return "";
        }
    };

    server.listen(port, () => {
        logger.info("listening on " + this.getServerIP());
    });
};

module.exports.server = server;
