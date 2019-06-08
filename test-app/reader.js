const HID = require('node-hid');
const events = require('events');
var weightChanged = new events.EventEmitter();

var scale;
var VID = 3768;
var PID = 61440;

exports.scaleConnected = scaleConnected;
exports.registerScale = registerScale;
exports.getScaleWeightKg = getScaleWeightKg;
exports.getScaleWeightLb = getScaleWeightLb;
exports.getScaleWeightOz = getScaleWeightOz;
exports.weightChanged = weightChanged;
exports.listenData = listenData;
exports.isPluggedIn = isPluggedIn;
exports.getStatus = getStatus;

function registerScale() {
    scale = new HID.HID(VID, PID);
}

function isPluggedIn() {
    //get list of all devices
    var devices = HID.devices();
    var scaleFound = false;

    //check through list of devices, see if any of them are the scale - if not, it's not plugged in or otherwise not registered to Windows
    devices.forEach(function(device){
        if (device.vendorId.toFixed() == VID && device.productId.toFixed() == PID) {
            //console.log("Scale found!");
            scaleFound = true;
        }
    })

    return scaleFound;
}
function isFault() {
    if (getStatus() == 1) {
        return true;
    } else {
        return false;
    }
}

function isMoving() {
    if (getStatus() == 3) {
        return true;
    } else {
        return false;
    }
}

function isUnderZero() {
    if (getStatus() == 5) {
        return true;
    } else {
        return false;
    }
}

function isOverweight() {
    if (getStatus() == 6) {
        return true;
    } else {
        return false;
    }
}

function getStatus() {
    //get scale status,
    /*
    1: fault,
    2: stable @ 0,
    3: in motion,
    4: stable,
    5: under 0,
    6: over-weight,
    7: requires calibration,
    8: requires re-zeroing
    */
    var data = getByte();
    var status = data[1];
    return status;
}

function getByte() {
    /*
    Byte format for scale is as follows:
    Byte 0: Report ID
    Byte 1: Scale status (
        1: fault,
        2: stable @ 0,
        3: in motion,
        4: stable,
        5: under 0,
        6: over-weight,
        7: requires calibration,
        8: requires re-zeroing
    )
    Byte 2: Weight unit (
        3: kg
        11: oz
        12: pounds, do nothing
    )
    Byte 3: Data scaling (decimal placement), signed byte is power of 10
    Byte 4: Scale Weight LSB
    Byte 5: Scale weight MSB
    */

    //attempt to get data packet from scale with a timeout of 250 ms
    var byte = scale.readTimeout(250);
    return byte;
}

function listenData() {
    scale.on("error", function(err){
        console.log("Error occurred while listening, stopping data stream listener... (scale disconnected?)");
    });

    var lastWeight;

    scale.on("data", function(data){
        //console.log("logging data!")
        var currentWeight = data[4];
        if (currentWeight != lastWeight) {
            weightChanged.emit("change", currentWeight);
        }

        lastWeight = currentWeight;
    });
    
}

function scaleRegistered() {
}

function roundToHundredth(num) {
    return parseFloat(num.toFixed(2));
}

function getScaleWeightRaw() {
    var data = getByte();
    //get weight from scale data packet
    var weight = data[4];

    return weight;
}

function getScaleWeightLb() {
    var data = getByte();

    //get weight from scale data packet
    var weight = data[4];
    //add correct decimal point
    weight /= 100;

    //The scale can return weight in different units, this switch makes certain it's converted properly:

    //3: kg
    //11: oz
    //12: pounds, do nothing
    switch(data[2]) {
        case 3:
            //convert to pounds from kg
            weight *= 2.2;
            break;
        case 11:
            //convert to pounds from oz
            weight *= 0.0625;
            break;
        case 12:
            //keep as pounds
            break;
    }

    weight = roundToHundredth(weight);

    return weight;
}

function getScaleWeightKg() {
    //get weight in pounds and convert to kg
    var weight = getScaleWeightLb();
    weight /= 2.2;

    weight = roundToHundredth(weight);

    return weight;
}

function getScaleWeightOz() {
    //get weight in pounds and convert to oz
    var weight = getScaleWeightLb()
    weight /= 0.0625

    weight = roundToHundredth(weight);

    return weight;
}
//unused testing function, will delete later
/*
exports.howManyDevices = function() {
    return HID.devices();
}
*/