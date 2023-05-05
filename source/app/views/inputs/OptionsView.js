"use strict";

/* 
    OptionsView

*/

(class OptionsView extends View {
  initPrototypeSlots() {}

  init() {
    super.init();
  }

  initElement() {
    super.initElement();
    this.listenForChange();
  }

  listenForChange() {
    this.element().addEventListener("change", (event) => {
      this.onChange(event);
    });
  }

  selectedElement() {
    const e = this.element();
    const selectedOptionElement = e.options[e.selectedIndex];
    return selectedOptionElement;
  }

  selectedValue() {
    return this.selectedElement().value;
  }

  selectedText() {
    return this.selectedElement().innerText;
  }

  setString (aString) {
    throw new Error("unimplemented")
    return this
  }

  string () {
    return this.selectedText()
  }

  onChange(event) {
    this.submit();
  }

  setOptions(array) {
    // array is expected to contain items like { label: "a", value: "b" }
    const e = this.element();
    e.innerHTML = "";
    array.forEach((item) => {
      const option = new Option(item.label, item.value, false);
      option._item = item;
      e.appendChild(option);
    });
    return this;
  }
}).initThisClass();
