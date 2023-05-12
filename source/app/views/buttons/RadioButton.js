"use strict";

/* 
    RadioButton

    

*/

(class RadioButton extends Button {
  initPrototypeSlots() {
    this.newSlot("state", false)
    this.newSlot("onIconPath", null)
    this.newSlot("offIconPath", null)
  }

  init() {
    super.init();
  }

  setState (aBool) {
    this._state = aBool;
    this.updateIcon();
    return this;
  }

  setOnIconPath (aPath) {
    this._onIconPath = aPath;
    this.updateIcon();
    return this;
  }

  setOffIconPath (aPath) {
    this._offIconPath = aPath;
    this.updateIcon();
    return this;
  }

  updateIcon () {
    if (this.state()) {
      this.setIconPath(this.onIconPath());
    } else {
      this.setIconPath(this.offIconPath());
    }
    return this;
  }

  toggle () {
    this.setState(!this.state());
    return this;
  }

  submit () {
    this.toggle(); // toggle first?
    super.submit();
    return this;
  }

}.initThisClass());

