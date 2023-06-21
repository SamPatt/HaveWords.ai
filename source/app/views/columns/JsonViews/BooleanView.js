"use strict";

/* 

    BooleanView

*/

(class BooleanView extends RadioButton {

  init() {
    super.init();
    this.setOnLabel("true");
    this.setOffLabel("true");
  }

  initElement() {
    super.initElement();
    const s = this.element().style;
    //s.border = "none";
    //s.borderBottom = "3px dashed rgba(255, 0, 0, 0.01)";
    //this.setMinMaxWidth("2em");
    /*
    this.style().height = "1.3em";
    this.style().lineHeight = "1em";
    this.style().margin = "0";
    this.style().padding = "0";
    this.style().paddingTop = "0.2em";
    this.style().width = "100%";
    this.style().verticalAlign = "bottom";
    */

  }

  setJson(v) {
    this.setValue(String(v));
    return this;
  }

}).initThisClass();
