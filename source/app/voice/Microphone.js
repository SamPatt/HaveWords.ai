"use strict";

/* 

    Microphone

*/

(class Microphone extends Base {
  initPrototypeSlots () {
    this.newSlot("isOn", false);
    this.newSlot("isRequestingMicAccess", false);
    this.newSlot("userAudioStream", null);
    this.newSlot("micButton", null);
  }

  init () {
    super.init();
    this.setupMicButton();
  }

  setupMicButton () {
    const b = RadioButton.clone().setId("micButton");
    b.setOnIconPath("resources/icons/mic-on.svg");
    b.setOffIconPath("resources/icons/mic-off.svg");
    b.setState(false);
    b.setTarget(this).setAction("toggleState");
    b.toggle = function() {
      console.log("toggle!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    }
    this.setMicButton(b);  
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
      this.requestMicAccess();
      this.setIsOn(this.isOn());
    }
  }

  hasMicAccess () {
    return this.userAudioStream() !== null;
  }
  
  requestMicAccess () {
    if (this.hasMicAccess() || this.isRequestingMicAccess()) {
      return;
    }
  
    this.setIsRequestingMicAccess(true);
  
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        this.setIsRequestingMicAccess(false);
        this.setUserAudioStream(stream);
        this.setIsOn(true);
      })
      .catch((error) => {
        this.setIsRequestingMicAccess(false);
        this.setIsOn(false);
        console.error("Error getting audio stream:", error);
      });
  }

  setIsOn (aBool) {
    this._isOn = aBool
    if (this.micButton()) {
      this.micButton().setState(this.isOn()); // TODO: move to notification so we don't know about UI
    }
    return this
  }
  
}.initThisClass());

Microphone.shared();