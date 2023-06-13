"use strict";

/* 
    TextAreaInputView

*/

(class TextAreaInputView extends View {
  initPrototypeSlots () {
    this.newSlot("isEditable", true);
  }

  init () {
    super.init();
  }

  setIsEditable (aBool) {
    this._isEditable = aBool;
    this.updateDisabled();
    return this;
  }

  updateDisabled() {
    this.element().disabled = !this.isEditable();

    if (this.isEditable()) {
      this.style().border = "1px solid rgba(255, 255, 255, 0.2)";
    } else {
      this.style().border = "none";
    }

    return this;
  }
  
  initElement () {
    super.initElement();
    this.element().style.textAlign = "left";
    this.listenForKeyDown()
  }

  onEnterKeyDown (event) {
    this.submit();
    event.target.blur();
    event.preventDefault(); // prevent new line
  }

  /*
  onEnterKeyUp (event) {
    this.submit();
    event.preventDefault(); // prevent new line
  }
  */

  submit () {
    const f = this.submitFunc()
    if (f) {
      f()
    }
    return this
  }

  appendText(text) {
    this.element().value += text;
  }
  
}.initThisClass());
