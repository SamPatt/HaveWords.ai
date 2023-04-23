// If the user is a guest this will set the room id to the one in the url
const urlParams = new URLSearchParams(window.location.search);
const inviteId = urlParams.get('room');

if (inviteId) {
  isHost = false;
} else {
  isHost = true;
}
let id;
let hostNickname;
let guestNickname;

// If user is host, check if there is an existing hostId in local storage
if (isHost) {
  const existingHostId = localStorage.getItem('hostId');
  const existingHostNickname = localStorage.getItem('hostNickname');
  if (existingHostId) {
    // If there is an existing hostId, set the hostId to the existing one
    id = existingHostId;
    hostNickname = existingHostNickname;
  } else {
    // If there is no existing hostId, generate a new one and save it to local storage
    id = generateId();
    localStorage.setItem('hostId', id);
  }
} else {
  // If user is guest, generate a new id
  const existingGuestId = localStorage.getItem('guestId');
  const existingGuestNickname = localStorage.getItem('guestNickname');
  if (existingGuestId) {
    // If there is an existing guestId, set the guestId to the existing one
    id = existingGuestId;
    guestNickname = existingGuestNickname;
  } else {
    // If there is no existing guestId, generate a new one and save it to local storage
      id = generateId();
      localStorage.setItem('guestId', id);
  }
}

let connections = {};
let dataChannels = {};
let bannedGuests = [];
let conn;
let gameMode = false;

/* // Local peerjs server
const peer = new Peer(id,{
  host: "localhost",
  port: 9000,
  path: "/myapp",
}); */


// Deployed peerjs server
const peer = new Peer(id,{
    host: "peerjssignalserver.herokuapp.com",
    path: "/peerjs",
    secure: true,
    port: 443,
});

let content = "You are a helpful assistant.";
const conversationHistory = [
    {
      role: 'system',
      content: content,
    },
  ];
const loadingAnimation = document.getElementById('loadingHost');
const startGameButton = document.getElementById('startGameButton');
let guestUserList = [];
let userAudioStream;

navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    userAudioStream = stream;
  })
  .catch(error => {
    console.error('Error getting audio stream:', error);
  });

peer.on('open', function () {
    console.log('PeerJS client is ready. Peer ID:', id);
    
  
    if (isHost) {
      setupHostSession(); // Call the function to set up the host session
      loadSessionData();
      displaySessionHistory();
      if (!hostNickname) {
        hostNickname = (generateHostNickname() + ' (host)');
        // Add host nickname to localstorage
        localStorage.setItem('hostNickname', hostNickname);
        console.log('Host nickname:', hostNickname);
        displayUsername.value = hostNickname;
        updateInputField(displayUsername)
      } else {
        console.log('Host nickname is already set:', hostNickname);
        
      }
    } else {
      if (!guestNickname) {
        guestNickname = generateNickname();
        // Add guest nickname to localstorage
        localStorage.setItem('guestNickname', guestNickname);
        displayUsername.value = guestNickname;
        updateInputField(displayUsername)

        console.log('Guest nickname:', guestNickname);
      } else {
        console.log('Guest nickname is already set:', guestNickname);
      }
      setupJoinSession(); // Call the function to set up the join session
    }
    });
    


let retryCount = 0;
const maxRetries = 5;

peer.on('error', function (err) {
  console.log('PeerJS error:', err);

  if (retryCount < maxRetries) {
    setTimeout(() => {
      console.log('Attempting to reconnect to PeerJS server...');
      peer.reconnect();
      retryCount++;
    }, 5000);
  } else {
    console.log('Reached maximum number of retries. Displaying system message.');
    // Display a system message here, e.g. by updating the UI
    addChatMessage("system-message", `Connection to peer server lost. Your existing connections still work, but you won't be able to make new connections or voice calls.`, "System");
  }
});

// Answer incoming voice calls
peer.on('call', call => {
  const acceptCall = confirm(`Incoming call. Do you want to accept the call?`);

  if (acceptCall) {
    call.answer(userAudioStream);
    console.log('Answering incoming call from:', call.peer);

    call.on('stream', remoteStream => {
      handleRemoteStream(remoteStream);
      updateCalleeVoiceRequestButton(call.peer, call);
    });

    call.on('close', () => {
      // Handle call close event
      console.log('Call with peer:', call.peer, 'has ended');
    });
  } else {
    console.log('Call from', call.peer, 'rejected');
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
    console.error("Couldn't find user actions element for callee ID:", calleeID);
    return;
  }

  const voiceRequestButton = userActions.querySelector("button");
  if (!voiceRequestButton) {
    console.error("Couldn't find voice request button for callee ID:", calleeID);
    return;
  }

  voiceRequestButton.textContent = "End Voice Call";
  voiceRequestButton.onclick = () => {
    call.close();
    voiceRequestButton.textContent = "Request Voice Call";
    voiceRequestButton.onclick = null;
  };
}

const copyToClipboard = (str) => {
  playSendBeep()
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(str);
  }
  return Promise.reject('The Clipboard API is not available.');
};

const displayInviteLink = document.getElementById('displayInviteLink');

const displayInviteText = document.getElementById('displayInviteText');
displayInviteText.addEventListener('click', (event) => {
  const oldColor = event.target.style.color
  event.target.style.color = "white"
  setTimeout(() => { event.target.style.color = oldColor; }, 0.2*1000)
  copyToClipboard(displayInviteText._link);
});

// These functions are called if the user is the host, to generate room IDs and create and copy the invite link
function generateId() {
    return Math.random().toString(36).substr(2, 9);
  }
function makeInviteLink(hostRoomId) {
    const inviteLink = `${window.location.origin}/?room=${hostRoomId}`;
    return inviteLink;
  }
const copyInviteLinkButton = document.getElementById('copyInviteLink');
copyInviteLinkButton.addEventListener('click', () => {
    displayInviteLink.select();
    document.execCommand('copy');
  });

// Creates a token for guest identity across sessions
function generateToken() {
    console.log('Generating token...');
    return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
    
  }
let guestToken = localStorage.getItem("guestToken");
  if (!guestToken) {
    guestToken = generateToken();
    localStorage.setItem("guestToken", guestToken);
  }
  

function displayHostHTMLChanges () {
    document.getElementById('hostAIContainer').style.display = 'block';
    document.getElementById('aiSelection').style.display = 'block';
    document.getElementById('inputSection').style.display = 'block';
    document.getElementById('resetSessionButton').style.display = 'block';
    startGameButton.style.display = 'block';

}

function displayGuestHTMLChanges () {
    document.getElementById('hostAIContainer').style.display = 'block';
    document.getElementById('remoteSystemPrompt').style.display = 'block';
    document.getElementById('inputSectionRemote').style.display = 'block';
    messageInputRemote.disabled = true;
    document.getElementById('aiSelection').style.display = 'none';
}
// Disables the chat send button until the data channel is open
const chatSendButton = document.getElementById('chatSendButton');
chatSendButton.addEventListener('click', sendChatMessage);

const modelSelect = document.getElementById('aiModel');
let selectedModelNickname = '';

function updateSelectedModelNickname() {
  const selectedOption = modelSelect.options[modelSelect.selectedIndex];
  selectedModelNickname = selectedOption.getAttribute('data-nickname');
}
updateSelectedModelNickname();


function updateSendButtonState() {
  if (aiModel.value === 'gpt-3.5-turbo' || aiModel.value === 'gpt-4') {
    sendButton.disabled = false;
  } else {
    sendButton.disabled = true;
  }
}

const apiKeyInput = document.getElementById('apiKey');

document.addEventListener('DOMContentLoaded', () => {
  const aiModel = document.getElementById('aiModel');
  const sendButton = document.getElementById('sendButton');
  const submitApiKeyButton = document.getElementById('submitApiKey');
  updateSendButtonState();
  modelSelect.addEventListener('change', updateSelectedModelNickname);

  aiModel.addEventListener('change', () => {
    selectedOption = modelSelect.options[modelSelect.selectedIndex];
    selectedModelNickname = selectedOption.getAttribute('data-nickname');
    updateSendButtonState();
  });

  
  submitApiKeyButton.addEventListener('click', () => {
    localStorage.setItem('openai_api_key', apiKeyInput.value);
    submitApiKeyButton.textContent = 'Saved!';
    setTimeout(() => {
      submitApiKeyButton.style.display = 'none';
    }, 1000);
  });
 

  // Load the stored API key from localStorage if it exists
  const storedApiKey = localStorage.getItem('openai_api_key');
  if (storedApiKey) {
    apiKeyInput.value = storedApiKey;
  }

  chatSendButton.addEventListener('click', () => {
    sendChatMessage()
  });

  sendButton.addEventListener('click', () => {
    addPrompt();    
  });

  sendButtonRemote.addEventListener('click', () => {
    guestSendPrompt();    
  });
  
});

//PeerJS webRTC section

async function setupHostSession() {
    console.log('Setting up host session');
    displayHostHTMLChanges();
    const inviteLink = makeInviteLink(id);
    displayInviteLink.value = inviteLink;
    displayInviteText._link = inviteLink
    displayInviteText.style.opacity = 1;

    addMessage("system-message", "<p>Welcome, <b>" + hostNickname + '</b>!</p> <p>To begin your AI sharing session, choose your AI model and input your OpenAI <a href="https://platform.openai.com/account/api-keys">API Key</a> key above. Your key is stored <i>locally in your browser</i>.</p><p>Then copy the invite link above, and send it to your friends. Click on their usernames in the Guest section to grant them access to your AI - or to kick them if they are behaving badly.</p> <p>Feeling adventurous? Click <b>Start Game</b> to play an AI guided roleplaying game with your friends. Have fun!</p>', "HaveWords");
  
    // Handle incoming connections from guests
    peer.on('connection', (conn) => {
        console.log('Incoming connection:', conn);
        conn.on('open', () => {
          connections[conn.peer] = conn;
      
          // Adds to datachannels
          dataChannels[conn.peer] = {
            conn: conn,
            id: conn.peer,
            nickname: '',
            token: '',
            canSendPrompts: false,
          };
  
        // Handle receiving messages from guests
        conn.on('data', (data) => {
            console.log(`Message from ${conn.peer}:`, data);
          
            if (data.type === 'nickname') {
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
                guestUserList = newGuestUserList
                // Send the session history to the guest
                const sessionData = loadSessionData();
                dataChannels[conn.peer].conn.send({
                  type: 'session-history',
                  history: sessionData.history,
                  nickname: hostNickname,
                  guestUserList: newGuestUserList,
                });                
                // Send a new message to all connected guests to notify them of the new guest
                for (const guestId in dataChannels) {
                  if (dataChannels.hasOwnProperty(guestId)) {
                    if (data.id !== guestId) {
                      dataChannels[guestId].conn.send({
                        type: 'guest-join',
                        message: `${data.nickname} has joined the session!`,
                        nickname: hostNickname,
                        joiningGuestNickname: data.nickname,
                        joiningGuestId: data.id,
                        guestUserList: guestUserList,
                      });
                    }
                  }

                }
                addChatMessage("system-message", `${data.nickname} has joined the session!`, hostNickname);
              }
            }
            if (data.type === 'remote-prompt') {
                // Add prompt to prompt history
                if (dataChannels[conn.peer].canSendPrompts) {
                  const sessionData = loadSessionData();
                  sessionData.history.push({
                  type: 'prompt',
                  data: data.message,
                  id: data.id,
                  nickname: data.nickname,

                });
                  saveSessionData(sessionData);
                  // Send prompt to guests
                  for (const guestId in dataChannels) {
                    if (dataChannels.hasOwnProperty(guestId)) {
                        if (data.id !== guestId) {
                            dataChannels[guestId].conn.send({
                                type: 'prompt',
                                id: data.id,
                                message: data.message,
                                nickname: data.nickname,
                            });
                        }
                    }
                  }
                  // Display prompt
                  addMessage("prompt", data.message, data.nickname);
                  sendAIResponse(data.message, data.nickname);
                } else {
                  console.log(`Rejected prompt from ${conn.peer} - ${dataChannels[conn.peer].nickname}`);
                }
            }
            if (data.type === 'remote-system-message') {
              // Add remote system message update to history if guest is allowed to send prompts
              if (dataChannels[conn.peer].canSendPrompts) {
                const sessionData = loadSessionData();
                sessionData.history.push({
                  type: 'system-message',
                  data: data.message,
                  id: data.id,
                  nickname: data.nickname,

                });
                saveSessionData(sessionData);
                // Update system message and display it TO DO SEND TO ALL
                addMessage("system-message", data.message, data.nickname);
                guestChangeSystemMessage(data);
              } else {
                console.log(`Rejected system message update from ${conn.peer} - ${dataChannels[conn.peer].nickname}`);
              }
          }
            if (data.type === 'chat') {
                // Add chat to chat history
                const sessionData = loadSessionData();
                sessionData.history.push({
                  type: 'chat',
                  data: data.message,
                  id: data.id,
                  nickname: data.nickname,
                });
                saveSessionData(sessionData);
                // Display chat message
                addChatMessage(data.type, data.message, data.nickname);

              // Broadcast chat message to all connected guests
              for (const guestId in dataChannels) {
                if (dataChannels.hasOwnProperty(guestId)) {
                    if (data.id !== guestId) {
                        dataChannels[guestId].conn.send({
                            type: 'chat',
                            id: data.id,
                            message: data.message,
                            nickname: data.nickname,
                        });
                    }
                }
              }
            }

            if (data.type === 'nickname-update') {
              // Update nickname in datachannels
              const oldNickname = dataChannels[conn.peer].nickname;
              dataChannels[conn.peer].nickname = data.newNickname;
              addChatMessage("system-message", `${oldNickname} is now ${data.newNickname}.`, hostNickname);
              updateUserList();
              // Update nickname in guest user list
              const updatedGuestUserList = updateGuestUserlist();
              guestUserList = updatedGuestUserList;
              // Send updated guest user list to all guests
              for (const guestId in dataChannels) {
                if (dataChannels.hasOwnProperty(guestId)) {
                    dataChannels[guestId].conn.send({
                        type: 'nickname-update',
                        message: `${oldNickname} is now ${data.newNickname}.`,
                        nickname: hostNickname,
                        oldNickname: oldNickname,
                        newNickname: data.newNickname,
                        guestUserList: updatedGuestUserList,
                    });
                }
          }

        }
      });

        conn.on('close', () => {
          
          console.log(`Guest disconnected: ${conn.peer}`);
          // Create a new guest list without the disconnected peer
          const closedPeerId = dataChannels[conn.peer].id;
          const closedPeerNickname = dataChannels[conn.peer].nickname;
          delete connections[conn.peer];
          delete dataChannels[conn.peer];
          const updatedGuestUserList = updateGuestUserlist();
          guestUserList = updatedGuestUserList;
          for (const guestId in dataChannels) {
              if (dataChannels.hasOwnProperty(guestId)) {
                  dataChannels[guestId].conn.send({
                      type: 'guest-leave',
                      message: `${closedPeerNickname} has left the session.`,
                      nickname: hostNickname,
                      leavingGuestNickname: closedPeerNickname,
                      leavingGuestId: closedPeerId,
                      guestUserList: updatedGuestUserList,
                  });
              }
          }
          addChatMessage("system-message", `${closedPeerNickname} has left the session.`, hostNickname);


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
    console.log('Setting up join session');
    displayGuestHTMLChanges();

    console.log('Attempting to connect to host with inviteId:', inviteId); // Add this line
  
    conn = peer.connect(inviteId);
  
    conn.on('open', () => {
      console.log('Connection opened:', conn);
      connections[inviteId] = conn;
      dataChannels[inviteId] = conn;
      console.log(`Connected to host: ${inviteId}`);
      conn.send({
        type: 'nickname',
        id: id,
        nickname: guestNickname,
        token: guestToken,
      });
  
  
      // Handle receiving messages from the host
      conn.on('data', (data) => {
        console.log(`Message from host:`, data);
        if (data.type === "kick") {
            conn.close();
            console.log("You have been kicked from the session.");
            displayKickedMessage();
          }
        if (data.type === 'chat') {
            playReceiveBeep();
            addChatMessage(data.type, data.message, data.nickname)
        }
        if (data.type === 'prompt') {
            guestAddPrompt(data);
        }
        if (data.type === 'ai-response') {
            guestAddHostAIResponse(data.message, data.nickname);
        }
        if (data.type === 'ban') {
            document.getElementById('chatInput').disabled = true;
            addChatMessage("chat", "You have been banned from the session.", "System");
        }
        if (data.type === 'session-history') {
          console.log('Received session history:', data.history);
          guestUserList = data.guestUserList.filter(guest => guest.id !== id);
          console.log("Received guestUserList:", guestUserList);
          displayGuestUserList(); // Call a function to update the UI with the new guestUserList
          guestDisplayHostSessionHistory(data.history);
      }

        if (data.type === 'nickname-update') {
          guestUserList = data.guestUserList.filter(guest => guest.id !== id);
          displayGuestUserList();
          addChatMessage("chat", data.message, data.nickname);
        }
        
        if (data.type === 'system-message') {
          guestAddSystemMessage(data);
        }
        if (data.type === 'image-link') {
          addImage(data.message);
        }

        if (data.type === 'game-launch') {
          startRoleplaySession();
          addMessage("prompt", "The adventure has begun! The AI DM is crafting our session, please wait...", data.nickname);
        }
        if (data.type === "guest-join") {
          addChatMessage("chat", data.message, data.nickname);
          guestUserList = data.guestUserList;
          const index = guestUserList.findIndex(guest => guest.id === id); // Use a function to test each element
          if (index !== -1) {
              guestUserList.splice(index, 1);
          }
          displayGuestUserList();
      }
        if (data.type === "guest-leave") {
          addChatMessage("chat", data.message, data.nickname);
          guestUserList = data.guestUserList;
          const index = guestUserList.findIndex(guest => guest.id === id); // Use a function to test each element
          if (index !== -1) {
              guestUserList.splice(index, 1);
          }
          displayGuestUserList();
      }
      
          
        const messageInputRemote = document.getElementById('messageInputRemote');
        if (data.type === 'grant-ai-access') {
          messageInputRemote.disabled = false;
          messageInputRemote.placeholder = 'Send a prompt to the AI...';
          addChatMessage("chat", "You've been granted AI access!", "Host");
        } else if (data.type === 'revoke-ai-access') {
          messageInputRemote.disabled = true;
          messageInputRemote.placeholder = "No prompt permission";
          addChatMessage("chat", "You've lost AI access.", "Host");
        }


        });
      conn.on('error', (err) => {
      console.log('Connection error:', err);
      });
      conn.on('close', () => {
        delete connections[inviteId];
        delete dataChannels[inviteId];
        console.log(`Disconnected from host: ${inviteId}`);
      });
    });
  }

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value;
    playSendBeep();

        if (message.trim() !== '') {
            input.value = '';
        
            if (isHost) {
            // Add chat to chat history
            const sessionData = loadSessionData();
            sessionData.history.push({
              type: 'chat',
              data: message,
              id: id,
              nickname: hostNickname,
            });
            saveSessionData(sessionData);
            // Display chat message
            addLocalChatMessage(message);
            // Broadcast chat message to all connected guests
            for (const guestId in dataChannels) {
                if (dataChannels.hasOwnProperty(guestId)) {
                    dataChannels[guestId].conn.send({
                    type: 'chat',
                    id: id,
                    message: message,
                    nickname: hostNickname,
                    });
                }
                }
            } else {
              // Send chat message to host
              conn.send({
                type: 'chat',
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
          console.log("Game mode is on, adding username to prompt: " + message);
          }
       } else {
        console.log("Game mode is off, sending prompt to OpenAI: " + message)
       }

  // Get AI Response and post locally
    const response = await fetchOpenAITextResponse(message);
    if (gameMode) {
      console.log("Calling triggerBot with AI response:", response);
      triggerBot(response, "fantasyRoleplay");
      console.log("Game mode is on, sending response to bot: " + response);
    }
    
    addAIReponse(response);
    // Send the response to all connected guests
    for (const guestId in dataChannels) {
      if (dataChannels.hasOwnProperty(guestId)) {
        dataChannels[guestId].conn.send({
          type: 'ai-response',
          id: id,
          message: response,
          nickname: selectedModelNickname,
      });
      }
    }
  }

// Calls the OpenAI LLM API and returns the response
async function fetchOpenAITextResponse(prompt) {
    const apiKey = localStorage.getItem('openai_api_key');
    if (!apiKey) {
      console.error("API key is missing.");
      addMessage("system-message", "API key is missing.", "System");
      return;
    }
 

  
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
  
    const aiModelSelect = document.getElementById('aiModel');
    const selectedModel = aiModelSelect.value;
  
    // Add the user's message to the conversation history
    conversationHistory.push({
      role: 'user',
      content: prompt,
    });
  
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: conversationHistory,
      }),
    };
  
    try {
      const response = await fetch(apiUrl, requestOptions);
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
  
      // Add the assistant's response to the conversation history
      conversationHistory.push({
        role: 'assistant',
        content: aiResponse,
      });
      // Save the conversation history to local storage
      const sessionData = loadSessionData();
      sessionData.history.push({
        type: 'ai-response',
        data: aiResponse,
        id: id,
        nickname: selectedModelNickname,
      });
      saveSessionData(sessionData);

      return aiResponse;
    } catch (error) {
      console.error("Error fetching AI response:", error);
      addMessage("system-message", "Error fetching AI response. Make sure the model is selected and the API key is correct.", "Host");
    }
  }
// Calls the OpenAI Image API and returns the image URL
async function fetchOpenAIImageResponse(prompt, sessionType) {
  const apiKey = localStorage.getItem('openai_api_key');
  if (!apiKey) {
    console.error("API key is missing.");
    addMessage("system-message", "API key is missing.", "System");
    return;
  }
  const apiUrl = 'https://api.openai.com/v1/images/generations';
  // Changes prompt based on session type
  let imagePrompt;
  if (sessionType === "fantasyRoleplay") {
    imagePrompt = "An epic masterpiece realistic painting of " + prompt + ", in the style of John Howe and Alan Lee, digital art";
  } else {
    // other session types later
  }
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt: imagePrompt,
      n: 1,
      size: "512x512",
    }),
  };
  const response = await fetch(apiUrl, requestOptions);
  const responseData = await response.json();
  const imageURL = responseData.data[0].url;
  return imageURL;
}

// Sends AI responses from fetchOpenAITextResponse to ChatGPT to determine if it should trigger actions
async function triggerBot(response, sessionType) {
  const apiKey = localStorage.getItem('openai_api_key');
  if (!apiKey) {
    console.error("API key is missing.");
    addMessage("system-message", "API key is missing.", "System");
    return;
  }
  const fantasyRoleplayPrompt = `Respond only with JSON.\n\nMy friends and I are playing a roleplaying fantasy game. We will send our game messages to you. I will refer to the messages as scenes.\n\nYour job is to trigger certain actions if you identify certain events happening in the scenes. Your message should never include two "Trigger:" messages, only one. If you respond with "Trigger: Yes" you must also include an "Image: Description" response with a description of the scene. This description will generate an image, so keep your description brief and only include words which are simple to represent visually, do not include the names of the characters in the prompt, and request that monsters or characters are centered in the image. Here are the events you are looking for, and the actions to trigger:\n\n1) EVENT:  A new monster, new player character, or new non-player character is being introduced in the scene. ACTION: Respond with a "Trigger: Yes" section in your JSON and an "Image: Description" section, where Description is replaced with a prompt you've created to describe the new monster or character being introduced.\n\n2) EVENT: Combat has started, or a serious threat has been introduced in the scene. ACTION: Respond with a "Trigger: Yes" section in your JSON, and an "Image: Description" section describing the scene.\n\n3) EVENT: The party has defeated a monster and ended combat, or otherwise completed an impressive achievement in the scene. ACTION: Respond with a "Trigger: Yes" section in your JSON, and an "Image: Description" describing the scene.\n\n4) EVENT: The party has entered a tavern, inn, or celebrating with a large group in the scene. ACTION: Respond with a "Trigger: Yes" section in your JSON, and an "Image: Description" section describing the scene.\n\n5) EVENT:  The setting in the scene changes significantly, and the new scenery is being described. ACTION: Respond with a "Trigger: Yes" section in your JSON and an "Image: Description" section, where Description is replaced with a prompt you've created to describe the new scene being introduced. This prompt will be used to generate a new image, so make the prompt as descriptive as you can given the information from the scene.\n\nIf multiple events occur within the same scene, respond with multiple actions.\n\nIf you detect none of these happening in the scene, respond with a "Trigger: No" section in your JSON.\n\nExamples\n\nScene: A group of gnolls approaches. The gnolls are humanoid creatures with the head of a hyena and the body of a human. They stand about 7 feet tall and with their wiry builds, they can move quickly and gracefully. You can see from their sharpened teeth and claws that they are fierce predators, and their beady eyes gleam with hunger and malice.\n\nYour response:\n\n{\n"Trigger": "Yes",\n"Image": "A group of 7-foot-tall gnolls with the head of a hyena and the body of a human approach with sharpened teeth and claws, gleaming with hunger and malice."\n}\n\nScene: You met a dozen villagers or so - mostly women, children, and elderly - sheltering behind hastily erected barricades, wielding whatever makeshift weapons they could find. They are dressed in simple clothes and have weathered faces, evidence of the harsh desert terrain they live in. They are relieved and grateful as you approach them, thanking you repeatedly for your help.\n\n{\n"Trigger": "Yes",\n"Image": "A group of women, children, and elderly villagers dressed in simple, ragged clothes, living in the desert, showing gratitude"\n}\n\nScene: You bid farewell to the grateful villagers and decide to continue your journey through the vast desert of Avaloria. As you walk, the sandy dunes seem to stretch endlessly before you, and the sun beats down relentlessly. You find a rocky outcropping where you can rest and eat. You notice that there is a winding path that seems to lead up the outcropping. Do you investigate or continue walking through the desert?\n\n{\n"Trigger": "Yes",\n"Image": "A rocky outcropping in the desert with a winding path leading up to it"\n}\n\n\nScene: You decide to rest for a while in the shade of the rocky outcropping. As you settle in, you notice that there are some signs of a recent fire nearby. Do you investigate the fire or continue resting?\n\n{\n"Trigger": "No"\n}\n\nScene: You approach the sealed doors of the ancient temple and inspect them closely. It seems that the doors have been sealed for centuries, and it will require a great deal of strength to move the stone blocks that have been placed there.\n\nDo you want to try and move the blocks yourself or investigate the surrounding area for clues on how to open the doors?\n\n{\n"Trigger": "No"\n}\n\nScene:`
  let triggerPrompt;
  if(sessionType === "fantasyRoleplay") {
    triggerPrompt = fantasyRoleplayPrompt;
    } else {
      // other session types later
      console.log("No session type for triggerBot found.")
    }  
  const message = triggerPrompt + response;
  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      "model": "gpt-3.5-turbo",
      "messages": [{"role": "user", "content": message}]
    }),
  };
  const AIresponse = await fetch(apiUrl, requestOptions);
  const data = await AIresponse.json();
  const rawTrigger = data.choices[0].message.content;
  let trigger;
  if (isValidJSON(rawTrigger)) {
    const cleanedResponse = removeWhitespace(rawTrigger);
    trigger = JSON.parse(cleanedResponse);

    // Rest of the code...
  } else {
    console.error("Invalid JSON data:", response);
  }
  // If an image is triggered, send the image prompt to the image API
  if (trigger["Trigger"] === "Yes") {
    if ("Image" in trigger) {
      const imageDescription = trigger["Image"];
      const imageURL = await fetchOpenAIImageResponse(imageDescription, "fantasyRoleplay");
      console.log("event triggered, image: " + imageURL);
      sendImage(imageURL);
      addImage(imageURL);
      console.log(`Image description: ${imageDescription}`);
    }
  } else {
    console.log("No event triggered");
  }
  
}

// Send imageURL to all connected guests
function sendImage(imageURL) {
  //Save into session history  
  const sessionData = loadSessionData();
    sessionData.history.push({
      type: 'image-link',
      data: imageURL,
      id: id,
      nickname: hostNickname,
    });
    saveSessionData(sessionData);

  for (const guestId in dataChannels) {
    if (dataChannels.hasOwnProperty(guestId)) {
          dataChannels[guestId].conn.send({
          type: 'image-link',
          message: imageURL,
          nickname: hostNickname,
        });
      }
    }

  }

function isValidJSON(jsonString) {
  try {
    const parsedJSON = JSON.parse(jsonString);
    return true;
  } catch (error) {
    return false;
  }
}

function removeWhitespace(jsonString) {
  try {
    const parsedJSON = JSON.parse(jsonString);
    const cleanedJSONString = JSON.stringify(parsedJSON);
    return cleanedJSONString;
  } catch (error) {
    console.error("Error while removing whitespace from JSON:", error);
    return jsonString;
  }
}

function addMessage(type, message, nickname) {
    let icon;
    let isUser = false;
    if (type === "prompt") {
      loadingAnimation.style.display = "inline";
      icon = "👤";
      isUser = true;
    } else if (type === "ai-response") {
      loadingAnimation.style.display = "none";
      icon = "🤖";
    } else if (type === "system-message") {
      icon = "🔧";
    } else {
      icon = "🦔";
    }

    const formattedResponse = convertToParagraphs(message);
    const sanitizedHtml = DOMPurify.sanitize(formattedResponse);
    const messagesDiv = document.querySelector('.messages');
    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'message-wrapper';

    const iconDiv = document.createElement('div');
    iconDiv.className = 'icon';
    iconDiv.innerHTML = icon;

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    if (!isUser) {
      messageWrapper.className += " aiMessage"; 
    }

    const messageNickname = document.createElement('div');
    messageNickname.className = 'message-nickname';
    messageNickname.textContent = nickname;
    messageContent.appendChild(messageNickname);

    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    messageText.innerHTML = sanitizedHtml;
    messageContent.appendChild(messageText);
    messageWrapper.appendChild(iconDiv);
    messageWrapper.appendChild(messageContent);

    messagesDiv.appendChild(messageWrapper);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    //const scrollView = messagesDiv.parentNode
    //scrollView.scrollTop = scrollView.scrollHeight;
}

function addImage(imageURL) {
  let icon;
  let isUser = false;
  const messagesDiv = document.querySelector('.messages');
  const messageWrapper = document.createElement('div');
  messageWrapper.className = 'message-wrapper';

  const iconDiv = document.createElement('div');
  iconDiv.className = 'icon';
  iconDiv.innerHTML = icon;

  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';

  if (!isUser) {
    messageWrapper.className += " aiMessage"; 
  }

  const imageElement = document.createElement('img');
  imageElement.src = imageURL;
  messageContent.appendChild(imageElement);

  messageWrapper.appendChild(iconDiv);
  messageWrapper.appendChild(messageContent);

  messagesDiv.appendChild(messageWrapper);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}


function addChatMessage(type, message, nickname) {
  let icon;
    if(type === 'chat') {
      icon = '🗯️';
    } else if (type === 'ai-response') {
      icon = '🤖';
      }  else  {
      icon = '🔧';
      }
      
  const formattedResponse = convertToParagraphs(message);
  const sanitizedHtml = DOMPurify.sanitize(formattedResponse);
  const messagesDiv = document.querySelector('.chatMessages');
  const messageWrapper = document.createElement('div');
  messageWrapper.className = 'message-wrapper';

  const iconDiv = document.createElement('div');
  iconDiv.className = 'icon';
  iconDiv.innerHTML = icon;

  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';

  const messageNickname = document.createElement('div');
  messageNickname.className = 'message-nickname';
  messageNickname.textContent = nickname;
  messageContent.appendChild(messageNickname);

  const messageText = document.createElement('div');
  messageText.className = 'message-text';
  messageText.innerHTML = sanitizedHtml;
  messageContent.appendChild(messageText);
  messageWrapper.appendChild(iconDiv);
  messageWrapper.appendChild(messageContent);
  messagesDiv.appendChild(messageWrapper);
  const scrollView = messagesDiv.parentNode
  scrollView.scrollTop = scrollView.scrollHeight;
}
  
  
  

async function addAIReponse(response) {
  playReceiveBeep();
    addMessage("ai-response", response, selectedModelNickname);
  }

async function addLocalChatMessage(message) {
    const sessionData = loadSessionData();
    sessionData.history.push({
      type: 'chat',
      data: message,
      id: id,
      nickname: hostNickname,
    });
    saveSessionData(sessionData);
    addChatMessage("chat", message, hostNickname);
    
  }

async function guestAddLocalChatMessage(message) {
    addChatMessage("chat", message, guestNickname);
  }


async function addPrompt() {
    playSendBeep();
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    if (message === '') return;
    input.value = '';
    const sessionData = loadSessionData();
    sessionData.history.push({
      type: 'prompt',
      data: message,
      id: id,
      nickname: hostNickname,
    });
    saveSessionData(sessionData);
    addMessage("prompt", message, hostNickname);
    sendPrompt(message);
 } 

async function guestAddPrompt(data) {
  playReceiveBeep();
  addMessage("prompt", data.message, data.nickname);
} 

async function guestAddSystemMessage(data) {
  playReceiveBeep();
  addMessage("system-message", data.message, data.nickname);
} 

async function guestAddLocalPrompt(prompt) {
  playSendBeep();
  addMessage("prompt", prompt, guestNickname);
} 

async function guestAddHostAIResponse(response, nickname) {
  playReceiveBeep();
  addMessage("ai-response", response, nickname);
}

async function sendPrompt(message) {
  // Send the prompt to all connected guests
  for (const guestId in dataChannels) {
    if (dataChannels.hasOwnProperty(guestId)) {
      dataChannels[guestId].conn.send({
        type: 'prompt',
        id: id,
        message: message,
        nickname: hostNickname,
    });
    }
  } if (gameMode) {
    message = hostNickname + ": " + message;
    console.log("Game mode is on, adding username to prompt: " + message);
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

// These functions update the list of connected guests and display the user actions menu

function updateUserList() {
  const userList = document.getElementById("userList");
  userList.innerHTML = "";

  for (const guestId in dataChannels) {
    if (dataChannels.hasOwnProperty(guestId)) {
      const guestToken = dataChannels[guestId].token;
      const guestNickname = dataChannels[guestId].nickname;

      // Create a container for the user and their actions
      const userContainer = document.createElement("div");
      userContainer.classList.add("user-container");

      // Create the user list item and add an arrow indicator
      const listItem = document.createElement("li");
      listItem.textContent = guestNickname;
      listItem.setAttribute("data-id", guestId);
      listItem.setAttribute("data-token", guestToken);

      const arrowIndicator = document.createElement("span");
      arrowIndicator.textContent = " ▼";
      arrowIndicator.classList.add("arrow-indicator");
      listItem.appendChild(arrowIndicator);

      // Create user action buttons
      const userActions = document.createElement("div");
      userActions.classList.add("user-actions");

      // AI Access button
      const canSendPromptsButton = document.createElement('button');
      canSendPromptsButton.textContent = dataChannels[guestId].canSendPrompts ? 'Revoke AI access' : 'Grant AI access';
      canSendPromptsButton.onclick = () => {
        dataChannels[guestId].canSendPrompts = !dataChannels[guestId].canSendPrompts;
      
        canSendPromptsButton.textContent = dataChannels[guestId].canSendPrompts ? 'Revoke AI access' : 'Grant AI access';
      
        if (dataChannels[guestId].canSendPrompts) {
          dataChannels[guestId].conn.send({ type: 'grant-ai-access' });
        } else {
          dataChannels[guestId].conn.send({ type: 'revoke-ai-access' });
        }
      };
      userActions.appendChild(canSendPromptsButton);

      userContainer.appendChild(listItem);

      // Voice request button
      handleVoiceRequestButton(userActions, guestId);

      // Kick button
      const kickButton = document.createElement("button");
      kickButton.textContent = "Kick";
      kickButton.onclick = () => {
        // Kick logic
        console.log("Kicking user " + guestId)
        kickUser(guestId);
      };
      userActions.appendChild(kickButton);

      const muteButton = document.createElement("button");
      muteButton.textContent = "Mute";
      muteButton.onclick = () => {
        // Mute logic
      };
      userActions.appendChild(muteButton);

      const banButton = document.createElement("button");
      banButton.textContent = "Ban";
      banButton.onclick = () => {
        // Ban logic
        banUser(guestId, guestToken);
      };
      userActions.appendChild(banButton);

      // Add user actions to the user container and set it to be hidden by default
      userActions.style.display = "none";
      userContainer.appendChild(userActions);

      // Show or hide user actions when the arrow indicator is clicked
      arrowIndicator.onclick = () => {
        if (userActions.style.display === "none") {
          userActions.style.display = "block";
        } else {
          userActions.style.display = "none";
        }
      };

      // Add the user container to the user list
      userList.appendChild(userContainer);
    }
  }
}

function displayGuestUserList() {
  
  const userList = document.getElementById("userList");
  userList.innerHTML = "";

  for (const id in guestUserList) {
    if (guestUserList.hasOwnProperty(id)) {
      const guestNickname = guestUserList[id].nickname;

      // Create a container for the user and their actions
      const userContainer = document.createElement("div");
      userContainer.classList.add("user-container");

      // Create the user list item and add an arrow indicator
      const listItem = document.createElement("li");
      listItem.textContent = guestNickname;
      listItem.setAttribute("data-id", guestUserList[id].id);

      const arrowIndicator = document.createElement("span");
      arrowIndicator.textContent = " ▼";
      arrowIndicator.classList.add("arrow-indicator");
      listItem.appendChild(arrowIndicator);

      userContainer.appendChild(listItem);

      // Create user action buttons
      const userActions = document.createElement("div");
      userActions.classList.add("user-actions");

      // Voice request button

      handleVoiceRequestButton(userActions, guestUserList[id].id);

      // Mute button
      const muteButton = document.createElement("button");
      muteButton.textContent = "Mute";
      muteButton.onclick = () => {
        // Mute logic
      };
      userActions.appendChild(muteButton);


      // Add user actions to the user container and set it to be hidden by default
      userActions.style.display = "none";
      userContainer.appendChild(userActions);

      // Show or hide user actions when the arrow indicator is clicked
      arrowIndicator.onclick = () => {
        if (userActions.style.display === "none") {
          userActions.style.display = "block";
        } else {
          userActions.style.display = "none";
        }
      };

      // Add the user container to the user list
      userList.appendChild(userContainer);
    }
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
    const call = peer.call(calleeID, userAudioStream);
    activeCalls[calleeID] = call;

    call.on('stream', remoteStream => {
      handleRemoteStream(remoteStream);
    });
    call.on('close', () => {
      console.log('Call with peer:', call.peer, 'has ended');
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


function displayUserActions(event) {
    const guestId = event.currentTarget.getAttribute("data-id");
    const userActions = document.getElementById("userActions");
    userActions.style.display = "block";
    userActions.setAttribute("data-id", guestId);
  }
  
function kickUser(kickedUserId) {
    if (dataChannels.hasOwnProperty(kickedUserId)) {
      const guestConn = dataChannels[kickedUserId].conn;
      guestConn.send({ type: "kick" });
  
      setTimeout(() => {
        guestConn.close();
        console.log(`Kicked guest: ${kickedUserId}`);
        delete dataChannels[kickedUserId];
        updateUserList();
      }, 500); // Adjust the delay (in milliseconds) as needed
    }
    const userActions = document.getElementById("user-actions");
    userActions.style.display = "none";
  }

function displayKickedMessage() {
    const chatOutput = document.getElementById("chatOutput");
    const kickedMessage = document.createElement("li");
    kickedMessage.classList.add("kicked-message");
    kickedMessage.textContent = "You've been kicked.";
    chatOutput.appendChild(kickedMessage);
  
    const chatSendButton = document.getElementById("chatSendButton");
    chatSendButton.disabled = true;
  }

function banUser(id, token) {
    if (dataChannels.hasOwnProperty(id)) {
      const guestConn = dataChannels[id].conn;
      guestConn.send({ type: "ban" });
  
      setTimeout(() => {
        guestConn.close();
        console.log(`Banned guest: ${id}`);
        bannedGuests.push(token);
        console.log(token)
        console.log(bannedGuests)
        delete dataChannels[id];
        updateUserList();
      }, 500); // Adjust the delay (in milliseconds) as needed
    }
    const userActions = document.getElementById("user-actions");
    userActions.style.display = "none";
  }

const usernameField = document.getElementById('username');

usernameField.addEventListener("keyup", (event) => {
  const target = event.target
  //console.log("event.key: '" + event.key + "'")
  if (event.key === "Enter") {
    updateUserName()
    event.target.blur()
  }
  updateInputField(target)
})

function updateInputField (target) {
  const size = target.value.length ? target.value.length : target.placeholder.length;
  //console.log("size:", size)
  target.setAttribute('size', (size) + "em")
}


function updateUserName () {
  const username = usernameField.value;
  if (username.trim() !== "") {
    if (isHost) {
      // Set new host nickname and send to all guests
      const oldNickname = hostNickname;
      if (hostNickname === username) {
        return;
      }
      hostNickname = username;
      // Update the host nickname in localstorage
      localStorage.setItem("hostNickname", hostNickname);
      addChatMessage(
        "chat",
        `${oldNickname} is now ${hostNickname}.`,
        hostNickname
      );
      const updatedGuestUserList = updateGuestUserlist();
      for (const guestId in dataChannels) {
        if (dataChannels.hasOwnProperty(guestId)) {
          dataChannels[guestId].conn.send({
            type: "nickname-update",
            message: `${oldNickname} is now ${hostNickname}.`,
            nickname: hostNickname,
            oldNickname: oldNickname,
            newNickname: hostNickname,
            guestUserList: updatedGuestUserList,
          });
        }
      }
    } else {
      // Set new guest nickname and send to host
      guestNickname = username;
      // Update the guest nickname in localstorage
      localStorage.setItem("guestNickname", guestNickname);
      sendUsername(username);
    }
  }
}
  
function sendUsername(username) {
      // Send chat message to host
      conn.send({
        type: 'nickname-update',
        id: id,
        newNickname: username,
      });
        }

  const systemMessage = document.getElementById('systemMessage');
  /*
  systemMessage.addEventListener('focus', () => {
      document.getElementById('submitSystemMessage').style.display = 'inline-block';
    });
    */

  function setNewAIRole(newRole) {
    content = newRole;
    systemMessage.value = content;
    conversationHistory.push({
      role: 'system',
      content: content,
    });
    // Check to see if host or guest and send message to appropriate party
    if (isHost) {
      sendSystemMessage(content);
    } else {
      console.log("Guests cannot set new AI role")
    }
    console.log("sent system message:", content)
  }

  /*
  systemMessage.addEventListener('input', () => {
      //systemMessage.style.width = `${systemMessage.value.length}ch`;
      content = systemMessage.value;
      conversationHistory = [
        {
          role: 'system',
          content: content,
        },
      ];
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
      content = systemMessage.value;
      conversationHistory = [
        {
          role: 'system',
          content: content,
        },
      ];
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
      // Send the updated system message to all connected guests
      for (const guestId in dataChannels) {
        if (dataChannels.hasOwnProperty(guestId)) {
          dataChannels[guestId].conn.send({
            type: 'system-message',
            id: id,
            message: message,
            nickname: hostNickname,
        });
        }
      }
    }

function guestChangeSystemMessage(data) {
  content = data.message;
  conversationHistory.push({
    role: 'user',
    content: prompt,
  });
  // Update system message input
  systemMessage.value = content;
  // Relay to connected guests
  for (const guestId in dataChannels) {
    if (dataChannels.hasOwnProperty(guestId)) {
      dataChannels[guestId].conn.send({
        type: 'system-message',
        id: data.id,
        message: data.message,
        nickname: data.nickname,
    });
    }
  }
}

// These functions save, load, and clear the session data from local storage
function saveSessionData(sessionData) {
    localStorage.setItem('sessionData', JSON.stringify(sessionData));
  }

function loadSessionData() {
    const sessionData = JSON.parse(localStorage.getItem('sessionData'));
    if (!sessionData) {
      return {
        history: [],
      };
    }
  
    if (!sessionData.history) {
      sessionData.history = [];
    }
  
    return sessionData;
  }
  
function clearSessionData() {
    localStorage.removeItem('sessionData');
    localStorage.removeItem('hostId');
    localStorage.removeItem('hostNickname');
  }

// Add event listener to trigger the resetSession function when the resetSessionButton is clicked
resetSessionButton.addEventListener('click', resetSession);

function resetSession () {
  const userChoice = confirm('Do you want to start a new session? This will delete the previous session data and create a new invite link.');  
  // Clear the session data
    clearSessionData();
    // Reload the page
    window.location.reload();
  }

// You can call this function when the host starts a new session
async function checkForExistingSession() {
    const sessionData = loadSessionData();
    if (sessionData) {
      const userChoice = confirm('Do you want to restore the previous session? Cancel to start a new session.');
      if (userChoice) {
        
      } else {
        // Start a new session
        clearSessionData();
      }
    }
  }

function guestDisplayHostSessionHistory(sessionData) {
    
    sessionData.forEach((item) => {
      if (item.type === 'prompt') {
        addMessage(item.type, item.data, item.nickname);
      } else if (item.type === 'ai-response') {
        addMessage(item.type, item.data, item.nickname);
      } else if (item.type === 'system-message') {
        addMessage(item.type, item.data, item.nickname);
      } else if (item.type === 'chat') {
        addChatMessage(item.type, item.data, item.nickname);
      } else if (item.type === 'image-link') {
        addImage(item.data);
      }
    });
  }
  
function displaySessionHistory() {
  const sessionData = loadSessionData();
  sessionData.history.forEach((item) => {
    
    if (item.type === 'prompt') {
      addMessage(item.type, item.data, item.nickname);
    } else if (item.type === 'ai-response') {
      addMessage(item.type, item.data, item.nickname);
    } else if (item.type === 'system-message') {
      addMessage(item.type, item.data, item.nickname);
    } else if (item.type === 'chat') {
      addChatMessage(item.type, item.data, item.nickname);
    } else if (item.type === 'image-link') {
      addImage(item.data);
    }
  });
}

const messageInput = document.getElementById('messageInput');
const chatInput = document.getElementById('chatInput');
const messageInputRemote = document.getElementById('messageInputRemote');

messageInput.addEventListener('keypress', handleEnterKeyPress);
chatInput.addEventListener('keypress', handleEnterKeyPress);
messageInputRemote.addEventListener('keypress', handleEnterKeyPress);


// This displays the user's nickname above the chat window
const displayUsername = document.getElementById('username');
if (isHost) {
  displayUsername.value = hostNickname;
  updateInputField(displayUsername)
} else {
  displayUsername.value = guestNickname;
  updateInputField(displayUsername)
}

function handleEnterKeyPress(event) {
  if (event.keyCode === 13) { // Check if the key is Enter
    if (!event.shiftKey) { // Check if Shift is NOT pressed
      event.preventDefault(); // Prevent the default action (newline)

      if (document.activeElement === messageInput) {
        sendButton.click();
      } else if (document.activeElement === chatInput) {
        chatSendButton.click();
      } else if (document.activeElement === messageInputRemote) {
        sendButtonRemote.click();
      }
    }
  }
}

// Start the group game when the host clicks the button
startGameButton.addEventListener('click', () => {
  startSession("fantasyRoleplay");
});

async function startSession(sessionType) {
    localStorage.setItem('openai_api_key', apiKeyInput.value);
    addMessage('prompt', "You've started the session!", hostNickname);
    // Check which session type was selected
    if(sessionType === "fantasyRoleplay") {  
      gameMode = true;
      startRoleplaySession();
      // Construct the system message to guide the AI
      const newRole = "You are now the AI Dungeon Master guiding a roleplaying session.";
      setNewAIRole(newRole)
      // Get the current user's usernames
      const usernames = getCurrentUsernames();
      console.log(usernames);
      // Construct the prompt to assign roles and describe the setting
      const prompt = `We are a group of people playing a fantasy role playing game, and you are our dungeon master. Each user will respond with their own username at the beginning of the message for you to identify them. You can ask individual users what actions they will take. The game should be fast paced and lively. Respond with HTML formatting to use bold, italics, or other elements when needed, but don't use <br> tags, use newlines instead. When possible, make choices open-ended, but you can offer specific options if it will enhance the story. Don't use Markdown, only use HTML. Assign each of the following users a fantasy role and briefly describe the setting, then start the game: ${usernames.join(', ')}.`;

    // Send the system message and the prompt to the AI
    // Send a message to all connected guests
    for (const guestId in dataChannels) {
      if (dataChannels.hasOwnProperty(guestId)) {
        dataChannels[guestId].conn.send({
          type: 'game-launch',
          id: id,
          message: "The host started a new session!",
          nickname: hostNickname,
      });

      }
    }
    const response = await fetchOpenAITextResponse(prompt);
    triggerBot(response, "fantasyRoleplay");
    addAIReponse(response);

    // Send the response to all connected guests
    for (const guestId in dataChannels) {
      if (dataChannels.hasOwnProperty(guestId)) {
        dataChannels[guestId].conn.send({
          type: 'ai-response',
          id: id,
          message: response,
          nickname: selectedModelNickname,
      });
      }
    }
    } else {
      // other session types later
    }
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
      console.log("Added to guestNicknames: " + dataChannels[guestId].nickname);
    }
  }
  return guestNicknames;
}

function startRoleplaySession() {
    // Trigger the visual indicator (e.g., change the background color)

    var h2Element = document.querySelector('.header h2');

    // Change the content of the h2 element
    h2Element.innerHTML = 'AI GAME MASTER';


    document.getElementById('aiSelectionBlock').style.display = "none"; 
    playOminousSound();
}

function playOminousSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  const notes = [110, 123.47, 130.81, 146.83]; // Frequencies for notes A2, B2, C3, and D3

  notes.forEach((note, index) => {
    const startTime = audioContext.currentTime + index * 0.5;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.frequency.value = note;
    oscillator.type = index % 2 === 0 ? 'sine' : 'triangle';
    gainNode.gain.setValueAtTime(0.2, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.5);
  });
}

function playSendBeep() {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const gainNode = context.createGain();

  gainNode.gain.setValueAtTime(0.02, context.currentTime);
  gainNode.connect(context.destination);

  const notes = [330, 290]; // Lower frequencies for the send beep

  notes.forEach((note, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(note, context.currentTime + index * 0.1);

    oscillator.connect(gainNode);
    oscillator.start(context.currentTime + index * 0.1);
    oscillator.stop(context.currentTime + (index * 0.1) + 0.1);
  });
}

function playReceiveBeep() {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const gainNode = context.createGain();

  gainNode.gain.setValueAtTime(0.02, context.currentTime);
  gainNode.connect(context.destination);

  const notes = [290, 330]; // Lower frequencies for the receive beep

  notes.forEach((note, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(note, context.currentTime + index * 0.1);

    oscillator.connect(gainNode);
    oscillator.start(context.currentTime + index * 0.1);
    oscillator.stop(context.currentTime + (index * 0.1) + 0.1);
  });
}

window.addEventListener('load', () => {

});

// This section is for creating a random nickname for the users
const adjectives = [
  'wacky',
  'spunky',
  'quirky',
  'zany',
  'kooky',
  'cranky',
  'sassy',
  'snarky',
  'dorky',
  'goofy',
  'dizzy',
  'silly',
  'sneaky',
  'bizarre',
  'nutty',
  'loopy',
  'whimsical',
  'rambunctious',
  'witty',
  'zesty',
  'bouncy',
  'peppy',
  'jazzy',
  'zippy',
  'fuzzy',
  'fizzy',
  'dizzying',
  'snappy',
  'flashy',
  'giddy',
  'hilarious',
  'absurd',
  'eccentric',
  'bizarre',
  'groovy',
  'boisterous',
  'ridiculous',
  'zonked',
  'kooky',
  'blazing',
  'snarling',
  'gnarly',
  'scowling',
  'grumpy',
  'fiery',
  'spiteful',
  'malevolent',
  'sinister',
  'nasty',
  'cynical',
  'cranky',
  'wicked',
  'vicious',
  'brutish',
  'malicious',
  'sardonic',
  'scathing',
  'venomous',
  'rude',
  'insolent',
];
 
  const nouns = [
    'cheese-sculptor',
    'llama-farmer',
    'plumber-from-mars',
    'pro-thumb-wrestler',
    'underwater-basket-weaver',
    'fortune-cookie-writer',
    'pro-goose-caller',
    'ninja-warrior',
    'yo-yo-champion',
    'extreme-couponer',
    'cat-acrobat',
    'roadkill-collector',
    'cactus-whisperer',
    'quilt-sniffer',
    'stilt-walker',
    'cheese-grater',
    'gum-chewer',
    'lint-collector',
    'toe-wrestler',
    'pizza-acrobat',
    'bubble-wrap-popper',
    'dance-machine',
    'dream-interpreter',
    'taco-taster',
    'circus-clown',
    'pogo-stick-champion',
    'pillow-fight-champion',
    'speed-talker',
    'disco-ball-spinner',
    'gum-bubble-blower',
    'electric-scooter-rider',
    'balloon-animal-maker',
    'chicken-whisperer',
    'juggler-extraordinaire',
    'glow-stick-dancer',
    'sock-collector',
    'pineapple-juggler',
    'extreme-hiker',
    'karaoke-superstar',
    'chainsaw-juggler',
    'garbage-collector',
    'sewer-inspector',
    'human-ashtray',
    'rat-tamer',
    'insect-farmer',
    'denture-collector',
    'professional-complainer',
    'rotten-egg-collector',
    'cigarette-licker',
    'taxidermist-apprentice',
    'snail-racer',
    'feral-cat-wrangler',
  ];
  
  

  const hostAdjectives = [
    'authoritative',
    'confident',
    'decisive',
    'determined',
    'focused',
    'smug',
    'influential',
    'inspiring',
    'knowledgeable',
    'motivated',
    'powerful',
    'proactive',
    'professional',
    'respected',
    'strategic',
    'successful',
    'visionary',
    'wise',
    'ambitious',
    'charismatic',
    'jocund',
    'halcyon',
    'ephemeral',
    'furtive',
    'incognito',
    'scintillating',
    'quixotic',
    'mellifluous',
    'susurrant',
    'penultimate',
    'euphonious',
    'ethereal',
    'effervescent',
    'fecund',
    'serendipitous',
    'melismatic',
    'obfuscating',
    'quintessential',
    'nebulous',
    'luminous',
  ];
  
  const hostNouns = [
    'kite-surfer',
    'glass-blower',
    'lightning-catcher',
    'ice-sculptor',
    'cloud-watcher',
    'waterfall-climber',
    'fire-breather',
    'snowboarder',
    'flower-arranger',
    'labyrinth-builder',
    'skydiver',
    'volcano-tracker',
    'bird-whisperer',
    'meteor-watcher',
    'moon-walker',
    'aurora-chaser',
    'tide-pool-explorer',
    'forest-ranger',
    'wilderness-explorer',
    'glacier-trekker',
    'rainbow-chaser',
    'thunderbolt-rider',
    'desert-navigator',
    'jungle-explorer',
    'storm-chaser',
    'tropical-paradise-traveler',
    'mushroom-hunter',
    'sahara-trekker',
  ];
  


function convertToParagraphs(text) {
  // Split the text into paragraphs using double newline characters
  const paragraphs = text.split(/\n{2,}/g);

  // Wrap each paragraph in a <p> tag
  const html = paragraphs.map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`).join('');

  return html;
}


function generateHostNickname() {
    const adjective = hostAdjectives[Math.floor(Math.random() * hostAdjectives.length)];
    const noun = hostNouns[Math.floor(Math.random() * hostNouns.length)];
    return `${adjective}-${noun}`;
  }

function generateNickname() {
      const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      return `${adjective}-${noun}`;
    }

