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
    // res.send('hello');
});

io.on("connection", (socket) => {
    console.log("a user connected");
    socket.on("disconnect", () => {
        console.log("user disconnected");
    });

    socket.on("snipShare", (msg) => {
        console.log("message: " + msg);
    });
});

exports.emitMessage = (tag, message) => {
    io.emit(tag, message)
}

server.listen(3456, () => {
    console.log("listening on *:3456");
});
