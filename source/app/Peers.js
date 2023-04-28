"use strict";

/* 
    Peers

*/

(class Peers extends Base {
  initPrototypeSlots() {}

  init() {
    super.init();
    this.setIsDebugging(true);
  }

  inviteId() {
    // If the user is a guest this will set the room id to the one in the url
    const urlParams = new URLSearchParams(window.location.search);
    const inviteId = urlParams.get("room");
    return inviteId;
  }

  isHost() {
    const isHost = !this.inviteId();
    //console.log("isHost:" + isHost)
    return isHost;
  }

  broadcast(json) {
    for (const guestId in dataChannels) {
      if (dataChannels.hasOwnProperty(guestId)) {
        dataChannels[guestId].conn.send(json);
      }
    }
  }

  broadcastExceptTo(json, excludeId) {
    for (const guestId in dataChannels) {
      if (dataChannels.hasOwnProperty(guestId)) {
        if (guestId !== excludeId) {
          dataChannels[guestId].conn.send(json);
        }
      }
    }
  }

  sendUsername(username) {
    // Send chat message to host
    conn.send({
      type: "nickname-update",
      id: Session.shared().localUserId(),
      newNickname: username,
    });
  }
  
  generateId() {
    // These functions are called if the user is the host, to generate room IDs and create and copy the invite link
    return Math.random().toString(36).substr(2, 9);
  }

  // Creates a token for guest identity across sessions
 generateToken() {
  console.log("Generating token...");
  return (
    Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2)
  );
}

  // --- get channel / connection for a userId ---

  channelForUserId(userId) {
    if (dataChannels.hasOwnProperty(userId)) {
      return dataChannels[userId];
    }
    return undefined;
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

    bannedGuests.push(token);

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
      const conn = dataChannels[userId].conn;
      conn.close();
      delete dataChannels[userId];
      UsersView.shared().updateUserList();
    } else {
      console.warn("attempt to close missing channel for userId: " + userId);
    }
  }
}.initThisClass());

// -----------------------------------------------------

// If user is host, check if there is an existing hostId in local storage
if (Peers.shared().isHost()) {
  const existingHostId = localStorage.getItem("hostId");
  const existingHostNickname = Session.shared().hostNickname();
  if (existingHostId) {
    // If there is an existing hostId, set the hostId to the existing one
    Session.shared().setLocalUserId(existingHostId)
    //Session.shared().setLocalUserId(existingHostId)
    Session.shared().setHostNickname(existingHostNickname)
  } else {
    // If there is no existing hostId, generate a new one and save it to local storage
    Session.shared().setLocalUserId(Peers.shared().generateId());
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
    Session.shared().setLocalUserId(Peers.shared().generateId());
    localStorage.setItem("guestId", Session.shared().localUserId());
  }
}

let gameMode = false;
let fantasyRoleplay = false;

const connections = {};
const dataChannels = {};
const bannedGuests = [];
let conn;
let guestUserList = [];
let peer;

//PeerJS webRTC section

function makeInviteLink(hostRoomId) {
  const inviteLink = `${window.location.href}?room=${hostRoomId}`;
  //const inviteLink = `${window.location.origin}/?room=${hostRoomId}`;
  return inviteLink;
}

async function setupHostSession() {
  console.log("Setting up host session");
  displayHostHTMLChanges();
  const inviteLink = makeInviteLink(Session.shared().localUserId());
  InviteButton.shared().setLink(inviteLink);

  if (!fantasyRoleplay) {
    addMessage(
      "system-message",
      `<p>Welcome, <b> ${Session.shared().hostNickname()} </b>!</p><p>To begin your AI sharing session, choose your AI model and input your OpenAI <a href="https://platform.openai.com/account/api-keys">API Key</a> key above. Your key is stored <i>locally in your browser</i>.</p><p>Then send this invite link to your friends: <a href="${inviteLink}">${inviteLink}</a>.  Click on their usernames in the Guest section to grant them access to your AI - or to kick them if they are behaving badly.</p> <p>Feeling adventurous? Click <b>Start Game</b> to play an AI guided roleplaying game with your friends. Have fun!</p>`,
      "HaveWords"
    );
  }
  // Handle incoming connections from guests
  peer.on("connection", (conn) => {
    console.log("Incoming connection:", conn);
    conn.on("open", () => {
      connections[conn.peer] = conn;

      // Adds to datachannels
      dataChannels[conn.peer] = {
        conn: conn,
        id: conn.peer,
        nickname: "",
        token: "",
        canSendPrompts: false,
      };

      // Handle receiving messages from guests
      conn.on("data", (data) => {
        console.log(`Message from ${conn.peer}:`, data);

        if (data.type === "nickname") {
          if (bannedGuests.includes(data.token)) {
            const guestConn = dataChannels[data.id].conn;
            guestConn.send({ type: "ban" });
            setTimeout(() => {
              guestConn.close();
              console.log(`Rejected banned guest: ${data.id}`);
            }, 500);
          } else {
            // Store the guest's nickname
            dataChannels[conn.peer].nickname = data.nickname;

            //Store the guest's token
            dataChannels[conn.peer].token = data.token;
            console.log(`Guest connected: ${conn.peer} - ${data.nickname}`);
            UsersView.shared().updateUserList();

            // Create a guest user list with ids and nicknames to send to the new guest
            const newGuestUserList = updateGuestUserlist();
            guestUserList = newGuestUserList;
            // Send the session history to the guest
            dataChannels[conn.peer].conn.send({
              type: "session-history",
              history: Session.shared().history(),
              nickname: Session.shared().hostNickname(),
              guestUserList: newGuestUserList,
            });

            // Send a new message to all connected guests to notify them of the new guest
            Peers.shared().broadcastExceptTo(
              {
                type: "guest-join",
                message: `${data.nickname} has joined the session!`,
                nickname: Session.shared().hostNickname(),
                joiningGuestNickname: data.nickname,
                joiningGuestId: data.id,
                guestUserList: guestUserList,
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
          if (dataChannels[conn.peer].canSendPrompts) {
            Session.shared().addToHistory({
              type: "prompt",
              data: data.message,
              id: data.id,
              nickname: data.nickname,
            });

            // Send prompt to guests
            Peers.shared().broadcastExceptTo(
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
            sendAIResponse(data.message, data.nickname);
          } else {
            console.log(
              `Rejected prompt from ${conn.peer} - ${
                dataChannels[conn.peer].nickname
              }`
            );
          }
        }
        if (data.type === "remote-system-message") {
          // Add remote system message update to history if guest is allowed to send prompts
          if (dataChannels[conn.peer].canSendPrompts) {
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
              `Rejected system message update from ${conn.peer} - ${
                dataChannels[conn.peer].nickname
              }`
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
          Peers.shared().broadcastExceptTo(
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
          const oldNickname = dataChannels[conn.peer].nickname;
          dataChannels[conn.peer].nickname = data.newNickname;
          addChatMessage(
            "system-message",
            `${oldNickname} is now ${data.newNickname}.`,
            Session.shared().hostNickname()
          );
          UsersView.shared().updateUserList();
          // Update nickname in guest user list
          const updatedGuestUserList = updateGuestUserlist();
          guestUserList = updatedGuestUserList;
          // Send updated guest user list to all guests
          Peers.shared().broadcast({
            type: "nickname-update",
            message: `${oldNickname} is now ${data.newNickname}.`,
            nickname: Session.shared().hostNickname(),
            oldNickname: oldNickname,
            newNickname: data.newNickname,
            guestUserList: updatedGuestUserList,
          });
        }
      });

      conn.on("close", () => {
        console.log(`Guest disconnected: ${conn.peer}`);
        // Create a new guest list without the disconnected peer
        const closedPeerId = dataChannels[conn.peer].id;
        const closedPeerNickname = dataChannels[conn.peer].nickname;
        delete connections[conn.peer];
        delete dataChannels[conn.peer];
        const updatedGuestUserList = updateGuestUserlist();
        guestUserList = updatedGuestUserList;

        Peers.shared().broadcast({
          type: "guest-leave",
          message: `${closedPeerNickname} has left the session.`,
          nickname: Session.shared().hostNickname(),
          leavingGuestNickname: closedPeerNickname,
          leavingGuestId: closedPeerId,
          guestUserList: updatedGuestUserList,
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

function updateGuestUserlist() {
  let guestUserList = [];
  guestUserList.push({
    id: Session.shared().localUserId(),
    nickname: Session.shared().hostNickname(),
  });
  for (const guestId in dataChannels) {
    if (dataChannels.hasOwnProperty(guestId)) {
      guestUserList.push({
        id: guestId,
        nickname: dataChannels[guestId].nickname,
      });
    }
  }
  return guestUserList;
}

async function setupJoinSession() {
  console.log("Setting up join session");
  displayGuestHTMLChanges();
  const inviteId = Peers.shared().inviteId();

  console.log("Attempting to connect to host with inviteId:", inviteId); // Add this line

  conn = peer.connect(inviteId);

  conn.on("open", () => {
    console.log("Connection opened:", conn);
    connections[inviteId] = conn;
    dataChannels[inviteId] = conn;
    console.log(`Connected to host: ${inviteId}`);
    conn.send({
      type: "nickname",
      id: Session.shared().localUserId(),
      nickname: Session.shared().guestNickname(),
      token: guestToken,
    });

    // Handle receiving messages from the host
    conn.on("data", (data) => {
      console.log(`Message from host:`, data);
      if (data.type === "kick") {
        conn.close();
        console.log("You have been kicked from the session.");
        UsersView.shared().displayKickedMessage();
      }
      if (data.type === "chat") {
        Sounds.shared().playReceiveBeep();
        addChatMessage(data.type, data.message, data.nickname);
      }
      if (data.type === "prompt") {
        guestAddPrompt(data);
      }
      if (data.type === "ai-response") {
        guestAddHostAIResponse(data.message, data.nickname);
      }
      if (data.type === "ban") {
        document.getElementById("chatInput").disabled = true;
        addChatMessage(
          "chat",
          "You have been banned from the session.",
          "System"
        );
      }
      if (data.type === "session-history") {
        console.log("Received session history:", data.history);
        guestUserList = data.guestUserList.filter((guest) => guest.id !== Session.shared().localUserId());
        console.log("Received guestUserList:", guestUserList);
        UsersView.shared().displayGuestUserList(); // Call a function to update the UI with the new guestUserList
        guestDisplayHostSessionHistory(data.history);
      }

      if (data.type === "nickname-update") {
        guestUserList = data.guestUserList.filter((guest) => guest.id !== Session.shared().localUserId());
        UsersView.shared().displayGuestUserList();
        addChatMessage("chat", data.message, data.nickname);
      }

      if (data.type === "system-message") {
        guestAddSystemMessage(data);
      }
      if (data.type === "image-link") {
        addImage(data.message);
      }

      if (data.type === "game-launch") {
        startRoleplaySession();
        addMessage("prompt", data.message, data.nickname);
      }
      if (data.type === "guest-join") {
        addChatMessage("chat", data.message, data.nickname);
        guestUserList = data.guestUserList;
        const index = guestUserList.findIndex((guest) => guest.id === Session.shared().localUserId()); // Use a function to test each element
        if (index !== -1) {
          guestUserList.splice(index, 1);
        }
        UsersView.shared().displayGuestUserList();
      }
      if (data.type === "guest-leave") {
        addChatMessage("chat", data.message, data.nickname);
        guestUserList = data.guestUserList;
        const index = guestUserList.findIndex((guest) => guest.id === Session.shared().localUserId()); // Use a function to test each element
        if (index !== -1) {
          guestUserList.splice(index, 1);
        }
        UsersView.shared().displayGuestUserList();
      }

      const messageInputRemote = document.getElementById("messageInputRemote");
      if (data.type === "grant-ai-access") {
        messageInputRemote.disabled = false;
        messageInputRemote.placeholder = "Send a prompt to the AI...";
        addChatMessage("chat", "You've been granted AI access!", "Host");
      } else if (data.type === "revoke-ai-access") {
        messageInputRemote.disabled = true;
        messageInputRemote.placeholder = "No prompt permission";
        addChatMessage("chat", "You've lost AI access.", "Host");
      }
    });
    conn.on("error", (err) => {
      console.log("Connection error:", err);
    });
    conn.on("close", () => {
      delete connections[inviteId];
      delete dataChannels[inviteId];
      console.log(`Disconnected from host: ${inviteId}`);
    });
  });
}

// --- peer code ------------------

function setupPeer() {
  /*
  // Local peerjs server
  peer = new Peer(id, {
    host: "localhost",
    port: 9000,
    path: "/myapp",
  });
  */

  // Deployed peerjs server
  peer = new Peer(Session.shared().localUserId(), {
    host: "peerjssignalserver.herokuapp.com",
    path: "/peerjs",
    secure: true,
    port: 443,
  });

  peer.on("open", function () {
    console.log("PeerJS client is ready. Peer ID:", Session.shared().localUserId());

    if (Peers.shared().isHost()) {
      //Session.shared().load() // loadSessionData();
      displaySessionHistory();
      if (!Session.shared().hostNickname()) {
        Session.shared().setHostNickname(Nickname.generateHostNickname() + " (host)")
        UsernameView.shared().setString(Session.shared().hostNickname());
      } else {
        console.log("Host nickname is already set:", Session.shared().hostNickname());
      }
      if (hostWelcomeMessage == false) {
        setupHostSession(); // Call the function to set up the host session
        hostWelcomeMessage = true;
      }
    } else {
      if (!Session.shared().guestNickname()) {
        Session.shared().setGuestNickname(Nickname.generateNickname())
        UsernameView.shared().setString(Session.shared().guestNickname());
        console.log("Guest nickname:", Session.shared().guestNickname());
      } else {
        console.log("Guest nickname is already set:", Session.shared().guestNickname());
      }
      setupJoinSession(); // Call the function to set up the join session
    }
  });

  let retryCount = 0;
  const maxRetries = 5;

  peer.on("error", function (err) {
    console.log("PeerJS error:", err);

    if (retryCount < maxRetries) {
      setTimeout(() => {
        console.log("Attempting to reconnect to PeerJS server...");
        peer.reconnect();
        retryCount++;
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
  });

  // Answer incoming voice calls
  peer.on("call", (call) => {
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
  });
}

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


let guestToken = localStorage.getItem("guestToken");
if (!guestToken) {
  guestToken = Peers.shared().generateToken();
  localStorage.setItem("guestToken", guestToken);
}

// Send imageURL to all connected guests
function sendImage(imageURL) {
  Session.shared().addToHistory({
    type: "image-link",
    data: imageURL,
    id: Session.shared().localUserId(),
    nickname: Session.shared().hostNickname(),
  });

  Peers.shared().broadcast({
    type: "image-link",
    message: imageURL,
    nickname: Session.shared().hostNickname(),
  });
}

async function sendPrompt(message) {
  Peers.shared().broadcast({
    type: "prompt",
    id: Session.shared().localUserId(),
    message: message,
    nickname: Session.shared().hostNickname(),
  });

  if (gameMode) {
    message = Session.shared().hostNickname() + ": " + message;
  }
  sendAIResponse(message);
}

async function guestSendPrompt() {
  const input = document.getElementById("messageInputRemote");
  const message = input.value;

  if (message.trim() !== "") {
    input.value = "";

    // Send chat message to host
    conn.send({
      type: "remote-prompt",
      id: Session.shared().localUserId(),
      message: message,
      nickname: guestNickname,
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
      const call = peer.call(calleeID, Microphone.shared().userAudioStream());
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
