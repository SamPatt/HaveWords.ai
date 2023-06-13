"use strict";

/* 
    KVView

*/

(class KVView extends HView {
  initPrototypeSlots() {
    this.newSlot("keyView", null);
    this.newSlot("valueView", null);
    this.newSlot("isCollapsable", false);
  }

  init() {
    super.init();
    this.setIsDebugging(false);

    this.setKeyView(HView.clone());
    this.keyView().makeWidthFitContent().setTarget(this);
    this.keyView().listenForClick();
    this.addSubview(this.keyView());

    this.setValueView(HView.clone());
    this.valueView().makeWidthFitContent();
    this.addSubview(this.valueView());
  }

  setLabel (s) {
    this.keyView().setString(s);
    return this;
  }

  label () {
    return this.keyView().string();
  }

  onClickView(keyView) {
    if (this.isCollapsable()) {
      if (this.isCollapsed()) {
        this.uncollapseValue();
        this.sendRespondingDescendants("uncollapseValue");
      } else {
        this.collapseValue();
        this.sendRespondingDescendants("collapseValue");
      }
    }
  }

  isCollapsed () {
    return this.valueView().isHidden();
  }

  collapseValue () {
    if (this.isCollapsable()) {
      this.valueView().hide();
    }
  }

  uncollapseValue () {
    if (this.isCollapsable()) {
      this.valueView().unhide();
    }
  }

  // flex direction

  stackVertically () {
    this.setFlexDirection("column");
    this.valueView().style().paddingLeft = "0.75em"
    this.valueView().style().paddingBottom = "0.5em"
    //this.valueView().style().borderLeft = "1px #aaa solid"
    return this;
  }

  stackHorizontally () {
    this.setFlexDirection("row");
    this.valueView().style().paddingLeft = "0.5em"
    //this.valueView().style().border = "1px blue solid"
    return this;
  }

  setIsStackedVertically (aBool) {
    if (aBool) {
      this.stackVertically();
    } else {
      this.stackHorizontally();
    }
    return this;
  }

}).initThisClass();
