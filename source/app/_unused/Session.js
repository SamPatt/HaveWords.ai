"use strict";

/* 
    

*/

(class AiSession extends Base {
    initPrototypeSlots () {
        //this.newSlot("idb", null)
    }

    init () {
        super.init()
        this.setIdb(IndexedDBFolder.clone())
        this.setIsDebugging(false)
    }

    static launch () {
        console.log("App launch")
    }

}.initThisClass());
