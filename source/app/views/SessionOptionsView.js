"use strict";

/* 
    SessionOptionsView

*/

(class SessionOptionsView extends View {
  initPrototypeSlots() {
    this.newSlot("aiModelOptions", null);
    this.newSlot("apiKeyText", null);
    this.newSlot("azureApiKeyText", null);
    this.newSlot("azureApiRegionOptions", null);

    this.newSlot("imageGenModelOptions", null);
    this.newSlot("midjourneyApiKeyText", null);
    this.newSlot("midjourneyApiBaseUrlText", null);

    this.newSlot("sessionTypeOptions", null);
    this.newSlot("sessionSubtypeOptions", null);
    this.newSlot("sessionCustomizationText", null);
    this.newSlot("sessionLanguageOptions", null);

    this.newSlot("sessionStartButton", null);
    this.newSlot("sessionResetButton", null);
  }

  init() {
    super.init();
    this.setId("aiSelectionBlock");

    this.setAiModelOptions(
      OptionsView.clone()
        .setId("aiModelOptions")
        .setTarget(this)
    );
    this.asyncSetupAiModelOptions();


    this.setupApiKeyText();
    this.setupAzureApiKeyText();
    this.setupAzureApiRegionOptions();

    this.setImageGenModelOptions(
      OptionsView.clone()
        .setId("imageGenModelOptions")
        .setTarget(this)
        .setOptions(ImageGen.shared()
          .modelOptions()
          .map((name) => {
            return { label: name, value: name };
          })
        )
    );

    this.setupImageGenModelOptions();
    this.setupMidjourneyApiKeyText();
    this.setupMidjourneyApiBaseUrlText();

    this.setSessionTypeOptions(
      OptionsView.clone()
        .setId("sessionTypeOptions")
        .setTarget(this)
        .setOptions(sessionOptionsArray)
        .setShouldStore(true)
        .load()
    );

    this.setSessionSubtypeOptions(
      OptionsView.clone().setId("sessionSubtypeOptions").setTarget(this)
    );

    this.sessionTypeOptions().submit(); // to setup subtypes

    this.sessionSubtypeOptions().setShouldStore(true).load()

    this.setSessionLanguageOptions(
      OptionsView.clone()
        .setId("sessionLanguageOptions")
        .setTarget(this)
        .setOptions(AzureTextToSpeech.shared().languageOptions())
        .setShouldStore(true)
        .load()
    );

    if (!this.sessionLanguageOptions().hasSelection()) {
      // make US English the default
      this.sessionLanguageOptions().setSelectedLabel("English (United States)");
    }

    this.setSessionCustomizationText(
      TextAreaInputView.clone()
        .setId("sessionCustomizationText")
        .setTarget(this)
    );

    this.setSessionStartButton(
      Button.clone()
        .setId("sessionStartButton")
        .setTarget(this)
        .setIsDisabled(true)
    );

    this.setSessionResetButton(
      Button.clone().setId("sessionResetButton").setTarget(this)
    );

    this.setupApiKeyText();
    this.onUpdateInputs(); // to enable start button if ready
  }

  async asyncSetupAiModelOptions () {
    const note = document.getElementById("AiModelOptionsNote");
    let names = OpenAiChat.shared().availableModelNames();
    
    // Get the API key
    let apiKey = OpenAiChat.shared().apiKey();
    
    // Change the note's display, opacity and color only if there's an API key
    if (apiKey && (!names || names.length === 0)) {
      note.style.display = "inline";
      note.style.opacity = 1;
      note.style.color = "yellow";
    }
  
    await OpenAiChat.shared().asyncCheckModelsAvailability();
    names = OpenAiChat.shared().availableModelNames();
    console.log("available model names:", names);
    this.aiModelOptions().setOptions(names)
    .setShouldStore(true)
    .load();
    this.onUpdateInputs();
    
    // If there is an API key, hide the note again
    if (apiKey) {
      note.style.opacity = 0;
    }
  }  

  languagePrompt () {
    const label = this.sessionLanguageOptions().selectedLabel();
    const value = this.sessionLanguageOptions().selectedValue();
    AzureTextToSpeech.shared().setVoiceName(value);
    
    const parts = label.split("(");
    const locale = parts[0];
    let prompt = `Please make all your responses in the ${locale} language`;
    if (parts.length > 1) {
      const subLocale = parts[1].split(")")[0];
      prompt += `, as spoken in ${subLocale}.`;
    }
    //console.log("============== language prompt:", prompt);
    return prompt;
  }

  setupApiKeyText() {
    const field = TextFieldView.clone().setId("apiKeyText").setTarget(this);
    this.setApiKeyText(field);

    field.setValidationFunc((s) => {
      const isValid = OpenAiService.shared().validateKey(s);
      if (isValid) {
        if (s !== OpenAiService.shared().apiKey()) {
          OpenAiService.shared().setApiKey(s);
          this.asyncSetupAiModelOptions();
        }
      } else {
        OpenAiService.shared().setApiKey(null);
        this.aiModelOptions().setOptions([])
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
      } else {
        AzureService.shared().setApiKey(null);
      }
      return isValid;
    });

    // Load the stored API key
    const k = AzureService.shared().apiKey();
    if (k) {
      field.setString(k);
    }
  }

  onKeyUp_apiKeyText() {
    this.onUpdateInputs();
  }

  canStart() {
    if (ImageGen.shared().isMidjourneyOption() && (!this.midjourneyApiKeyText().isValid() || !this.midjourneyApiBaseUrlText().isValid())) {
      return false;
    }
    
    return this.apiKeyText().isValid() && this.aiModelOptions().selectedValue();
  }

  onUpdateInputs() {
    this.sessionStartButton().setIsDisabled(!this.canStart());
  }

  setupAzureApiRegionOptions() {
    const options = OptionsView.clone().setId("azureApiRegionOptions").setOptions(AzureService.shared().regionOptions()).setTarget();
    this.setAzureApiRegionOptions(options);

    // Load the stored API key
    const s = AzureService.shared().region();
    if (s) {
      options.setSelectedValue(s);
    }
  }

  onSubmit_azureApiRegionOptions() {
    AzureService.shared().setRegion(this.azureApiRegionOptions().selectedValue());
  }

  setupImageGenModelOptions() {
    this.imageGenModelOptions().setSelectedLabel(ImageGen.shared().option());
  }
  
  setupMidjourneyApiKeyText(){
    const field = TextFieldView.clone().setId("midjourneyApiKeyText").setTarget(this);
    this.setMidjourneyApiKeyText(field);

    const self = this;
    
    field.setValidationFunc((s) => {
      const isValid = MJService.shared().validateKey(s);
      if (isValid) {
        MJService.shared().setApiKey(s);
      }
      return isValid;
    });

    // Load the stored API key
    const s = MJService.shared().apiKey();
    if (s) {
      field.setString(s);
    }

    this.showMidjourneyFieldsIfNeeded();
  }

  onChange_midjourneyApiKeyText() {
    console.log("onChange_midjourneyApiKeyText");
    this.onUpdateInputs();
  }
  
  setupMidjourneyApiBaseUrlText(){
    const field = TextFieldView.clone().setId("midjourneyApiBaseUrlText").setTarget(this);
    this.setMidjourneyApiBaseUrlText(field);

    const self = this;
    field.setValidationFunc((s) => {
      const isValid = MJService.shared().validateBaseUrl(s);
      if (isValid) {
        MJService.shared().setApiBaseUrl(s);
      }
      return isValid;
    });

    // Load the stored API key
    const s = MJService.shared().apiBaseUrl();
    if (s) {
      field.setString(s);
    }

    this.showMidjourneyFieldsIfNeeded();
  }

  onChange_midjourneyApiBaseUrlText() {
    console.log("onChange_midjourneyApiBaseUrlText");
    this.onUpdateInputs();
  }

  showMidjourneyFieldsIfNeeded() {
    if (ImageGen.shared().isMidjourneyOption()) {
      document.getElementById("midjourneyApiKeyContainer").style.display = "block";
      document.getElementById("midjourneyApiBaseUrlContainer").style.display = "block";
      ImageBot.shared().setImageGen(MJImageGen.shared());
    }
    else if (ImageGen.shared().isDalleOption()) {
      document.getElementById("midjourneyApiKeyContainer").style.display = "none";
      document.getElementById("midjourneyApiBaseUrlContainer").style.display = "none";
      ImageBot.shared().setImageGen(OpenAiImageGen.shared());
    }
    else {
      throw "Unknown Image Gen Model Option: " + ImageGen.shared().option();
    }
  }

  // --- setup ---

  appDidInit() {
    this.hidePromptInputs();

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

  onSubmit_imageGenModelOptions() {
    ImageGen.shared().setOption(this.imageGenModelOptions().selectedValue());

    this.showMidjourneyFieldsIfNeeded();

    this.onUpdateInputs();
  }

  // --- sessionSubtypeOptions ---

  onSubmit_sessionSubtypeOptions() {}

  hidePromptInputs() {
    document.getElementById("messageInputSection").style.display = "none"; // host ai chat input
    document.getElementById("messageInputRemoteSection").style.display = "none"; // guest ai chat input
  }

  displayHostHTMLChanges() {
    document.getElementById("appView").style.display = "block";
    this.unhide();
    document.getElementById("messageInputSection").style.display = "block"; // host ai chat input
    document.getElementById("messageInputRemoteSection").style.display = "none"; // guest ai chat input
    /*
    document.getElementById("sessionResetButton").style.display = "block";
    this.sessionStartButton().style.display = "block";
    */
  }

  displayGuestHTMLChanges() {
    document.getElementById("appView").style.display = "block";
    this.hide();
    document.getElementById("messageInputSection").style.display = "none"; // hide host ai chat input
    document.getElementById("messageInputRemoteSection").style.display =
      "block"; // display guest ai chat input
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

  aiModel() {
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

  replacedConfigString(s) {
    s = s.replaceAll("[sessionType]", this.sessionType());
    s = s.replaceAll("[sessionSubtype]", this.sessionSubtype());
    s = s.replaceAll("[playerNames]", this.playerNames());
    s = s.replaceAll(
      "[customization]",
      this.sessionCustomizationText().string()
    );
    return s;
  }

  // --- config lookups ---

  configLookup(key) {
    const a = this.sessionTypeOptions().selectedElement()._item[key];
    const b = this.sessionSubtypeOptions().selectedElement()._item[key];
    const v = b ? b : a;
    return v ? v : "";
  }

  promptSuffix() {
    return this.configLookup("promptSuffix");
  }


  prompt() {
    let prompt = this.configLookup("prompt");

    const promptSuffix = this.promptSuffix();
    if (promptSuffix) {
      prompt += promptSuffix; // for the prompts, we add them together, for others we typically override
    }
    prompt += this.languagePrompt();
    
    return this.replacedConfigString(prompt);
  }

  message() {
    const v = this.configLookup("message");
    return this.replacedConfigString(v);
  }

  // --- art prompt ---

  artPromptSuffix() {
    const v = this.configLookup("artPromptSuffix");
    return this.replacedConfigString(v);
  }

  artPromptPrefix() {
    const v = this.configLookup("artPromptPrefix");
    return this.replacedConfigString(v);
  }

  // -- music playlist ---

  musicPlaylists() {
    return this.configLookup("musicPlaylists");
  }

  sessionFontFamily() {
    return this.configLookup("fontFamily");
  }

  sessionFontWeight() {
    const v = this.configLookup("fontWeight");
    return v ? v : "300";
  }

  headerFontFamily() {
    const v = this.configLookup("headerFontFamily");
    return v ? v : "inherit";
  }

  sessionBackgroundColor() {
    const v = this.configLookup("backgroundColor");
    return v ? v : "#222";
  }

  sessionTextColor() {
    const v = this.configLookup("color");
    return v ? v : "rgb(219, 219, 219)";
  }

  allowsImageGen() {
    const v = this.configLookup("allowsImageGen");
    return v ? v : true;
  }

  // --- start session ---

  applySessionUiPrefs() {
    document.body.style.backgroundColor = this.sessionBackgroundColor();
    document.body.style.color = this.sessionTextColor();

    //const section = document.body;
    const section = document.getElementById("AiChatMessages").parentNode;
    section.style.fontFamily = this.sessionFontFamily();
    section.style.fontWeight = this.sessionFontWeight();

    /*
    for (const e of document.getElementsByTagName("h2")) {
      e.style.fontFamily = this.headerFontFamily();
      console.log(
        "setting font family '" +
          this.headerFontFamily() +
          "' on '" +
          e.innerHTML +
          "'"
      );
    }
    */

    for (const e of document.getElementsByClassName("chapterNumber")) {
      e.style.fontFamily = this.headerFontFamily();
      //console.log("setting font family '" + this.headerFontFamily() + "' on '" + e.innerHTML + "'");
    }

    for (const e of document.getElementsByClassName("chapterTitle")) {
      e.style.fontFamily = this.headerFontFamily();
      //console.log("setting font family '" + this.headerFontFamily() + "' on '" + e.innerHTML + "'");
    }

    for (const e of document.getElementsByClassName("drop-cap")) {
      e.style.fontFamily = this.headerFontFamily();
      //console.log("setting font family '" + this.headerFontFamily() + "' on '" + e.innerHTML + "'");
    }
  }

  sessionTitle() {
    return (
      this.sessionTypeOptions().selectedLabel() +
      " / " +
      this.sessionSubtypeOptions().selectedLabel()
    );
  }

  updateSessionTitle() {
    //debugger;
    const e = document.getElementById("SessionTitle");
    e.innerHTML = this.sessionTitle();
  }

  async onSubmit_sessionStartButton() {
    this.hide();

    MusicPlayer.shared().selectPlaylistsWithNames(this.musicPlaylists());
    this.applySessionUiPrefs();
    this.updateSessionTitle();

    Session.shared().setGameMode(
      this.sessionTypeOptions().selectedElement()._item.gameMode
    );

    AiChatView.shared().setShowLoading(true);

    /*
    AiChatView.shared().addMessage(
      "prompt",
      "You've started the session!",
      LocalUser.shared().nickname(),
      LocalUser.shared().id()
    );
    */
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

    const response = await OpenAiChat.shared().asyncFetch(this.prompt());
    // Stores initial AI response, which contains character descriptions, for later use
    Session.shared().setGroupSessionFirstAIResponse(response);
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
