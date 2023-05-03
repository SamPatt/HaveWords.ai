"use strict";

/* 
    TextFieldView

*/

(class TextFieldView extends View {
  initPrototypeSlots () {
    this.newSlot("validationFunc", null)
  }

  init () {
    super.init();
  }

  initElement () {
    super.initElement();
    this.listenForKeyUp()
  }

  onKeyUp (event) {
    super.onKeyUp(event);
    this.validate()
  }

  onEnterKeyUp (event) {
    if (event.key === "Enter") {
      this.submit();
      event.target.blur();
    }
  }

  submit () {
    this.validate()
    if (this.isValid()) {
      super.submit()
    }
  }

  validate () {
    if (this.isValid()) {
      this.element().style.color = "white";
    } else {
      this.element().style.color = "red";
    }
  }

  isValid () {
    const f = this.validationFunc();
    if (f) {
      const isValid = f(this.string());
      return isValid;
    }
    return true
  }
  
}.initThisClass());
