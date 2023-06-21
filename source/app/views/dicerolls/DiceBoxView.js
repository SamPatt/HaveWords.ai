import DiceBox from "@3d-dice/dice-box";
import ParserInterface from "@3d-dice/dice-parser-interface";

(class DiceBoxView extends View {
  initPrototypeSlots() {
    super.initPrototypeSlots();

    //Public Interface
    this.newSlot("notation");
    this.newSlot("results");
    

    //Internal
    this.newSlot("diceBox");
    this.newSlot("parser");
    this.newSlot("rollResults", "");
    this.newSlot("resizeTimeout", 0);
  }

  //Public Interface
  async setup() {
    return this.diceBox().init();
  }

  async roll() {
    await this.diceBox().roll(this.parser().parseNotation(this.notation()));
    this.setResults(this.parser().parseFinalResults(this.diceBox().getRollResults()));
    return this.results();
  }

  clear() {
    this.diceBox().clear();
  }

  //Internal
  init() {
    super.init();

    this.setDiceBox(new DiceBox("#diceBox", {
      assetPath: "assets/",
      assetPath: window.location.pathname + "source/external/@3d-dice/dice-box/dist/assets/",
      //origin: "https://unpkg.com/@3d-dice/dice-box@1.0.8/dist/",
      //origin: "./source/external/@3d-dice/dice-box/dist/",
      theme: "smooth",
      themeColor: "#000000",
      offscreen: true,
      scale: 4*screen.availHeight/document.getElementById("diceBox").clientHeight
    }));

    this.setParser(new ParserInterface());

    const self = this;
    window.addEventListener('resize', e => {
      self.windowDidResize();
    });
  }

  windowDidResize() {
    const self = this;
    clearTimeout(this.resizeTimeout());
    this.setResizeTimeout(setTimeout(() => {
      self.updateDiceBox();
    }, 200));
  }

  updateDiceBox() {
    this.diceBox().updateConfig({
      scale: 4*screen.availHeight/document.getElementById("diceBox").clientHeight
    })
  }
}).initThisClass();

getGlobalThis().DiceBoxView = DiceBoxView;