"use strict";

/* 
    TextAreaInputView

*/

(class TextAreaInputView extends View {
  initPrototypeSlots () {
  }

  init () {
    super.init();
  }

  initElement () {
    super.initElement();
    this.listenForKeyPress()
  }

  onEnterKeyPress (event) {
    this.submit();
    event.preventDefault(); // prevent new line
  }

  submit () {
    const f = this.submitFunc()
    if (f) {
      f()
    }
    return this
  }
  
}.initThisClass());
