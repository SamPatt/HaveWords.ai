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
  }

  selectedElement() {
    const e = this.element();
    const selectedOptionElement = e.options[e.selectedIndex];
    return selectedOptionElement;
  }

  setSelectedValue (s) {
    this.element().children.forEach(option => {
      const match = option.value === s;
      option.selected = match;
    })
    return this;
  }

  selectedValue() {
    return this.selectedElement().value;
  }

  selectedText() {
    return this.selectedElement().innerText;
  }

  setString (aString) {
    this.setSelectedValue(aString)
    return this
  }

  string () {
    return this.selectedValue()
  }

  onChange(event) {
    super.onChange(event);
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
