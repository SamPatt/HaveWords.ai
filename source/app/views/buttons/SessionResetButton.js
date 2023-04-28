"use strict";

/* 
    SessionResetButton

*/

(class SessionResetButton extends View {
  initPrototypeSlots() {
    this.newSlot("link", null)
  }

  init() {
    super.init();
    this.setId("resetSessionButton");
    this.listenForClick()
  }

  onClick (event) {
    Session.shared().reset();
  }

}.initThisClass());
