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
    this.clearHostnickname();
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

  // hostNickname

  setHostNickname (s) {
    localStorage.setItem("hostNickname", s);
    return this;
  }

  hostNickname (s) {
    return localStorage.getItem("hostNickname");
  }

  clearHostnickname () {
    localStorage.removeItem("hostNickname");
    return this;
  }

  // guestNickname

  setGuestNickname (s) {
    localStorage.setItem("guestNickname", s);
    return this;
  }

  guestNickname (s) {
    return localStorage.getItem("guestNickname");
  }

  clearGuestNickname () {
    localStorage.removeItem("guestNickname");
    return this;
  }



}.initThisClass());

let id;

let hostWelcomeMessage = false;
let groupSessionType;
let groupSessionDetails;
let groupSessionFirstAIResponse;
let inSession = false;