var usb = require('usb');

var scale;

exports.registerScale = function() {
    var devices  = usb.getDeviceList();
    devices.forEach(function(device){
        console.log("checking device...")
        if(device.deviceDescriptor.idVendor.toString() == "0EB8"){
            console.log("MT Device Found!")
        } else {
            console.log("not MT device, VID: "+device.deviceDescriptor.idVendor.toString());
        }
    });
}

/*
    var devices  = usb.getDeviceList();
    devices.forEach(function(device){
        console.log("checking device...")
        if(device.deviceDescriptor.idVendor.toString() == "0EB8"){
            console.log("MT Device Found!")
        } else {
            console.log("not MT device, VID: "+device.deviceDescriptor.idVendor.toString());
        }
    });
*/

exports.howManyDevices = function () {
    return usb.getDeviceList().length;
}