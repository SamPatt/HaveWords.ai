"use strict";

/* 
    ColumnView

*/

(class ColumnView extends View {
  initPrototypeSlots() {
    this.newSlot("headerView", null)
    this.newSlot("scrollView", null)
    this.newSlot("footerView", null)
  }

  init() {
    super.init();
  }

  initElement() {
    super.initElement();
    //this.setScrollView(ScrollView.clone().setId("PlayersColumn_ScrollView"));
    return this;
  }

}.initThisClass());
