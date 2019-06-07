const reader = require('./reader');
const nodeConsole = require('console');

var electronConsole = new nodeConsole.Console(process.stdout, process.stderr);

electronConsole.log("MTBC Reader test application launched.");

//var scale = reader.Scale;
reader.registerScale();
reader.listenData();

document.getElementById("TestButton").onclick = function(e) {
    //console.log("Button Pressed!");
    reader.registerScale();
    reader.weightChanged.on("change", function(){
        reader.registerScale();
        console.log(reader.getScaleWeightLb());
    });
}
