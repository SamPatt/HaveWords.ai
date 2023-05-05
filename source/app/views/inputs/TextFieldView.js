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
    this.listenForKeyDown()
    this.listenForKeyUp()
  }

  onEnterKeyDown (event) {
    this.submit();
    event.target.blur();
  }

  onKeyUp (event) {
    super.onKeyUp(event);
    this.validate()
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
