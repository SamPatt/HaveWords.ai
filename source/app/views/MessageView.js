"use strict";

/* 

    MessageView

*/

(class MessageView extends View {
  initPrototypeSlots() {
    this.newSlot("avatarElement", null);
    this.newSlot("nicknameElement", null);
    this.newSlot("textElement", null);
    this.newSlot("messageContentElement", null);

    this.newSlot("requestId", null);

    // image related
    this.newSlot("imageJob", null);
    this.newSlot("imageGenButton", null);
    this.newSlot("loadingContainer", null);
    this.newSlot("imageContainer", null);
    this.newSlot("imageUrl", null);

    //Dice Rolls
    this.newSlot("rollRequestViews");
  }

  init() {
    super.init();
    this.setRollRequestViews([]);
    this.create();
  }

  initElement () {
    this.style().display = "block";

    // element
    const messageWrapper = document.createElement("div");
    messageWrapper.className = "message-wrapper";
    this.setElement(messageWrapper);

    // content
    const messageContent = document.createElement("div");
    messageContent.className = "message-content";
    this.setMessageContentElement(messageContent);

    // nickname
    const nicknameElement = document.createElement("div");
    this.setNicknameElement(nicknameElement);
    nicknameElement.className = "message-nickname";

    // avatar
    const img = document.createElement("img");
    img.className = "message-avatar";
    img.width = 50;
    img.height = 50;
    img.src = "resources/icons/default-avatar.png"; // Use a default avatar image if the user doesn't have one
    this.setAvatarElement(img);

    // avatar name and wrapper
    const avatarAndNameWrapper = document.createElement("div");
    avatarAndNameWrapper.className = "avatar-and-name-wrapper";
    avatarAndNameWrapper.appendChild(img);
    avatarAndNameWrapper.appendChild(nicknameElement);

    messageContent.appendChild(avatarAndNameWrapper);

    // text content
    const messageText = document.createElement("div");
    messageText.className = "message-text";
    messageContent.appendChild(messageText);
    this.setTextElement(messageText);

    messageWrapper.appendChild(messageContent);

    
    // loading animation
    const loadingContainer = document.createElement("div");
    loadingContainer.className = "messageImageContainer"
    loadingContainer.innerHTML = this.centerDotsHtml();
    loadingContainer.style.display = "none";
    loadingContainer.style.opacity = 0.5;
    this.setLoadingContainer(loadingContainer);
    messageWrapper.appendChild(loadingContainer)

    // attached image
    const imageContainer = document.createElement("div");
    imageContainer.className = "messageImageContainer"
    this.setImageContainer(imageContainer);
    messageWrapper.appendChild(imageContainer);
    return this;
  }

  setIsStreaming (aBool) {
    if (aBool) {
      this.showIsLoading();
    } else {
      this.hideIsLoading();
    }
    return this;
  }

  showIsLoading () {
    //debugger;
    this.loadingContainer().style.display = "flex";
  }

  hideIsLoading () {
    this.loadingContainer().style.display = "none";
  }

  dotsHtml () {
    return `<span class="dots"><span class="dot dot1">.</span><span class="dot dot2">.</span><span class="dot dot3">.</span>`;
  }

  centerDotsHtml () {
    return `<span class="dots"><span class="dot dot3">.</span><span class="dot dot2">.</span><span class="dot dot1">.</span><span class="dot dot2">.</span><span class="dot dot3">.</span>`;
  }

  setImageUrl (imageUrl) {
    if (!imageUrl) {
      this.setImageContainerText("Generating image" + this.dotsHtml());
    } else {
      this._imageUrl = imageUrl;

      const iv = ImageMessageView.clone().setImageUrl(imageUrl).setIsUser(false);
      this.imageContainer().innerHTML = "";
      this.imageContainer().appendChild(iv.element());
      /*
      this.imageContainer().setAttribute(
        "data-tooltip",
        this.imageBotJob().imagePrompt()
      );
      */
      this.hideIsLoading();
    }
  }

  // after creating the instance, these methods can be used to set bits of it's content

  setAvatar (imgSrc) {
    if (imgSrc) {
      this.avatarElement().src = imgSrc;
    }
    return this;
  }

  setNickname (aString) {
    this.nicknameElement().textContent = aString;
    return this;
  }

  setText (aString) {
    const formatted = aString.convertToParagraphs();
    const sanitizedHtml = DOMPurify.sanitize(formatted);
    this.textElement().innerHTML = sanitizedHtml;
    return this;
  }

  imageContainer () {
    /*
    const e = this.textElement().querySelector(".chapterImage");
    if (e) {
      e.style.display = "flex";
      e.style.borderRadius = "50%";
      this._imageContainer.style.display = "none";
      return e;
    }
    */

    return this._imageContainer;
  }

  text () {
    return this.textElement().innerHTML;
  }

  contentOfFirstElementOfClass(className) {
    const matches = this.element().querySelectorAll('.' + className); 
    if (matches.length) {
      return matches[0].innerHTML;
    }
    return undefined;
  }

  contentOfElementsOfClass(className) {
    const matches = this.element().querySelectorAll('.' + className); 
    const results = [];
    matches.forEach(e => results.push(e.innerHTML));
    return results;
  }

  // --- helpers to get bits of tagged content ---

  chapterNumber () {
    return this.contentOfFirstElementOfClass('chapterNumber'); 
  }

  chapterTitle () {
    return this.contentOfFirstElementOfClass('chapterTitle'); 
  }

  sceneSummary () {
    return this.contentOfFirstElementOfClass('sceneSummary'); 
  }

  bookTitle () {
    return this.contentOfFirstElementOfClass('bookTitle'); 
  }

  playerInfos () {
    return this.contentOfElementsOfClass('playerInfo'); 
  }

  rollWasMentioned() {
    return this.text().match(/[^a-zA-Z]*roll[^a-zA-Z]*/i);
  }


  // isUser - this is duplicated in ImageMessageView

  setIsUser (aBool) {
    if (!aBool) {
      this.element().className += " aiMessage";
    } else {
      this.element().className += " nonAiMessage";
    }
    return this;
  }

  // --------------------------------

  hasRequestedImage () {
    return this.imageJob() !== null;
  }

  addImageGenButton () {
    const button = this.newImageGenImageButton();
    this.setImageGenButton(button);
    this.element().appendChild(button);
    return this;
  }

  newImageGenImageButton () {
    const button = document.createElement("button");
    button.className = "generate-image-prompt-button";
    button.setAttribute(
      "data-tooltip",
      "Generate image for this scene."
    );

    const buttonView = Button.clone().setElement(button);
    buttonView.setIconPath("resources/icons/image.svg");
    buttonView.iconElement().style.opacity = 0.5;

    button.style.width = "1.5em";
    button.style.height = "1.5em";
    button.style.position = "absolute";
    button.style.top = "1em";

    button.addEventListener("click", () => {
      this.onRequestImage();
    });

    return button
  }

  requestImageIfSummaryAvailable () {
    if (!this.hasRequestedImage()) {
      if (this.sceneSummary()) {
        console.log("MessageView.onRequestImage")
        this.onRequestImage();
      }
    }
  }

  async onRequestImage () {
    if (this.hasRequestedImage()) {
      console.warn("attempt to request image twice");
      return;
    }
    this.hideImageGenButton();
    this.setImageUrl(null); // to add loading animation

    const job = ImageBotJobs.shared().newJob();

    if (this.sceneSummary()) {
      // if the content of the page contains a summary tag, 
      // we use that so we can skip generating a summary from the full text
      const summary = this.sceneSummary();
      App.shared().session().players().processSceneSummary(summary);
      job.setSceneSummary(summary);
    } else {
      job.setSceneDescription(this.text());
    }

    job.setRequestId(this.requestId());
    this.setImageJob(job);

    try {
      await job.start();
    } catch (error) {
      this.setErrorMessage(error.message);
    }
  }

  hideImageGenButton () {
    if (this.imageGenButton()) {
      this.imageGenButton().style.display = "none";
    }
  }

  showImageGenButton () {
    if (this.imageGenButton()) {
      this.imageGenButton().style.display = "block";
    }
  }

  updateImageProgressJson(json) {
    if (this.imageUrl()) {
      return 
    }

    if (json.errorMessage) {
      this.setErrorMessage(json.errorMessage);
      return
    }

    if (json.status) {
      this.setImageContainerText("Generating image" + this.dotsHtml() + " " + json.status);
    }
  }

  setImageContainerText (text) {
    this.imageContainer().innerHTML = "<span style=\"opacity:0.5;\">" + text + "</span>";
    return this;
  }

  setErrorMessage (text) {
    //debugger;
    if (text) {
      this.setImageContainerText("Error generating image: \"" + text + "\"");
      this.showImageGenButton();
    }
  }

  /* Function Calls */

  execFunctionCall(responseJson) {
    switch(responseJson.function_call.name) {
      case "rollRequest":
        this.execRollRequest(responseJson);
        break;
      case "dice_rolls":
        this.execRollRequest(responseJson);
        break;
    }
  }

  execRollRequest(responseJson) {
    const rolls = JSON.parse(responseJson.function_call.arguments).rolls;

    if (rolls.length == 0) {
      return;
    }

    let container = document.createElement("div");
    container.className = "rollRequest";
    container.innerHTML = '<h2>Please make the following roll(s)</h2>';

    //group request rolls by character for display
    const groupedRolls = new Map();
    
    rolls.forEach(roll => {
      const rolls = groupedRolls.get(roll.character) || [];
      rolls.push(roll);
      groupedRolls.set(roll.character, rolls);
    });

    const characterList = document.createElement("ul");
    let id = 0;
    for (let [character, rolls] of groupedRolls) {
      const characterItem = document.createElement("li");
      characterItem.innerHTML = `<h3>${ character }:</h3>`

      const characterRollsList = document.createElement("ul");
      characterItem.appendChild(characterRollsList);

      for (let roll of rolls) {
        const rrv = RollRequestView.clone().setMessageView(this).setRollRequest(RollRequest.clone().setId(id).setJson(roll)).create();
        this.rollRequestViews().push(rrv);
        characterRollsList.appendChild(rrv.element());
        id ++;
      }

      characterList.appendChild(characterItem);
    }
    container.appendChild(characterList);

    this.textElement().appendChild(container);

    setTimeout(() => {
      AiChatColumn.shared().scrollView().scrollToBottom();
    }, 10);
  }

  addRollOutcome(rollOutcome) {
    this.rollRequestViews().find(rrv => rrv.rollRequest().id() == rollOutcome.id).addRollOutcome(rollOutcome);
    if (App.shared().isHost() && this.rollRequestViews().every(rrv => rrv.rollOutcome())) {
      this.sendRollOutcomePrompt();
    }
  }

  sendRollOutcomePrompt() {
    const message = this.rollRequestViews().map(rrv => {
      const rr = rrv.rollRequest();
      return `${rr.character()} (${rr.reason()}): ${rrv.textRollOutcomeDescription()}`
    }).join("\n");

    console.log(message);

    Session.shared().addToHistory({
      type: "prompt",
      data: message,
      id: LocalUser.shared().id(),
      nickname: LocalUser.shared().nickname(),
    });
    
    HostSession.shared().sendAIResponse(message);

    Sounds.shared().playSendBeep();
  }
}.initThisClass());

