"use strict";

/* 

    Player

      nickname
      id
      avatar

      LocalUser ref?
      PeerConnection ref?
      
*/

(class Player extends Base {
  initPrototypeSlots() {
    this.newSlot("info", null);
    //this.newSlot("localUser", null);
    //this.newSlot("guestConnection", null);
  }

  init() {
    super.init();
    this.setInfo({})
  }

  isLocal () {
    return this.id() === LocalUser.shared().id();
  }

  setJson(json) {
    this.setInfo(json);
    return this;
  }

  asJson () {
    return this.info();
  }

  // id

  id () {
    return this.info().id;
  }

  setId (v) {
    this.info().id = v;
    return this;
  }

  // nickname

  nickname () {
    return this.info().nickname;
  }

  setNickname (v) {
    this.info().nickname = v;
    return this;
  }

  // avatar

  avatar () {
    return this.info().avatar;
  }

  setAvatar (v) {
    this.info().avatar = v;
    return this;
  }

  // canSendPrompts

  canSendPrompts () {
    return this.info()._canSendPrompts
  }

  setCanSendPrompts(v) {
    this.info()._canSendPrompts = v;
    return this;
  }

  // data

  data () {
    return this.info().data;
  }

  setData (v) {
    this.info().data = v;
    return this;
  }

}.initThisClass());

