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
    this.setTagName("input");
  }

  setIsEditable (aBool) {
    this._isEditable = aBool;
    this.updateDisabled();
    return this;
  }

  updateDisabled() {
    this.element().disabled = !this.isEditable();

    if (this.isEditable()) {
      this.style().borderBottom = "1px solid rgba(255, 255, 255, 0.2)";
      this.style().borderRadius = "0px";
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
  
  appendText(text) {
    this.element().value += text;
  }
  
}.initThisClass());
