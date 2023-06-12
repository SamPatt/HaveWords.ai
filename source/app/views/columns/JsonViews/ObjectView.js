"use strict";

/* 
  
      ObjectView
  
  */

(class ObjectView extends JsonView {
  /*
    initPrototypeSlots() {
    }
  
    init() {
      super.init();
    }
    */

  initElement() {
    super.initElement();

    const e = this.element();
    e.style.borderLeft = "1px solid rgba(255, 255, 255, 0.1)";
    e.style.paddingLeft = "4px";
    e.style.paddingRight = "4px";

    return this;
  }


  setupSubviews() {
    this.removeAllSubviews();
    const json = this.json();
    const keys = Object.getOwnPropertyNames(json);

    keys.forEach((key) => {
      const value = json[key];
      const kv = KVView.clone();
      kv.keyView().addSubview(this.newViewForValue(key + ":   "));
      kv.keyView().element().style.opacity = 0.5;
      kv.keyView().makeWidthFitContent();
      kv.valueView().addSubview(this.newViewForValue(value));
      this.addSubview(kv);
    });
    return this;
  }

}).initThisClass();
