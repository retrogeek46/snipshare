const { networkInterfaces } = require("os");
const express = require("express");
const cors = require("cors");
// const https = require("https");
const http = require("http");
const fs = require("fs");
const app = express();
const nativeImage = require("electron").nativeImage;
app.use(cors());

const key = fs.readFileSync(__dirname + "/../ssl_cert/key.pem");
const cert = fs.readFileSync(__dirname + "/../ssl_cert/cert.pem");
const options = {
    key: key,
    cert: cert,
};

// const server = https.createServer(options, app);
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server, {
    cors: {
        origin: "https://localhost:3444",
        methods: ["GET", "POST"],
    }
});

io.on("connection", (socket) => {
    socket.on("fromClient", (msg) => {
        // create native image from buffer
        let img = nativeImage.createFromDataURL(msg);
        this.emitMessage("snipShare", img.toDataURL());
    });
    // socket.onAny((event, ...args) => {
    //     console.log(`got ${event}`);
    // });
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

exports.emitMessage = (tag, message) => {
    io.emit(tag, message)
}

const port = 3456;

exports.getServerIP = () => {
    const nets = networkInterfaces();
    const results = Object.create(null); // Or just '{}', an empty object

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }
    return results["Ethernet"][0] + ":" + String(port);
}

server.listen(port, () => {
    console.log("listening on " + this.getServerIP());
});
