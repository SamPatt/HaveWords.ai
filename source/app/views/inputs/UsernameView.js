"use strict";

/* 
    UsernameView
*/

(class UsernameView extends TextFieldView {
  initPrototypeSlots() {}

  init() {
    super.init();
    this.setId("username");
    this.setSubmitFunc(() => {
      UsersView.shared().updateUserName();
    });
  }

  setString(s) {
    this.element().value = s;
    return this;
  }

  string() {
    return this.element().value;
  }

  onKeyUp(event) {
    super.onKeyUp(event);
    this.resizeWidthToFitContent();
  }

  resizeWidthToFitContent() {
    const e = this.element();

    let size = e.value.length ? e.value.length : e.placeholder.length;
    size *= 1.1;
    e.setAttribute("size", size + "em");
    return this;
  }
}).initThisClass();
