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
        setupPeer()

        OpenAiChat.shared().addToConversation({
            role: "system",
            content: "You are a helpful assistant.",
        })
          
        if (Peers.shared().isHost()) {
            UsernameView.shared().setString(hostNickname);
        } else {
            UsernameView.shared().setString(guestNickname);
        }
    }

    static launch () {
        console.log("App launch")
        App.shared().run()
    }

}.initThisClass());
