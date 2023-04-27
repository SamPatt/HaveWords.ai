"use strict";

/* 
    Session

*/

(class Session extends Base {
    initPrototypeSlots () {
        this.newSlot("data", null)
    }

    init () {
        super.init()
        this.load()
        this.setIsDebugging(true)
    }

    save () {
      const json = JSON.stringify(this.data());
      localStorage.setItem("sessionData", json);
    }

    load () {
      let json = JSON.parse(localStorage.getItem("sessionData"));

      if (!json) {
        json = {
          history: [],
        };
      }

      if (!json.history) {
        json.history = [];
      }

      this.setData(json);
    
      return this;
    }
    
    clear () {
      localStorage.removeItem("sessionData");
      localStorage.removeItem("hostId");
      localStorage.removeItem("hostNickname");
      this.load()
    }

    history () {
      return this.data().history
    }

    addToHistory (json) {
      this.history().push(json)
      this.save()
      return this
    }

}.initThisClass());
  
// Add event listener to trigger the resetSession function when the resetSessionButton is clicked
resetSessionButton.addEventListener("click", resetSession);

function resetSession() {
  const userChoice = confirm(
    "Do you want to start a new session? This will delete the previous session data and create a new invite link."
  );
  // Clear the session data
  Session.shared().clear();
  // Reload the page
  window.location.reload();
}

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
  Session.shared().history().forEach((item) => {
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
  Session.shared().history().forEach((item) => {
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
  const sessionTypeDetailsSelect = document.getElementById("sessionTypeDetailsSelect");

  const customInput = document.createElement("input");
  customInput.type = "text";
  customInput.id = "customSessionDetailsInput";
  customInput.placeholder = "Enter custom details...";
  const customInputLabel = document.createElement("p");
  customInputLabel.innerHTML = "Or create your own session:";

  // Clear existing options and description
  //dropdownContainer.innerHTML = "";
  sessionTypeDetailsSelect.innerHTML = "";
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
      //groupSessionDetails = sessionTypeDetails.value;
      const sessionTypeDetailsSelect = document.getElementById("sessionTypeDetailsSelect");
      groupSessionDetails = sessionTypeDetailsSelect.value;
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

