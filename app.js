// If the user is a guest this will set the room id to the one in the url
const urlParams = new URLSearchParams(window.location.search);
const inviteId = urlParams.get('room');

if (inviteId) {
  isHost = false;
} else {
  isHost = true;
}
let id;

// If user is host, check if there is an existing hostId in local storage
if (isHost) {
  const existingHostId = localStorage.getItem('hostId');
  if (existingHostId) {
    // If there is an existing hostId, set the hostId to the existing one
    id = existingHostId;
  } else {
    // If there is no existing hostId, generate a new one and save it to local storage
    id = generateId();
    localStorage.setItem('hostId', id);
  }
} else {
  // If user is guest, generate a new id
  id = generateId();
}


let connections = {};
let dataChannels = {};
let hostNickname;
let guestNickname;
let bannedGuests = [];
let conn;
let gameMode = false;
const peer = new Peer(id,{
    host: "peerjssignalserver.herokuapp.com",
    path: "/peerjs",
    secure: true,
    port: 443,
});
let content = "You are a helpful assistant.";
let conversationHistory = [
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
      hostNickname = (generateHostNickname() + ' (host)');
      console.log('Host nickname:', hostNickname);
      displayUsername.innerHTML = "<b>" + hostNickname + "</b>";
      setupHostSession(); // Call the function to set up the host session
      checkForExistingSession(); // Call the function to check for an existing session
    } else {
      setupJoinSession(); // Call the function to set up the join session
      guestNickname = generateNickname();
      displayUsername.innerHTML = "<b>" + guestNickname + "</b>";
      console.log('Guest nickname:', guestNickname);
    }
  });
  
peer.on('error', function (err) {
    console.log('PeerJS error:', err);
  });
  
window.addEventListener('beforeunload', () => {
    peer.disconnect();
    peer.destroy();
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



const displayInviteLink = document.getElementById('displayInviteLink');

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
    document.getElementById('displayInviteLinkContainer').style.display = 'block';
    startGameButton.style.display = 'block';

}

function displayGuestHTMLChanges () {
    document.getElementById('hostAIContainer').style.display = 'block';
    document.getElementById('remoteSystemPrompt').style.display = 'block';
    document.getElementById('inputSectionRemote').style.display = 'block';
    messageInputRemote.disabled = true;
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

document.addEventListener('DOMContentLoaded', () => {
  const aiModel = document.getElementById('aiModel');
  const sendButton = document.getElementById('sendButton');
  const apiKeyInput = document.getElementById('apiKey');
  const apiKeyInputContainer = document.getElementById('apiKeyInput');
  const submitApiKeyButton = document.getElementById('submitApiKey');
  updateSendButtonState();
  modelSelect.addEventListener('change', updateSelectedModelNickname);

  aiModel.addEventListener('change', () => {
    apiKeyInputContainer.style.display = 'inline';
    selectedOption = modelSelect.options[modelSelect.selectedIndex];
    selectedModelNickname = selectedOption.getAttribute('data-nickname');
    updateSendButtonState();
  });
  


  apiKeyInput.addEventListener('input', () => {
    if (apiKeyInput.value.length > 0) {
      submitApiKeyButton.style.display = 'inline';
    } else {
      submitApiKeyButton.style.display = 'none';
    }
  });

  submitApiKeyButton.addEventListener('click', () => {
    localStorage.setItem('openai_api_key', apiKeyInput.value);
    apiKeyInputContainer.style.display = 'none';
    submitApiKeyButton.style.display = 'none';
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
      
        
        if (data.type === 'system-message') {
          guestAddSystemMessage(data);
        }
        if (data.type === 'game-launch') {
          triggerAdventureStart();
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
        message = nickname + ": " + message;
        console.log("Game mode is on, adding username to prompt: " + message);
       }
  // Get AI Response and post locally
    const response = await fetchOpenAIResponse(message);
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

async function fetchOpenAIResponse(prompt) {
    const apiKey = localStorage.getItem('openai_api_key');
    if (!apiKey) {
      console.error("API key is missing.");
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

function addMessage(type, message, nickname) {
    let icon;
    if(type === 'prompt') {
      loadingAnimation.style.display = 'inline';
      icon = '👤';
    } else if (type === 'ai-response') {
      loadingAnimation.style.display = 'none';
      icon = '🤖';
      }  else if (type === 'system-message')  {

      icon = '🔧';
      } else {

      icon = '🦔';
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
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
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
  }
  sendAIResponse(message);
}

async function guestSendPrompt() {
    const input = document.getElementById('messageInputRemote');
    const message = input.value;

        if (message.trim() !== '') {
            input.value = '';
        
              // Send chat message to host
              conn.send({
                type: 'remote-prompt',
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

  const systemMessage = document.getElementById('systemMessage');
  systemMessage.addEventListener('focus', () => {
      document.getElementById('submitSystemMessage').style.display = 'block';
    });
  systemMessage.addEventListener('input', () => {
      systemMessage.style.width = `${systemMessage.value.length}ch`;
    });
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
  conversationHistory = [
    {
      role: 'system',
      content: content,
    },
  ];
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
  }
// You can call this function when the host starts a new session
async function checkForExistingSession() {
    const sessionData = loadSessionData();
    if (sessionData) {
      const userChoice = confirm('Do you want to restore the previous session? Cancel to start a new session.');
      if (userChoice) {
        displaySessionHistory();
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
const displayUsername = document.getElementById('displayUsername');
if (isHost) {
  displayUsername.innerHTML = hostNickname;
} else {
  displayUsername.innerHTML = guestNickname;
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
  startAdventure();
  
});

async function startAdventure() {
    gameMode = true;
    triggerAdventureStart();
    addMessage('prompt', "You've started the session!", hostNickname);
    // Construct the system message to guide the AI
    //TODO Allow user choices and pass various choices into the content and prompt options
    content = "You are now the AI Dungeon Master guiding a roleplaying session.";
    systemMessage.value = content;
    
    // Get the current user's usernames
    const usernames = getCurrentUsernames();
    console.log(usernames);

    // Construct the prompt to assign roles and describe the setting
    const prompt = `We are a group of people playing a fantasy role playing game, and you are our dungeon master. Each user will respond with their own username at the beginning of the message for you to identify them. You can ask individual users what actions they will take. The game should be fast paced and lively. Respond with HTML formatting to use bold, italics, or other elements when needed, but don't use <br> tags, use newlines instead, and do not use Markdown.  When possible, make choices open-ended, but you can offer specific options if it will enhance the story. Assign each of the following users a fantasy role and briefly describe the setting, then start the game: ${usernames.join(', ')}.`;

    // Send the system message and the prompt to the AI
    // Send a message to all connected guests
    for (const guestId in dataChannels) {
      if (dataChannels.hasOwnProperty(guestId)) {
        dataChannels[guestId].conn.send({
          type: 'game-launch',
          id: id,
          message: "The game has begun!",
          nickname: hostNickname,
      });
      }
    }
    const response = await fetchOpenAIResponse(prompt);
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
    // Trigger the visual indicator and sound effect
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

function triggerAdventureStart() {
    // Trigger the visual indicator (e.g., change the background color)
    document.body.style.backgroundColor = "rgb(52, 78, 56)";

    // Play the sound effect
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
  const systemMessageElement = document.getElementById('systemMessage'); 
  systemMessageElement.value = ''; 
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

