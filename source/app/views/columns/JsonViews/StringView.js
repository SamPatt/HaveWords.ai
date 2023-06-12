"use strict";

/* 

    StringView

*/

(class StringView extends JsonView {
  initPrototypeSlots() {
    this.newSlot("textArea", null);
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

    e.style.paddingLeft = "0.2em";
    e.style.paddingRight = "0.2em";

    const textArea = TextAreaInputView.clone();
    this.setTextArea(textArea);
    this.addSubview(textArea);
    this.makeWidthFitContent();
    return this;
  }

  setupSubviews() {
    this.removeAllSubviews();
    this.setString(this.json());
    return this;
  }

}).initThisClass();
