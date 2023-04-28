"use strict";

/* 
    UsersView

    UsersView.shared().updateUserList()
*/

(class UsersView extends View {
  initPrototypeSlots() {}

  init() {
    super.init();
    this.setId("userList");
  }

  updateUserList() {
    const userList = document.getElementById("userList");
    userList.innerHTML = "";

    for (const guestId in dataChannels) {
      if (dataChannels.hasOwnProperty(guestId)) {
        const guestToken = dataChannels[guestId].token;
        const guestNickname = dataChannels[guestId].nickname;

        // Create a container for the user and their actions
        const userContainer = document.createElement("div");
        userContainer.classList.add("user-container");

        // Create the user list item and add an arrow indicator
        const listItem = document.createElement("li");
        listItem.textContent = guestNickname;
        listItem.setAttribute("data-id", guestId);
        listItem.setAttribute("data-token", guestToken);

        const arrowIndicator = document.createElement("span");
        arrowIndicator.textContent = " ▼";
        arrowIndicator.classList.add("arrow-indicator");
        listItem.appendChild(arrowIndicator);

        // Create user action buttons
        const userActions = document.createElement("div");
        userActions.classList.add("user-actions");

        // AI Access button
        const canSendPromptsButton = document.createElement("button");
        canSendPromptsButton.textContent = dataChannels[guestId].canSendPrompts
          ? "Revoke AI access"
          : "Grant AI access";
        canSendPromptsButton.onclick = () => {
          dataChannels[guestId].canSendPrompts =
            !dataChannels[guestId].canSendPrompts;

          canSendPromptsButton.textContent = dataChannels[guestId]
            .canSendPrompts
            ? "Revoke AI access"
            : "Grant AI access";

          if (dataChannels[guestId].canSendPrompts) {
            dataChannels[guestId].conn.send({ type: "grant-ai-access" });
          } else {
            dataChannels[guestId].conn.send({ type: "revoke-ai-access" });
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
          // Kick logic
          console.log("Kicking user " + guestId);
          kickUser(guestId);
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
          banUser(guestId, guestToken);
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
      }
    }
  }
}.initThisClass());

// ----------------------------------------------------------------

// These functions update the list of connected guests and display the user actions menu

function displayGuestUserList() {
  const userList = document.getElementById("userList");
  userList.innerHTML = "";

  for (const id in guestUserList) {
    if (guestUserList.hasOwnProperty(id)) {
      const guestNickname = guestUserList[id].nickname;

      // Create a container for the user and their actions
      const userContainer = document.createElement("div");
      userContainer.classList.add("user-container");

      // Create the user list item and add an arrow indicator
      const listItem = document.createElement("li");
      listItem.textContent = guestNickname;
      listItem.setAttribute("data-id", guestUserList[id].id);

      const arrowIndicator = document.createElement("span");
      arrowIndicator.textContent = " ▼";
      arrowIndicator.classList.add("arrow-indicator");
      listItem.appendChild(arrowIndicator);

      userContainer.appendChild(listItem);

      // Create user action buttons
      const userActions = document.createElement("div");
      userActions.classList.add("user-actions");

      // Voice request button

      handleVoiceRequestButton(userActions, guestUserList[id].id);

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
    }
  }
}

function displayUserActions(event) {
  const guestId = event.currentTarget.getAttribute("data-id");
  const userActions = document.getElementById("userActions");
  userActions.style.display = "block";
  userActions.setAttribute("data-id", guestId);
}

function kickUser(kickedUserId) {
  if (dataChannels.hasOwnProperty(kickedUserId)) {
    const guestConn = dataChannels[kickedUserId].conn;
    guestConn.send({ type: "kick" });

    setTimeout(() => {
      guestConn.close();
      console.log(`Kicked guest: ${kickedUserId}`);
      delete dataChannels[kickedUserId];
      UsersView.shared().updateUserList()
    }, 500); // Adjust the delay (in milliseconds) as needed
  }
  const userActions = document.getElementById("user-actions");
  userActions.style.display = "none";
}

function displayKickedMessage() {
  const chatOutput = document.getElementById("chatOutput");
  const kickedMessage = document.createElement("li");
  kickedMessage.classList.add("kicked-message");
  kickedMessage.textContent = "You've been kicked.";
  chatOutput.appendChild(kickedMessage);

  const chatSendButton = document.getElementById("chatSendButton");
  chatSendButton.disabled = true;
}

function banUser(id, token) {
  if (dataChannels.hasOwnProperty(id)) {
    const guestConn = dataChannels[id].conn;
    guestConn.send({ type: "ban" });

    setTimeout(() => {
      guestConn.close();
      console.log(`Banned guest: ${id}`);
      bannedGuests.push(token);
      console.log(token);
      console.log(bannedGuests);
      delete dataChannels[id];
      UsersView.shared().updateUserList()
    }, 500); // Adjust the delay (in milliseconds) as needed
  }
  const userActions = document.getElementById("user-actions");
  userActions.style.display = "none";
}

function updateUserName() {
  const username = UsernameView.shared().string();
  if (username.trim() !== "") {
    if (Peers.shared().isHost()) {
      // Set new host nickname and send to all guests
      const oldNickname = hostNickname;
      if (hostNickname === username) {
        return;
      }
      hostNickname = username;
      // Update the host nickname in localstorage
      localStorage.setItem("hostNickname", hostNickname);
      addChatMessage(
        "chat",
        `${oldNickname} is now ${hostNickname}.`,
        hostNickname
      );
      const updatedGuestUserList = updateGuestUserlist();
      for (const guestId in dataChannels) {
        if (dataChannels.hasOwnProperty(guestId)) {
          dataChannels[guestId].conn.send({
            type: "nickname-update",
            message: `${oldNickname} is now ${hostNickname}.`,
            nickname: hostNickname,
            oldNickname: oldNickname,
            newNickname: hostNickname,
            guestUserList: updatedGuestUserList,
          });
        }
      }
    } else {
      // Set new guest nickname and send to host
      guestNickname = username;
      // Update the guest nickname in localstorage
      localStorage.setItem("guestNickname", guestNickname);
      Peers.shared().sendUsername(username);
    }
  }
}
