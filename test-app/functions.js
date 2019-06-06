const reader = require('./reader');
const nodeConsole = require('console');

var electronConsole = new nodeConsole.Console(process.stdout, process.stderr);

electronConsole.log("MTBC Reader test application launched.");

reader.scale.registerScale();

document.getElementById("TestButton").onclick = function(e) {
    //console.log("Button Pressed!");
    console.log(reader.scale.getScaleWeightLb());
}