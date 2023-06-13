"use strict";

/* 

    NumberView

*/

(class NumberView extends TextFieldView {

  init () {
    super.init();
    this.setValidationFunc((n) => {
      const isNumber = !isNaN(parseFloat(n)) && !isNaN(n - 0);
      return isNumber;
    });
  }

  initElement() {
    super.initElement();
    const s = this.element().style;
    s.display = "inline-block";
    s.margin = "0em";
    s.padding = "0em";
  }

  toJson () {
    return Number(this.value());
  }

}).initThisClass();
