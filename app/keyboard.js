const hid = require("node-hid");

const KEYBOARD_NAME = "GMMK Pro";
const KEYBOARD_USAGE_ID = 0x61;
const KEYBOARD_USAGE_PAGE = 0xff60;
const KEYBOARD_UPDATE_TIME = 1000;

let keyboard = null;
   
exports.updateKeyboard = () => {
    try {
        if (!keyboard) {
            const devices = hid.devices();
            for (const d of devices) {
                if (
                    d.product === KEYBOARD_NAME &&
                    d.usage === KEYBOARD_USAGE_ID &&
                    d.usagePage === KEYBOARD_USAGE_PAGE
                ) {
                    keyboard = new hid.HID(d.path);
                    break;
                }
            }
        }
        keyboard.write([1, 10]);
        return 1;
    } catch {
        return 0;
    }
}
