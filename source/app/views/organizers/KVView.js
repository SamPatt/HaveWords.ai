"use strict";

/* 
    KVView

*/

(class KVView extends HView {
  initPrototypeSlots() {
    this.newSlot("keyView", null);
    this.newSlot("valueView", null);
  }

  init() {
    super.init();
    this.setIsDebugging(false);

    this.setKeyView(HView.clone());
    this.keyView().element().style.minWidth = "fit-content";
    this.keyView().element().style.maxWidth = "fit-content";
    this.addSubview(this.keyView());

    this.setValueView(HView.clone());
    this.valueView().element().style.minWidth = "fit-content";
    this.valueView().element().style.maxWidth = "fit-content";
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
