"use strict";

/* 
    GuestSession

    manages guest connection to host

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
    SessionOptionsView.shared().displayGuestHTMLChanges();
    this.connect();
  }

  connect() {
    const hostConnection = PeerServer.shared().connectToPeerId(this.hostId());
    hostConnection.setDelegate(this);
    this.setHostConnection(hostConnection);
  }

  onOpen() {
    this.sendNickname();
  }

  onData(data) {
    this.debugLog("onData", data);

    const action = "onReceived_" + data.type;

    const method = this[action];
    if (method) {
      method.apply(this, [data]);
    } else {
      console.warn("WARNING: no " + this.type() + "." + action + "() method found");
    }
  }

  // --- receive messages ---

  onReceived_kick(data) {
    conn.close();
    console.log("You have been kicked from the session.");
    UsersView.shared().displayKickedMessage();

    const chatOutput = document.getElementById("chatOutput");
    const kickedMessage = document.createElement("li");
    kickedMessage.classList.add("kicked-message");
    kickedMessage.textContent = "You've been kicked.";
    chatOutput.appendChild(kickedMessage);
  }

  onReceived_chat(data) {
    Sounds.shared().playReceiveBeep();
    GroupChatView.shared().addChatMessage(
      data.type,
      data.message,
      data.nickname,
      data.id
    );
  }

  onReceived_prompt(data) {
    AiChatView.shared().guestAddPrompt(data);
  }

  onReceived_aiResponse(data) {
    AiChatView.shared().guestAddHostAIResponse(data.message, data.nickname);
  }

  onReceived_ban(data) {
    document.getElementById("chatInput").disabled = true;
    GroupChatView.shared().addChatMessage(
      "chat",
      "You have been banned from the session.",
      "System",
      data.id
    );
  }

  onReceived_sessionHistory(data) {
    console.log("Received session history:", data.history);
  
    // Set user avatars
    for (const [userId, avatar] of Object.entries(data.avatars)) {
      Session.shared().setUserAvatar(userId, avatar);
    }
  
    // Update guest list
    console.log("Received guestUserList:", data.guestUserList);
  
    UsersView.shared().setGuestUserList(
      data.guestUserList.filter(
        (guest) => guest.id !== LocalUser.shared().id()
      )
    );
  
    UsersView.shared().displayGuestUserList(); // Call a function to update the UI with the new guestUserList
    SessionOptionsView.shared().guestDisplayHostSessionHistory(data.history);
  }  

  onReceived_nicknameUpdate(data) {
    // Update the chat message
    GroupChatView.shared().addChatMessage(
      "chat",
      data.message,
      data.newNickname,
      data.userId
    );
  
    // Update the guest user list from the received data
    UsersView.shared().setGuestUserList(data.guestUserList);
  
    // Refresh the guest user list display
    UsersView.shared().displayGuestUserList();
    console.log("Received nickname-update" + data);
  }  

  onReceived_avatarUpdate(data) {
    Session.shared().setUserAvatar(data.userId, data.avatar);
    GroupChatView.shared().addChatMessage(
      "chat",
      data.message,
      data.nickname,
      data.userId
    );
    console.log("Received avatar-update");
  }

  onReceived_systemMessage(data) {
    AiChatView.shared().guestAddSystemMessage(data);
  }

  onReceived_imageLink(data) {
    AiChatView.shared().addImage(data.message);
  }

  onReceived_gameLaunch(data) {
    Session.shared().setGameMode(true);
    if (data.sessionType === "fantasyRoleplay") {
      SessionOptionsView.shared().startRoleplaySession();
      console.log("Guest sees Fantasy Roleplay Session Started");
    } else if (data.sessionType === "trivia") {
      SessionOptionsView.shared().startTriviaSession();
      console.log("Guest sees Trivia Session Started");
    } else if (data.sessionType === "explore") {
      SessionOptionsView.shared().startExploreSession();
      console.log("Guest sees Explore Session Started");
    } else {
      console.log("Error: Invalid session type");
    }
    AiChatView.shared().addMessage("prompt", data.message, data.nickname, data.id);
  }

  onReceived_guestJoin(data) {
    GroupChatView.shared().addChatMessage(
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
    UsersView.shared().setGuestUserList(newGuestUserList);
    UsersView.shared().displayGuestUserList();
    console.log("Received guest-join");
  }

  onReceived_guestLeave(data) {
    GroupChatView.shared().addChatMessage("chat", data.message, data.nickname),
      data.id;
    const newGuestUserList = data.guestUserList;
    const index = newGuestUserList.findIndex(
      (guest) => guest.id === LocalUser.shared().id()
    ); // Use a function to test each element
    if (index !== -1) {
      newGuestUserList.splice(index, 1);
    }
    HostSession.shared().setGuestUserList(newGuestUserList);
    UsersView.shared().displayGuestUserList();
    console.log("Received guest-leave");
  }

  onReceived_grantAiAccess(data) {
    const messageInputRemote = AiChatView.shared().messageInputRemote();
    messageInputRemote.element().disabled = false;
    messageInputRemote.element().placeholder = "Send a prompt to the AI...";
    GroupChatView.shared().addChatMessage(
      "chat",
      "You've been granted AI access!",
      "Host",
      data.id
    );
  }

  onReceived_revokeAiAccess(data) {
    const messageInputRemote = AiChatView.shared().messageInputRemote();
    messageInputRemote.element().disabled = true;
    essageInputRemote.element().placeholder = "No prompt permission";
    GroupChatView.shared().addChatMessage(
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
    this.send({
      type: "nickname",
      id: LocalUser.shared().id(),
      nickname: LocalUser.shared().nickname(),
    });
  }

  sendUsername(username) {
    this.send({
      type: "nicknameUpdate",
      id: LocalUser.shared().id(),
      newNickname: username,
    });
  }

  sendAvatar(avatar) {
    this.send({
      type: "avatarUpdate",
      id: LocalUser.shared().id(),
      nickname: LocalUser.shared().nickname(),
      avatar: avatar,
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
        message: message,
        nickname: LocalUser.shared().nickname(),
      });
      AiChatView.shared().guestAddLocalPrompt(message);
    }
  }
}).initThisClass();
