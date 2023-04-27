"use strict";

/* 
    App

*/

(class App extends Base {
    initPrototypeSlots () {
        //this.newSlot("idb", null)
    }

    init () {
        super.init()
        this.setIsDebugging(true)
    }

    run () {
        OpenAiChat.shared().addToConversation({
            role: "system",
            content: "You are a helpful assistant.",
        })
          


        // This displays the user's nickname above the chat window
        if (isHost) {
            displayUsername.value = hostNickname;
            updateInputField(displayUsername);
        } else {
            displayUsername.value = guestNickname;
            updateInputField(displayUsername);
        }

    }

    static launch () {
        console.log("App launch")
        App.shared().run()
    }

}.initThisClass());
