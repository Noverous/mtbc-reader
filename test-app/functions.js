const reader = require('./reader');
const nodeConsole = require('console');

var electronConsole = new nodeConsole.Console(process.stdout, process.stderr);

electronConsole.log("MTBC Reader test application launched.");

//reader.listenScale();

reader.scaleEvents.on("change", function(){
    console.log(reader.getWeightLb());
});

document.getElementById("TestButton").onclick = function(e) {
    console.log(reader.readRegistered());
    //console.log(reader.scaleEvents.listeners().length);
    //console.log(reader.isPluggedIn());
    console.log("Button Pressed!");
}
