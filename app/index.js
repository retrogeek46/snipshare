const { NativeImage } = require('electron');
const electron = require('electron');
const path = require("path");
const server = require("./server.js");
var ImageJS = require("imagejs");
const { app, BrowserWindow, Tray, Menu, dialog, clipboard, globalShortcut } =
    electron;

let mainWindow;

createMainWindow = () => {
    let win = new BrowserWindow({
        width: 900,
        height: 493,
        icon: path.join(__dirname, 'cut-paper.png'),
        transparent: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
        },
        autoHideMenuBar: true,
        center: true,
        thickFrame: true,
    });
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

        const nativeImage = require("electron").nativeImage;
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
            let rotatedImage = RotateImage(clipboardImage);
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
    let appIcon = new Tray(path.join(__dirname, "cut-paper.png"));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Send Snippet', click: function () {sendSnip()} },
        { label: 'Exit', click: function () {
                app.isQuitting = true;
                app.quit();
            }
        }
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
    mainWindow.minimize();
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
})