
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
