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

app.use(cors());

const key = fs.readFileSync(__dirname + "/../ssl_cert/key.pem");
const cert = fs.readFileSync(__dirname + "/../ssl_cert/cert.pem");
const options = {
    key: key,
    cert: cert,
};

const systemInfoInterval = 2000;
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
            console.log(socket.id + " disconnected due to " + msg);
        });
        socket.on("connected", (msg) => {
            console.log(`got ${msg}, client connected`);
        });
        socket.on("fromWeb", (msg) => {
            // create native image from buffer
            let img = nativeImage.createFromDataURL(msg);
            this.emitMessage("snipShare", img.toDataURL());
        });
        socket.on("fromAndroid", async (msg) => {
            // create native image from buffer
            console.log(`got ${msg}`);
            await keyboard.type(Key[Number(msg)]);
        });
        socket.on("startDraw", async (msg) => {
            console.log(msg);
            const height = msg.split("|")[0];
            const width = msg.split("|")[1];
            electronObj.initDrawWindow(height, width);
        });
        socket.on("draw", async (msg) => {
            // console.log(msg);
            let currentPos = await mouse.getPosition();
            const x = currentPos.x - parseFloat(msg.split("|")[0]);
            const y = currentPos.y - parseFloat(msg.split("|")[1]);
            // console.log(`x: ${x}, y: ${y}`);
            // await mouse.move([new Point(x, y)]);
            await mouse.drag([new Point(x, y)]);
            // electronObj.testMethod(`x: ${x}, y: ${y}`)
        });
        // socket.onAny(async (event, ...args) => {
        //     console.log(`got ${event}`);
        //     // await mouse.move(right(500));
        // });
    });

    exports.startSystemInfoTimer = async () => {
        console.log("Starting system info timer");
        systemInfoTimer = setInterval(async () => {
            const systemData = await systemInfo.getSystemInfo();
            // console.log(systemData);
            const systemInfoValues = systemData["HKCU\\SOFTWARE\\HWiNFO64\\VSB"]["values"];
            // console.log(systemData["HKCU\\SOFTWARE\\HWiNFO64\\VSB"]);

            let cpuVoltage = systemInfoValues["Value2"]["value"];
            let cpuTempRaw = systemInfoValues["ValueRaw4"]["value"];
            let cpuTemp = cpuTempRaw.toString() + "C";
            if (Number(cpuTempRaw) > 60) {
                keyboardQmk.updateKeyboard(12);
            } else {
                keyboardQmk.updateKeyboard(13);
            }
            // let cpuVoltage = systemInfoValues["Value2"]["value"];
            const msg = `CPU Temp: ${cpuTemp}, CPU Voltage: ${cpuVoltage}`;
            console.log(msg);
            this.emitMessage("systemInfo", msg);
        }, systemInfoInterval);
    }

    exports.stopSystemInfoTimer = () => {
        console.log("Stopping system info timer");
        clearInterval(systemInfoTimer);
    }

    // exports.startSystemInfoTimer = async () => {
    //     const systemData = await systemInfo.getSystemInfo();
    //     // console.log(systemData);
    //     const systemInfoValues = systemData["HKCU\\SOFTWARE\\HWiNFO64\\VSB"]["values"];
    //     const msg = `CPU Voltage: ${systemInfoValues["Value2"]["value"]}`;
    //     console.log(msg);
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
            // console.log(results);
            if (!("Ethernet" in results)) {
                // console.log(results[0][0]);
                return (
                    results["vEthernet (New Virtual Switch)"][0] +
                    ":" +
                    String(port)
                );
            }
                return results["Ethernet"][0] + ":" + String(port);
        } catch (ex) {
            console.log(ex);
            return "";
        }
    };

    server.listen(port, () => {
        console.log("listening on " + this.getServerIP());
    });
};

module.exports.server = server;
