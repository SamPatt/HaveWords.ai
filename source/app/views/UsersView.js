"use strict";

/* 
    UsersView

*/

(class UsersView extends View {
  initPrototypeSlots() {}

  init() {
    super.init();
    this.setId("userList");
    this.newSlot("guestUserList", null)
  }

  setGuestUserList (aList) {
    this._guestUserList = aList

    if (App.shared().isHost()) {
    this.displayHostUserList()
    } else {
      this.displayGuestUserList()
    }

    return this
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
    const username = UsernameView.shared().string();
    if (username.trim() !== "") {
      if (App.shared().isHost()) {
        // Set new host nickname and send to all guests
        const oldNickname = LocalUser.shared().nickname();
        if (oldNickname === username) {
          return;
        }
        Session.shared().setHostNickname(username);
        GroupChatView.shared().addChatMessage(
          "chat",
          `${oldNickname} is now ${LocalUser.shared().nickname()}.`,
          LocalUser.shared().nickname(),
          LocalUser.shared().id()
        );

        const json = {
          type: "nicknameUpdate",
          message: `${oldNickname} is now ${LocalUser.shared().nickname()}.`,
          nickname: LocalUser.shared().nickname(),
          oldNickname: oldNickname,
          newNickname: LocalUser.shared().nickname(),
          guestUserList: UsersView.shared().updateGuestUserlist(),
        };

        HostSession.shared().broadcast(json)

        /*
        HostSession.shared()
          .dataChannels()
          .forEachKV((guestId, channel) => {
            channel.conn.send(json);
          });
          */
      } else {
        // Set new guest nickname and send to host
        Session.shared().setGuestNickname(username);
        GuestSession.shared().sendUsername(username);
      }
    }
  }

  updateAvatar(avatar) { // update from UI
    if (avatar !== "") {
      if (App.shared().isHost()) {
        // Update host avatar and send to all guests
        const oldAvatar = Session.shared().hostAvatar();
        if (oldAvatar === avatar) {
          return;
        }
        LocalUser.shared().setAvatar(avatar);
        HostSession.shared().updateHostAvatar(oldAvatar, avatar);
      } else {
        // Set new guest avatar and send to host
        Session.shared().setGuestAvatar(avatar);
        GuestSession.shared().sendAvatar(avatar);
      }
    }
  }


}.initThisClass());
