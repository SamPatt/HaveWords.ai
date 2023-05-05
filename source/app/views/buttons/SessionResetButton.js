"use strict";

/* 
    SessionResetButton

*/

(class SessionResetButton extends Button {
  initPrototypeSlots() {
  }

  init() {
    super.init();
    this.setId("sessionResetButton");
    this.setSubmitFunct(() => {
      Session.shared().reset();
    })
  }

}.initThisClass());
