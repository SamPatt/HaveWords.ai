import ParserInterface from "@3d-dice/dice-parser-interface";

(class RollPanelView extends View {
  //Public
  initPublicPrototypeSlots() {
    this.newSlot("isMouseOver", false);
  }

  setReason(title) {
    this.titleView().setInnerText(title);
    return this;
  }

  character() {
    return this.characterTextField().value();
  }

  setCharacter(character) {
    this.characterTextField().setValue(character);
    return this;
  }

  die () {
    return this.dieOptionsView().value();
  }

  setDie(die) {
    this.dieOptionsView().setValue(die);
    return this;
  }

  count () {
    return this.countTextField().value();
  }

  setCount(count) {
    this.countTextField().setValue(count);
    return this;
  }

  modifier() {
    return this.modifierTextField().value();
  }

  setModifier(modifier) {
    this.modifierTextField().setValue(modifier);
    return this;
  }

  rollType() {
    return this.rollTypeOptionsView().value();
  }

  setRollType(rollType) {
    this.rollTypeOptionsView().setValue(rollType);
    return this;
  }

  rollTarget() {
    return parseInt(this.targetTextField().value());
  }

  setRollTarget(rollTarget) {
    rollTarget = parseInt(rollTarget);
    if (isNaN(rollTarget)) {
      rollTarget = "";
    }
    this.targetTextField().setValue(rollTarget);
    return this;
  }

  notation() {
    let notation = this.countTextField().value();
    notation += ("d" + this.dieOptionsView().selectedValue());
    notation += this.rollTypeOptionsView().selectedValue();
    notation += this.modifierTextField().value();
    return notation;
  }

  rollInstructions() {
    let rollInstructions = this.character() + ", roll " + this.count() + "d" + this.die() + this.modifier();
    if (this.rollType()) {
      rollInstructions += " with " + this.rollType();
    }
    if (this.rollTarget()) {
      rollInstructions += " with a target of " + this.rollTarget() + " or higher";
    }
    rollInstructions += "."
    return rollInstructions;
  }

  async roll() {
    const dv = DiceRollView.shared();
    dv.setCharacter(this.character())
    dv.setNotation(this.notation())
    dv.setRollTarget(this.rollTarget());
    this.hide();
    await dv.roll();
    setTimeout(() => { dv.clear() }, 500);
    AiChatColumn.shared().messageInput().appendText(dv.outcomeDescription());
    if (this.shouldSendImmediately()) {
      AiChatColumn.shared().messageInput().submit();
    }
    else {
      AiChatColumn.shared().messageInput().appendText("\n");
    }
    return this;
  }

  show() {
    this.element().style.position = 'absolute';
    this.element().style.display = 'flex';
    const myRect = this.element().getBoundingClientRect();
    this.element().style.left = String(window.innerWidth/2 - myRect.width/2) + "px";
    this.element().style.top = String(window.innerHeight/2 - myRect.height/2) + "px";
    return this;
  }

  hide() {
    this.element().style.display = 'none';
  }


  //Internal
  initPrototypeSlots() {
    super.initPrototypeSlots();
    
    this.initPublicPrototypeSlots();

    //Internal
    this.newSlot("titleView", null);
    this.newSlot("characterTextField", null);
    this.newSlot("dieOptionsView", null);
    this.newSlot("countTextField", null);
    this.newSlot("modifierTextField", null);
    this.newSlot("rollTypeOptionsView", null);
    this.newSlot("targetTextField", null);
    this.newSlot("sendImmediatelyCheckbox", null);
    this.newSlot("rollButton", null);
    this.newSlot("cancelButton", null);

    this.newSlot("parser", null);
  }

  init() {
    super.init();
    this.setId("rollPanelView");
    this.setParser(new ParserInterface());
  }

  initElement() {
    super.initElement();

    this.setTitleView(View.clone().setId("rollPanelTitle"));
    this.setCharacterTextField(TextFieldView.clone().setId("rollPanelCharacter"));
    this.setCountTextField(TextFieldView.clone().setId("rollPanelCount"));
    this.setDieOptionsView(OptionsView.clone().setId("rollPanelDie"));
    this.setModifierTextField(TextFieldView.clone().setId("rollPanelModifier"));
    this.setRollTypeOptionsView(OptionsView.clone().setId("rollPanelRollType"));
    this.setTargetTextField(TextFieldView.clone().setId("rollPanelTarget"));
    //this.setSendImmediatelyCheckbox(CheckboxView.clone().setId("rollPanelSendImmediately"));
    this.setRollButton(Button.clone().setId("rollPanelRollButton").setTarget(this).setAction("roll"));
    this.setCancelButton(Button.clone().setId("rollPanelCancelButton").setTarget(this).setAction("hide"));

    var self = this;
    this.element().addEventListener('mouseover', e => { self.didMouseOver(e) });
    this.element().addEventListener('mouseout', e => { self.didMouseOut(e) });
    
    this.hide();
  }

  didMouseOver() {
    this.setIsMouseOver(true);
  }

  didMouseOut() {
    this.setIsMouseOver(false);
    //this.hide();
  }

  shouldSendImmediately() {
    return true;
    //return this.sendImmediatelyCheckbox().isChecked();
  }
}).initThisClass();

window.RollPanelView = RollPanelView;