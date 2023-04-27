"use strict";

/* 
    View

*/

(class View extends Base {
  initPrototypeSlots () {
    this.newSlot("element", null)
    this.newSlot("id", null)
  }

  init () {
    super.init();
  }

  setId (id) {
    this._id = id
    const e = document.getElementById(id);
    if (!e) {
      throw new Error("no element found for id '" + id + "'")
    }
    this.setElement(e)
    return this
  }

  appendChild (e) {
    this.element().appendChild(e);
    return this
  }

  setInnerHTML (s) {
    this.element().innerHTML = s
    return this
  }

  listenForClick () {
    this.element().addEventListener("click", (event) => {
      this.onClick(event)
    })
    return this
  }
  
}.initThisClass());
