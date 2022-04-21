const { NativeImage } = require('electron');
const electron = require('electron');
const path = require("path");
const server = require("./server.js");
const keyboard = require("./services/keyboard.js");
var ImageJS = require("imagejs");
const { app, BrowserWindow, Tray, Menu, dialog, clipboard, globalShortcut } = electron;
const nativeImage = require("electron").nativeImage;

let mainWindow;

const createMainWindow = () => {
    let win = new BrowserWindow({
        width: 900,
        height: 480,
        icon: path.join(__dirname, "/Resources/cut-paper.png"),
        transparent: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
        },
        autoHideMenuBar: true,
        center: true,
        thickFrame: true,
        backgroundColor: "#2e2c29",
    });

    const serverIP = server.getServerIP();
    const windowMsg = serverIP != "" ? "The webpage is hosted at " + serverIP : "Cannot get serverIP";
    const versionMsg = "Current Version: " + app.getVersion();
    const windowContent = [
        "<body>",
        `<p style="
            text-align:center; 
            font-family: 'JetBrains Mono', 'Courier New'; 
            color: white;
            font-size:90%;
            margin: 0;
            position: absolute;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);">${versionMsg}</p>`,
        `<p style="
            text-align:center; 
            font-family: 'JetBrains Mono', 'Courier New'; 
            color: white;
            font-size:120%;
            margin: 0;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);">${windowMsg}</p>`,
        "</body>",
    ].join("");
    win.loadURL("data:text/html;charset=utf-8," + encodeURI(windowContent));

    let tray = null;
    win.on('minimize', function (event) {
        event.preventDefault();
        win.hide();
        tray = createTray();
    });
    win.on('restore', function (event) {
        win.show();
        tray.destroy();
    });
    return win;
}

const createDrawWindow = (height, width) => {
    console.log("Creating draw window");

    let win = new BrowserWindow({
        width: width,
        height: height,
        icon: path.join(__dirname, "/Resources/cut-paper.png"),
        // transparent: true,
        frame: false,
        alwaysOnTop: true,
        backgroundColor: "#2e2c29",
        opacity: 0.25
    });

    win.setIgnoreMouseEvents(true);
    win.setFocusable(false);

    return win
};

const RotateImage = (imageToRotate) => {
    let { width, height } = imageToRotate.getSize();
    let imageBmp = imageToRotate.getBitmap()
    if (width > height) {
        imageBmp = new ImageJS.Bitmap({
            width: width,
            height: height,
            data: imageToRotate.getBitmap(),
        });
        imageBmp = imageBmp.rotate({ degrees: 270 , fit: "pad"});
        height = imageBmp._data.height; 
        width = imageBmp._data.width;

        return nativeImage.createFromBitmap(imageBmp._data.data, {
            width: width,
            height: height,
        });
    } else {
        return imageToRotate;
    }
};

const sendSnip = () => {
    let clipboardImage = clipboard.readImage();
    if (clipboardImage.isEmpty()) {
        const errorOptions = {
            buttons: ["OK"],
            title: "Invalid Data",
            message: "The data in clipboard is not a valid image",
        };
        dialog.showMessageBox(null, errorOptions);
    } else {
        // rotate image
        try {
            let rotatedImage = clipboardImage;
            // let rotatedImage = RotateImage(clipboardImage);
            server.emitMessage("snipShare", rotatedImage.toDataURL());
        } catch (err) {
            const errorOptions = {
                buttons: ["OK"],
                title: "Unhandled Exception",
                message: err.toString(),
            };
            dialog.showMessageBox(null, errorOptions);
        }
    }
}

const sendEncoderStateChange = () => {
    keyboard.updateKeyboard(10);
}

const getEncoderState = () => {
    keyboard.getEncoderState();
}

const createTray = async () => {
    let appIcon = new Tray(path.join(__dirname, "/Resources/cut-paper.png"));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: "Send Snippet",
            click: function () {
                sendSnip();
            },
        },
        {
            label: "Show Draw Window",
            click: function () {
                createDrawWindow();
            },
        },
        {
            label: "Start sending System Info",
            click: async function () {
                await server.startSystemInfoTimer();
            },
        },
        {
            label: "Stop sending System Info",
            click: function () {
                server.stopSystemInfoTimer();
            },
        },
        {
            label: "Exit",
            click: function () {
                app.isQuitting = true;
                app.quit();
            },
        },
    ]);
    appIcon.on('double-click', (event) => {
        mainWindow.show();
    });
    appIcon.setToolTip('SnipShare');
    appIcon.setContextMenu(contextMenu);
    return appIcon;
}

app.on('ready', async () => {
    await server.server(this);
    await server.startSystemInfoTimer();
    const sendSnipRegister = globalShortcut.register("Ctrl+Alt+9", () => {
        sendSnip();
    });
    const qmkUpdateEncoderRegister = globalShortcut.register("Ctrl+Alt+8", async () => {
        sendEncoderStateChange();
    });
    const qmkGetEncoderRegister = globalShortcut.register("Ctrl+Alt+7", async () => {
        getEncoderState();
    });
    const startSystemInfoTimer = globalShortcut.register("Ctrl+Alt+6", async () => {
        await server.startSystemInfoTimer();
    });
    const stopSystemInfoTimer = globalShortcut.register("Ctrl+Alt+5", async () => {
        server.stopSystemInfoTimer();
    });
    mainWindow = createMainWindow();
    // mainWindow.minimize();

    // const nodeAbi = require("node-abi");
    // console.log(nodeAbi.getAbi("14.16.1", "node"));

});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
})

exports.initDrawWindow = (height, width) => {
    console.log(`height is ${height}, width is ${width}`);
    createDrawWindow(height, width);
};

// exports.testMethod = (msg) => {
//     console.log(`received ${msg}`);
// }

// exports.createImageFromBuffer = (buffer) => {
//     return nativeImage.createFromBuffer(buffer);
// };