"use strict";

/* 
    UsernameView

*/

(class UsernameView extends TextFieldView {
  initPrototypeSlots () {
  }

  init () {
    super.init();
    this.setId("username")
    this.setSubmitFunc(() => { 
      updateUserName()
    })
  }

  setString (s) {
    this.element().value = s;
    return this;
  }

  string () {
    return this.element().value;
  }

  onKeyPress (event) {
    super.onKeyPress(event)
    this.resizeWidthToFitContent()
  }

  resizeWidthToFitContent () {
    const e = this.element()
    
    // assumes view is input elemet
    const size = e.value.length ? e.value.length : e.placeholder.length;
    e.setAttribute("size", size + "em");
    return this
  }

}.initThisClass());
