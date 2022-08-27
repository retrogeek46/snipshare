const { NativeImage } = require('electron');
const electron = require('electron');
const path = require("path");
const server = require("./server.js");
const keyboard = require("./services/keyboard.js");
var ImageJS = require("imagejs");
const { app, BrowserWindow, Tray, Menu, dialog, clipboard, globalShortcut, ipcMain } = electron;
const nativeImage = require("electron").nativeImage;
const logger = require("./utils/logger");
const utils = require("./utils/utils");
const spawn = require("child_process").spawn;
const kill = require("tree-kill");

let mainWindow;
let activeWinProcess;

const createMainWindow = () => {
    let win = new BrowserWindow({
        width: 900,
        height: 480,
        icon: path.join(__dirname, "/Resources/cut-paper.png"),
        transparent: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        autoHideMenuBar: true,
        center: true,
        thickFrame: true,
        backgroundColor: "#2e2c29",
    });
    
    win.loadFile(path.join(__dirname, 'static/index.html'))

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
    logger.info("Creating draw window");

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
    keyboard.updateKeyboard(1);
}

const getKeyboardState = () => {
    keyboard.getKeyboardState();
}

const resetKeyboard = () => {
    keyboard.resetKeyboard();
}

const updateCurrentOS = () => {
    keyboard.updateKeyboard(4, 1);
}

const attachKeyboardListener = () => {
    let keyboardObj = keyboard.getKeyboard();
    if (keyboardObj) {
        keyboardObj.on("data", (val) => {
            if (val[0] == 23) {
                logger.info("received keyboard data in main");
                mainWindow.webContents.send("updateKeyboardState", {
                    "encoderState": val[1],
                    "layerState": val[2],
                    "currentOS": val[3]
                });
            }
        });
    } else {

    }
};

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

const spawnActiveWinProcess = () => {
    activeWinProcess = spawn('cd E:/Coding/C#/ActiveWinTest && dotnet run Program.cs', { shell: true })
}

const killActiveWinProcess = () => {
    if (activeWinProcess != null) {
        kill(activeWinProcess.pid);
    }
}

app.on('ready', async () => {
    utils.clearLogs(app.getAppPath());
    await server.server(this);
    await server.startSystemInfoTimer();
    global.serverIP = server.getServerIP();
    global.appVersion = app.getVersion();
    // TODO: handle active win so that it is optional 
    // spawnActiveWinProcess();
    
    const qmkGetKeyboardState = globalShortcut.register(
        "Ctrl+Alt+-",
        () => {
            attachKeyboardListener();
        }
    );
    const qmkUpdateOSRegister = globalShortcut.register(
        "Ctrl+Alt+0",
        () => {
            killActiveWinProcess();
        }
    );
    const sendSnipRegister = globalShortcut.register(
        "Ctrl+Alt+9",
        () => {
            sendSnip();
        }
    );
    const qmkUpdateEncoderRegister = globalShortcut.register(
        "Ctrl+Alt+8",
        async () => {
            sendEncoderStateChange();
        }
    );
    const qmkGetEncoderRegister = globalShortcut.register(
        "Ctrl+Alt+7",
        async () => {
            // getEncoderState();
            resetKeyboard();
        }
    );
    const startSystemInfoTimer = globalShortcut.register(
        "Ctrl+Alt+6",
        async () => {
            await server.startSystemInfoTimer();
        }
    );
    const stopSystemInfoTimer = globalShortcut.register(
        "Ctrl+Alt+5",
        async () => {
            server.stopSystemInfoTimer();
        }
    );
    mainWindow = createMainWindow();

    // mainWindow.webContents.openDevTools();
    // mainWindow.minimize();

    // const nodeAbi = require("node-abi");
    // logger.info(nodeAbi.getAbi("14.16.1", "node"));
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    killActiveWinProcess();
})

ipcMain.on("applyKeyboardRGB", (event, message) => {
    keyboard.updateKeyboard(5, [message["r"], message["g"], message["b"]]);
});

exports.initDrawWindow = (height, width) => {
    logger.info(`height is ${height}, width is ${width}`);
    createDrawWindow(height, width);
};

exports.updateCurrentOS = (currentOS) => {
    // console.log("in ipc Main");
    mainWindow.webContents.send("updateCurrentOS", currentOS);
};

// exports.testMethod = (msg) => {
//     logger.info(`received ${msg}`);
// }

// exports.createImageFromBuffer = (buffer) => {
//     return nativeImage.createFromBuffer(buffer);
// };