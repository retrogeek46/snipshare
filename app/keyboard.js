const hid = require("node-hid");

const KEYBOARD_NAME = "GMMK Pro";
const KEYBOARD_USAGE_ID = 0x61;
const KEYBOARD_USAGE_PAGE = 0xff60;
const KEYBOARD_UPDATE_TIME = 1000;

let keyboard = null;
let dataListenerAttached = false;


const connectKeyboard = async () => {
    console.log("connect keyboard called");
    if (!keyboard) {
        const devices = hid.devices();
        for (const d of devices) {
            if (
                d.product === KEYBOARD_NAME &&
                d.usage === KEYBOARD_USAGE_ID &&
                d.usagePage === KEYBOARD_USAGE_PAGE
            ) {
                keyboard = new hid.HID(d.path);
                // console.log(keyboard.getFeatureReport());
                await attachDataListener();

                // keyboard.on("data", (e) => {
                //     console.log(e[0]);
                //     // Check that the data is a valid screen index and update the current one
                //     if (e[0] >= 1 && e[0] <= screens.length) {
                //         currentScreenIndex = e[0] - 1;
                //         console.log(
                //             `Keyboard requested screen index: ${currentScreenIndex}`
                //         );
                //     }
                // });

                break;
            }
        }
    }
};

const attachDataListener = async () => {
    console.log("attaching data listener");
    keyboard.on("data", (val) => {
        // console.log(
        //     val[0] + " " + val[32] +
        //     val[1] + " " + val[33] +
        //     val[2] + " " + val[34] +
        //     val[3] + " " + val[35] +
        //     val[4] + " " + val[36] +
        //     val[5] + " " + val[37] +
        //     val[6] + " " + val[38] +
        //     val[7] + " " + val[39] +
        //     val[8] + " " + val[40] +
        //     val[9] + " " + val[41] +
        //     val[10] + " " + val[42] +
        //     val[11] + " " + val[43] +
        //     val[12] + " " + val[44] +
        //     val[13] + " " + val[45] +
        //     val[14] + " " + val[46] +
        //     val[15] + " " + val[47] +
        //     val[16] + " " + val[48] +
        //     val[17] + " " + val[49] +
        //     val[18] + " " + val[50] +
        //     val[19] + " " + val[51] +
        //     val[20] + " " + val[52] +
        //     val[21] + " " + val[53] +
        //     val[22] + " " + val[54] +
        //     val[23] + " " + val[55] +
        //     val[24] + " " + val[56] +
        //     val[25] + " " + val[57] +
        //     val[26] + " " + val[58] +
        //     val[27] + " " + val[59] +
        //     val[28] + " " + val[60] +
        //     val[29] + " " + val[61] +
        //     val[30] + " " + val[62] +
        //     val[31] + " " + val[63] +
        //     + " asdf " + val[64] + " " + new Date()
        // );
        console.log(val[0] + " " + new Date());
        // if (val[0] >= 1) {
        //     encoderState = val[0];
        //     console.log(`Received data: ${encoderState}`);
        // }
    });
    dataListenerAttached = true;
}

const attachErrorListener = () => {
    keyboard.on("error", (val) => {
        console.log(val[0] + " " + new Date());
    });
    errorListenerAttached = true;
};

exports.updateKeyboard = async () => {
    try {
        if (!keyboard) {
            await connectKeyboard();
        }
        keyboard.write([1, 10]);
        return 1;
    } catch {
        return 0;
    }
}

exports.getEncoderState = async () => {
    let encoderState = null;
    try {
        if (!keyboard) {
            await connectKeyboard();
        }
        // if (!dataListenerAttached) {
        //     attachDataListener()
        // }
        // if (!errorListenerAttached) {
        //     attachErrorListener();
        // }
        keyboard.write([1, 11]);
        return encoderState;
    } catch {
        return 0;
    }
}
