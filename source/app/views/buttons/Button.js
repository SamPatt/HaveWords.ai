"use strict";

/* 
    Button

    When clicked, button calls view submit function
*/

(class Button extends View {
  initPrototypeSlots() {
  }

  init() {
    super.init();
  }

  setShouldStore (aBool) {
    if (aBool) {
      throw new Error("unable to store button state");
    }
    return this;
  }

  initElement () {
    super.initElement();
    this.listenForClick();
  }

  onClick (event) {
    this.submit();
  }

}.initThisClass());

