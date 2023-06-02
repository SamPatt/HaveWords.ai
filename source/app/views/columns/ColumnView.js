"use strict";

/* 
    ColumnView

*/

(class PlayersColumn extends View {
  initPrototypeSlots() {
    this.newSlot("headerView", null)
    this.newSlot("scrollView", null)
    this.newSlot("footerView", null)
  }

  init() {
    super.init();
    this.setId("PlayersColumn");
  }

  initElement() {
    super.initElement();
    this.setScrollView(ScrollView.clone().setId("PlayersColumn_ScrollView"));
    return this;
  }

}.initThisClass());
