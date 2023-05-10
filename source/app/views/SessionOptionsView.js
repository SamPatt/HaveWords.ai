"use strict";

/* 
    SessionOptionsView

*/

(class SessionOptionsView extends View {
  initPrototypeSlots() {
    this.newSlot("aiModelOptions", null);
    this.newSlot("apiKeyText", null);
    this.newSlot("azureApiKeyText", null);
    this.newSlot("azureApiRegionText", null);

    this.newSlot("sessionTypeOptions", null);
    this.newSlot("sessionSubtypeOptions", null);
    this.newSlot("sessionCustomizationText", null);

    this.newSlot("sessionStartButton", null);
    this.newSlot("sessionResetButton", null);
  }

  init() {
    super.init();
    this.setId("aiSelectionBlock");

    const modelOptions = OpenAiChat.shared().modelOptions().map(name => { return { label: name, value:name }; });
    this.setAiModelOptions(
      OptionsView.clone().setId("aiModelOptions").setTarget(this).setOptions(modelOptions).setShouldStore(true).load()
    )

    this.setupApiKeyText();
    this.setupAzureApiKeyText();
    this.setupAzureApiRegionText();

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
      const isValid = OpenAiService.shared().validateKey(s);
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

  setupAzureApiKeyText() {
    //debugger;
    const field = TextFieldView.clone().setId("azureApiKeyText");
    this.setAzureApiKeyText(field);

    field.setValidationFunc((s) => {
    //  debugger;
      const isValid = AzureService.shared().validateKey(s);
      if (isValid) {
        AzureService.shared().setApiKey(s);
        this.showAzureRegionIfNeeded();
      }
      return isValid;
    });

    // Load the stored API key
    const k = AzureService.shared().apiKey();
    if (k) {
      field.setString(k);
    }
  }

  showAzureRegionIfNeeded () {
    const isNeeded = AzureService.shared().apiKey();
    this.azureApiRegionText().element().parentNode.style.display = isNeeded ? "block" : "none";
    return this;
  }

  setupAzureApiRegionText() {
    const field = TextFieldView.clone().setId("azureApiRegionText");
    this.setAzureApiRegionText(field);

    field.setValidationFunc((s) => {
      const isValid = AzureService.shared().validateRegion(s);
      if (isValid) {
        AzureService.shared().setRegion(s);
      }
      return isValid;
    });

    // Load the stored API key
    const s = AzureService.shared().region();
    if (s) {
      field.setString(s);
    }

    this.showAzureRegionIfNeeded();
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

  // --- config lookups ---

  configLookup (key) {
    const a = this.sessionTypeOptions().selectedElement()._item[key];
    const b = this.sessionSubtypeOptions().selectedElement()._item[key];
    const v = b ? b : a;
    return v ? v : "";
  }

  promptSuffix () {
    return this.configLookup("promptSuffix");
  }

  prompt() {
    let prompt = this.configLookup("prompt");

    const promptSuffix = this.promptSuffix();
    if (promptSuffix) {
      prompt += promptSuffix;
    }
    return this.replacedConfigString(prompt);
  }

  message() {
    const v = this.configLookup("message");
    return this.replacedConfigString(v);
  }

  artPromptSuffix () {
    const v = this.configLookup("artPromptSuffix");
    return this.replacedConfigString(v);
  }

  artPromptPrefix () {
    const v = this.configLookup("artPromptPrefix");
    return this.replacedConfigString(v);
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

    //this.debugLog("using prompt [[" + this.prompt() + "]]")
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
    //YouTubeAudioPlayer.shared().setVideoId("fViUt4xeclo").play()
  }

}).initThisClass();
