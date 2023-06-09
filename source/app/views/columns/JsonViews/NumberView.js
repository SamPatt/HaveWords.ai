"use strict";

/* 

    NumberView

*/

(class NumberView extends JsonView {
  initPrototypeSlots() {
    this.newSlot("json", null);
  }

  init() {
    super.init();
  }

  initElement() {
    super.initElement();
    const e = this.element();
    e.style.display = "flex";
    e.style.justifyContent = "start";
    e.style.textAlign = "left";
    e.style.flexDirection = "column";

    //e.style.borderBottom = "1px solid rgba(255, 255, 255, 0.1)";
    e.style.paddingLeft = "0.2em";
    e.style.paddingRight = "0.2em";
    //e.style.paddingTop = "0.2em";
    //e.style.paddingBottom = "0.2em";

    return this;
  }

  setupSubviews() {
    this.removeAllSubviews();
    this.setString(this.json());
    return this;
  }

}).initThisClass();
