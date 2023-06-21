"use strict";

/* 

    RollRequestView

*/

(class RollRequestView extends View {
  //Public
  initPublicPrototypeSlots() {
    this.newSlot("rollRequest");
    this.newSlot("rollOutcome", null);
  }

  textRollOutcomeDescription() {
    const div = document.createElement("div");
    div.innerHTML = this.rollOutcome().outcomeDescription;
    return div.innerText;
  }


  //Private
  initPrototypeSlots() {
    super.initPrototypeSlots();
    this.initPublicPrototypeSlots();
    this.newSlot("messageView");
    this.newSlot("reasonElement");
  }

  init() {
    super.init();
    this.setTagName("li");
  }

  initElement () {
    let tagName = 'span';
    let pc = this.rollRequest().playerCharacter();
    if (pc) {
      if (pc.isLocal()) {
        tagName = 'a';  //PC Roll
      }
    }
    else if(App.shared().isHost()) {
      tagName = 'a'; //NPC Roll
    }
    let reasonElement = document.createElement(tagName);
    reasonElement.innerHTML = this.rollRequest().reason();
    if (reasonElement.tagName.toLowerCase() == 'a') {
      const self = this;
      reasonElement.addEventListener('mouseover', evt => self.mouseOver(evt));
    }
    this.element().appendChild(reasonElement);
    this.setReasonElement(reasonElement);
    return this;
  }

  mouseOver(evt) {
    const rp = RollPanelView.shared();
    rp.setRollRequest(this.rollRequest());
    rp.setTarget(this);
    rp.setAction("rollPanelDidSubmit");
    rp.show();
    rp.positionRelativeTo(evt);
  }

  async rollPanelDidSubmit() {
    RollPanelView.shared().hide();
    
    const span = document.createElement("span");
    span.innerHTML = this.reasonElement().innerHTML + ": ";
    this.reasonElement().replaceWith(span);
    this.setReasonElement(span);

    this.rollRequest().setResults(await DiceBoxView.shared().setNotation(this.rollRequest().notation()).roll());
    DiceBoxView.shared().clear();
    
    const rollOutcome = {
      type: "rollOutcome",
      id: this.rollRequest().id(),
      requestId: this.messageView().requestId(),
      outcomeDescription: this.rollRequest().outcomeDescription()
    };

    AiChatColumn.shared().addRollOutcome(rollOutcome);
    if (App.shared().isHost()) {
      HostSession.shared().broadcast(rollOutcome);
    }
    else {
      GuestSession.shared().send(rollOutcome);
    }
  }

  addRollOutcome(rollOutcome) {
    this.setRollOutcome(rollOutcome);
    let span = document.createElement("span");
    span.innerHTML = rollOutcome.outcomeDescription;
    this.element().appendChild(span);
  }
}.initThisClass());

