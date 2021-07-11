const electron = require('electron');
const path = require("path");
const server = require("./server.js");
const { app, BrowserWindow, Tray, Menu, dialog, clipboard, globalShortcut } =
    electron;

let mainWindow;

createMainWindow = () => {
    let win = new BrowserWindow({
        width: 900,
        height: 493,
        icon: path.join(__dirname, 'cloud_fun.ico'),
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
        // const successOptions = {
        //     buttons: ["OK"],
        //     title: "Data Sent",
        //     message: "Data sent successfully",
        // };
        // dialog.showMessageBox(null, successOptions);
        server.emitMessage('snipShare', clipboardImage.toDataURL());
    }
}

createTray = () => {
    let appIcon = new Tray(path.join(__dirname, "cloud_fun.ico"));
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
    // console.log('App Running');
    const globalShortcutRegister = globalShortcut.register("Ctrl+Alt+9", () => {
        sendSnip();
    });
    mainWindow = createMainWindow();
    mainWindow.minimize();
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
})