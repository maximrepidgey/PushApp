var startTime = 0;
var start = 0;
var end = 0;
var diff = 0;
var timerID = 0;


function chrono() {
    end = new Date();
    diff = end - start;
    diff = new Date(diff);
    var msec = diff.getMilliseconds();
    var sec = diff.getSeconds();
    var min = diff.getMinutes();
    var hr = diff.getHours() - 1;
    if (min < 10) {
        min = "0" + min;
    }
    if (sec < 10) {
        sec = "0" + sec;
    }
    if (msec < 10) {
        msec = "00" + msec;
    }
    else if (msec < 100) {
        msec = "0" + msec;
    }
    try{
      document.getElementById("chronometer").innerHTML = hr + ":" + min + ":" + sec + ":" + msec;
      timerID = setTimeout("chrono()", 10);
    }catch (e) {

    }

}
function chronoStart() {
    start = new Date();
    chrono();
}
function chronoContinue() {
    start = new Date() - diff;
    start = new Date(start);
    chrono();
}
function chronoReset() {
    document.getElementById("chronometer").innerHTML = "0:00:00:000";
    start = new Date();
}
function chronoStopReset() {
    document.getElementById("chronometer").innerHTML = "0:00:00:000";
    document.chronoForm.startstop.onclick = chronoStart;
}
function chronoStop() {
    clearTimeout(timerID);
}


function chronoPauseOrContinue() {
    let pauseBtn = document.getElementById("pause-continue").childNodes[0];
    if (pauseBtn.innerHTML == "pause") {
        pauseBtn.innerHTML = "play_arrow";
        chronoStop();

    } else {
        pauseBtn.innerHTML = "pause";
        chronoContinue();
    }

}

window.onload = chronoStart;

function clientButtons(){
  let buttons = document.querySelectorAll('.no-padding ul li a');
  let buttonCoach = buttons[1];
  let buttonDashboard = buttons[0];
  buttonCoach.addEventListener("click", () => {
      renderCoaches();
  });
  buttonDashboard.addEventListener("click", () => {
      location.reload();
  });
}
clientButtons();
