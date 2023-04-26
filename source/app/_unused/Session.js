"use strict";

/* 
    Session

    Session info like:
    - ai model
    - api key
    - ai role
    - conversation history

    // example use:
    
    // get history
    const history = Session.shared().conversationHistory()

    // add to history
    Session.shared().addToConversation(json)

*/

(class Session extends Base {
    initPrototypeSlots () {
        this.newSlot("aiModel", null)
        this.newSlot("apiKey", null)
        this.newSlot("aiRole", null)
        this.newSlot("conversationHistory", null)
    }

    init () {
        super.init()
        this.setConversationHistory([])
        this.setIsDebugging(true)
    }

    addToConversation (json) {
        //assert(isValidJson(json))?
        this.conversationHistory().push(json)
        return this
    }

}.initThisClass());
