"use strict";

/* 
    GuestConnection

    This class is only used for Host sessions

*/

(class GuestConnection extends PeerConnection {
  initPrototypeSlots() {
    this.newSlot("pubkey", null); 
  }

  init() {
    super.init();
    this.setInfo({});
    this.setIsDebugging(false);
  }

  hostSession () {
    return HostSession.shared();
  }

  // --- nickname ----

  nickname () {
    return this.info().nickname;
  }

  setNickName (s) {
    this.info().nickname = s;
    return this;
  }

  // --- avatar --- 

  avatar () {
    return this.info().avatar;
  }

  setAvatar (s) {
    this.info().avatar = s;
    return this;
  }

  // --- canSendPrompts --- 

  canSendPrompts () {
    return this.info().canSendPrompts;
  }

  setCanSendPrompts(aBool) {
    this.info().canSendPrompts = s;
    return this;
  }
  
  // ----------------

  onOpen(peerId) {
    console.log(this.type() + " onOpen(" + peerId + ")");
    
    super.onOpen(peerId);

    if (this.hostSession().bannedGuests().has(this.id())) {
      this.send({ type: "ban" });
      setTimeout(() => this.shutdown(), 500);
    }

    this.hostSession().onOpenGuestConnection(this);

    this.setInfo({
      nickname: "",
      canSendPrompts: false,
      avatar: "",
    });

  }

  onData(data) {
    this.debugLog("onData", data);
    data.peerId = this.peerId()

    const action = "onReceived_" + data.type;

    const method = this[action];
    if (method) {
      method.apply(this, [data]);
    } else {
      debugger;
      console.warn("WARNING: no " + this.type() + "." + action + "() method found");
    }
  }

  isBanned () {
    return this.hostSession().bannedGuests().has(this.id())
  }

  description () {
    return this.type() + " id: " + this.id() + " nick: " + this.nickname()
  }

  onReceived_nickname(data) {
    if (this.isBanned()) {
      this.sendThenClose({ type: "ban" });
    } else {
      this.setNickName(data.nickname);
      this.setPubkey(data.id);

      console.log("Guest connected: " + this.description())
      const newGuestUserList = this.hostSession().calcGuestUserlist();
      const guestAvatars = this.hostSession().calcGuestAvatars();
      this.hostSession().updateGuestUserlist();

      this.send({
        type: "sessionHistory",
        history: Session.shared().history(),
        nickname: LocalUser.shared().nickname(),
        guestUserList: newGuestUserList,
        avatars: guestAvatars,
        id: LocalUser.shared().id()
      });

      // Send a new message to all connected guests to notify them of the new guest
      this.hostSession().broadcastExceptTo(
        {
          type: "guestJoin",
          message: this.nickname() + " has joined the session!",
          nickname: LocalUser.shared().nickname(),
          joiningGuestNickname: data.nickname,
          joiningGuestId: data.id,
          guestUserList: newGuestUserList,
        },
        data.peerId
      );

      GroupChatColumn.shared().addChatMessage(
        "systemMessage",
        `${data.nickname} has joined the session!`,
        LocalUser.shared().nickname(),
        this.id()
      );
    }
  }

  onReceived_remotePrompt(data) {
    // Add prompt to prompt history
    if (this.canSendPrompts()) {
      Session.shared().addToHistory({
        type: "prompt",
        data: data.message,
        id: data.id,
        nickname: data.nickname,
      });

      // Send prompt to guests
      this.hostSession().broadcastExceptTo(
        {
          type: "prompt",
          id: data.id,
          message: data.message,
          nickname: data.nickname,
        },
        data.peerId
      );

      // Display prompt
      AiChatColumn.shared().addMessage("prompt", data.message, data.nickname, data.id);

      // If in game mode, add username to prompt
      if (Session.shared().gameMode()) {
        let newMessage;
        newMessage = data.nickname + ": " + data.message;
        console.log("Game mode on, adding guest username to prompt");
        this.hostSession().sendAIResponse(newMessage);
      } else {
        this.hostSession().sendAIResponse(data.message);
      }
    } else {
      console.log(`Rejected prompt from ${conn.peer} - ${this.nickname()}`);
    }
  }

  onReceived_remoteSystemMessage(data) {
    // Add remote system message update to history if guest is allowed to send prompts
    if (this.canSendPrompts()) {
      Session.shared().addToHistory({
        type: "systemMessage",
        data: data.message,
        id: data.id,
        nickname: data.nickname,
      });
      // Update system message and display it TO DO SEND TO ALL
      AiChatColumn.shared().addMessage("systemMessage", data.message, data.nickname, data.id);
      this.hostSession().guestChangeSystemMessage(data);
    } else {
      console.log(
        `Rejected system message update from ${conn.peer} - ${channel.nickname}`
      );
    }
  }
  
  onReceived_chat(data) {
    // Add chat to chat history
    Session.shared().addToHistory({
      type: "chat",
      data: data.message,
      id: data.id,
      nickname: data.nickname,
    });

    // Display chat message
    GroupChatColumn.shared().addChatMessage(
      data.type,
      data.message,
      data.nickname,
      data.id
    );

    // Broadcast chat message to all connected guests
    this.hostSession().broadcastExceptTo(
      {
        type: "chat",
        id: data.id,
        message: data.message,
        nickname: data.nickname,
      },
      data.peerId
    );
  }

  onReceived_nicknameUpdate(data) {
    // Update nickname in datachannels
    const oldNickname = this.nickname();
    this.setNickName(data.newNickname);

    GroupChatColumn.shared().addChatMessage(
      "systemMessage",
      `${oldNickname} is now ${data.newNickname}.`,
      LocalUser.shared().nickname(),
      data.id
    );
    this.hostSession().updateGuestUserlist();
    // Update nickname in guest user list
    // Send updated guest user list to all guests
    this.hostSession().broadcast({
      type: "nicknameUpdate",
      message: `${oldNickname} is now <b>${data.newNickname}</b>.`,
      nickname: LocalUser.shared().nickname(),
      newNickname: data.newNickname,
      userId: data.id,
      guestUserList: this.hostSession().calcGuestUserlist(),
    });
  }

  onReceived_avatarUpdate(data) {
    // Update avatar in datachannels
    this.setAvatar(data.avatar);
    // Update avatar in guest user list
    Session.shared().setUserAvatar(data.id, data.avatar);
    GroupChatColumn.shared().addChatMessage(
      "systemMessage",
      `${data.nickname} updated their avatar.`,
      data.nickname,
      data.id
    );
    // Send updated guest user list to all guests
    this.hostSession().broadcast({
      type: "avatarUpdate",
      avatar: data.avatar,
      userId: data.id,
      nickname: data.nickname,
      message: `${data.nickname} updated their avatar.`
    });
  }

  onClose() {
    super.onClose();

    if (!this.isBanned()) {
      this.hostSession().broadcast({
        type: "guestLeave",
        message: `${this.nickname()} has left the session.`,
        nickname: LocalUser.shared().nickname(),
        leavingGuestNickname: this.nickname(),
        leavingGuestId: this.id(),
        guestUserList: this.hostSession().calcGuestUserlist(),
      });

      GroupChatColumn.shared().addChatMessage(
        "systemMessage",
        `${this.nickname()} has left the session.`,
        LocalUser.shared().nickname(),
        this.id()
      );
    }

    this.hostSession().updateGuestUserlist();
  }
}).initThisClass();
