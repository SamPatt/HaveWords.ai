"use strict";

/* 
    SessionOptionsView

*/

(class SessionOptionsView extends View {
  initPrototypeSlots() {
    this.newSlot("aiModelOptions", null);
    this.newSlot("apiKeyText", null);

    this.newSlot("sessionTypeOptions", null);
    this.newSlot("sessionSubtypeOptions", null);
    this.newSlot("sessionCustomizationText", null);

    this.newSlot("sessionStartButton", null);
    this.newSlot("sessionResetButton", null);
  }

  init() {
    super.init();
    this.setId("aiSelectionBlock");

    this.setAiModelOptions(
      OptionsView.clone().setId("aiModelOptions").setTarget(this)
    );

    this.setupApiKeyText();

    this.setSessionTypeOptions(
      OptionsView.clone()
      .setId("sessionTypeOptions")
      .setTarget(this)
      .setOptions(sessionOptionsArray)
      .setShouldStore(true).load()
    );

    this.setSessionSubtypeOptions(
      OptionsView.clone().setId("sessionSubtypeOptions").setTarget(this)
    );

    this.setSessionCustomizationText(
      TextAreaInputView.clone()
        .setId("sessionCustomizationText")
        .setTarget(this)
    );

    this.setSessionStartButton(
      Button.clone().setId("sessionStartButton").setTarget(this)
    );

    this.setSessionResetButton(
      Button.clone().setId("sessionResetButton").setTarget(this)
    );

    this.setupApiKeyText();
    this.sessionTypeOptions().submit(); // to setup subtypes
  }

  setupApiKeyText() {
    const field = TextFieldView.clone().setId("apiKeyText");
    this.setApiKeyText(field);

    field.setValidationFunc((s) => {
      const isValid = s.length === 51 && s.startsWith("sk-");
      if (isValid) {
        OpenAiService.shared().setApiKey(s);
      }
      return isValid;
    });

    // Load the stored API key
    const k = OpenAiChat.shared().apiKey();
    if (k) {
      field.setString(k);
    }
  }

  // --- setup ---

  appDidInit() {
    if (App.shared().isHost()) {
      this.unhide();
    } else {
      this.hide();
    }
  }

  // --- aiModelOptions ---

  onSubmit_aiModelOptions() {}

  selectedModelNickname() {
    return this.aiModelOptions().selectedValue();
  }

  // --- sessionTypeOptions ---

  onSubmit_sessionTypeOptions() {
    const subOptionsArray =
      this.sessionTypeOptions().selectedElement()._item.options;
    this.sessionSubtypeOptions().setOptions(subOptionsArray);
  }

  // --- sessionSubtypeOptions ---

  onSubmit_onSubmit_sessionSubtypeOptions() {}


  displayHostHTMLChanges() {
    document.getElementById("appView").style.display = "block";
    this.unhide()
    document.getElementById("inputSection").style.display = "block"; // host ai chat input
    document.getElementById("inputSectionRemote").style.display = "none"; // guest ai chat input

    /*
    document.getElementById("sessionResetButton").style.display = "block";
    this.sessionStartButton().style.display = "block";
    */
  }

  displayGuestHTMLChanges() {
    document.getElementById("appView").style.display = "block"; 
    this.hide()
    document.getElementById("inputSection").style.display = "none"; // guest ai chat input
    document.getElementById("inputSectionRemote").style.display = "block"; // guest ai chat input
    messageInputRemote.disabled = true;
  }

  /*
  // You can call this function when the host starts a new session
  checkForExistingSession() {
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
  */

  displayHistory(history) {
    history.forEach((item) => {
      if (item.type === "prompt") {
        AiChatView.shared().addMessage(
          item.type,
          item.data,
          item.nickname,
          item.id
        );
      } else if (item.type === "aiResponse") {
        AiChatView.shared().addMessage(
          item.type,
          item.data,
          item.nickname,
          item.id
        );
      } else if (item.type === "systemMessage") {
        AiChatView.shared().addMessage(
          item.type,
          item.data,
          item.nickname,
          item.id
        );
      } else if (item.type === "chat") {
        GroupChatView.shared().addChatMessage(
          item.type,
          item.data,
          item.nickname,
          item.id
        );
      } else if (item.type === "imageLink") {
        AiChatView.shared().addImage(item.data);
      }
    });
  }

  guestDisplayHostSessionHistory(sessionData) {
    this.displayHistory(sessionData);
  }

  displaySessionHistory() {
    this.displayHistory(Session.shared().history());
  }

  // --- helpers ---

  aiModel () {
    return this.aiModelOptions().selectedValue();
  }

  sessionType() {
    return this.sessionTypeOptions().selectedValue();
  }

  sessionSubtype() {
    return this.sessionSubtypeOptions().selectedValue();
  }

  getCurrentUsernames() {
    // Add all nicknames of connected guests to the guestNicknames array
    const guestNicknames = PeerServer.shared()
      .peerConnections()
      .valuesArray()
      .map((pc) => pc.nickname());
    guestNicknames.push(LocalUser.shared().nickname());
    return guestNicknames;
  }

  playerNames() {
    return this.getCurrentUsernames().join(",");
  }

  replacedConfigString (s) {
    s = s.replaceAll("[sessionType]", this.sessionType());
    s = s.replaceAll("[sessionSubtype]", this.sessionSubtype());
    s = s.replaceAll("[playerNames]", this.playerNames());
    s = s.replaceAll(
      "[customization]",
      this.sessionCustomizationText().string()
    );
    return s
  }

  promptSuffix () {
    const ps1 = this.sessionTypeOptions().selectedElement()._item.promptSuffix;
    const ps2 = this.sessionSubtypeOptions().selectedElement()._item.promptSuffix;
    return ps2 ? ps2 : ps1;
  }

  prompt() {
    const typePrompt = this.sessionTypeOptions().selectedElement()._item.prompt;
    const subtypePrompt =
      this.sessionSubtypeOptions().selectedElement()._item.prompt;
    let prompt = subtypePrompt ? subtypePrompt : typePrompt;

    const promptSuffix = this.promptSuffix();
    if (promptSuffix) {
      prompt += promptSuffix;
    }
    return this.replacedConfigString(prompt);
  }

  message() {
    const typeMessage =
      this.sessionTypeOptions().selectedElement()._item.message;
    const subtypeMessage =
      this.sessionSubtypeOptions().selectedElement()._item.message;
    const message = subtypeMessage ? subtypeMessage : typeMessage;
    return this.replacedConfigString(message);
  }

  // --- start session ---

  async onSubmit_sessionStartButton() {
    Session.shared().setGameMode(
      this.sessionTypeOptions().selectedElement()._item.gameMode
    );

    AiChatView.shared().addMessage(
      "prompt",
      "You've started the session!",
      LocalUser.shared().nickname(),
      LocalUser.shared().id()
    );
    Session.shared().setInSession(true);

    HostSession.shared().showHostIntroMessage();


    // Send the system message and the prompt to the AI
    // Send a message to all connected guests
    HostSession.shared().broadcast({
      type: "gameLaunch",
      id: LocalUser.shared().id(),
      message: this.message(),
      nickname: LocalUser.shared().nickname(),
      sessionType: this.sessionType(),
    });

    this.hide()

    console.log("using prompt [[" + this.prompt() + "]]")
    const response = await OpenAiChat.shared().asyncFetch(this.prompt());
    // Stores initial AI response, which contains character descriptions, for later use
    Session.shared().setGroupSessionFirstAIResponse(response);
    //triggerBot(response, "fantasyRoleplay", this.sessionSubtype());
    AiChatView.shared().addAIReponse(response);

    // Send the response to all connected guests
    HostSession.shared().broadcast({
      type: "aiResponse",
      id: LocalUser.shared().id(),
      message: response,
      nickname: this.selectedModelNickname(),
    });

    Sounds.shared().playOminousSound();
  }

}).initThisClass();

// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------

/*
<option value="DnD">Traditional D&D</option>
<option value="Conan">Conan (Robert E. Howard)</option>
<option value="HarryPotter">Harry Potter (J.K. Rowling)</option>
<option value="StudioGhibli">Studio Ghibli</option>
<option value="Naruto">Naruto</option>
<option value="NorseMythology">Norse Mythology</option>
<option value="Greek Mythology">Greek Mythology</option>
<option value="Dune">Dune (Frank Herbert)</option>
<option value="Star Wars">Star Wars (George Lucas)</option>
<option value="Cyberpunk">Cyberpunk (William Gibson)</option>
<option value="Discworld">Discworld (Terry Pratchett)</option>
<option value="HitchhikersGuide">Hitchhikers Guide to the Galaxy (Scott Adams)</option>
*/

const sessionOptionsArray = [
  {
    value: "fantasyRoleplay",
    label: "Fantasy Roleplaying",
    description: `Choose from various fantasy worlds to embark on an exciting roleplaying adventure with your friends. The AI Dungeon Master will guide you through the story and help you create memorable moments.`,
    aiName: "AI Game Master",
    gameMode: true,
    chatName: "Player's Chat",
    usersName: "Players",
    message: "The host has started a [sessionType] in the [sessionSubtype] universe.",
    promptSuffix: `You are our guide, describing the settings and the characters, and making the fictional world come alive for our group.\n
    Formatting: Don't use Markdown, only use HTML. Respond with HTML formatting to use bold, italics, and use <br> for new paragraphs.\n
    Messages: Each player will respond with their own name at the beginning of the message for you to identify them. 
    You can ask players what actions they will take. Keep track of them individually but try not to split the party.\n
    Dialogue: Never speak for the players. Use dialogue for the characters you are describing frequently, always in quotation marks. 
    Make the dialogue realistic based on what you know of the character. Give the characters emotions fitting to the situation. 
    Remember there are multiple players, and dialogue is usually happening within a group.\n
    Plot: Describe only the next step of the adventure based on the player input. 
    Don't take any actions on the player's behalf, always let the player make the decisions. 
    Remember there are multiple players, and descriptions of scenes should include more than just one player. 
    The story should only progress when the player has made a decision about how to move forward. Do not progress the story if the player is still engaged in dialogue (unless the dialogue is describing them taking a specific action). 
    Players should sometimes fail, especially if their request is unrealistic given the setting and world. The plot should be challenging but fun, including puzzles, riddles, or combat. Combat should not be life-threatening.\n
    Beginning the session: Welcome the players, give us brief character descriptions fitting the world theme (with our names in bold), briefly describe the setting, describe a simple, cute story hook, then start the session.\n
    The player names are: [playerNames].`,
    options: [
      {
        label: "Traditional roleplaying",
        value: "traditional fantasy",
        prompt: `Please play the roll of an dungeon master and lead us on a traditional campaign of Dungeons and Dragons. 
        The campaign should be epic and full of serious challenges. 
        This is a game played by adults and should not be a children's story or involve children as characters.`,
      },
      {
        label: "Harry Potter",
        value: "Harry Potter",
        prompt: `Overview: We are a group of players, exploring the fictional worlds and characters from the Harry Potter books and films.`,
      },
      {
        label: "Studio Ghibli",
        value: "Studio Ghibli",
        prompt: `Overview: We are a group of players, exploring the fictional worlds and characters from Studio Ghibli films, including 
        Spirited Away, My Neighbor Totoro, Howl's Moving Castle, Castle in the Sky, Kiki's Delivery Service, Porco Rosso, and others.`
      },
      {
        value: "Conan",
        label: "Conan the Barbarian",
        prompt: `Please play the roll of an expert, witty and fun loving dungeon master and lead us on a campaign of your own creation in Robert E. Howard's Conan the Barbarian universe.
        As in the books, the adventures should be of epic and deal with great challenges and mysteries - nothing mundane.`
      },
      {
        label: "Norse Mythology",
        value: "Norse",
        prompt: `Please play the roll of an expert, witty and fun loving dungeon master and lead us on a campaign of your own creation in the [sessionSubtype] universe.`
      },
    ],
  },
  {
    value: "trivia",
    label: "Trivia Session",
    description: `<p>Test your knowledge in a group trivia game. The AI will generate trivia questions for you and your friends to answer, keeping score and providing a fun and engaging experience.</p>`,
    aiName: "AI Trivia Master",
    gameMode: true,
    chatName: "Player's Chat",
    usersName: "Players",
    message: "The host has started a [sessionSubtype] trivia game.",
    options: [
      {
        label: "Variety",
        value: "Variety",
        prompt: `Please play the roll of an expert, witty and fun loving trivia master and lead us on a trivia game of your own creation, which questions from the [sessionSubtype] category. The players are: [playerNames].`,
      },
      {
        label: "Sports",
        value: "Sports",
        prompt: `Please play the roll of an expert, witty and fun loving trivia master and lead us on a trivia game of your own creation, which questions from the [sessionSubtype] category. The players are: [playerNames].`,
      },
      {
        label: "Pop Culture",
        value: "Pop Culture",
        prompt: `Please play the roll of an expert, witty and fun loving trivia master and lead us on a trivia game of your own creation, which questions from the [sessionSubtype] category. The players are: [playerNames].`,
      },
      {
        label: "History",
        value: "History",
        prompt: `Please play the roll of an expert, witty and fun loving trivia master and lead us on a trivia game of your own creation, which questions from the [sessionSubtype] category. The players are: [playerNames].`,
      },
      {
        label: "Science",
        value: "Science",
        prompt: `Please play the roll of an expert, witty and fun loving trivia master and lead us on a trivia game of your own creation, which questions from the [sessionSubtype] category. The players are: [playerNames].`,
      },
      {
        label: "1970s",
        value: "1970s",
        prompt: `Please play the roll of an expert, witty and fun loving trivia master and lead us on a trivia game of your own creation, which questions from the [sessionSubtype] category. The players are: [playerNames].`,
      },
      {
        label: "1980s",
        value: "1980s",
        prompt: `Please play the roll of an expert, witty and fun loving trivia master and lead us on a trivia game of your own creation, which questions from the [sessionSubtype] category. The players are: [playerNames].`,
      },
      {
        label: "1990s",
        value: "1990s",
        prompt: `Please play the roll of an expert, witty and fun loving trivia master and lead us on a trivia game of your own creation, which questions from the [sessionSubtype] category. The players are: [playerNames].`,
      },
    ],
  },
  {
    value: "explore",
    label: "Exploration Session",
    description: `Investigate historical events. Interview celebrities. Jump into your favorite sitcom. Travel to fictional universes. Explore the limits of your imagination by telling the AI whatever you want to do.</p>`,
    aiName: "Exploration Narrator",
    chatName: "Player's Chat",
    usersName: "Players",
    gameMode: false,
    message:
      "The host started a new exploration session! Please wait while the AI Guide prepares to start the session...",
    options: [
      {
        label: "Write your own",
        value: "Write your own",
        prompt: `You are now the AI Guide for an exploration session where players can investigate historical events, interview celebrities, explore fictional worlds, and more. 
        The players will start their messages with their names.
        Start the session by welcoming the players and create a short description where the players can start an adventure based on the following prompt: [customization]. 
        Use HTML formatting in your responses to add bold, italics, headings, line breaks, or other methods to improve the look and clarity of your responses, when necessary. 
        Be creative and informative in your responses, and make the exploration engaging and enjoyable for the players. 
        Do not write dialogue for the users, only for the characters in the scene. 
        Let the users speak for themselves. 
        Emphasize aspects of the settings and characters that are relevant to the exploration. 
        Respond to the players' actions and questions, and guide them through the exploration.`,
      },
    ],
  },
];
