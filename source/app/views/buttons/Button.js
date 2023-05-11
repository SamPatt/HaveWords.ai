"use strict";

/* 
    Button

    When clicked, button calls view submit function
*/

(class Button extends View {
  initPrototypeSlots() {
    this.newSlot("isDisabled", false);
  }

  init() {
    super.init();
  }

  setIsDisabled (aBool) {
    this._isDisabled = aBool;
    const e = this.element()
    if (e) {
      if (aBool) {
        e.style.opacity = 0.25;
      } else {
        e.style.opacity = 1;
      }
    }
    return this;
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
    if (this.isDisabled()) {
      // play an error beep?
    } else {
      this.submit();
    }
  }

}.initThisClass());

