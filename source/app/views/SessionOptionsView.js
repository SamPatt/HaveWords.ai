"use strict";

/* 
    SessionOptionsView

*/

(class SessionOptionsView extends View {
  initPrototypeSlots() {}

  init() {
    super.init();
    this.setId("messages");
  }
}.initThisClass());


const startGameButton = document.getElementById("startGameButton");
// Start the group game when the host clicks the button
startGameButton.addEventListener("click", () => {
  updateSessionTypeOptions("fantasyRoleplay");
});



const systemMessage = document.getElementById("systemMessage");


function setNewAIRole(newRole) {
  const content = newRole;
  systemMessage.value = content;
  OpenAiChat.shared().addToConversation({
    role: "system",
    content: content,
  })

  // Check to see if host or guest and send message to appropriate party
  if (isHost) {
    //sendSystemMessage(content);
    // Disable for now
  } else {
    console.log("Guests cannot set new AI role");
  }
  console.log("sent system message:", content);
}

/*
  systemMessage.addEventListener('input', () => {
      //systemMessage.style.width = `${systemMessage.value.length}ch`;
      const content = systemMessage.value;
      OpenAiChat.shared().addToConversation({
        role: 'system',
        content: content,
      })

      document.getElementById('submitSystemMessage').style.display = 'none';
      // Check to see if host or guest and send message to appropriate party
      if (isHost) {
        sendSystemMessage(content);
      } else {
        sendSystemMessageToHost(content);
      }
      console.log("sent system message:", content)
    });

    */
/*
  document.getElementById('submitSystemMessage').addEventListener('click', () => {    
      const content = systemMessage.value;

      OpenAiChat.shared().clearConversationHistory()
      OpenAiChat.shared().addToConversation(
          role: 'system',
          content: content,
        })

      document.getElementById('submitSystemMessage').style.display = 'none';
      // Check to see if host or guest and send message to appropriate party
      if (isHost) {
        sendSystemMessage(content);
      } else {
        sendSystemMessageToHost(content);
      }
    }); 
    */

async function sendSystemMessage(message) {
  Peers.shared().broadcast({
    type: "system-message",
    id: id,
    message: message,
    nickname: hostNickname,
  });
}

function guestChangeSystemMessage(data) {
  const content = data.message;
  OpenAiChat.shared().addToConversation({
    role: "user",
    content: prompt,
  });

  // Update system message input
  systemMessage.value = content;

  // Relay to connected guests
  Peers.shared().broadcast({
    type: "system-message",
    id: data.id,
    message: data.message,
    nickname: data.nickname,
  });
}

