"use strict";

/* 
    Session

*/

(class Session extends Base {
    initPrototypeSlots () {
        this.newSlot("data", null)
    }

    init () {
        super.init()
        this.load()
        this.setIsDebugging(true)
    }

    save () {
      const json = JSON.stringify(this.data());
      localStorage.setItem("sessionData", json);
    }

    load () {
      let json = JSON.parse(localStorage.getItem("sessionData"));

      if (!json) {
        json = {
          history: [],
        };
      }

      if (!json.history) {
        json.history = [];
      }

      this.setData(json);
    
      return this;
    }
    
    clear () {
      localStorage.removeItem("sessionData");
      localStorage.removeItem("hostId");
      localStorage.removeItem("hostNickname");
      this.load()
    }

    history () {
      return this.data().history
    }

    addToHistory (json) {
      this.history().push(json)
      this.save()
      return this
    }

}.initThisClass());
  
// Add event listener to trigger the resetSession function when the resetSessionButton is clicked
resetSessionButton.addEventListener("click", resetSession);

function resetSession() {
  const userChoice = confirm(
    "Do you want to start a new session? This will delete the previous session data and create a new invite link."
  );
  // Clear the session data
  Session.shared().clear();
  // Reload the page
  window.location.reload();
}

// You can call this function when the host starts a new session
async function checkForExistingSession() {
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

function guestDisplayHostSessionHistory(sessionData) {
  Session.shared().data().forEach((item) => {
    if (item.type === "prompt") {
      addMessage(item.type, item.data, item.nickname);
    } else if (item.type === "ai-response") {
      addMessage(item.type, item.data, item.nickname);
    } else if (item.type === "system-message") {
      addMessage(item.type, item.data, item.nickname);
    } else if (item.type === "chat") {
      addChatMessage(item.type, item.data, item.nickname);
    } else if (item.type === "image-link") {
      addImage(item.data);
    }
  });
}

function displaySessionHistory() {
  Session.shared().history().forEach((item) => {
    if (item.type === "prompt") {
      addMessage(item.type, item.data, item.nickname);
    } else if (item.type === "ai-response") {
      addMessage(item.type, item.data, item.nickname);
    } else if (item.type === "system-message") {
      addMessage(item.type, item.data, item.nickname);
    } else if (item.type === "chat") {
      addChatMessage(item.type, item.data, item.nickname);
    } else if (item.type === "image-link") {
      addImage(item.data);
    }
  });
}