

// --- invite link ------------------

const displayInviteLink = document.getElementById("displayInviteLink");

const displayInviteText = document.getElementById("displayInviteText");
displayInviteText.addEventListener("click", (event) => {
  const oldColor = event.target.style.color;
  event.target.style.color = "white";
  setTimeout(() => {
    event.target.style.color = oldColor;
  }, 0.2 * 1000);
  Sounds.shared().playSendBeep();
  displayInviteText._link.copyToClipboard()
});

// ---------------------

OpenAiChat.shared().addToConversation({
  role: "system",
  content: "You are a helpful assistant.",
})

const loadingAnimation = document.getElementById("loadingHost");
const startGameButton = document.getElementById("startGameButton");

// --- peer code ------------------

peer.on("open", function () {
  console.log("PeerJS client is ready. Peer ID:", id);

  if (isHost) {
    //Session.shared().load() // loadSessionData();
    displaySessionHistory();
    if (!hostNickname) {
      hostNickname = Nickname.generateHostNickname() + " (host)";
      // Add host nickname to localstorage
      localStorage.setItem("hostNickname", hostNickname);
      console.log("Host nickname:", hostNickname);
      displayUsername.value = hostNickname;
      updateInputField(displayUsername);
    } else {
      console.log("Host nickname is already set:", hostNickname);
    }
    if (hostWelcomeMessage == false) {
      setupHostSession(); // Call the function to set up the host session
      hostWelcomeMessage = true;
    }
  } else {
    if (!guestNickname) {
      guestNickname = Nickname.generateNickname();
      // Add guest nickname to localstorage
      localStorage.setItem("guestNickname", guestNickname);
      displayUsername.value = guestNickname;
      updateInputField(displayUsername);

      console.log("Guest nickname:", guestNickname);
    } else {
      console.log("Guest nickname is already set:", guestNickname);
    }
    setupJoinSession(); // Call the function to set up the join session
  }
});


function checkURLPath() {
  const hash = window.location.hash;
  console.log("Current hash:", hash); // Add this line for debugging
  if (hash === "#adventure") {
    console.log("URL includes #adventure");
    fantasyRoleplay = true;
    updateSessionTypeOptions("fantasyRoleplay");
  } else if (hash === "#trivia") {
    console.log("URL includes #trivia");
    gameMode = true;
    updateSessionTypeOptions("trivia");
  } else if (hash === "#exploreFiction") {
    console.log("URL includes #exploreFiction");
    updateSessionTypeOptions("exploreFiction");
  }
}

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
  const acceptCall = confirm(`Incoming call. Do you want to accept the call?`);

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



// These functions are called if the user is the host, to generate room IDs and create and copy the invite link
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}
function makeInviteLink(hostRoomId) {
  const inviteLink = `${window.location.href}?room=${hostRoomId}`;
  //const inviteLink = `${window.location.origin}/?room=${hostRoomId}`;
  return inviteLink;
}
const copyInviteLinkButton = document.getElementById("copyInviteLink");
copyInviteLinkButton.addEventListener("click", () => {
  displayInviteLink.select();
  document.execCommand("copy");
});

// Creates a token for guest identity across sessions
function generateToken() {
  console.log("Generating token...");
  return (
    Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2)
  );
}
let guestToken = localStorage.getItem("guestToken");
if (!guestToken) {
  guestToken = generateToken();
  localStorage.setItem("guestToken", guestToken);
}

function displayHostHTMLChanges() {
  document.getElementById("hostAIContainer").style.display = "block";
  document.getElementById("aiSelection").style.display = "block";
  document.getElementById("inputSection").style.display = "block";
  document.getElementById("resetSessionButton").style.display = "block";
  startGameButton.style.display = "block";
}

function displayGuestHTMLChanges() {
  document.getElementById("hostAIContainer").style.display = "block";
  document.getElementById("remoteSystemPrompt").style.display = "block";
  document.getElementById("inputSectionRemote").style.display = "block";
  messageInputRemote.disabled = true;
  document.getElementById("aiSelection").style.display = "none";
}
// Disables the chat send button until the data channel is open
const chatSendButton = document.getElementById("chatSendButton");
chatSendButton.addEventListener("click", sendChatMessage);

const modelSelect = document.getElementById("aiModel");
let selectedModelNickname = "";

function updateSelectedModelNickname() {
  const selectedOption = modelSelect.options[modelSelect.selectedIndex];
  selectedModelNickname = selectedOption.getAttribute("data-nickname");
}
updateSelectedModelNickname();

function updateSendButtonState() {
  if (aiModel.value === "gpt-3.5-turbo" || aiModel.value === "gpt-4") {
    sendButton.disabled = false;
  } else {
    sendButton.disabled = true;
  }
}

const apiKeyInput = document.getElementById("apiKey");

function setupSessionUI () {
  const aiModel = document.getElementById("aiModel");
  const submitApiKeyButton = document.getElementById("submitApiKey");
  updateSendButtonState();
  modelSelect.addEventListener("change", updateSelectedModelNickname);
  checkURLPath();

  aiModel.addEventListener("change", () => {
    selectedOption = modelSelect.options[modelSelect.selectedIndex];
    selectedModelNickname = selectedOption.getAttribute("data-nickname");
    updateSendButtonState();
  });

  submitApiKeyButton.addEventListener("click", () => {
    localStorage.setItem("openai_api_key", apiKeyInput.value);
    submitApiKeyButton.textContent = "Saved!";
    setTimeout(() => {
      submitApiKeyButton.style.display = "none";
    }, 1000);
  });

  // Load the stored API key from localStorage if it exists
  const storedApiKey = OpenAiChat.shared().apiKey();
  if (storedApiKey) {
    apiKeyInput.value = storedApiKey;
  }
}
setupSessionUI()

function handleChatSendButtonClick() {
  console.log("chatSendButton clicked");
  sendChatMessage();
}

function handleSendButtonClick() {
  console.log("sendButton clicked");
  addPrompt();
  console.log("Sending prompt to AI");
}

function handleSendButtonRemoteClick() {
  console.log("sendButtonRemote clicked");
  guestSendPrompt();
  console.log("Sending remote prompt to AI");
}



//PeerJS webRTC section

async function setupHostSession() {
  console.log("Setting up host session");
  displayHostHTMLChanges();
  const inviteLink = makeInviteLink(id);
  displayInviteLink.value = inviteLink;
  displayInviteText._link = inviteLink;
  displayInviteText.style.opacity = 1;

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
            Peers.shared().broadcastExceptTo({
              type: "guest-join",
              message: `${data.nickname} has joined the session!`,
              nickname: hostNickname,
              joiningGuestNickname: data.nickname,
              joiningGuestId: data.id,
              guestUserList: guestUserList,
            }, data.id )

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
            Peers.shared().broadcastExceptTo({
              type: "prompt",
              id: data.id,
              message: data.message,
              nickname: data.nickname,
            }, data.id);

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
          Peers.shared().broadcastExceptTo({
            type: "chat",
            id: data.id,
            message: data.message,
            nickname: data.nickname,
          }, data.id )
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
          })
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

function sendChatMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value;
  Sounds.shared().playSendBeep();

  if (message.trim() !== "") {
    input.value = "";

    if (isHost) {
      // Add chat to chat history
      Session.shared().addToHistory({
        type: "chat",
        data: message,
        id: id,
        nickname: hostNickname,
      });
      // Display chat message
      addLocalChatMessage(message);
      // Broadcast chat message to all connected guests
      Peers.shared().broadcast({
        type: "chat",
        id: id,
        message: message,
        nickname: hostNickname,
      });
    } else {
      // Send chat message to host
      conn.send({
        type: "chat",
        id: id,
        message: message,
        nickname: guestNickname,
      });
      guestAddLocalChatMessage(message);
    }
  }
}

async function sendAIResponse(message, nickname) {
  // If in game mode, add username to the start of each prompt
  if (gameMode) {
    if (!isHost) {
      message = nickname + ": " + message;
    }
  } else {
  }

  // Get AI Response and post locally
  
  

  const response = await OpenAiChat.shared().asyncFetch(message);
  if (gameMode) {
    //console.log("Calling triggerBot with AI response:", response);
    //triggerBot(response, groupSessionType, groupSessionDetails);
  }

  addAIReponse(response);

  Peers.shared().broadcast({
    type: "ai-response",
    id: id,
    message: response,
    nickname: selectedModelNickname,
  });
}


// Send imageURL to all connected guests
function sendImage(imageURL) {
  Session.shared().addToHistory({
    type: "image-link",
    data: imageURL,
    id: id,
    nickname: hostNickname,
  });

  Peers.shared().broadcast({
    type: "image-link",
    message: imageURL,
    nickname: hostNickname,
  });
}


async function sendPrompt(message) {
  Peers.shared().broadcast({
    type: "prompt",
    id: id,
    message: message,
    nickname: hostNickname,
  });

  if (gameMode) {
    message = hostNickname + ": " + message;
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
      id: id,
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


const systemMessage = document.getElementById("systemMessage");
/*
  systemMessage.addEventListener('focus', () => {
      document.getElementById('submitSystemMessage').style.display = 'inline-block';
    });
    */

function setNewAIRole(newRole) {
  const content = newRole;
  systemMessage.value = content;
  OpenAiChat.shared().addToConversation({
    role: "system",
    content: content,
  })

  // Check to see if host or guest and send message to appropriate party
  if (isHost) {
    //sendSystemMessage(content);
    // Disable for now
  } else {
    console.log("Guests cannot set new AI role");
  }
  console.log("sent system message:", content);
}

/*
  systemMessage.addEventListener('input', () => {
      //systemMessage.style.width = `${systemMessage.value.length}ch`;
      const content = systemMessage.value;
      OpenAiChat.shared().addToConversation({
        role: 'system',
        content: content,
      })

      document.getElementById('submitSystemMessage').style.display = 'none';
      // Check to see if host or guest and send message to appropriate party
      if (isHost) {
        sendSystemMessage(content);
      } else {
        sendSystemMessageToHost(content);
      }
      console.log("sent system message:", content)
    });

    */
/*
  document.getElementById('submitSystemMessage').addEventListener('click', () => {    
      const content = systemMessage.value;

      OpenAiChat.shared().clearConversationHistory()
      OpenAiChat.shared().addToConversation(
          role: 'system',
          content: content,
        })

      document.getElementById('submitSystemMessage').style.display = 'none';
      // Check to see if host or guest and send message to appropriate party
      if (isHost) {
        sendSystemMessage(content);
      } else {
        sendSystemMessageToHost(content);
      }
    }); 
    */

async function sendSystemMessage(message) {
  Peers.shared().broadcast({
    type: "system-message",
    id: id,
    message: message,
    nickname: hostNickname,
  });
}

function guestChangeSystemMessage(data) {
  const content = data.message;
  OpenAiChat.shared().addToConversation({
    role: "user",
    content: prompt,
  });
  // Update system message input
  systemMessage.value = content;
  // Relay to connected guests
  Peers.shared().broadcast({
    type: "system-message",
    id: data.id,
    message: data.message,
    nickname: data.nickname,
  });
}

const messageInput = document.getElementById("messageInput");
const chatInput = document.getElementById("chatInput");
const messageInputRemote = document.getElementById("messageInputRemote");

messageInput.addEventListener("keypress", handleEnterKeyPress);
chatInput.addEventListener("keypress", handleEnterKeyPress);
messageInputRemote.addEventListener("keypress", handleEnterKeyPress);

// This displays the user's nickname above the chat window
const displayUsername = document.getElementById("username");
if (isHost) {
  displayUsername.value = hostNickname;
  updateInputField(displayUsername);
} else {
  displayUsername.value = guestNickname;
  updateInputField(displayUsername);
}

function handleEnterKeyPress(event) {
  if (event.keyCode === 13) {
    // Check if the key is Enter
    if (!event.shiftKey) {
      // Check if Shift is NOT pressed
      event.preventDefault(); // Prevent the default action (newline)

      if (document.activeElement === messageInput) {
        handleSendButtonClick();
      } else if (document.activeElement === chatInput) {
        handleChatSendButtonClick();
      } else if (document.activeElement === messageInputRemote) {
        handleSendButtonRemoteClick();
      }
    }
  }
}

// Start the group game when the host clicks the button
startGameButton.addEventListener("click", () => {
  updateSessionTypeOptions("fantasyRoleplay");
});

//TODO: move the initial username scrape and AI prompt into the specific session functions, since users won't be connected yet

async function startSession(sessionType, sessionDetails) {
  addMessage("prompt", "You've started the session!", hostNickname);
  inSession = true;
  // Check which session type was selected
  if (sessionType === "fantasyRoleplay") {
    gameMode = true;
    // Construct the system message to guide the AI
    const newRole =
      "You are now the AI Game Master guiding a roleplaying session set in the " +
      sessionDetails +
      " world";
    setNewAIRole(newRole);
    // Get the current user's usernames
    const usernames = getCurrentUsernames();
    console.log(usernames);
    // Determine the prompt based on the session details
    let prompt;
    if (sessionDetails === "Studio Ghibli") {
      prompt = `Overview: We are a group of players, exploring the fictional worlds and characters from Studio Ghibli films, including Spirited Away, My Neighbor Totoro, Howl's Moving Castle, Castle in the Sky, Kiki's Delivery Service, Porco Rosso, and others. You are our guide, describing the settings and the characters, and making the fictional world come alive for our group.\n\nFormatting: Don't use Markdown, only use HTML. Respond with HTML formatting to use bold, italics, and use <br> for new paragraphs.\n\nMessages: Each player will respond with their own name at the beginning of the message for you to identify them. You can ask players what actions they will take. Keep track of them individually but try not to split the party.\n\nDialogue: Never speak for the players. Use dialogue for the characters you are describing frequently, always in quotation marks. Make the dialogue realistic based on what you know of the character. Give the characters emotions fitting to the situation. Remember there are multiple players, and dialogue is usually happening within a group.\n\nPlot: Describe only the next step of the adventure based on the player input. Don't take any actions on the player's behalf, always let the player make the decisions. Remember there are multiple players, and descriptions of scenes should include more than just one player. The story should only progress when the player has made a decision about how to move forward. Do not progress the story if the player is still engaged in dialogue (unless the dialogue is describing them taking a specific action). The player should sometimes fail, especially if their request is unrealistic given the setting and world. The plot should be challenging but fun, including puzzles, riddles, or combat. Combat should not be life-threatening.\n\nBeginning the session: Welcome the players, give us brief character descriptions fitting the world theme (with our names in bold), briefly describe the setting, describe a simple, cute story hook, then start the session.\n\nThe player names are: ${usernames.join(
        ", "
      )}.\n\nYour response:`;
    } else if (sessionDetails === "Harry Potter") {
      prompt = `Overview: We are a group of players, exploring the fictional worlds and characters from the Harry Potter books and films. You are our guide, describing the settings and the characters, and making the fictional world come alive for our group.\n\nFormatting: Don't use Markdown, only use HTML. Respond with HTML formatting to use bold, italics, and use <br> for new paragraphs.\n\nMessages: Each player will respond with their own name at the beginning of the message for you to identify them. You can ask players what actions they will take. Keep track of them individually but try not to split the party.\n\nDialogue: Never speak for the players. Use dialogue for the characters you are describing frequently, always in quotation marks. Make the dialogue realistic based on what you know of the character. Give the characters emotions fitting to the situation. Remember there are multiple players, and dialogue is usually happening within a group.\n\nPlot: Describe only the next step of the adventure based on the player input. Don't take any actions on the player's behalf, always let the player make the decisions. Remember there are multiple players, and descriptions of scenes should include more than just one player. The story should only progress when the player has made a decision about how to move forward. Do not progress the story if the player is still engaged in dialogue (unless the dialogue is describing them taking a specific action). The player should sometimes fail, especially if their request is unrealistic given the setting and world. The plot should be challenging but fun, including puzzles, riddles, or combat. Combat should not be life-threatening.\n\nBeginning the session: Welcome the players, give us brief character descriptions fitting the world theme (with our names in bold), briefly describe the setting, describe a simple, cute story hook, then start the session.\n\nThe player names are: ${usernames.join(
        ", "
      )}.\n\nYour response:`;
    } else {
      prompt = `We are a group of people playing a fantasy role playing game in the world of ${sessionDetails}, and you are our game master. Each user will respond with their own username at the beginning of the message for you to identify them. You can ask individual users what actions they will take. The game should be fast paced and lively. Respond with HTML formatting to use bold, italics, or other elements when needed, but don't use <br> tags, use newlines instead. When possible, make choices open-ended, but you can offer specific options if it will enhance the story. Don't speak for the users. Don't use Markdown, only use HTML. Assign each of the following users a fantasy role and briefly describe the setting, then start the game: ${usernames.join(
        ", "
      )}.`;
    }
    // Send the system message and the prompt to the AI
    // Send a message to all connected guests
    Peers.shared().broadcast({
      type: "game-launch",
      id: id,
      message:
        "The host started a new " +
        sessionDetails +
        " session! Please wait while the AI Game master crafts your world...",
      nickname: hostNickname,
    });

    const response = await OpenAiChat.shared().asyncFetch(prompt);
    // Stores initial AI response, which contains character descriptions, for later use
    groupSessionFirstAIResponse = response;
    //triggerBot(response, "fantasyRoleplay", sessionDetails);
    addAIReponse(response);

    // Send the response to all connected guests
    Peers.shared().broadcast({
      type: "ai-response",
      id: id,
      message: response,
      nickname: selectedModelNickname,
    });
  } else {
    console.log("No session type selected");
    // other session types later
  }
}

function updateSessionTypeOptions(sessionType) {
  const dropdownContainer = document.getElementById("dropdownContainer");
  const customInputContainer = document.getElementById("customInputContainer");
  const sessionTypeDescription = document.getElementById("sessionTypeDescription");

  const customInput = document.createElement("input");
  customInput.type = "text";
  customInput.id = "customSessionDetailsInput";
  customInput.placeholder = "Enter custom details...";
  const customInputLabel = document.createElement("p");
  customInputLabel.innerHTML = "Or create your own session:";

  // Clear existing options and description
  dropdownContainer.innerHTML = "";
  customInputContainer.innerHTML = "";
  sessionTypeDescription.innerHTML = "";

  let options;
  let description;

  if (sessionType === "fantasyRoleplay") {
    groupSessionType = "fantasyRoleplay";
    options = [
      { value: "traditional fantasy", text: "Traditional roleplaying" },
      { value: "Conan", text: "Conan" },
      { value: "Norse", text: "Norse Mythology" },
      { value: "Harry Potter", text: "Harry Potter" },
      { value: "Studio Ghibli", text: "Studio Ghibli" },
    ];
    description = `
      <h2>Fantasy Roleplaying:</h2>
      <p>Choose from various fantasy worlds to embark on an exciting roleplaying adventure with your friends. The AI Dungeon Master will guide you through the story and help you create memorable moments.</p>
    `;
  } else if (sessionType === "trivia") {
    options = [
      { value: "Variety", text: "Variety" },
      { value: "Sports", text: "Sports" },
      { value: "History", text: "History" },
      { value: "Pop Culture", text: "Pop Culture" },
    ];
    description = `
      <h2>Trivia:</h2>
      <p>Test your knowledge in a group trivia game. The AI will generate trivia questions for you and your friends to answer, keeping score and providing a fun and engaging experience.</p>
    `;
  } else if (sessionType === "explorefiction") {
    options = [
      // Add explore fiction options here
    ];
    description = `
      <h2>Explore Fiction:</h2>
      <p>Travel to various fictional universes with the AI's help. Discover new worlds, interact with famous characters, and engage in thrilling adventures as you explore the limits of your imagination.</p>
    `;
  } else {
    // Add different options and descriptions for other session types
  }

  // Add the new options to the dropdown menu
  const selectElement = document.createElement("select");
  options.forEach((option) => {
    const opt = document.createElement("option");
    opt.value = option.value;
    opt.textContent = option.text;
    selectElement.appendChild(opt);
  });

  dropdownContainer.appendChild(selectElement);
  customInputContainer.appendChild(customInputLabel);
  customInputContainer.appendChild(customInput);

  // Add the description to the sessionTypeDescription div
  sessionTypeDescription.innerHTML = description;
  displayHashModal(sessionType);
}


function displayHashModal(sessionType) {
  // Display the API key modal
  const submitHashModal = document.getElementById(
    "submitOnVisitHashModalButton"
  );
  const onVisitHashModal = document.getElementById("onVisitHashModal");
  const hashApiKey = document.getElementById("hashApiKeyInput");
  const apiKeyError = document.getElementById("apiKeyError");

  // Check if the API key is already set in local storage
  const storedApiKey = OpenAiChat.shared().apiKey();
  if (storedApiKey) {
    // Update the input field's placeholder text and disable the input
    hashApiKey.disabled = true;
    hashApiKey.placeholder = "Already set!";
  }

  onVisitHashModal.style.display = "block";
  const sessionTypeDetailsSelect = document.getElementById(
    "sessionTypeDetailsSelect"
  );
  let selectedSessionTypeDetails;
  // Add event listener for the submit button
  submitHashModal.addEventListener("click", () => {
    if (!hashApiKey.disabled && hashApiKey.value.trim() === "") {
      apiKeyError.style.display = "block"; // Show the error message
      return;
    }
    // Only set the API key in local storage if the input is not disabled
    if (!hashApiKey.disabled) {
      const storedApiKey = OpenAiChat.shared().setApiKey(hashApiKey.value);
    }
    const customDetailsInput = document.getElementById("customSessionDetailsInput");
    const customDetails = customDetailsInput.value.trim();
    
    if (customDetails !== "") {
      groupSessionDetails = customDetails;
    } else {
      groupSessionDetails = sessionTypeDetails.value;
    }
    console.log("Group session world: " + groupSessionDetails);
    onVisitHashModal.style.display = "none";
    // Start the session with the selected session type
    if (sessionType === "fantasyRoleplay") {
      startRoleplaySession();
    } else if (sessionType === "trivia") {
      startTriviaSession();
    } else if (sessionType === "explorefiction") {
      startExploreFictionSession();
    } else {
      // Add other session types here
      console.log("No session type selected");
    }
  });
}

function endAdventure() {
  gameMode = false;
  // Trigger the visual indicator (e.g., change the background color)
  document.body.style.backgroundColor = "#333";
}

function getCurrentUsernames() {
  // Add all nicknames of connected guests to the guestNicknames array
  const guestNicknames = [];
  guestNicknames.push(hostNickname);
  for (const guestId in dataChannels) {
    if (dataChannels.hasOwnProperty(guestId)) {
      guestNicknames.push(dataChannels[guestId].nickname);
    }
  }
  return guestNicknames;
}

// This changes the display for the roleplay session in order to create a waiting room for players to join
function startRoleplaySession() {
  // Trigger the visual indicator
  var userPanelh2Element = document.querySelector(".userPanel .header h2");
  var guestChatH2 = document.querySelector(".chatPanel .header h2");
  var peersH2 = document.querySelector(".connectedUsers .header h2");

  // Change the content of the h2 element
  userPanelh2Element.innerHTML = "AI GAME MASTER";
  guestChatH2.innerHTML = "Players' Chat";
  peersH2.innerHTML = "Players";

  document.getElementById("aiSelectionBlock").style.display = "none";

  if (isHost) {
    const inviteLink = makeInviteLink(id);
    addMessage(
      "welcome-message",
      `<p>Welcome to your roleplaying session, set in the <b>${groupSessionDetails}</b> world!</p></p>Send your friends this invite link to join your session: <a href="${inviteLink}">${inviteLink}</a></p><p>When you're ready, the AI Game Master will begin the session when you click <b>Begin Session</b> below.</p>`,
      "HaveWords.ai"
    );
  }
  Sounds.shared().playOminousSound();
}

