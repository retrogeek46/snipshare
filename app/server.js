const { networkInterfaces } = require("os");
const express = require("express");
const cors = require("cors");
const http = require("http");
const app = express();
app.use(cors());


const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server, {
    cors: {
        origin: "http://localhost:3444",
        methods: ["GET", "POST"],
    },
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
