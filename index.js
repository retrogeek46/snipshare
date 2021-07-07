const electron = require('electron');
const path = require("path");

const { app, BrowserWindow, Tray, Menu, Notification, dialog, clipboard } = electron;

let mainWindow;

function createMainWindow() {
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
    // const url = "http://localhost:3002";

    // win.loadURL(url).then(() => console.log("URL loaded."));

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

function createTray() {
    let appIcon = new Tray(path.join(__dirname, "cloud_fun.ico"));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Send Snippet', click: function () {
                let clipboardImage = clipboard.readImage()
                // console.log(clipboardImage.isEmpty());
                // console.log(clipboardImage.getSize());
                if (clipboardImage.isEmpty()) {
                    // new Notification({ title: "Invalid Data", body: "The data in clipboard is not a valid image" }).show();
                    const errorOptions = {
                        buttons: ['OK'],
                        title: 'Invalid Data',
                        message: 'The data in clipboard is not a valid image'
                    };
                    dialog.showMessageBox(null, errorOptions);
                    console.log('no image');
                } else {
                    const successOptions = {
                        buttons: ['OK'],
                        title: 'Data Sent',
                        message: 'Data sent successfully'
                    };
                    dialog.showMessageBox(null, successOptions);
                    console.log('yes image');
                }
            }
        },
        {
            label: 'Exit', click: function () {
                app.isQuiting = true;
                app.quit();
            }
        }
    ]);

    appIcon.on('double-click', function (event) {
        mainWindow.show();
    });

    appIcon.setToolTip('SnipShare');
    appIcon.setContextMenu(contextMenu);
    return appIcon;
}

app.on('ready', () => {
    console.log('app is ready');
    mainWindow = createMainWindow();
    mainWindow.minimize();
});