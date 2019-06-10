//Obtain the reference to the scale, no further registration or checking is required - the library will handle everything else
const scale = require('mtbc-reader');

console.log("MTBC scale test application launched.");

//set initial connection status:
document.getElementById("TestField").value = checkConnected()

//Listen to the scale data event
scale.events.on("change", function(weight){
    //When the event is fired, display the weight in console
    console.log("Weight on scale changed! New weight is: " + weight);
    //And update the live view field
    document.getElementById("WeightDisplay").value = weight; 
});

//Listen to the connection test button click event
document.getElementById("TestButton").onclick = function(e) {
    //set status field value to connection value
    document.getElementById("TestField").value = checkConnected();
}

//Listen to the pause button click event
document.getElementById("PauseButton").onclick = function(e) {
    console.log("Paused!");
    //pause events
    scale.pause();
    //Update text field
    document.getElementById("PlaybackField").value = "Halted";
}

//Listen to the resume button click event
document.getElementById("ResumeButton").onclick = function(e) {
    console.log("Resumed!");
    //resume events
    scale.resume();
    //Update text field
    document.getElementById("PlaybackField").value = "Active";
}

//Listen to the weight button click event
document.getElementById("WeightButton").onclick = function(e) {
    //get current weight from scale
    var weight = scale.getWeightLb();

    console.log("Weight on scale via button is: " + weight)

    //Update weight field
    document.getElementById("WeightDisplay2").value = weight;
}

function checkConnected() {
        //initialize status variable
        var statusString;

        //Check if the scale is plugged in, and set the new string accordingly
        if (scale.isPluggedIn()) {
            statusString = "Scale is plugged in!"
        } else {
            statusString = "Scale is not plugged in."
        }
    
        console.log(statusString);
    
        return statusString;
    }