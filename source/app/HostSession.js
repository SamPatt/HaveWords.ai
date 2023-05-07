"use strict";

/* 
    HostSession

    PeerJS webRTC code

*/

(class HostSession extends Base {
  initPrototypeSlots() {
    this.newSlot("bannedGuests", null);
    //this.newSlot("conn", null);
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

  // --- get channel / connection for a userId ---

  channelForUserId(userId) {
    return this.dataChannels().get(userId);
  }

  connectionForUserId(userId) {
    const channel = this.channelForUserId(userId);
    if (channel) {
      return channel.conn;
    }
    return undefined;
  }

  // --- user actions ---

  kickUser(userId) {
    console.log("Kicked guest: " + userId);
    const conn = this.connectionForUserId(userId);
    if (conn) {
      conn.sendThenClose({ type: "kick" });
    }
  }

  banUser(userId) {
    console.log("Banned guest: " + userId);
    this.bannedGuests().add(userId);

    const peerConn = this.peerConnectionForId(userId);
    if (peerConn) {
      conn.sendThenClose({ type: "ban" });
    }
  }
  
  closeConnectionForUser(userId) {
    const peerConn = this.peerConnectionForId(userId);
    if (peerConn) {
      peerConn.shutdown()
    }
  }

  updateHostAvatar(newAvatar) {
    const json = {
      type: "avatarUpdate",
      message: `Host updated their avatar.`,
      nickname: LocalUser.shared().nickname(),
      userId: LocalUser.shared().id(),
      avatar: newAvatar,
      guestUserList: this.calcGuestUserlist(),
    };

    this.broadcast(json);
  }

  // --- peer setup ---

  setupInviteButton() {
    const inviteLink = App.shared().inviteLink();
    InviteButton.shared().setLink(inviteLink);
  }

  setupHostSession() {
    assert(App.shared().isHost())

    console.log("Setting up host session");
    this.setupInviteButton();

    Session.shared().clear()
    SessionOptionsView.shared().displaySessionHistory();
    SessionOptionsView.shared().displayHostHTMLChanges();

    OpenAiChat.shared().clearConversationHistory();
    //this.showHostIntroMessage()
  }

  showHostIntroMessage () {
      const message = `<p>Welcome, <b> ${LocalUser.shared().nickname()} </b>!</p>` + 
        "<p>To begin your AI sharing session, copy the invite link (using the right button) to your friends.</p>" +
        "<p>Click on their usernames in the Guest section to grant them access to your AI - or to kick them if they are behaving badly.</p>";
        
      AiChatView.shared().addMessage(
        "systemMessage",
        message,
        "HaveWords",
        LocalUser.shared().id()
      );
  }

  /*
  these get handled by GuestConnection instances

  onOpenPeerConnection (conn) {
    this.updateGuestUserlist()
  }
  
  onClosePeerConnection (conn) {
    this.updateGuestUserlist()
  }
  */

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

    // Update system message input
    //this.systemMessageInput().value = content;

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

  async sendAIResponse(message, nickname) {
    // Get AI Response and post locally
    const response = await OpenAiChat.shared().asyncFetch(message);
  
    AiChatView.shared().addAIReponse(response);
  
    this.broadcast({
      type: "aiResponse",
      id: LocalUser.shared().id(),
      message: response,
      nickname: SessionOptionsView.shared().selectedModelNickname(),
    });
  }
  
}).initThisClass();
