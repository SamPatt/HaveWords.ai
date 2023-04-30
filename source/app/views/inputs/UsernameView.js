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
      UsersView.shared().updateUserName()
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
    let size = e.value.length ? e.value.length : e.placeholder.length;
    size *= 1.1; // TODO: actually measure the width that would be rendered instead of guessing
    e.setAttribute("size", size + "em");
    return this
  }

}.initThisClass());
