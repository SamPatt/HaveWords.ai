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
  
}.initThisClass());
