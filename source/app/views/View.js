"use strict";

/* 
    View

*/

(class View extends Base {
  initPrototypeSlots() {
    this.newSlot("element", null);
    this.newSlot("id", null);
    this.newSlot("submitFunc", null);
    this.newSlot("target", null);
    this.newSlot("action", null);
    this.newSlot("shouldStore", false);
  }

  init() {
    super.init();
  }

  initElement() {
    this.listenForChange();
  }

  setId(id) {
    this._id = id;
    const e = document.getElementById(id);
    if (!e) {
      throw new Error("no element found for id '" + id + "'");
    }
    this.setElement(e);
    this.initElement();
    if (this.shouldStore()) {
      this.load();
    }
    return this;
  }

  appendChild(e) {
    this.element().appendChild(e);
    return this;
  }

  // --- content ---

  setInnerHTML(s) {
    this.element().innerHTML = s;
    return this;
  }

  // --- inner text ---

  setInnerText(s) {
    this.element().innerText = s;
    return this;
  }

  innerText() {
    return this.element().innerText;
  }

  // --- string value ---

  setString(s) {
    // an abstract way to set the string value of the view content
    // which allows subclasses to override it
    const e = this.element();
    if (e.tagName === "INPUT") {
      e.value = s;
    } else {
      this.setInnerHTML(s);
    }
    return this;
  }

  string() {
    const e = this.element();
    if (e.tagName === "INPUT") {
      return e.value;
    }
    return this.innerText();
  }

  // --- listening for events ---

  listenForChange() {
    this.element().addEventListener("change", (event) => {
      this.onChange(event);
    });
  }

  listenForClick() {
    assert(this.onClick);
    this.element().addEventListener("click", (event) => {
      this.onClick(event);
    });
    return this;
  }

  listenForKeyUp() {
    this.element().addEventListener("keyup", (event) => {
      this.onKeyUp(event);
    });
    return this;
  }

  listenForKeyDown() {
    this.element().addEventListener("keydown", (event) => {
      this.onKeyDown(event);
    });
    return this;
  }

  // --- handling for events ---

  onChange(event) {
    if (this.shouldStore()) {
      this.save();
    }
    return this;
  }

  onKeyUp(event) {
    const enterKeyCode = 13;
    if (event.keyCode === enterKeyCode) {
      if (event.shiftKey) {
        this.onShiftEnterKeyUp(event);
      } else {
        this.onEnterKeyUp(event);
      }
    }
  }

  onShiftEnterKeyUp(event) {}

  onEnterKeyUp(enter) {}

  // --- key down events ---

  onKeyDown(event) {
    const enterKeyCode = 13;
    if (event.keyCode === enterKeyCode) {
      if (event.shiftKey) {
        this.onShiftEnterKeyDown(event);
      } else {
        this.onEnterKeyDown(event);
      }
    }
  }

  onShiftEnterKeyDown(event) {}

  onEnterKeyDown(enter) {}

  // --- actions ---

  submit() {
    // use sumbit function if set
    const f = this.submitFunc();
    if (f) {
      f();
    } else {
      //console.warn("no submit function set for " + this.description());
    }

    // use target & action if set
    const t = this.target();
    if (t) {
      if (this.action()) {
        const m = t[this.action()];
        if (m) {
          m.apply(t, [this]);
        } else {
          console.warn(
            "button target " +
              t.type() +
              " does not implement method for action '" +
              this.action() +
              "'"
          );
        }
      } else {
        // use action method name generated from element id
        const idAction = "onSubmit_" + this.id();
        const m = t[idAction];
        if (m) {
          m.apply(t, [this]);
        } else {
          console.warn(
            "button target " +
              t.type() +
              " does not implement method for action '" +
              idAction +
              "'"
          );
        }
      }
      return this;
    }
  }

  // --- helpers ---

  description() {
    return this.type() + " with id " + this.id();
  }

  hide() {
    this.element().style.display = "none";
    return this;
  }

  unhide() {
    this.element().style.display = "block";
    return this;
  }

  load () {
    const s = localStorage.getItem(this.id());
    if (s !== undefined) {
      console.log("loading " + this.type() + " " + this.id());
      this.setString(s);
    }
    return this;
  }

  save() {
    console.log("saving " + this.type() + " " + this.id() + ":" + this.string());
    localStorage.setItem(this.id(), this.string());
  }

}).initThisClass();
