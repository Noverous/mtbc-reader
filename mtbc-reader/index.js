/*
Basic JavaScript library built to allow developers to interface with MTBC scales; without setting your hair on fire.
*/

const HID = require('node-hid');
const events = require('events');
const {asyncPoll} = require('async-poll');

var scaleEvents = new events.EventEmitter();

var scale;
var paused = false;
var readRegistered = false;
var VID = 3768;
var PID = 61440;

exports.getWeightKg = getWeightKg;
exports.getWeightLb = getWeightLb;
exports.getWeightOz = getWeightOz;
exports.events = scaleEvents;
exports.isPluggedIn = isPluggedIn;
exports.isFault = isFault;
exports.isMoving = isMoving;
exports.isUnderZero = isUnderZero;
exports.isOverweight = isOverweight;
exports.getStatus = getStatus;
exports.pause = pause;
exports.resume = resume;
exports.getByte = getByte;
//exports.readRegistered = function() {return readRegistered;}

//attempt to register scale on startup
console.log("Preforming initial scale registration...");
registerScale();

const interval = 2000;
const timeout = 0;
//poll the OS every 2 seconds to keep the listener registered throughout unplugs and replugs
//It's not elegant, but it's the best solution I have for now until node-usb-detection updates.
asyncPoll(keepRegistered,false, {interval, timeout} )


function registerScale() {
    if (isPluggedIn()) {
        scale = new HID.HID(VID, PID);
    }
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
    //if scale is saying it's having an error:
    if (getStatus() == 1) {
        return true;
    } else {
        return false;
    }
}

function isMoving() {
    //if the scale is currently moving to accept or release weight
    if (getStatus() == 3) {
        return true;
    } else {
        return false;
    }
}

function isUnderZero() {
    //if the scale is returning a value below zero (either negative numbers or simply refusing to display anything)
    if (getStatus() == 5) {
        return true;
    } else {
        return false;
    }
}

function isOverweight() {
    //if the scale is encountering a load larger than it's intended max capacity
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

    var status = scale.getStatus();

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

    //register initial byte as all fields with 0, if the scale cannot be reached for whatever reason (likely unplugged) this will be returned instead.
    var byte = [0,0,0,0,0];
    //if scale is plugged in, attempt to get data packet from scale with a timeout of 250 ms
    if (isPluggedIn()) {
        try {
            byte = scale.readTimeout(250);
        } catch (err) {
            console.log("Error caught while attempting to get scale packet, has the scale been unplugged?");
        } 
    }
    return byte;
}

function pause() {
    //pause event listening
    paused = true;
}

function resume() {
    //resume event listening
    paused = false;
}

function keepRegistered() {
    /*
    Function polled asynchronously, used to keep listener up-to-date through scale unplugs and changes
    */
    if (!readRegistered && isPluggedIn()) {
        registerScale();
        listenScale();
    }
}

function listenScale() {

    //internal function used to begin listening for weight changes
    scale.on("error", function(err){
        console.log("Error occurred while listening, stopping data stream listener... (scale disconnected?)");
        readRegistered = false;
    });

    var lastWeight;

    if (!readRegistered) {
        scale.on("data", function(data){
            readRegistered = true;
            //console.log("logging data!")
            var currentWeight = data[4];
            //if weight has changed since last event, emit
            if (currentWeight != lastWeight && (!paused && isPluggedIn())) {
                //console.log("Emitting!");
                //registerScale();
                scaleEvents.emit("change", getWeightLb());
            }

            lastWeight = currentWeight;
        });
    }
    
}

function roundToHundredth(num) {
    //simple helper function to help make numbers cleaner
    return parseFloat(num.toFixed(2));
}

function getWeightLb() {
    //registerScale();
    var data = getByte();

    //registerScale();

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

function getWeightKg() {
    //get weight in pounds and convert to kg
    var weight = getWeightLb();
    weight /= 2.2;

    weight = roundToHundredth(weight);

    return weight;
}

function getWeightOz() {
    //get weight in pounds and convert to oz
    var weight = getWeightLb()
    weight /= 0.0625

    weight = roundToHundredth(weight);

    return weight;
}