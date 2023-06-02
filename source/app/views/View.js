"use strict";

/* 
    View

*/

(class View extends Base {
  initPrototypeSlots() {
    this.newSlot("element", null);
    this.newSlot("tagName", "div");
    this.newSlot("id", null);
    this.newSlot("submitFunc", null);
    this.newSlot("target", null);
    this.newSlot("action", null);
    this.newSlot("canStore", true);
    this.newSlot("shouldStore", false);
    this.newSlot("hiddenDisplayType", null);
  }

  init() {
    super.init();
    this.setIsDebugging(false);
  }

  setShouldStore (aBool) {
    if (!this.canStore()) {
      throw new Error("unable to store button state");
    }
    this._shouldStore = aBool;
    return this;
  }

  style () {
    return this.element().style;
  }

  initElement() {
    this.style().display = "flex";
    this.style().flexDirection = "column";
    this.listenForChange();
  }

  setElement(e) {
    this._element = e;
    if (e) {
      assert(!e._view);
      e._view = this; // TODO: use WeakRef
    }
    return this;
  }

  create() {
    const e = document.createElement(this.tagName());
    this.setElement(e);
    this.initElement();
    return this;
  }

  addSubview (aView) {
    this.appendChild(aView.element());
    return this;
  }

  subviews () {
    const subviews = [];
    const e = this.element();
    const children = e.children;
    for (let i = 0; i < children.length; i++) {
      const view = children[i]._view;
      assert(view);
      subviews.push(view);
    }
    return subviews;
  }

  clear () {
    this.element().textContent = '';
    return this;
  }

  removeAllSubviews () {
    this.clear();
    return this;
  }

  setClassName (aName) {
    this.element().className = aName;
    return this;
  }

  setId(id) {
    this._id = id;
    if (this.element()) {
      this.element().id = id;
      return this;
    }

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
    const t = this.target();
    if (t) {
      const methodName = "onChange_" + this.id();
      const m = t[methodName];
      if (m) {
        m.apply(t, this);
      }
    }

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

    const t = this.target();
    if (t) {
      const methodName = "onKeyUp_" + this.id();
      const m = t[methodName];
      if (m) {
        m.apply(t, this);
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

  // --- hiding ---

  setIsHidden(aBool) {
    if (aBool) {
      this.hide();
    } else {
      this.unhide();
    }
    return this;
  }

  hide() {
    if (!this.isHidden()) {
      const e = this.element();
      const tag = e.tagName;
      let v = e.style.display;
      if (tag === "TABLE") {
        v = "table";
      } else if (tag === "TR") {
        v = "table-row";
      } else if (tag === "TD") {
        v = "table-cell";
      }
      this.setHiddenDisplayType(v);
      this.element().style.display = "none";
    }
    return this;
  }

  unhide() {
    if (this.isHidden()) {
      const hd = this.hiddenDisplayType();
      const d = hd ? hd : "block";
      this.element().style.display = d;
    }
    return this;
  }

  isHidden() {
    return this.element().style.display === "none";
  }

  // value

  setValue (v) {
    this.element().innerHTML = v;
    return this;
  }

  value () {
    return this.element().innerHTML;
  }

  // ----

  load () {
    const s = localStorage.getItem(this.id());
    if (s !== undefined) {
      this.debugLog("loading from localStorage " + this.type() + " " + this.id() + "value: '" + s + "'");
      this.setValue(s);
    }
    return this;
  }

  save() {
    const v = this.value();
    this.debugLog("saving " + this.type() + " id:" + this.id() + " value:'" + v + "'");
    localStorage.setItem(this.id(), v);
  }

}).initThisClass();
