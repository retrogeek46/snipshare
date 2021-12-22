const { NativeImage } = require('electron');
const electron = require('electron');
const path = require("path");
const server = require("./server.js");
var ImageJS = require("imagejs");
const { app, BrowserWindow, Tray, Menu, dialog, clipboard, globalShortcut } =
    electron;
const nativeImage = require("electron").nativeImage;

let mainWindow;

createMainWindow = () => {
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
    const windowContent = [
        "<body>",
        `<p style="
            text-align:center; 
            font-family: 'JetBrains Mono', 'Courier New'; 
            color: white;
            font-size:120%;
            margin: 0;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);">The webpage is hosted at ${serverIP}</p>`,
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

createDrawWindow = () => {
    console.log("Creating draw window");

    let win = new BrowserWindow({
        width: 400,
        height: 400,
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

RotateImage = (imageToRotate) => {
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

sendSnip = () => {
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

createTray = () => {
    let appIcon = new Tray(path.join(__dirname, "/Resources/cut-paper.png"));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Send Snippet', click: function () {sendSnip()} },
        { label: 'Exit', click: function () {
                app.isQuitting = true;
                app.quit();
            }
        },
        { label: 'Show Draw Window', click: function () { createDrawWindow() }}
    ]);
    appIcon.on('double-click', (event) => {
        mainWindow.show();
    });
    appIcon.setToolTip('SnipShare');
    appIcon.setContextMenu(contextMenu);
    return appIcon;
}

app.on('ready', () => {
    const globalShortcutRegister = globalShortcut.register("Ctrl+Alt+9", () => {
        sendSnip();
    });
    mainWindow = createMainWindow();
    // mainWindow.minimize();

    // const nodeAbi = require("node-abi");
    // console.log(nodeAbi.getAbi("14.16.1", "node"));

});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
})

// exports.createImageFromBuffer = (buffer) => {
//     return nativeImage.createFromBuffer(buffer);
// };