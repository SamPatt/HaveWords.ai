"use strict";

/* 
    HostSession

    PeerJS webRTC code

*/

(class HostSession extends Base {
  initPrototypeSlots() {
    this.newSlot("bannedGuests", null);
    this.newSlot("hasSetup", false);
  }

  init() {
    super.init();
    this.setBannedGuests(new Set());
    this.setIsDebugging(true);

    assert(App.shared().isHost()); // Guest sessions should never access this class
  }

  broadcast(json) {
    PeerServer.shared().broadcast(json);
  }

  broadcastExceptTo(json, excludeId) {
    PeerServer.shared().broadcastExceptTo(json, excludeId);
  }

  broadcastPlayTrackId (trackId) {
    this.broadcast({
      type: "playTrackId",
      //id: LocalUser.shared().id(),
      //nickname: LocalUser.shared().nickname(),
      trackId: trackId,
    });
  }

  async broadcastPlayAudioBlob (audioBlob) {
    const dataUrl = await audioBlob.asyncToDataUrl();
    this.broadcast({
      type: "playAudioBlob",
      //id: LocalUser.shared().id(),
      //nickname: LocalUser.shared().nickname(),
      audioBlobDataUrl: dataUrl,
    });
  }

  // --- user actions ---

  kickUser(userId) {
    console.log("Kicked guest: " + userId);
    const pc = PeerServer.shared().peerConnectionForId(userId);
    if (pc) {
      pc.sendThenClose({ type: "kick" });
    }
    this.sendSystemMessage(userId + " was kicked")
  }

  banUser(userId) {
    console.log("Banned guest: " + userId);
    this.bannedGuests().add(userId);

    const pc = PeerServer.shared().peerConnectionForId(userId);
    
    if (pc) {
      pc.sendThenClose({ type: "ban" });
    }
    this.sendSystemMessage(pc.nickname() + " was banned")
  }
  
  closeConnectionForUser(userId) {
    const pc = PeerServer.shared().peerConnectionForId(userId);
    if (pc) {
      pc.shutdown()
    }
  }

  // --- peer setup ---

  setupInviteButton() {
    const inviteLink = App.shared().inviteLink();
    InviteButton.shared().setLink(inviteLink);
  }

  setupHostSession() {
    if (this.hasSetup()) {
      // might get called again if we reconnect to PeerServer
      return
    }
    this.setHasSetup(true);

    assert(App.shared().isHost())

    //console.log("Setting up host session");
    this.setupInviteButton();

    Session.shared().clear()
    SessionOptionsView.shared().displaySessionHistory();
    SessionOptionsView.shared().displayHostHTMLChanges();

    OpenAiChat.shared().clearConversationHistory();
    //this.showHostIntroMessage()
  }

  showHostIntroMessage () {
      const message = `<p>Welcome, <b>${LocalUser.shared().nickname()}</b>!</p>` + 
        "<p>If you'd like to have others join your session, you can share the invite link (top right button in this window) with your friends.</p>" +
        "<p>Click on their usernames in the Guest section to grant them access to your AI, or to kick or mute them if they are behaving badly.</p>";
        
      AiChatView.shared().addMessage(
        "systemMessage",
        message,
        "HaveWords",
        LocalUser.shared().id()
      );
  }

  calcGuestAvatars() {
    let avatars = {};
  
    // Only add the local user's avatar if it exists
    if (LocalUser.shared().avatar()) {
      avatars[LocalUser.shared().id()] = LocalUser.shared().avatar();
    }
  
    PeerServer.shared()
      .peerConnections()
      .forEachKV((guestId, peerConnection) => {
        const guestAvatar = Session.shared().getUserAvatar(guestId);
        // Only add the guest's avatar if it exists
        if (guestAvatar) {
          avatars[guestId] = guestAvatar;
        }
      });
  
    return avatars;
  }  

  calcGuestUserlist() {
    let userList = [];

    userList.push({
      id: LocalUser.shared().id(),
      nickname: LocalUser.shared().nickname(),
    });

    PeerServer.shared()
      .peerConnections()
      .forEachKV((guestId, peerConnection) => {
        userList.push({
          id: guestId,
          nickname: peerConnection.info().nickname,
        });
      });

      return userList
    }

  updateGuestUserlist() {
    UsersView.shared().setGuestUserList(this.calcGuestUserlist());
    return userList;
  }

  // ---------------------

  guestChangeSystemMessage(data) {
    const content = data.message;
    OpenAiChat.shared().addToConversation({
      role: "user",
      content: prompt,
    });

    // Relay to connected guests
    this.broadcast({
      type: "systemMessage",
      id: data.id,
      message: data.message,
      nickname: data.nickname,
    });
  }

  // Send imageURL to all connected guests
  broadcastImage(imageURL) {
    Session.shared().addToHistory({
      type: "imageLink",
      data: imageURL,
      id: LocalUser.shared().id(),
      nickname: LocalUser.shared().nickname(),
    });

    this.broadcast({
      type: "imageLink",
      message: imageURL,
      nickname: LocalUser.shared().nickname(),
    });
  }

  sendPrompt(message) {
    this.broadcast({
      type: "prompt",
      id: LocalUser.shared().id(),
      message: message,
      nickname: LocalUser.shared().nickname(),
    });

    if (Session.shared().gameMode()) {
      message = LocalUser.shared().nickname() + ": " + message;
      console.log("Game mode on, host adds username to prompt");
    }
    this.sendAIResponse(message);
  }

  sendSystemMessage(message) {
    this.broadcast({
      type: "systemMessage",
      id: LocalUser.shared().id(),
      message: message,
      nickname: LocalUser.shared().nickname(),
    });
  }

  async sendAIResponse(prompt) {
    // Get AI Response and post locally
    const response = await OpenAiChat.shared().asyncFetch(prompt, this);
  
    AiChatView.shared().addAIReponse(response);

    this.broadcast({
      type: "aiResponse",
      id: LocalUser.shared().id(),
      message: response,
      nickname: SessionOptionsView.shared().selectedModelNickname(),
    });
  }

  onStreamData (request, newData) {
    console.log("Host " + request.requestId() + " onStreamData:" , newData);
  }

  onStreamComplete (request, allData) {
    console.log("Host " + request.requestId() + " onStreamComplete:" , allData);
  }
  
}).initThisClass();
