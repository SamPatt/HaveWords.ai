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

  playTrackId (trackId) {
    MusicPlayer.shared().playTrackId(trackId);
    HostSession.shared().broadcastPlayTrackId(trackId);
  }

  broadcastPlayTrackId (trackId) {
    this.broadcast({
      type: "playTrackId",
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

    OpenAiChat.shared().addToConversation({
      role: "system",
      content: "You are a helpful assistant.",
    });
    //this.showHostIntroMessage()
  }

  showHostIntroMessage () {
    /*
      const message = `<p>Welcome, <b>${LocalUser.shared().nickname()}</b>!</p>` + 
        "<p>If you'd like to have others join your session, you can share the invite link (top right button in this window) with your friends.</p>" +
        "<p>Click on their usernames in the Guest section to grant them access to your AI, or to kick or mute them if they are behaving badly.</p>";
        
      AiChatView.shared().addMessage(
        "systemMessage",
        message,
        "HaveWords",
        LocalUser.shared().id()
      );
      */
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
  broadcastImage(imageURL, requestId) {
    Session.shared().addToHistory({
      type: "imageLink",
      data: imageURL,
      requestId: requestId,
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

  async sendAIResponse(prompt, role = "user") {
    // Get AI Response and post locally
    const request = await OpenAiChat.shared().newRequestForPrompt(prompt, role);
    request.setStreamTarget(this);

    AiChatView.shared().addAIReponse("", request.requestId());

    this.broadcast({
      type: "aiResponse",
      id: LocalUser.shared().id(),
      requestId: request.requestId(),
      message: "",
      nickname: SessionOptionsView.shared().selectedModelNickname(),
    });

    return await request.asyncSendAndStreamResponse();
  }

  /*
  onStreamData (request, newData) {
    //console.log("Host " + request.requestId() + " onStreamData:" , newData);
    const content = request.fullContent();
    const validated = constent.validatedHtml();
    const lastContent = request.lastContent();

    if (validated !== ) {
      //const sendContent = content;

      const newContent = content.substr(lastContent.length);
      const wrappedNewContent = newContent.wrapHtmlWordsWithSpanClass("fadeInWord");
      
      //console.log("---\n" + wrappedNewContent + "\n---");

      const sendContent = lastContent + wrappedNewContent;
      request.setLastContent(content);
      
      this.shareUpdate(request, sendContent);
    }
  }
  */

  onStreamData (request, newData) {
    //console.log("Host " + request.requestId() + " onStreamData:" , newData);
    const content = request.fullContent();

    if (content.isValidHtml()) {
      //const sendContent = content;

      const lastContent = request.lastContent();
      const newContent = content.substr(lastContent.length);
      const wrappedNewContent = newContent.wrapHtmlWordsWithSpanClass("fadeInWord");
      
      //console.log("---\n" + wrappedNewContent + "\n---");

      const sendContent = lastContent + wrappedNewContent;
      request.setLastContent(content);
      
      this.shareUpdate(request, sendContent);
    }
  }

  shareUpdate (request, sendContent) {
    //console.log("shareUpdate:", sendContent);
    //console.log("---");

    AiChatView.shared().updateAIResponse(request.requestId(), sendContent)
    this.broadcast({
      type: "updateAiResponse",
      id: LocalUser.shared().id(),
      requestId: request.requestId(),
      message: sendContent,
    });
  }

  onStreamComplete (request) {
    const content = request.fullContent();
    this.shareUpdate(request, content);
    AiChatView.shared().onAiResponseCompleteText(content);
    console.log("Host " + request.requestId() + " onStreamComplete");
  }

  updateImageProgress(imageGen) { 
    //console.log(this.type() + ` MJImageGenProgress status: ${imageGen.status()} progress: ${ imageGen.progress()}`);
    const json = {
      type: "updateImageProgress",
      id: LocalUser.shared().id(),
      requestId: imageGen.requestId(),
      percentage: imageGen.progress(),
      timeTaken: imageGen.timeTaken(),
      status: imageGen.status(),
    };

    AiChatView.shared().updateImageProgressJson(json);
    this.broadcast(json);
  }
  
}).initThisClass();
