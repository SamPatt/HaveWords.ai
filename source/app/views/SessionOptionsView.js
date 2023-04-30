"use strict";

/* 
    SessionOptionsView

*/

(class SessionOptionsView extends View {
  initPrototypeSlots() {}

  init() {
    super.init();
    this.setId("aiSelectionBlock");
  }
}.initThisClass());


const startGameButton = document.getElementById("startGameButton");
// Start the group game when the host clicks the button
startGameButton.addEventListener("click", () => {
  updateSessionTypeOptions("fantasyRoleplay");
});



const systemMessage = document.getElementById("systemMessage");


function setNewAIRole(newRole) {
  const content = newRole;
  systemMessage.value = content;
  OpenAiChat.shared().addToConversation({
    role: "system",
    content: content,
  })

  // Check to see if host or guest and send message to appropriate party
  if (Peers.shared().isHost()) {
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
      if (Peers.shared().isHost()) {
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
      if (Peers.shared().isHost()) {
        sendSystemMessage(content);
      } else {
        sendSystemMessageToHost(content);
      }
    }); 
    */

async function sendSystemMessage(message) {
  Peers.shared().broadcast({
    type: "system-message",
    id: Session.shared().localUserId(),
    message: message,
    nickname: Session.shared().hostNickname(),
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

function checkURLPath() {
  const hash = window.location.hash;
  console.log("Current hash:", hash); // Add this line for debugging
  if (hash === "#fantasyRoleplay") {
    console.log("URL includes #fantasyRoleplay");
    Session.shared().setFantasyRoleplay(true)
    updateSessionTypeOptions("fantasyRoleplay");
  } else if (hash === "#trivia") {
    console.log("URL includes #trivia");
    Session.shared().setGameMode(true)
    updateSessionTypeOptions("trivia");
  } else if (hash === "#explore") {
    console.log("URL includes #explore");
    updateSessionTypeOptions("explore");
  }
}

const apiKeyInput = document.getElementById("apiKey");

/*
  const submitApiKeyButton = document.getElementById("submitApiKey");
  submitApiKeyButton.addEventListener("click", () => {
    localStorage.setItem("openai_api_key", apiKeyInput.value);
    submitApiKeyButton.textContent = "Saved!";
    setTimeout(() => {
      submitApiKeyButton.style.display = "none";
    }, 1000);
  });
*/

function setupSessionUI() {
  const aiModel = document.getElementById("aiModel");
  updateSendButtonState();
  modelSelect.addEventListener("change", updateSelectedModelNickname);
  checkURLPath();

  aiModel.addEventListener("change", () => {
    selectedOption = modelSelect.options[modelSelect.selectedIndex];
    selectedModelNickname = selectedOption.getAttribute("data-nickname");
    updateSendButtonState();
  });

  apiKeyInput.addEventListener("keyup", (event) => {
    console.log("apiKeyInput keyup")
    const key = apiKeyInput.value
    if (key.length === 51 && key.startsWith("sk-")) {
      OpenAiService.shared().setApiKey(apiKeyInput.value)
      apiKeyInput.style.color = "white"
    } else {
      apiKeyInput.style.color = "red"
    }
  });

  // Load the stored API key from localStorage if it exists
  const storedApiKey = OpenAiChat.shared().apiKey();
  if (storedApiKey) {
    apiKeyInput.value = storedApiKey;
  }
}

setupSessionUI();

// You can call this function when the host starts a new session
async function checkForExistingSession() {
  const sessionData = Session.shared().data();
  if (sessionData) {
    const userChoice = confirm(
      "Do you want to restore the previous session? Cancel to start a new session."
    );
    if (userChoice) {
    } else {
      // Start a new session
      Session.shared().clear();
    }
  }
}

function guestDisplayHostSessionHistory(sessionData) {
  Session.shared()
    .history()
    .forEach((item) => {
      if (item.type === "prompt") {
        addMessage(item.type, item.data, item.nickname);
      } else if (item.type === "ai-response") {
        addMessage(item.type, item.data, item.nickname);
      } else if (item.type === "system-message") {
        addMessage(item.type, item.data, item.nickname);
      } else if (item.type === "chat") {
        addChatMessage(item.type, item.data, item.nickname);
      } else if (item.type === "image-link") {
        addImage(item.data);
      }
    });
}

function displaySessionHistory() {
  Session.shared().history()
    .forEach((item) => {
      if (item.type === "prompt") {
        addMessage(item.type, item.data, item.nickname);
      } else if (item.type === "ai-response") {
        addMessage(item.type, item.data, item.nickname);
      } else if (item.type === "system-message") {
        addMessage(item.type, item.data, item.nickname);
      } else if (item.type === "chat") {
        addChatMessage(item.type, item.data, item.nickname);
      } else if (item.type === "image-link") {
        addImage(item.data);
      }
    });
}

//TODO: move the initial username scrape and AI prompt into the specific session functions, since users won't be connected yet

async function startSession(sessionType, sessionDetails) {
  addMessage("prompt", "You've started the session!", Session.shared().hostNickname());
  Session.shared().setInSession(true)

  // Check which session type was selected
  if (sessionType === "fantasyRoleplay") {
    Session.shared().setGameMode(true)
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
      id: Session.shared().localUserId(),
      message:
        "The host started a new " +
        sessionDetails +
        " session! Please wait while the AI Game master crafts your world...",
      nickname: Session.shared().hostNickname(),
      sessionType: "fantasyRoleplay",
    });

    const response = await OpenAiChat.shared().asyncFetch(prompt);
    // Stores initial AI response, which contains character descriptions, for later use
    Session.shared().setGroupSessionFirstAIResponse(response)
    //triggerBot(response, "fantasyRoleplay", sessionDetails);
    addAIReponse(response);

    // Send the response to all connected guests
    Peers.shared().broadcast({
      type: "ai-response",
      id: Session.shared().localUserId(),
      message: response,
      nickname: selectedModelNickname,
    });
  } else if (sessionType === "trivia") {
    Session.shared().setGameMode(true);
    // Construct the system message to guide the AI
    const newRole =
      "You are now the AI Trivia Master for a trivia session in the " +
      sessionDetails +
      " category";
    setNewAIRole(newRole);
    // Get the current user's usernames
    const usernames = getCurrentUsernames();
    console.log(usernames);

    // Beginning the session
    const prompt = `You are the host for a group trivia session in the ${sessionDetails} category. After you ask us your first question in the category, you will receive a response which includes the usernames followed by their answers. In your response to that message, include whether each user got the answer right or wrong, and then add points to their score, keeping record of each user throughout each round. Then ask if we're ready for the next question. Use HTML formatting in your responses to add bold, italics, headings, line breaks, or other methods to improve the look and clarity of your responses.  The player names are: ${usernames.join(", ")}, start the game by greeting the players, and asking the first question. Wait for our responses to your question.`;

    // Send a message to all connected guests
    Peers.shared().broadcast({
      type: "game-launch",
      id: Session.shared().localUserId(),
      message:
        "The host started a new " +
        sessionDetails +
        " trivia session! Please wait while the AI Trivia Master prepares the first question...",
      nickname: Session.shared().hostNickname(),
      sessionType: "trivia",
    });

    const response = await OpenAiChat.shared().asyncFetch(prompt);
    addAIReponse(response);

    // Send the response to all connected guests
    Peers.shared().broadcast({
      type: "ai-response",
      id: Session.shared().localUserId(),
      message: response,
      nickname: selectedModelNickname,
    });
  }  else if (sessionType === "explore") {
    Session.shared().setGameMode(true);
    // Construct the system message to guide the AI
    const newRole =
      "You are now the AI Guide for an exploration session where users can investigate historical events, interview celebrities, explore fictional worlds, and more";
    setNewAIRole(newRole);
    // Get the current user's usernames
    const usernames = getCurrentUsernames();
    console.log(usernames);

    // Beginning the session
    const userPrompt = Session.shared().groupSessionDetails()
    const prompt = `You are the AI Guide for an exploration session where users can investigate historical events, interview celebrities, explore fictional worlds, and more. The player names are: ${usernames.join(", ")}. Start the session by welcoming the players and create a short description where the players can start an adventure based on the following prompt: ${userPrompt}. Use HTML formatting in your responses to add bold, italics, headings, line breaks, or other methods to improve the look and clarity of your responses, when necessary. Be creative and informative in your responses, and make the exploration engaging and enjoyable for the players. Do not write dialogue for the users, only for the characters in the scene. Let the users speak for themselves. Emphasize aspects of the settings and characters that are relevant to the exploration. Respond to the users' actions and questions, and guide them through the exploration.`;

    // Send a message to all connected guests
    Peers.shared().broadcast({
      type: "game-launch",
      id: Session.shared().localUserId(),
      message:
        "The host started a new exploration session! Please wait while the AI Guide prepares to start the session...",
      nickname: Session.shared().hostNickname(),
      sessionType: "explore",
    });

    const response = await OpenAiChat.shared().asyncFetch(prompt);
    addAIReponse(response);

    // Send the response to all connected guests
    Peers.shared().broadcast({
      type: "ai-response",
      id: Session.shared().localUserId(),
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
  const sessionTypeDescription = document.getElementById(
    "sessionTypeDescription"
  );
  const sessionTypeDetailsSelect = document.getElementById(
    "sessionTypeDetailsSelect"
  );

  const customInput = document.createElement("input");
  customInput.type = "text";
  customInput.id = "customSessionDetailsInput";
  customInput.placeholder = "Enter custom details...";
  const customInputLabel = document.createElement("p");
  customInputLabel.innerHTML = "Or create your own session:";

  // Clear existing options and description
  //dropdownContainer.innerHTML = "";
  //sessionTypeDetailsSelect.innerHTML = "";
  customInputContainer.innerHTML = "";
  sessionTypeDescription.innerHTML = "";

  let options;
  let description;

  if (sessionType === "fantasyRoleplay") {
    Session.shared().setGroupSessionType("fantasyRoleplay")
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
    Session.shared().setGroupSessionType("trivia")
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
  } else if (sessionType === "explore") {
    Session.shared().setGroupSessionType("explore")
    options = [
      { value: "Explore", text: "Explore" },
    ];
    // Add examples here
    description = `
      <h2>Explore:</h2>
      <p>Investigate historical events. Interview celebrities. Jump into your favorite sitcom. Travel to fictional universes. Explore the limits of your imagination by telling the AI whatever you want to do.</p>
    `;
  } else {
    // Add different options and descriptions for other session types
  }

  // Add the new options to the dropdown menu
  const selectElement = document.createElement("select");
  selectElement.id = "sessionTypeDetailsSelect";
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
    const customDetailsInput = document.getElementById(
      "customSessionDetailsInput"
    );
    const customDetails = customDetailsInput.value.trim();

    if (customDetails !== "") {
      Session.shared().setGroupSessionDetails(customDetails);
      console.log("Group session details set to: " + Session.shared().groupSessionDetails());

    } else {
      const sessionTypeDetailsSelect = document.getElementById(
        "sessionTypeDetailsSelect"
      );
      console.log("Session type details select value: " + sessionTypeDetailsSelect.value);
      Session.shared().setGroupSessionDetails(sessionTypeDetailsSelect.value);
      console.log("Group session details set to: " + Session.shared().groupSessionDetails());

    }
    console.log("Group session world: " + Session.shared().groupSessionDetails());
    onVisitHashModal.style.display = "none";
    // Start the session with the selected session type
    if (sessionType === "fantasyRoleplay") {
      startRoleplaySession();
    } else if (sessionType === "trivia") {
      startTriviaSession();
    } else if (sessionType === "explore") {
      startExploreSession();
    } else {
      // Add other session types here
      console.log("No session type selected");
    }
  });
}

function endAdventure() {
  Session.shared().setGameMode(false)
  // Trigger the visual indicator (e.g., change the background color)
  document.body.style.backgroundColor = "#333";
}

function getCurrentUsernames() {
  // Add all nicknames of connected guests to the guestNicknames array
  const guestNicknames = [];
  guestNicknames.push(Session.shared().hostNickname());

  Peers.shared().dataChannels().forEachKV((guestId, channel) => {
    guestNicknames.push(channel.nickname);
  });
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

  if (Peers.shared().isHost()) {
    const inviteLink = Session.shared().inviteLink();
    addMessage(
      "welcome-message",
      `<p>Welcome to your roleplaying session, set in the <b>${Session.shared().groupSessionDetails()}</b> world!</p></p>Send your friends this invite link to join your session: <a href="${inviteLink}">${inviteLink}</a></p><p>When you're ready, the AI Game Master will begin the session when you click <b>Begin Session</b> below.</p>`,
      "HaveWords.ai"
    );
  }
  Sounds.shared().playOminousSound();
}

async function startTriviaSession() {
  // Trigger the visual indicator
  const userPanelh2Element = document.querySelector(".userPanel .header h2");
  const guestChatH2 = document.querySelector(".chatPanel .header h2");
  const peersH2 = document.querySelector(".connectedUsers .header h2");

  // Change the content of the h2 element
  userPanelh2Element.innerHTML = "AI TRIVIA MASTER";
  guestChatH2.innerHTML = "Players' Chat";
  peersH2.innerHTML = "Players";

  document.getElementById("aiSelectionBlock").style.display = "none";

  if (Peers.shared().isHost()) {
    const inviteLink = Session.shared().inviteLink();
    const selectedCategory = Session.shared().groupSessionDetails();
    addMessage(
      "welcome-message",
      `<p>Welcome to your trivia session in the <b>${selectedCategory}</b> category!</p><p>Send your friends this invite link to join your session: <a href="${inviteLink}">${inviteLink}</a></p><p>When you're ready, the AI Trivia Master will begin the session when you click <b>Begin Session</b> below.</p>`,
      "HaveWords.ai"
    );
  }
  Sounds.shared().playOminousSound();
}

async function startExploreSession() {
  // Trigger the visual indicator
  const userPanelh2Element = document.querySelector(".userPanel .header h2");
  const guestChatH2 = document.querySelector(".chatPanel .header h2");
  const peersH2 = document.querySelector(".connectedUsers .header h2");

  // Change the content of the h2 element
  userPanelh2Element.innerHTML = "AI EXPLORER";
  guestChatH2.innerHTML = "Explorers' Chat";
  peersH2.innerHTML = "Explorers";

  document.getElementById("aiSelectionBlock").style.display = "none";

  if (Peers.shared().isHost()) {
    const inviteLink = Session.shared().inviteLink();
    const selectedCategory = Session.shared().groupSessionDetails();
    addMessage(
      "welcome-message",
      `<p>Welcome to your exploration session, where you will <b>${selectedCategory}</b>!</p><p>Send your friends this invite link to join your session: <a href="${inviteLink}">${inviteLink}</a></p><p>When you're ready, the AI Explorer will be available to guide you through your journey when you click <b>Begin Session</b> below.</p>`,
      "HaveWords.ai"
    );
  }
  Sounds.shared().playOminousSound();
}