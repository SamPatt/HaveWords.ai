import ParserInterface from "@3d-dice/dice-parser-interface";

(class RollPanelView extends View {
  //Public

  initPublicPrototypeSlots() {
    this.newSlot("rollRequest", null);
    this.newSlot("rollOutcome", null);
    this.newSlot("isShown", false);
  }

  show() {
    this.setIsShown(true);
    this.element().style.position = 'absolute';
    this.element().style.display = 'table';
    const myRect = this.element().getBoundingClientRect();
    this.element().style.left = String(window.innerWidth/2 - myRect.width/2) + "px";
    this.element().style.top = String(window.innerHeight/2 - myRect.height/2) + "px";
    return this;
  }

  hide() {
    this.setIsShown(false);
    this.element().style.display = 'none';
  }

  positionRelativeTo(mouseEvent) { //position so that roll button is under click/tap location
    const myRect = this.element().getBoundingClientRect();
    const rollButtonRect = this.rollButton().element().getBoundingClientRect();
    this.element().style.position = 'absolute';
    this.element().style.left = String(Math.max(0, mouseEvent.clientX - (rollButtonRect.x - myRect.x + rollButtonRect.width/2))) + "px";
    this.element().style.top = String(
      Math.min( //Don't go below the bottom
        Math.max( //Don't go above the top
          mouseEvent.clientY - (rollButtonRect.y - myRect.y + rollButtonRect.height/2), 0
        ),
        document.body.clientHeight - myRect.height
      )) + "px";
    
    return this;
  }

  //Private
  initPrototypeSlots() {
    super.initPrototypeSlots();

    this.initPublicPrototypeSlots();

    this.newSlot("reasonView", null);
    this.newSlot("characterTextField", null);
    this.newSlot("countTextField", null);
    this.newSlot("dieOptionsView", null);
    this.newSlot("modifierTextField", null);
    this.newSlot("keepDropOptionsView", null);
    this.newSlot("keepDropHighLowOptionsView", null);
    this.newSlot("keepDropCountTextField", null);
    this.newSlot("targetTextField", null);
    this.newSlot("rollButton", null);
    this.newSlot("cancelButton", null);

    this.newSlot("parser", null);
  }

  setRollRequest(rollRequest) {
    this._rollRequest = rollRequest;

    this.reasonView().setInnerText(rollRequest.reason());
    this.characterTextField().setValue(rollRequest.character());
    this.countTextField().setValue(rollRequest.count());
    this.dieOptionsView().setValue(String(rollRequest.die()));
    this.modifierTextField().setValue(rollRequest.modifier());
    this.keepDropOptionsView().setValue(rollRequest.keepDrop());
    this.keepDropHighLowOptionsView().setValue(rollRequest.keepDropHighLow());
    this.keepDropCountTextField().setValue(rollRequest.keepDropCount());
    this.targetTextField().setValue(rollRequest.target() || "");
    return this;
  }

  init() {
    super.init();
    this.setId("rollPanelView");
    this.setParser(new ParserInterface());
  }

  initElement() {
    super.initElement();

    this.setReasonView(View.clone().setId("rollPanel_reasonView"));
    this.setCharacterTextField(TextFieldView.clone().setId("rollPanel_characterTextField").setTarget(this));
    this.setCountTextField(TextFieldView.clone().setId("rollPanel_countTextField").setTarget(this));
    this.setDieOptionsView(OptionsView.clone().setId("rollPanel_dieOptionsView").setTarget(this));
    this.setModifierTextField(TextFieldView.clone().setId("rollPanel_modifierTextField").setTarget(this));
    this.setKeepDropOptionsView(OptionsView.clone().setId("rollPanel_keepDropOptionsView").setTarget(this));
    this.setKeepDropHighLowOptionsView(OptionsView.clone().setId("rollPanel_keepDropHighLowOptionsView").setTarget(this));
    this.setKeepDropCountTextField(TextFieldView.clone().setId("rollPanel_keepDropCountTextField").setTarget(this));
    this.setTargetTextField(TextFieldView.clone().setId("rollPanel_targetTextField").setTarget(this));
    this.setRollButton(Button.clone().setId("rollPanel_rollButton").setTarget(this).setAction("submit"));
    this.setCancelButton(Button.clone().setId("rollPanel_cancelButton").setTarget(this).setAction("hide"));


    for (let e of this.element().querySelectorAll("*")) {
      e.style.display = "";
      delete e.style["flex-direction"];
    }

    this.hide();
  }

  //TODO validations
  onChange_rollPanel_characterTextField() {
    this.rollRequest().setCharacter(this.characterTextField().value().trim());
  }

  onChange_rollPanel_countTextField() {
    this.rollRequest().setCount(parseInt(this.countTextField().value().trim()));
  }

  onChange_rollPanel_dieOptionsView() {
    this.rollRequest().setDie(parseInt(this.dieOptionsView().value().trim()));
  }

  onChange_rollPanel_modifierTextField() {
    this.rollRequest().setModifier(parseInt(this.modifierTextField().value().trim()));
  }

  onChange_rollPanel_keepDropOptionsView() {
    this.rollRequest().setKeepDrop(this.keepDropOptionsView().value().trim());
  }

  onChange_rollPanel_keepDropHighLowOptionsView() {
    this.rollRequest().setKeepDrop(this.keepDropHighLowOptionsView().value().trim());
  }

  onChange_rollPanel_keepDropCountTextField() {
    this.rollRequest().setKeepDropCount(parseInt(this.keepDropCountTextField().value().trim()));
  }

  onChange_rollPanel_targetTextField() {
    this.rollRequest().setTarget(parseInt(this.targetTextField().value().trim()));
  }
}).initThisClass();

window.RollPanelView = RollPanelView;