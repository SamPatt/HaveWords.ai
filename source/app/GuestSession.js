"use strict";

/* 
    GuestSession

    Manages a guest's session and connection to it's host.
    

*/

(class GuestSession extends Base {
  initPrototypeSlots() {
    this.newSlot("hostId", null);
    this.newSlot("hostConnection", null);
  }

  init() {
    super.init();
    assert(!App.shared().isHost()); // Host sessions should never access this class
    this.setIsDebugging(true);
  }

  // --- connect ---

  joinSession(inviteId) {
    this.setHostId(inviteId);
    this.debugLog("joinSession " + inviteId);
    Session.shared().clear()
    GroupChatColumn.shared().displayGuestHTMLChanges();
    this.connect();
  }

  peerId () {
    return PeerServer.shared().peerId();
  }

  connect() {
    const hostConnection = PeerServer.shared().connectToPeerId(this.hostId());
    hostConnection.setDelegate(this);
    this.setHostConnection(hostConnection);
  }

  onOpen() {
    this.sendNickname(); // This will also share our cryptoId
  }

  async onData(data) {
    this.debugLog("onData", data);

    const action = "onReceived_" + data.type;

    const method = this[action];
    if (method) {
      /*
      const isValid = await LocalUser.shared().cryptoId().verifySignatureOnJson(data); // don't forget to also check if pubkey is correct!
      console.log("DATA:", data);
      console.log("SIG isValid:", isValid);
      */
      method.apply(this, [data]);
    } else {
      console.warn("WARNING: no " + this.type() + "." + action + "() method found");
    }
  }

  clearUserList () {
    PlayersColumn.shared().setGuestUserList([]);
  }

  // --- receive messages ---

  onReceived_playTrackId (data) {
    console.log("onReceived_playTrackId('" + data.trackId + "')");
    MusicPlayer.shared().playTrackId(data.trackId);
  }

  async onReceived_playAudioBlob(data) {
    console.log("onReceived_playAudioBlob()");
    const audioBlob = await Blob.asyncFromDataUrl(data.audioBlobDataUrl);
    AzureTextToSpeech.shared().queueAudioBlob(audioBlob);
  }

  onReceived_kick(data) {
    //this.hostConnection().shutdown();
    console.log("You have been kicked from the session.");
    GroupChatColumn.shared().addChatMessage(
      "chat",
      "You have been kicked from the session.",
      "System",
      data.id
    );
    this.clearUserList();
    document.getElementById("chatInput").disabled = true;
  }

  onReceived_chat(data) {
    // moved to ChatDataMessage onReceived
    Sounds.shared().playReceiveBeep();
    GroupChatColumn.shared().addChatMessage(
      data.type,
      data.message,
      data.nickname,
      data.id
    );
  }

  onReceived_prompt(data) {
    AiChatColumn.shared().guestAddPrompt(data);
  }

  onReceived_aiResponse(json) {
    AiChatColumn.shared().guestAddHostAIResponse(json);
  }

  onReceived_updateAiResponse(json) {
    AiChatColumn.shared().updateAIResponseJson(json) 
  }

  onReceived_ban(data) {
    //this.hostConnection().shutdown();
    GroupChatColumn.shared().addChatMessage(
      "chat",
      "You have been banned from the session.",
      "System",
      data.id
    );
    this.clearUserList();
    document.getElementById("chatInput").disabled = true;
  }

  onReceived_sessionHistory(data) {
    console.log("Received session history:", data.history);
  
    // Set user avatars
    for (const [userId, avatar] of Object.entries(data.avatars)) {
      Session.shared().setUserAvatar(userId, avatar);
    }
  
    // Update guest list
    console.log("Received guestUserList:", data.guestUserList);
  
    PlayersColumn.shared().setGuestUserList(data.guestUserList);
    AiChatColumn.shared().guestDisplayHostSessionHistory(data.history);
  }  

  onReceived_updateImageProgress(data) {
    AiChatColumn.shared().updateImageProgressJson(data);
  }

  onReceived_nicknameUpdate(data) {
    // Update the chat message
    GroupChatColumn.shared().addChatMessage(
      "chat",
      data.message,
      data.newNickname,
      data.userId
    );
  
    // Update the guest user list from the received data
    PlayersColumn.shared().setGuestUserList(data.guestUserList);
    console.log("Received nickname-update" + data);
  }  

  onReceived_avatarUpdate(data) {
    Session.shared().setUserAvatar(data.userId, data.avatar);
    GroupChatColumn.shared().addChatMessage(
      "chat",
      data.message,
      data.nickname,
      data.userId
    );
    console.log("Received avatar-update");
  }

  onReceived_systemMessage(data) {
    AiChatColumn.shared().guestAddSystemMessage(data);
  }

  onReceived_imageLink(data) {
    AiChatColumn.shared().addImage(data.message, data.requestId);
  }

  onReceived_gameLaunch(data) {
    AiChatColumn.shared().addMessage("prompt", data.message, data.nickname, data.id);
  }

  onReceived_ThemeUpdate(data) {
    App.shared().applyThemeDict(data.json);
  }

  onReceived_guestJoin(data) {
    GroupChatColumn.shared().addChatMessage(
      "chat",
      data.message,
      data.nickname,
      data.joiningGuestId
    );
    const newGuestUserList = data.guestUserList;
    const index = newGuestUserList.findIndex(
      (guest) => guest.id === LocalUser.shared().id()
    ); // Use a function to test each element
    if (index !== -1) {
      newGuestUserList.splice(index, 1);
    }
    PlayersColumn.shared().setGuestUserList(newGuestUserList);
    console.log("Received guest-join");
  }

  onReceived_guestLeave(data) {
    GroupChatColumn.shared().addChatMessage("chat", data.message, data.nickname),
      data.id;
    const newGuestUserList = data.guestUserList;
    const index = newGuestUserList.findIndex(
      (guest) => guest.id === LocalUser.shared().id()
    ); // Use a function to test each element
    if (index !== -1) {
      newGuestUserList.splice(index, 1);
    }
    PlayersColumn.shared().setGuestUserList(newGuestUserList);
    console.log("Received guest-leave");
  }

  onReceived_grantAiAccess(data) {
    const messageInputRemote = AiChatColumn.shared().messageInputRemote();
    messageInputRemote.element().disabled = false;
    messageInputRemote.element().placeholder = "Send a prompt to the AI...";
    GroupChatColumn.shared().addChatMessage(
      "chat",
      "You've been granted AI access!",
      "Host",
      data.id
    );
  }

  onReceived_revokeAiAccess(data) {
    const messageInputRemote = AiChatColumn.shared().messageInputRemote();
    messageInputRemote.element().disabled = true;
    essageInputRemote.element().placeholder = "No prompt permission";
    GroupChatColumn.shared().addChatMessage(
      "chat",
      "You've lost AI access.",
      "Host",
      data.id
    );
  }

  // --- send messages ---

  send(json) {
    this.hostConnection().send(json)
  }

  sendNickname() {
    const json = {
      type: "nickname",
      id: LocalUser.shared().id(),
      nickname: LocalUser.shared().nickname(),
    };
    console.log("sendNickname ", json);
    this.send(json);
  }

  sendNicknameUpdate(username) {
    this.send({
      type: "nicknameUpdate",
      id: LocalUser.shared().id(),
      newNickname: username,
    });
  }

  /*
  sendAvatar() {
    LocalUser.shared().shareAvatar();
  }
  */

  sendChat(message) {
    this.send({
      type: "chat",
      id: LocalUser.shared().id(),
      nickname: LocalUser.shared().nickname(),
      message: message,
    });
  }

  sendGuestPrompt() {
    const input = document.getElementById("messageInputRemote");
    let message = input.value;

    if (message.trim() !== "") {
      input.value = "";
      // Send chat message to host
      this.send({
        type: "remotePrompt",
        id: LocalUser.shared().id(),
        nickname: LocalUser.shared().nickname(),
        message: message,
      });
      AiChatColumn.shared().guestAddLocalPrompt(message);
    }
  }
}).initThisClass();
