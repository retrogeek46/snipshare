const systemInfo = require("../services/systemMonitor.js");
const constants = require("../utils/constants.js");
const { remote, ipcRenderer } = require("electron");

let cpuVoltage = "";
let cpuTempRaw = "";
let cpuUsageRaw = "";
let cpuTemp = "";
let cpuUsage = "";

const versionPara = document.getElementById("versionPara");
const ipAddressPara = document.getElementById("ipAddressPara");
const cpuParamsPara = document.getElementById("cpuParamsPara");
const keyboardParamsPara = document.getElementById("keyboardParamsPara");
const currentOSPara = document.getElementById("currentOS");
const rgbBoxPara = document.getElementById("rgbBox");

const serverIP = remote.getGlobal("serverIP");
const appVersion = remote.getGlobal("appVersion");

versionPara.innerText = "Current Version: " + appVersion;
ipAddressPara.innerText =
    serverIP != ""
        ? "The webpage is hosted at " + serverIP
        : "Cannot get serverIP";

const startSystemInfoUITimer = async () => {
    systemInfoUITimer = setInterval(async () => {
        const systemData = await systemInfo.getSystemInfo();
        const systemInfoValues = systemData["HKCU\\SOFTWARE\\HWiNFO64\\VSB"]["values"];

        cpuVoltage = systemInfoValues["Value2"]["value"];
        cpuTempRaw = systemInfoValues["ValueRaw4"]["value"];
        cpuUsageRaw = systemInfoValues["ValueRaw3"]["value"];
        cpuTemp = cpuTempRaw.toString() + "C";
        cpuUsage = cpuUsageRaw.toString() + "%";

        cpuParamsPara.innerHTML = `CPU<br>Temp: ${cpuTemp} &nbsp;&nbsp; Voltage: ${cpuVoltage} &nbsp;&nbsp; Usage: ${cpuUsage}`;

    }, constants.SYSTEM_INFO_INTERVAL);
};

const stopSystemInfoUITimer = () => {
    console.log("Stopping system info UI timer");
    clearInterval(systemInfoUITimer);
};

const applyKeyboardRGB = (event) => {
    // event.preventDefault();
    let rValue = document.getElementById("rValue").value;
    let gValue = document.getElementById("gValue").value;
    let bValue = document.getElementById("bValue").value;
    console.log(
        `Func called after button press with values rgb(${rValue}, ${gValue}, ${bValue})`
    );
    rgbBoxPara.style.backgroundColor = `rgb(${rValue}, ${gValue}, ${bValue})`;
    // ipcRenderer.send("applyKeyboardRGB", "message");
    ipcRenderer.send("applyKeyboardRGB", {
        'r': parseInt(rValue),
        'g': parseInt(gValue),
        'b': parseInt(bValue)
    })
}

ipcRenderer.on("updateCurrentOS", (event, currentOS) => {
    // console.log("in ipc renderer");
    currentOSPara.innerHTML = "Current OS: " + currentOS;
});

ipcRenderer.on("updateKeyboardState", (event, keyboardState) => {
    keyboardParamsPara.innerHTML = `Keyboard<br>Encoder State: ${keyboardState["encoderState"]} &nbsp;&nbsp; Layer State: ${keyboardState["layerState"]} &nbsp;&nbsp; Current OS: ${keyboardState["currentOS"]}`;
});

startSystemInfoUITimer();


