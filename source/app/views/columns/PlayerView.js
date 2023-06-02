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
    this.newSlot("guestDict", null);
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
    return this;
  }

  setGuestDict (dict) {
    this._guestDict = dict;
    this.setup();
    return this;
  }

  // --- helpers ---

  peerConnection () {
    return PeerServer.shared().peerConnections().get(this.userId());
  }

  userId () {
    return this.guestDict().id;
  }

  userInfo () {
    return this.peerConnection().info();
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
    PlayersColumn.shared().updateUserName(nameField.string());
  }

  isSelf () {
    return LocalUser.shared().id() === this.userId();
  }

  // --- setup ---

  setup() {
    const isHost = App.shared().isHost();
    const isSelf = this.isSelf();

    // Create a container for the user and their actions
    const userContainer = document.createElement("div");
    this.element().appendChild(userContainer);

    const nameField = TextFieldView.clone().create().setString(this.guestDict().nickname);
    nameField.setShouldFitContent(true);
    this.addSubview(nameField);
    nameField.element().style.marginBottom = "1em";
    nameField.setSubmitFunc(() => {
      this.onEditName(nameField);
    });

    nameField.setIsEditable(isSelf);

    if (isSelf) {
      const view = AvatarPickerView.shared();
      this.addSubview(view);
    }

    if (App.shared().isHost()) {

      const container1 = View.clone().create();
      container1.element().style.display = "flex";
      container1.element().style.flexDirection = "row";
      container1.element().style.justifyContent = "left";
      
      this.addSubview(container1);

      const radioItems = [
        {
          label: "prompt",
          action: "onTogglePrompt",
          state: this.guestDict().canSendPrompts,
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

