"use strict";

/* 
    UsersView

*/

(class UsersView extends View {
  initPrototypeSlots() {
    this.newSlot("guestUserList", null)
    this.newSlot("scrollView", null)
  }

  init() {
    super.init();
    this.setId("userList");
    this.setScrollView(ScrollView.clone().setId("userList"));
  }

  setGuestUserList(aList) {
    const ownId = LocalUser.shared().id();
    this._guestUserList = aList.filter((guest) => guest.id !== ownId);
  
    if (App.shared().isHost()) {
      this.displayHostUserList();
    } else {
      this.displayGuestUserList();
    }
  
    return this;
  }

  displayHostUserList() {
    const userList = document.getElementById("userList");
    userList.innerHTML = "";

    this.guestUserList().forEach((guest) => {
        const aGuestNickname = guest.nickname;
        const canSendPrompts = guest.canSendPrompts;
        const guestId =  guest.id;

        // Create a container for the user and their actions
        const userContainer = document.createElement("div");
        userContainer.classList.add("user-container");

        // Create the user list item and add an arrow indicator
        const listItem = document.createElement("li");
        listItem.textContent = aGuestNickname;
        listItem.setAttribute("data-id", guestId);

        const arrowIndicator = document.createElement("span");
        arrowIndicator.textContent = " ▼";
        arrowIndicator.classList.add("arrow-indicator");
        listItem.appendChild(arrowIndicator);

        // Create user action buttons
        const userActions = document.createElement("div");
        userActions.classList.add("user-actions");

        // AI Access button
        const peerConnection = PeerServer.shared().peerConnections().get(guestId);
        const canSendPromptsButton = document.createElement("button");
        canSendPromptsButton.textContent = canSendPrompts
          ? "Revoke AI access"
          : "Grant AI access";
        canSendPromptsButton.onclick = () => {
          const canSend = !peerConnection.info().canSendPrompts
          peerConnection.info().canSendPrompts = canSend;

          canSendPromptsButton.textContent = canSend
            ? "Revoke AI access"
            : "Grant AI access";

          if (canSend) {
            peerConnection.send({ type: "grantAiAccess" });
          } else {
            peerConnection.send({ type: "revokeAiAccess" });
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
          HostSession.shared().kickUser(guestId);
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
          HostSession.shared().banUser(guestId);
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
      });
  }

  // These functions update the list of connected guests and display the user actions menu

  displayGuestUserList() {
    const userList = document.getElementById("userList");
    userList.innerHTML = "";

    this.guestUserList().forEach((guestUser) => {

        const aGuestNickname = guestUser.nickname;

        // Create a container for the user and their actions
        const userContainer = document.createElement("div");
        userContainer.classList.add("user-container");

        // Create the user list item and add an arrow indicator
        const listItem = document.createElement("li");
        listItem.textContent = aGuestNickname;
        listItem.setAttribute("data-id", guestUser.id);

        const arrowIndicator = document.createElement("span");
        arrowIndicator.textContent = " ▼";
        arrowIndicator.classList.add("arrow-indicator");
        listItem.appendChild(arrowIndicator);

        userContainer.appendChild(listItem);

        // Create user action buttons
        const userActions = document.createElement("div");
        userActions.classList.add("user-actions");

        // Voice request button

        handleVoiceRequestButton(userActions, guestUser.id);

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
      });
  }

  updateUserName() { // update from UI
    const newNickname = UsernameView.shared().string().trim();
    const oldNickname = LocalUser.shared().nickname();
    if (newNickname === "" || oldNickname === newNickname) {
      return;
    }
    LocalUser.shared().setNickname(newNickname)

    if (App.shared().isHost()) {
      // Set new host nickname and send to all guests

      GroupChatColumn.shared().addChatMessage(
        "chat",
        `${oldNickname} is now <b>${LocalUser.shared().nickname()}</b>.`,
        LocalUser.shared().nickname(),
        LocalUser.shared().id()
      );

      const json = {
        type: "nicknameUpdate",
        userId: LocalUser.shared().id(),
        message: `${oldNickname} is now <b>${LocalUser.shared().nickname()}</b>.`,
        nickname: LocalUser.shared().nickname(),
        oldNickname: oldNickname,
        newNickname: LocalUser.shared().nickname(),
        guestUserList: HostSession.shared().calcGuestUserlist(),
      };

      HostSession.shared().broadcast(json)
    } else {
      GuestSession.shared().sendNicknameUpdate(newNickname);
    }
  }

}.initThisClass());
