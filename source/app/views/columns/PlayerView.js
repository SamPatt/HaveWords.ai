"use strict";

/* 

    PlayerView

  controls:

  ai access
  request voice call
  kick
  mute 
  ban

*/

(class PlayerView extends View {
  initPrototypeSlots() {
    this.newSlot("node", null);
    this.newSlot("avatarView", null);
    this.newSlot("nameField", null);
    this.newSlot("buttonsContainer", null);
  }

  init() {
    super.init();
  }

  initElement() {
    super.initElement();
    const e = this.element();
    e.style.display = "flex";
    e.style.justifyContent = "left";
    e.style.flexDirection = "column";

    e.style.borderBottom = "1px solid rgba(255, 255, 255, 0.1)";
    e.style.paddingLeft = "1em";
    e.style.paddingRight = "1em";
    e.style.paddingTop = "0.2em";
    e.style.paddingBottom = "0.2em";

    this.setupSubviews();
    return this;
  }

  setNode

  setPlayer (aPlayer) {
    this._node = aPlayer;
    this.syncFromNode();
    return this;
  }

  player () {
    return this.node()
  }

  // --- helpers ---

  /*
  peerConnection () {
    return PeerServer.shared().peerConnections().get(this.userId());
  }
  */

  userId () {
    return this.player().id();
  }

  // --- button actions ---

  onRadioButton(aButton) {
    console.log("onRadioButton ");
  }

  onButton(aButton) {
    console.log("onButton ");
  }

  onKick () {
    HostSession.shared().kickUser(this.userId());
  }

  onToggleBan () {
    HostSession.shared().banUser(this.userId());
  }

  onToggleMute () {

  }

  onEditName (nameField) {
    this.player().setNickname(nameField.string());

    //if (this.player().isLocal()) {
      LocalUser.shared().setNickname(this.player().nickname())
    //}

    if (App.shared().isHost()) {
      HostSession.shared().sharePlayers();
    } else {
      GuestSession.shared().sharePlayer();
    }
  }

  isSelf () {
    return LocalUser.shared().id() === this.userId();
  }

  // --- setup ---

  syncFromNode() {
    const player = this.player();

    //debugger;
    this.avatarView().setAvatarUrl(player.avatar());
    this.avatarView().setIsEditable(this.isSelf());

    this.nameField().setString(player.nickname());
    this.nameField().setIsEditable(this.isSelf());

    assert(this.avatarView().element().parentNode.parentNode === this.element());
    //this.syncButtons();
    return this;
  }

  setupSubviews() {
    const section = HView.clone();
    this.addSubview(section);

    // avatar view
    const view = AvatarPickerView.clone();
    this.setAvatarView(view);
    section.addSubview(view);

    // Create a container for the user and their actions
    const userContainer = document.createElement("div");
    this.element().appendChild(userContainer);

    // name field
    const nameField = TextFieldView.clone().create();
    this.setNameField(nameField);
    nameField.setShouldFitContent(true);
    section.addSubview(nameField);
    nameField.element().style.marginBottom = "1em";
    nameField.element().style.marginRight = "1em";
    nameField.element().style.width = "100%";
    nameField.element().style.minWidth = "70%";
    nameField.setSubmitFunc(() => {
      this.onEditName(nameField);
    });

    // buttonsContainer
    const container1 = View.clone().create();
    this.setButtonsContainer(container1);
    container1.element().style.display = "flex";
    container1.element().style.flexDirection = "row";
    container1.element().style.justifyContent = "left";
    
    return this;
  }

  syncButtons () {
    const isHost = App.shared().isHost();
    const isSelf = this.isSelf();

    if (isHost) {
      const container1 = this.buttonsContainer();

      const radioItems = [
        {
          label: "prompt",
          action: "onTogglePrompt",
          state: this.player().canSendPrompts(),
          available: isHost && !isSelf,
        },
        {
          label: "ban",
          action: "onToggleBan",
          state: false,
          available: isHost && !isSelf,
        },
        {
          label: "mute",
          action: "onToggleMute",
          state: false,
          available: false && !isSelf,
        },
      ];
        
      radioItems.forEach(item => {
        if (item.available) {
          const button = RadioButton.clone().create().setClassName("subheader smallButton");
          button.setAutoLabel(item.label);
          button.setTarget(this).setAction(item.action);
          container1.addSubview(button);
        }
      })

      /*
      const container2 = View.clone().create();
      container2.element().style.display = "flex";
      container2.element().style.justifyContent = "left";
      this.addSubview(container2);
      */

      const actionItems = [
        {
          label: "kick",
          action: "onKick",
          available: isHost && !isSelf,
        },
        {
          label:  "voice call",
          action: "onRequestVoiceCall",
          available: false,
        },
      ]; //, "voice call"];
      actionItems.forEach(item => {
        if (item.available) {
          const button = Button.clone().create().setClassName("subheader smallButton");
          button.setLabel(item.label).setTarget(this).setAction(item.action);
          container1.addSubview(button);
        }
      })

    }
  }

}.initThisClass());

