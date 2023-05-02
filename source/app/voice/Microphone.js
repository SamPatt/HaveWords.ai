"use strict";

/* 

    Microphone

*/

(class Microphone extends Base {
  initPrototypeSlots () {
    this.newSlot("isOn", false)
    this.newSlot("isRequestingMicAccess", false)
    this.newSlot("userAudioStream", null)
  }

  init () {
    super.init();
  }

  toggleState () {
    if (this.isRequestingMicAccess()) {
      return this
    }

    if (this.isOn()) {
      this.turnOff();
    } else {
      this.turnOn();
    }
  }

  turnOff () {
    console.warn("WARNING: Microphone.turnOff(): need to implement this.")
  }

  turnOn () {
    if (!this.hasMicAccess()) {
      this.requestMicAccess()
    }
  }

  hasMicAccess () {
    return this.userAudioStream() !== null;
  }
  
  requestMicAccess () {
    if (this.hasMicAccess() || this.isRequestingMicAccess()) {
      return;
    }

    this.micButton().style.opacity = 0.5;
  
    this.setIsRequestingMicAccess(true);
  
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        this.setIsRequestingMicAccess(false);
        this.setUserAudioStream(stream);
        this.setIsOn(true)
      })
      .catch((error) => {
        this.setIsRequestingMicAccess(false);
        this.setIsOn(false)
        console.error("Error getting audio stream:", error);
      });
  }

  setIsOn (aBool) {
    this._isOn = aBool
    if (this.micButton()) {
      this.micButton().style.opacity = 1;
      this.micButton().setOnState(this.isOn()) // TODO: move to notification so we don't know about UI
    }
    return this
  }

  micButton () {
    return document.getElementById("micButton")
  }
  
}.initThisClass());

// TODO: move the below code to MicrophoneButton class

const micButton = document.getElementById("micButton");
micButton._onIcon = "mic-fill-svgrepo-com.svg";
micButton._offIcon = "mic-slash-fill-svgrepo-com.svg";

micButton.setOnState = function (isOn) {
  const icon = isOn ? this._onIcon : this._offIcon;
  const svgObject = document.getElementById("micSvgIcon");
  svgObject.setAttribute("data", "resources/icons/" + icon);
};

micButton.addEventListener("click", (event) => {
  //const self = event.target;
  Microphone.shared().toggleState()
});
