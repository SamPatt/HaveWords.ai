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
    //e.style.borderLeft = "1px solid rgba(255, 255, 255, 0.1)";
    e.style.paddingLeft = "4px";
    e.style.paddingRight = "1em";

    return this;
  }


  setupSubviews() {
    this.removeAllSubviews();
    const json = this.json();
    const keys = Object.getOwnPropertyNames(json);

    keys.forEach((key) => {
      const value = json[key];
      const isCollection = this.typeIsCollection(value) || (typeof(value) === "string" && value.length > 15);
      const kv = KVView.clone();
      const suffix = isCollection ? `&#8901;` : ":&nbsp;&nbsp;"; //&#x25BD;
      kv.keyView().addSubview(this.newViewForValue(key + suffix));
      kv.keyView().element().style.opacity = 0.5;
      kv.keyView().makeWidthFitContent();
      kv.valueView().addSubview(this.newViewForValue(value));

      if (isCollection) {
        kv.setIsCollapsable(true);
        kv.stackVertically();
        kv.valueView().hide();
      }

      this.addSubview(kv);
    });
    return this;
  }

}).initThisClass();
