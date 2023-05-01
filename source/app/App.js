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
        LocalHost.shared().setupIds();

        LocalHost.shared().setupPeer()

        OpenAiChat.shared().addToConversation({
            role: "system",
            content: "You are a helpful assistant.",
        })
          
        if (LocalHost.shared().isHost()) {
            UsernameView.shared().setString(Session.shared().hostNickname());
        } else {
            UsernameView.shared().setString(Session.shared().guestNickname());
        }
    }

    static launch () {
        console.log("App launch")
        App.shared().run()
    }

}.initThisClass());
