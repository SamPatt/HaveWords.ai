"use strict";

/* 
    LocalHost

    PeerJS webRTC code

*/

//let conn;

(class LocalHost extends Base {
  initPrototypeSlots() {
    this.newSlot("connections", null);
    this.newSlot("dataChannels", null);
    this.newSlot("guestUserList", null);
    
    this.newSlot("bannedGuests", null);
    this.newSlot("peer", null);

    this.newSlot("retryCount", 0);
    this.newSlot("maxRetries", 5);
    this.newSlot("connToHost", null);

    /*
    this.newSlot("conn", null)
    */
  }

  init() {
    super.init();
    this.setConnections(new Map());
    this.setDataChannels(new Map());
    this.setGuestUserList([]);
    this.setBannedGuests(new Set());
    this.setIsDebugging(true);
  }

  // --- ids ---

  setupIds() {
    // If user is host, check if there is an existing hostId in local storage
    if (LocalHost.shared().isHost()) {
      const existingHostId = localStorage.getItem("hostId");
      const existingHostNickname = Session.shared().hostNickname();
      if (existingHostId) {
        // If there is an existing hostId, set the hostId to the existing one
        Session.shared().setLocalUserId(existingHostId);
        //Session.shared().setLocalUserId(existingHostId)
        Session.shared().setHostNickname(existingHostNickname);
      } else {
        // If there is no existing hostId, generate a new one and save it to local storage
        Session.shared().setLocalUserId(LocalHost.shared().generateId());
        localStorage.setItem("hostId", Session.shared().localUserId());
      }
    } else {
      // If user is guest, generate a new id
      const existingGuestId = localStorage.getItem("guestId");
      const existingGuestNickname = Session.shared().guestNickname();
      if (existingGuestId) {
        // If there is an existing guestId, set the guestId to the existing one
        Session.shared().setLocalUserId(existingGuestId);
        Session.shared().setGuestNickname(existingGuestNickname);
      } else {
        // If there is no existing guestId, generate a new one and save it to local storage
        Session.shared().setLocalUserId(LocalHost.shared().generateId());
        localStorage.setItem("guestId", Session.shared().localUserId());
      }
    }
  }

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

  isHost() {
    const isHost = !this.inviteId();
    //console.log("isHost:" + isHost)
    return isHost;
  }

  broadcast(json) {
    this.dataChannels().forEachKV((guestId, channel) => {
      channel.conn.send(json);
    });
  }

  broadcastExceptTo(json, excludeId) {
    this.dataChannels().forEachKV((guestId, channel) => {
      if (guestId !== excludeId) {
        channel.conn.send(json);
      }
    });
  }

  generateId() {
    // These functions are called if the user is the host, to generate room IDs and create and copy the invite link
    return Math.random().toString(36).substr(2, 9);
  }

  // --- guest token ---

  guestToken() {
    let guestToken = localStorage.getItem("guestToken");
    if (!guestToken) {
      guestToken = this.generateToken();
      localStorage.setItem("guestToken", guestToken);
    }
    return guestToken;
  }

  // Creates a token for guest identity across sessions
  generateToken() {
    console.log("Generating token...");
    return (
      Math.random().toString(36).substr(2) +
      Math.random().toString(36).substr(2)
    );
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
      conn.send({ type: "kick" });
      setTimeout(() => {
        this.closeConnectionForUser(userId);
      }, 500); // TODO: is delay needed?
    }
  }

  banUser(userId, token) {
    console.log("Banned guest: " + userId);
    console.log(token);
    console.log(bannedGuests);

    this.bannedGuests().add(token);

    const conn = this.connectionForUserId(userId);
    if (conn) {
      conn.send({ type: "ban" });
      setTimeout(() => {
        this.closeConnectionForUser(userId);
      }, 500); // TODO: is delay needed?
    }
  }

  closeConnectionForUser(userId) {
    const channel = this.channelForUserId(userId);
    if (channel) {
      const conn = this.connectionForUserId(userId);
      conn.close();
      this.dataChannels().delete(userId);
      UsersView.shared().updateUserList();
    } else {
      console.warn("attempt to close missing channel for userId: " + userId);
    }
  }

  updateGuestUserlist() {
    let userList = [];

    userList.push({
      id: Session.shared().localUserId(),
      nickname: Session.shared().hostNickname(),
    });
    LocalHost.shared()
      .dataChannels()
      .forEachKV((guestId, channel) => {
        userList.push({
          id: guestId,
          nickname: channel.nickname,
        });
      });

    this.setGuestUserList(userList);
    return userList;
  }

  // --- peer setup ---

  setupPeer() {
    /*
    // Local peerjs server
    const newPeer = new Peer(id, {
      host: "localhost",
      port: 9000,
      path: "/myapp",
    });
    */

    // Deployed peerjs server
    const newPeer = new Peer(Session.shared().localUserId(), {
      host: "peerjssignalserver.herokuapp.com",
      path: "/peerjs",
      secure: true,
      port: 443,
    });

    this.setPeer(newPeer);

    newPeer.on("open", () => {
      this.onOpenPeer() 
    });

    newPeer.on("error", (error) => {
      this.onPeerError(error);
    });

    newPeer.on("call", (call) => {
      this.onPeerCall(call);
    });

    return this;
  }

  onOpenPeer() {
    console.log(
      "PeerJS client is ready. Peer ID:",
      Session.shared().localUserId()
    );

    if (LocalHost.shared().isHost()) {
      //Session.shared().load() // loadSessionData();
      displaySessionHistory();
      if (!Session.shared().hostNickname()) {
        Session.shared().setHostNickname(
          Nickname.generateHostNickname() + " (host)"
        );
        UsernameView.shared().setString(Session.shared().hostNickname());
      } else {
        console.log(
          "Host nickname is already set:",
          Session.shared().hostNickname()
        );
      }
      if (Session.shared().hostWelcomeMessage() === false) {
        LocalHost.shared().asyncSetupHostSession(); // Call the function to set up the host session
        Session.shared().setHostWelcomeMessage(true);
      }
    } else {
      if (!Session.shared().guestNickname()) {
        Session.shared().setGuestNickname(Nickname.generateNickname());
        UsernameView.shared().setString(Session.shared().guestNickname());
        console.log("Guest nickname:", Session.shared().guestNickname());
      } else {
        console.log(
          "Guest nickname is already set:",
          Session.shared().guestNickname()
        );
      }
      RemoteHost.shared().asyncSetupJoinSession(); // Call the function to set up the join session
    }
  }

  onPeerError(err) {
    console.log("PeerJS error:", err);

    if (this.retryCount() < this.maxRetries()) {
      setTimeout(() => {
        console.log("Attempting to reconnect to PeerJS server...");
        this.peer().reconnect();
        this.setRetryCount(this.retryCount() + 1);
      }, 5000);
    } else {
      console.log(
        "Reached maximum number of retries. Displaying system message."
      );
      // Display a system message here, e.g. by updating the UI
      addChatMessage(
        "system-message",
        `Connection to peer server lost. Your existing connections still work, but you won't be able to make new connections or voice calls.`,
        "System"
      );
    }
  }

  onPeerCall(call) {
    // Answer incoming voice call
    const acceptCall = confirm(
      `Incoming call. Do you want to accept the call?`
    );

    if (acceptCall) {
      call.answer(Microphone.shared().userAudioStream());
      console.log("Answering incoming call from:", call.peer);

      call.on("stream", (remoteStream) => {
        handleRemoteStream(remoteStream);
        updateCalleeVoiceRequestButton(call.peer, call);
      });

      call.on("close", () => {
        // Handle call close event
        console.log("Call with peer:", call.peer, "has ended");
      });
    } else {
      console.log("Call from", call.peer, "rejected");
    }
  }



async asyncSetupHostSession() {
  console.log("Setting up host session");
  displayHostHTMLChanges();
  const inviteLink = Session.shared().inviteLink();
  InviteButton.shared().setLink(inviteLink);

  if (!Session.shared().fantasyRoleplay()) {
    addMessage(
      "system-message",
      `<p>Welcome, <b> ${Session.shared().hostNickname()} </b>!</p><p>To begin your AI sharing session, choose your AI model and input your OpenAI <a href="https://platform.openai.com/account/api-keys">API Key</a> key above. Your key is stored <i>locally in your browser</i>.</p><p>Then send this invite link to your friends: <a href="${inviteLink}">${inviteLink}</a>.  Click on their usernames in the Guest section to grant them access to your AI - or to kick them if they are behaving badly.</p> <p>Feeling adventurous? Click <b>Start Game</b> to play an AI guided roleplaying game with your friends. Have fun!</p>`,
      "HaveWords"
    );
  }
  // Handle incoming connections from guests
  LocalHost.shared().peer().on("connection", (conn) => {
    console.log("Incoming connection:", conn);
    conn.on("open", () => {
      LocalHost.shared().connections().set(conn.peer, conn);

      // Adds to datachannels
      LocalHost.shared().dataChannels().set(conn.peer, {
        conn: conn,
        id: conn.peer,
        nickname: "",
        token: "",
        canSendPrompts: false,
      });

      // Handle receiving messages from guests
      conn.on("data", (data) => {
        console.log(`Message from ${conn.peer}:`, data);
        const channel = LocalHost.shared().dataChannels().get(conn.peer);

        if (data.type === "nickname") {
          if (LocalHost.shared().bannedGuests().has(data.token)) {
            const guestConn = LocalHost.shared().dataChannels().get(data.id).conn;
            guestConn.send({ type: "ban" });
            setTimeout(() => {
              guestConn.close();
              console.log(`Rejected banned guest: ${data.id}`);
            }, 500);
          } else {
            // Store the guest's nickname

            channel.nickname = data.nickname;
            //Store the guest's token
            channel.token = data.token;

            console.log(`Guest connected: ${conn.peer} - ${data.nickname}`);
            UsersView.shared().updateUserList();

            // Create a guest user list with ids and nicknames to send to the new guest
            // Send the session history to the guest
            channel.conn.send({
              type: "session-history",
              history: Session.shared().history(),
              nickname: Session.shared().hostNickname(),
              guestUserList: LocalHost.shared().updateGuestUserlist(),
            });

            // Send a new message to all connected guests to notify them of the new guest
            LocalHost.shared().broadcastExceptTo(
              {
                type: "guest-join",
                message: `${data.nickname} has joined the session!`,
                nickname: Session.shared().hostNickname(),
                joiningGuestNickname: data.nickname,
                joiningGuestId: data.id,
                guestUserList: LocalHost.shared().guestUserList(),
              },
              data.id
            );

            addChatMessage(
              "system-message",
              `${data.nickname} has joined the session!`,
              Session.shared().hostNickname()
            );
          }
        }
        if (data.type === "remote-prompt") {
          // Add prompt to prompt history
          if (channel.canSendPrompts) {
            Session.shared().addToHistory({
              type: "prompt",
              data: data.message,
              id: data.id,
              nickname: data.nickname,
            });

            // Send prompt to guests
            LocalHost.shared().broadcastExceptTo(
              {
                type: "prompt",
                id: data.id,
                message: data.message,
                nickname: data.nickname,
              },
              data.id
            );

            // Display prompt
            addMessage("prompt", data.message, data.nickname);

            // If in game mode, add username to prompt
            if (Session.shared().gameMode()) {
              let newMessage;
              newMessage = data.nickname + ": " + data.message;
              console.log("Game mode on, adding guest username to prompt");
              sendAIResponse(newMessage, data.nickname);
            } else {
              sendAIResponse(data.message, data.nickname);
            }
          } else {
            console.log(
              `Rejected prompt from ${conn.peer} - ${channel.nickname}`
            );
          }
        }
        if (data.type === "remote-system-message") {
          // Add remote system message update to history if guest is allowed to send prompts
          if (channel.canSendPrompts) {
            Session.shared().addToHistory({
              type: "system-message",
              data: data.message,
              id: data.id,
              nickname: data.nickname,
            });
            // Update system message and display it TO DO SEND TO ALL
            addMessage("system-message", data.message, data.nickname);
            guestChangeSystemMessage(data);
          } else {
            console.log(
              `Rejected system message update from ${conn.peer} - ${channel.nickname}`
            );
          }
        }
        if (data.type === "chat") {
          // Add chat to chat history
          Session.shared().addToHistory({
            type: "chat",
            data: data.message,
            id: data.id,
            nickname: data.nickname,
          });
          // Display chat message
          addChatMessage(data.type, data.message, data.nickname);

          // Broadcast chat message to all connected guests
          LocalHost.shared().broadcastExceptTo(
            {
              type: "chat",
              id: data.id,
              message: data.message,
              nickname: data.nickname,
            },
            data.id
          );
        }

        if (data.type === "nickname-update") {
          // Update nickname in datachannels
          const oldNickname = channel.nickname;
          channel.nickname = data.newNickname;
          addChatMessage(
            "system-message",
            `${oldNickname} is now ${data.newNickname}.`,
            Session.shared().hostNickname()
          );
          UsersView.shared().updateUserList();
          // Update nickname in guest user list
          // Send updated guest user list to all guests
          LocalHost.shared().broadcast({
            type: "nickname-update",
            message: `${oldNickname} is now ${data.newNickname}.`,
            nickname: Session.shared().hostNickname(),
            oldNickname: oldNickname,
            newNickname: data.newNickname,
            guestUserList: LocalHost.shared().updateGuestUserlist(),
          });
        }
      });

      conn.on("close", () => {
        const channel = LocalHost.shared().dataChannels().get(conn.peer);

        console.log(`Guest disconnected: ${conn.peer}`);
        // Create a new guest list without the disconnected peer
        const closedPeerId = channel.id;
        const closedPeerNickname = channel.nickname;
        LocalHost.shared().connections().delete(conn.peer);
        LocalHost.shared().dataChannels().delete(conn.peer);

        LocalHost.shared().broadcast({
          type: "guest-leave",
          message: `${closedPeerNickname} has left the session.`,
          nickname: Session.shared().hostNickname(),
          leavingGuestNickname: closedPeerNickname,
          leavingGuestId: closedPeerId,
          guestUserList: LocalHost.shared().updateGuestUserlist(),
        });

        addChatMessage(
          "system-message",
          `${closedPeerNickname} has left the session.`,
          Session.shared().hostNickname()
        );

        UsersView.shared().updateUserList();
      });
    });
  });
}


  // --- message events ---
}.initThisClass());

LocalHost.shared().setupIds()

// -----------------------------------------------------
// -----------------------------------------------------
// -----------------------------------------------------
// -----------------------------------------------------
// -----------------------------------------------------
// -----------------------------------------------------
// -----------------------------------------------------
// -----------------------------------------------------
// -----------------------------------------------------
// -----------------------------------------------------
// -----------------------------------------------------
// -----------------------------------------------------
// -----------------------------------------------------
// -----------------------------------------------------
// -----------------------------------------------------
// -----------------------------------------------------
// -----------------------------------------------------
// -----------------------------------------------------
// -----------------------------------------------------
// -----------------------------------------------------
// -----------------------------------------------------
// -----------------------------------------------------


// --- peer code ------------------


function updateCalleeVoiceRequestButton(calleeID, call) {
  const listItem = document.querySelector(`li[data-id="${calleeID}"]`);
  if (!listItem) {
    console.error("Couldn't find list item element for callee ID:", calleeID);
    return;
  }

  const userActions = listItem.parentNode.querySelector(".user-actions");
  if (!userActions) {
    console.error(
      "Couldn't find user actions element for callee ID:",
      calleeID
    );
    return;
  }

  const voiceRequestButton = userActions.querySelector("button");
  if (!voiceRequestButton) {
    console.error(
      "Couldn't find voice request button for callee ID:",
      calleeID
    );
    return;
  }

  voiceRequestButton.textContent = "End Voice Call";
  voiceRequestButton.onclick = () => {
    call.close();
    voiceRequestButton.textContent = "Request Voice Call";
    voiceRequestButton.onclick = null;
  };
}



// Send imageURL to all connected guests
function sendImage(imageURL) {
  Session.shared().addToHistory({
    type: "image-link",
    data: imageURL,
    id: Session.shared().localUserId(),
    nickname: Session.shared().hostNickname(),
  });

  LocalHost.shared().broadcast({
    type: "image-link",
    message: imageURL,
    nickname: Session.shared().hostNickname(),
  });
}

async function sendPrompt(message) {
  LocalHost.shared().broadcast({
    type: "prompt",
    id: Session.shared().localUserId(),
    message: message,
    nickname: Session.shared().hostNickname(),
  });

  if (Session.shared().gameMode()) {
    message = Session.shared().hostNickname() + ": " + message;
    console.log("Game mode on, host adds username to prompt");
  }
  sendAIResponse(message);
}

async function guestSendPrompt() {
  const input = document.getElementById("messageInputRemote");
  let message = input.value;

  if (message.trim() !== "") {
    input.value = "";
    // Send chat message to host
    conn.send({
      type: "remote-prompt",
      id: Session.shared().localUserId(),
      message: message,
      nickname: Session.shared().guestNickname(),
    });
    guestAddLocalPrompt(message);
  }
}

function handleVoiceRequestButton(userActions, calleeID) {
  // Voice request button
  const voiceRequestButton = document.createElement("button");
  voiceRequestButton.textContent = "Request Voice Call";
  let isVoiceCallActive = false;
  let activeCalls = {}; // Store active calls

  voiceRequestButton.onclick = () => {
    if (!isVoiceCallActive) {
      // Start the voice call
      console.log("Requesting voice call with " + calleeID);
      voiceRequestButton.textContent = "End Voice Call";
      const call = LocalHost.shared().peer().call(calleeID, Microphone.shared().userAudioStream());
      activeCalls[calleeID] = call;

      call.on("stream", (remoteStream) => {
        handleRemoteStream(remoteStream);
      });
      call.on("close", () => {
        console.log("Call with peer:", call.peer, "has ended");
        voiceRequestButton.textContent = "Request Voice Call";
        isVoiceCallActive = false;
        delete activeCalls[calleeID]; // Remove the call from activeCalls
      });
    } else {
      // End the voice call
      const call = activeCalls[calleeID];
      if (call) {
        call.close();
        delete activeCalls[calleeID];
      }
      voiceRequestButton.textContent = "Request Voice Call";
    }
    isVoiceCallActive = !isVoiceCallActive;
  };
  userActions.appendChild(voiceRequestButton);
}

function handleRemoteStream(remoteStream) {
  const audioContext = new AudioContext();
  const audioElement = new Audio();

  audioElement.srcObject = remoteStream;
  audioElement.play();

  const audioSource = audioContext.createMediaStreamSource(remoteStream);
  const stereoPanner = audioContext.createStereoPanner();
  stereoPanner.pan.value = 0; // Pan the audio evenly between left and right channels

  audioSource.connect(stereoPanner);
  stereoPanner.connect(audioContext.destination);
}
