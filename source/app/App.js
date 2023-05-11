"use strict";

/* 
    App

*/

(class App extends Base {
  static launch() {
    //console.log("App launch");
    App.shared().asyncRun();
  }

  initPrototypeSlots() {
    this.newSlot("user", null);
    this.newSlot("compactButton1", null);
    this.newSlot("compactButton2", null);
  }

  init() {
    super.init();
    this.listenForWindowClose()
    this.setIsDebugging(true);
  }

  async asyncRun() {
    // setup LocalUser and PeerServer
    // after PeerServer opens, we'll get an onPeerOpen delegate message
    // which is were we'll set up HostSession or GuestSession

    await LocalUser.shared().asyncSetup();
    UsernameView.shared().setString(LocalUser.shared().nickname());

    PeerServer.shared().setDelegate(this).setup();

    SessionOptionsView.shared().appDidInit();
    this.unhide();

    OpenAiChat.shared().addToConversation({
      role: "system",
      content: "You are a helpful assistant.",
    });
    this.setupCompactorButtons();
  }

  unhide () {
    document.getElementById("appView").style.display = "block"; 
  }

  onPeerServerOpen() {
    // sent by PeerServer after connected
    if (this.isHost()) {
      //console.log("setup for HOST ==========================");
      PeerServer.shared().setPeerConnectionClass(GuestConnection);
      HostSession.shared().setupHostSession();
    } else {
      //console.log("setup for GUEST ==========================");
      //PeerServer.shared().setAllowsIncomingConnections(false)
      GuestSession.shared().joinSession(this.inviteId());
    }
  }

  // --- invite ---

  inviteId() {
    let roomId;
    const hashParams = new URLSearchParams(window.location.hash.substr(1));
    if (hashParams.has("room")) {
      // If the room ID is in the hash, use it
      roomId = hashParams.get("room");
    } else {
      // Otherwise, try to get it from the query string
      const urlParams = new URLSearchParams(window.location.search);
      roomId = urlParams.get("room");
    }
    return roomId;
  }

  inviteLink() {
    const hostRoomId = LocalUser.shared().id();
    const isFile = window.location.protocol === "file:";
    const base = isFile ? window.location.href : window.location.origin + "/";
    return `${base}?room=${hostRoomId}`;
  }

  isHost() {
    return !this.inviteId();
  }

  // --- handle window close ---

  listenForWindowClose () {
    window.addEventListener('beforeunload',  (event) => { this.onWindowClose() });
  }

  onWindowClose () {
    PeerServer.shared().shutdown()
  }

  // setup

  setupCompactorButtons () {
    this.setCompactButton1(
      Button.clone().setId("compactButton1").setTarget(this).setAction("onCompact1")
    );
    this.setCompactButton2(
      Button.clone().setId("compactButton2").setTarget(this).setAction("onCompact2")
    );
  }

  onCompact1 (aButton) {
    const group = View.clone().setId("groupChatColumn");
    const users = View.clone().setId("connectedUsersColumn");
    const toggled = !group.isHidden();
    group.setIsHidden(toggled);
    users.setIsHidden(toggled);
  }

  onCompact2 (aButton) {
    const users = View.clone().setId("connectedUsersColumn");
    users.setIsHidden(!users.isHidden());
  }

}).initThisClass();
