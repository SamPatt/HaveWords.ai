"use strict";

/* 
    KVView

*/

(class KVView extends VView {
  initPrototypeSlots() {
    this.newSlot("keyView", null);
    this.newSlot("valueView", null);
  }

  init() {
    super.init();
    this.setIsDebugging(false);
    this.create();

    this.setKeyView(HView.clone());
    this.addSubview(this.keyView());

    this.setValueView(HView.clone());
    this.addSubview(this.valueView());
  }

  setLabel (s) {
    this.keyView().setString(s);
    return this;
  }

  label () {
    return this.keyView().string();
  }

}).initThisClass();
