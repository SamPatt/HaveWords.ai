"use strict";

/* 
    PlayersColumn

*/

(class PlayersColumn extends ColumnView {
  initPrototypeSlots() {
    this.newSlot("guestUserList", null)
    this.newSlot("subnodeViewClass", null)
  }

  init() {
    super.init();
    this.setId("PlayersColumn");
    this.setSubnodeViewClass(PlayerView);
    this.setScrollView(ScrollView.clone().setId("PlayersColumn_ScrollView"));
  }

  node () {
    return App.shared().session().players();
  }

  syncFromNode() {
    this.display();
    return this;
  }

  display () {
    this.scrollView().removeAllItems();
    this.node().subnodes().forEach((player) => {
        const view = this.subnodeViewClass().clone().create().setPlayer(player);
        this.scrollView().addItemView(view);
    });
  }

}.initThisClass());
