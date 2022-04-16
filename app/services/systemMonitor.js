const si = require("systeminformation");
const regedit = require("regedit");
const path = require("path");

const vbsDirectory = "./Resources/vbs";
regedit.setExternalVBSLocation(vbsDirectory);


// TODO: create different templates based on
// which data returned is different?
// exports.getSystemInfo = async () => {
//     console.log("getting cpu data");
//     const cpuData = await si.cpuTemperature();
//     return cpuData
// };

exports.getSystemInfo = async () => {
    // console.log("getting system data");
    const systemData = await regedit.promisified.list([
        "HKCU\\SOFTWARE\\HWiNFO64\\VSB",
    ]);
    return systemData;
};

// const KEY = require("windows-registry").Key;

// exports.getSystemInfo = () => {
//     console.log("getting system data");
//     const key = new Key( "HKEY_CURRENT_USER\\SOFTWARE\\HWiNFO64\\VSB");
//     const systemData = regedit.list("HKEY_CURRENT_USER\\SOFTWARE\\HWiNFO64\\VSB");
//     return systemData;

// };