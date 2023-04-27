"use strict";

/* 
    Peers


    Peers.shared().broadcast(json)
    Peers.shared().broadcastExceptTo(json, id)
*/

(class Peers extends Base {
  initPrototypeSlots() {}

  init() {
    super.init();
    this.setIsDebugging(true);
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
}.initThisClass());

// -----------------------------------------------------

// If the user is a guest this will set the room id to the one in the url
const urlParams = new URLSearchParams(window.location.search);
const inviteId = urlParams.get("room");
let isHost;

if (inviteId) {
  isHost = false;
} else {
  isHost = true;
}
let id;
let hostNickname;
let guestNickname;
let hostWelcomeMessage = false;
let groupSessionType;
let groupSessionDetails;
let groupSessionFirstAIResponse;
let inSession = false;

// If user is host, check if there is an existing hostId in local storage
if (isHost) {
  const existingHostId = localStorage.getItem("hostId");
  const existingHostNickname = localStorage.getItem("hostNickname");
  if (existingHostId) {
    // If there is an existing hostId, set the hostId to the existing one
    id = existingHostId;
    hostNickname = existingHostNickname;
  } else {
    // If there is no existing hostId, generate a new one and save it to local storage
    id = generateId();
    localStorage.setItem("hostId", id);
  }
} else {
  // If user is guest, generate a new id
  const existingGuestId = localStorage.getItem("guestId");
  const existingGuestNickname = localStorage.getItem("guestNickname");
  if (existingGuestId) {
    // If there is an existing guestId, set the guestId to the existing one
    id = existingGuestId;
    guestNickname = existingGuestNickname;
  } else {
    // If there is no existing guestId, generate a new one and save it to local storage
    id = generateId();
    localStorage.setItem("guestId", id);
  }
}

let gameMode = false;
let fantasyRoleplay = false;

const connections = {};
const dataChannels = {};
const bannedGuests = [];
let conn;
let guestUserList = [];

/* // Local peerjs server
const peer = new Peer(id,{
  host: "localhost",
  port: 9000,
  path: "/myapp",
}); */

// Deployed peerjs server
const peer = new Peer(id, {
  host: "peerjssignalserver.herokuapp.com",
  path: "/peerjs",
  secure: true,
  port: 443,
});

//PeerJS webRTC section

function makeInviteLink(hostRoomId) {
  const inviteLink = `${window.location.href}?room=${hostRoomId}`;
  //const inviteLink = `${window.location.origin}/?room=${hostRoomId}`;
  return inviteLink;
}

async function setupHostSession() {
  console.log("Setting up host session");
  displayHostHTMLChanges();
  const inviteLink = makeInviteLink(id);
  InviteButton.shared().setLink(inviteLink);

  if (!fantasyRoleplay) {
    addMessage(
      "system-message",
      `<p>Welcome, <b> ${hostNickname} </b>!</p><p>To begin your AI sharing session, choose your AI model and input your OpenAI <a href="https://platform.openai.com/account/api-keys">API Key</a> key above. Your key is stored <i>locally in your browser</i>.</p><p>Then send this invite link to your friends: <a href="${inviteLink}">${inviteLink}</a>.  Click on their usernames in the Guest section to grant them access to your AI - or to kick them if they are behaving badly.</p> <p>Feeling adventurous? Click <b>Start Game</b> to play an AI guided roleplaying game with your friends. Have fun!</p>`,
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
            updateUserList();

            // Create a guest user list with ids and nicknames to send to the new guest
            const newGuestUserList = updateGuestUserlist();
            guestUserList = newGuestUserList;
            // Send the session history to the guest
            dataChannels[conn.peer].conn.send({
              type: "session-history",
              history: Session.shared().history(),
              nickname: hostNickname,
              guestUserList: newGuestUserList,
            });

            // Send a new message to all connected guests to notify them of the new guest
            Peers.shared().broadcastExceptTo(
              {
                type: "guest-join",
                message: `${data.nickname} has joined the session!`,
                nickname: hostNickname,
                joiningGuestNickname: data.nickname,
                joiningGuestId: data.id,
                guestUserList: guestUserList,
              },
              data.id
            );

            addChatMessage(
              "system-message",
              `${data.nickname} has joined the session!`,
              hostNickname
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
            hostNickname
          );
          updateUserList();
          // Update nickname in guest user list
          const updatedGuestUserList = updateGuestUserlist();
          guestUserList = updatedGuestUserList;
          // Send updated guest user list to all guests
          Peers.shared().broadcast({
            type: "nickname-update",
            message: `${oldNickname} is now ${data.newNickname}.`,
            nickname: hostNickname,
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
          nickname: hostNickname,
          leavingGuestNickname: closedPeerNickname,
          leavingGuestId: closedPeerId,
          guestUserList: updatedGuestUserList,
        });

        addChatMessage(
          "system-message",
          `${closedPeerNickname} has left the session.`,
          hostNickname
        );

        updateUserList();
      });
    });
  });
}

function updateGuestUserlist() {
  let guestUserList = [];
  guestUserList.push({
    id: id,
    nickname: hostNickname,
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

  console.log("Attempting to connect to host with inviteId:", inviteId); // Add this line

  conn = peer.connect(inviteId);

  conn.on("open", () => {
    console.log("Connection opened:", conn);
    connections[inviteId] = conn;
    dataChannels[inviteId] = conn;
    console.log(`Connected to host: ${inviteId}`);
    conn.send({
      type: "nickname",
      id: id,
      nickname: guestNickname,
      token: guestToken,
    });

    // Handle receiving messages from the host
    conn.on("data", (data) => {
      console.log(`Message from host:`, data);
      if (data.type === "kick") {
        conn.close();
        console.log("You have been kicked from the session.");
        displayKickedMessage();
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
        guestUserList = data.guestUserList.filter((guest) => guest.id !== id);
        console.log("Received guestUserList:", guestUserList);
        displayGuestUserList(); // Call a function to update the UI with the new guestUserList
        guestDisplayHostSessionHistory(data.history);
      }

      if (data.type === "nickname-update") {
        guestUserList = data.guestUserList.filter((guest) => guest.id !== id);
        displayGuestUserList();
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
        const index = guestUserList.findIndex((guest) => guest.id === id); // Use a function to test each element
        if (index !== -1) {
          guestUserList.splice(index, 1);
        }
        displayGuestUserList();
      }
      if (data.type === "guest-leave") {
        addChatMessage("chat", data.message, data.nickname);
        guestUserList = data.guestUserList;
        const index = guestUserList.findIndex((guest) => guest.id === id); // Use a function to test each element
        if (index !== -1) {
          guestUserList.splice(index, 1);
        }
        displayGuestUserList();
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
