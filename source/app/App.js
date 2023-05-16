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

    // compact controls
    this.newSlot("compactButton1", null);
    this.newSlot("compactButton2", null);

    // columns
    this.newSlot("groupChatColumn", null);
    this.newSlot("connectedUsersColumn", null);

    // other controls
    this.newSlot("musicOnButton", null);
    this.newSlot("narrationOnButton", null);
  }

  init() {
    super.init();
    this.listenForWindowClose()
    this.setIsDebugging(true);
    this.setupControls();
  }

  setupControls () {
    this.setMusicOnButton(
      RadioButton.clone().setId("MusicOnButton")
      .setTarget(this)
      .setOnLabel("Music On") 
      .setOffLabel("Music Off")
      .setShouldStore(true).load()
    );
    this.setNarrationOnButton(
      RadioButton.clone().setId("NarrationOnButton")
      .setTarget(this)
      .setOnLabel("Narration On") 
      .setOffLabel("Narration Off")
      .setShouldStore(true).load()
    );
    this.onSubmit_MusicOnButton();
    this.onSubmit_NarrationOnButton();
    //TODO: sync with state after app init?
  }

  onSubmit_MusicOnButton () {
    MusicPlayer.shared().setIsMuted(!this.musicOnButton().state());
  }

  onSubmit_NarrationOnButton () {
    AzureTextToSpeech.shared().setIsMuted(!this.narrationOnButton().state());
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
      RadioButton.clone().setId("compactButton1").setTarget(this).setAction("onCompact1").setOnIconPath("resources/icons/carret-left.svg").setOffIconPath("resources/icons/carret-right.svg")
    );

    this.setCompactButton2(
      RadioButton.clone().setId("compactButton2").setTarget(this).setAction("onCompact2").setOnIconPath("resources/icons/carret-left.svg").setOffIconPath("resources/icons/carret-right.svg")
    );

    this.setGroupChatColumn(View.clone().setId("groupChatColumn"));
    this.setConnectedUsersColumn(View.clone().setId("connectedUsersColumn"));
  }

  onCompact1 (aButton) {
    const s = aButton.state();
    this.groupChatColumn().setIsHidden(s);
    this.connectedUsersColumn().setIsHidden(s);
    this.compactButton2().setState(s)
  }

  onCompact2 (aButton) {
    this.connectedUsersColumn().setIsHidden(aButton.state());
  }

}).initThisClass();

/*
window.onerror = function(message, source, lineno, colno, error) {
  console.log('An error occurred: ', message);
  debugger;
  return true; // This prevents the firing of the default event handler
};
*/

