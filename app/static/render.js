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
const currentOSPara = document.getElementById("currentOS");

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

ipcRenderer.on("updateCurrentOS", (event, currentOS) => {
    // console.log("in ipc renderer");
    currentOSPara.innerHTML = "Current OS: " + currentOS;
});

startSystemInfoUITimer();


