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

getServerIP = () => {
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
    return results["Ethernet"][0]
}

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
    // res.send('hello');
});

// io.on("connection", (socket) => {
//     // console.log("a user connected");
//     // socket.on("disconnect", () => {
//         // console.log("user disconnected");
//     // });
//     // socket.on("snipShare", (msg) => {
//         // console.log("message: " + msg);
//     // });
// });

exports.emitMessage = (tag, message) => {
    io.emit(tag, message)
}

const port = 3456;

server.listen(port, () => {
    console.log("listening on " + getServerIP() + ":" + String(port));
});
