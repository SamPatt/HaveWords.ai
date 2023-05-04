"use strict";

/* 
    Session

*/

(class Session extends Base {
  initPrototypeSlots() {
    this.newSlot("data", null);
    this.newSlot("localUserId", null);
    this.newSlot("inSession", false);
    this.newSlot("groupSessionType", undefined);
    this.newSlot("groupSessionDetails", undefined);
    this.newSlot("groupSessionFirstAIResponse", undefined);

    this.newSlot("gameMode", undefined);
    this.newSlot("fantasyRoleplay", false);
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

  // Avatars

  /*
  localUserAvatar() {   // use LocalUser.shared().avatar() instead
    return localStorage.getItem("avatar") || null;
  }

  setLocalUserAvatar(avatar) {   // use LocalUser.shared().setAvatar() instead
    localStorage.setItem("avatar", avatar);
  }
  */

  getUserAvatar(userId) {
    return localStorage.getItem(`avatar_${userId}`) || null;
  }

  setUserAvatar(userId, avatar) {
    localStorage.setItem(`avatar_${userId}`, avatar);
  }

}.initThisClass());


