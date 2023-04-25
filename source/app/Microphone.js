"use strict";

/* 

    Microphone

*/

(class Microphone extends Base {
  initPrototypeSlots () {
    //this.newSlot("idb", null)
  }

  init () {
    super.init();
  }

  
}.initThisClass());



/* --- microphone input ---*/

const micButton = document.getElementById("micButton");
micButton._isOn = false;
micButton._onIcon = "mic-fill-svgrepo-com.svg";
micButton._offIcon = "mic-slash-fill-svgrepo-com.svg";

micButton.toggleState = function () {
  if (this._isOn) {
    this.turnOff();
  } else {
    this.turnOn();
  }
};

micButton.setIsOn = function (bool) {
  this._isOn = bool;
  this.updateIcon();
};

micButton.svgObject = function () {
  return document.getElementById("micSvgIcon");
};

micButton.updateIcon = function () {
  const icon = this._isOn ? this._onIcon : this._offIcon;
  this.svgObject().setAttribute("data", "resources/icons/" + icon);
};

micButton.turnOn = function () {
  this.setIsOn(true);
};

micButton.turnOff = function () {
  this.setIsOn(false);
};

micButton.addEventListener("click", (event) => {
  const self = event.target;
  //this.toggleState()
  if (self._isOn) {
    if (hasMicAccess()) {
      userAudioStream.muted = true; // not sure if this works
    }
    self.setIsOn(false);
  } else {
    if (hasMicAccess()) {
      userAudioStream.muted = false; // not sure if this works
      //userAudioStream = undefined;
      self.setIsOn(true);
    } else {
      requestMicAccess();
    }
  }
});

function hasMicAccess() {
  return userAudioStream !== undefined;
}

let isRequestingMicAccess = false;

function requestMicAccess() {
  if (hasMicAccess() || isRequestingMicAccess) {
    return;
  }

  isRequestingMicAccess = true;

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      isRequestingMicAccess = false;
      userAudioStream = stream;
      micButton.setIsOn(true);
    })
    .catch((error) => {
      isRequestingMicAccess = false;
      micButton.setIsOn(false);
      console.error("Error getting audio stream:", error);
    });
}
