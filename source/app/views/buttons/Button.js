"use strict";

/* 
    Button

    When clicked, button calls view submit function
*/

(class Button extends View {
  initPrototypeSlots() {
  }

  init() {
    super.init();
  }

  initElement () {
    super.initElement();
    this.listenForClick();
  }

  onClick (event) {
    this.submit()
  }

}.initThisClass());

