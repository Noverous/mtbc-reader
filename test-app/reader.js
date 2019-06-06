const HID = require('node-hid');
const events = require('events');
var eventEmitter = new events.EventEmitter();

var scale;
var VID = 3768;
var PID = 61440;

exports.Scale = Scale;
{
    scaleConnected,
    registerScale,
    getScaleWeightKg,
    getScaleWeightLb,
    getScaleWeightOz
}

class Scale extends EventEmitter {
}

function registerScale() {
    scale = new HID.HID(VID, PID);
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
    byte format for scale is as follows:
    Byte 0: Report ID
    Byte 1: Scale status (
        1: fault,
         2: stable @ 0,
          3: in motion,
           4: stable,
            5: under 0,
             6: over-weight,
              7: requires calibration,
               8: requires re-zeroing)
    Byte 2: Weight unit
    Byte 3: Data scaling (decimal placement), signed byte is power of 10
    Byte 4: Scale Weight LSB
    Byte 5: Scale weight MSB
    */

    //attempt to get data packet from scale with a timeout of 250 ms
    var byte = scale.readTimeout(250);
    return byte;
}

function scaleConnected() {
    scale.on("data", function(data){
        console.log(data[3]);
    });
}

function scaleRegistered() {
}

function roundToHundreth(num) {
    return parseFloat(num.toFixed(2));
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

    weight = roundToHundreth(weight);

    return weight;
}

function getScaleWeightKg() {
    //get weight in pounds and convert to kg
    var weight = getScaleWeightLb();
    weight /= 2.2;

    weight = roundToHundreth(weight);

    return weight;
}

function getScaleWeightOz() {
    //get weight in pounds and convert to oz
    var weight = getScaleWeightLb()
    weight /= 0.0625

    weight = roundToHundreth(weight);

    return weight;
}
/*
exports.howManyDevices = function() {
    return HID.devices();
}
*/