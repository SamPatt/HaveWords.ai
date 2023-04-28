"use strict";

/* 
    Session

*/

(class Session extends Base {
  initPrototypeSlots() {
    this.newSlot("data", null);
  }

  init() {
    super.init();
    this.load();
    this.setIsDebugging(true);
  }

  save() {
    const json = JSON.stringify(this.data());
    localStorage.setItem("sessionData", json);
  }

  load() {
    let json = JSON.parse(localStorage.getItem("sessionData"));

    if (!json) {
      json = {
        history: [],
      };
    }

    if (!json.history) {
      json.history = [];
    }

    this.setData(json);

    return this;
  }

  clear() {
    localStorage.removeItem("sessionData");
    localStorage.removeItem("hostId");
    localStorage.removeItem("hostNickname");
    this.load();
  }

  history() {
    return this.data().history;
  }

  addToHistory(json) {
    this.history().push(json);
    this.save();
    return this;
  }

  reset() {
    const userChoice = confirm(
      "Do you want to start a new session? This will delete the previous session data and create a new invite link."
    );
    Session.shared().clear();
    window.location.reload();
  }

}.initThisClass());

