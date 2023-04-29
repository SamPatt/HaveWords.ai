"use strict";

/* 
    TextFieldView

*/

(class TextFieldView extends View {
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
    if (event.key === "Enter") {
      this.submit();
      event.target.blur();
    }
  }
  
}.initThisClass());
