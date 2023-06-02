"use strict";

/* 
    TextFieldView

*/

(class TextFieldView extends View {
  initPrototypeSlots () {
    this.newSlot("validationFunc", null);
    this.newSlot("shouldFitContent", false);
    this.newSlot("isEditable", true);
  }

  init () {
    super.init();
    this.setTagName("input");
  }

  initElement () {
    super.initElement();
    this.setClassName("TextFieldView");
    this.listenForKeyDown();
    this.listenForKeyUp();
    this.updateDisabled();
  }

  setIsEditable (aBool) {
    this._isEditable = aBool;
    this.updateDisabled();
    return this;
  }

  updateDisabled() {
    this.element().disabled = !this.isEditable();
    return this;
  }

  onEnterKeyDown (event) {
    this.submit();
    event.target.blur();
  }

  setString(s) {
    super.setString(s);
    this.resizeIfNeeded();
    return this;
  }

  onKeyUp (event) {
    super.onKeyUp(event);
    this.validate()
    this.resizeIfNeeded();
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

  resizeIfNeeded () {
    if (this.shouldFitContent()) {
      this.resizeWidthToFitContent();
    }
    return this;
  }

  resizeWidthToFitContent() {
    const e = this.element();

    let size = e.value.length ? e.value.length : e.placeholder.length;
    size *= 1.1;
    e.setAttribute("size", size + "em");
    return this;
  }
  
}.initThisClass());
