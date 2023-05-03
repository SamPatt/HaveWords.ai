"use strict";

/* 
    View

*/

(class View extends Base {
  initPrototypeSlots () {
    this.newSlot("element", null)
    this.newSlot("id", null)
    this.newSlot("submitFunc", null)
  }

  init () {
    super.init();
  }

  initElement () {
  }

  setId (id) {
    this._id = id;
    const e = document.getElementById(id);
    if (!e) {
      throw new Error("no element found for id '" + id + "'");
    }
    this.setElement(e);
    this.initElement();
    return this
  }

  appendChild (e) {
    this.element().appendChild(e);
    return this
  }

  // --- content ---

  setInnerHTML (s) {
    this.element().innerHTML = s;
    return this
  }

  // --- inner text ---

  setInnerText (s) {
    this.element().innerText = s;
    return this
  }

  innerText () {
    return this.element().innerText
  }

  // --- string value ---

  setString (s) {
    // an abstract way to set the string value of the view content
    // which allows subclasses to override it 
    this.setInnerHTML(s)
    return this
  }

  string () {
    const e = this.element()
    if (e.tagName === "INPUT") {
      return e.value
    }
    return this.innerText()
  }

  // --- listening for events ---

  listenForClick () {
    assert(this.onClick)
    this.element().addEventListener("click", (event) => {
      this.onClick(event);
    })
    return this
  }

  listenForKeyPress () {
    assert(this.onKeyPress)
    this.element().addEventListener("keyup", (event) => {
      this.onKeyPress(event);
    })
    return this
  }

  // --- handling for events ---

  onKeyPress (event) {
    const enterKeyCode = 13;
    if (event.keyCode === enterKeyCode) {
      if (event.shiftKey) {
        this.onShiftEnterKeyPress(event)
      } else {
        this.onEnterKeyPress(event)
      }
    }
  }

  onShiftEnterKeyPress (event) {
  }

  onEnterKeyPress (enter) {
  }

  // --- actions ---

  submit () {
    const f = this.submitFunc()
    if (f) {
      f()
    } else {
      console.warn("no submit function set for " + this.description())
    }
    return this
  }

  // --- helpers ---

  description () {
    return this.type() + " with id " + this.id()
  }

}.initThisClass());
