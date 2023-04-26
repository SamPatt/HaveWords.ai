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
        //this.setData([])
        this.setIsDebugging(true)
    }

    addToData (json) {
        this.data().push(json)
        return this
    }

}.initThisClass());



// These functions save, load, and clear the session data from local storage
function saveSessionData(sessionData) {
    localStorage.setItem("sessionData", JSON.stringify(sessionData));
  }
  
  function loadSessionData() {
    const sessionData = JSON.parse(localStorage.getItem("sessionData"));
    if (!sessionData) {
      return {
        history: [],
      };
    }
  
    if (!sessionData.history) {
      sessionData.history = [];
    }
  
    return sessionData;
  }
  
  function clearSessionData() {
    localStorage.removeItem("sessionData");
    localStorage.removeItem("hostId");
    localStorage.removeItem("hostNickname");
  }
  
  // Add event listener to trigger the resetSession function when the resetSessionButton is clicked
  resetSessionButton.addEventListener("click", resetSession);
  
  function resetSession() {
    const userChoice = confirm(
      "Do you want to start a new session? This will delete the previous session data and create a new invite link."
    );
    // Clear the session data
    clearSessionData();
    // Reload the page
    window.location.reload();
  }
  
  // You can call this function when the host starts a new session
  async function checkForExistingSession() {
    const sessionData = loadSessionData();
    if (sessionData) {
      const userChoice = confirm(
        "Do you want to restore the previous session? Cancel to start a new session."
      );
      if (userChoice) {
      } else {
        // Start a new session
        clearSessionData();
      }
    }
  }