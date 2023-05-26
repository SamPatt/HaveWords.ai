"use strict";

/* 
    MJImageJob

    An object to manage the image generation requests, 
    and polling required to get a result.

*/

(class MJImageJob extends MJService {

  static systemInstructions () {
    return       `
    We are using the Midjourney service for image generation. 
    The following words and phrases (formatted as json) are considered inappropriate in prompts, 
    so please omit them or find alternative words:
    ["blood", "bloodbath", "crucifixion", "bloody", "flesh", "bruises", "car crash", "corpse", "crucified", "cutting", 
    "decapitate", "infested", "gruesome", "kill", "infected", "sadist", "slaughter", "teratoma", "tryphophobia", "wound", 
    "cronenberg", "khorne", "cannibal", "cannibalism", "visceral", "guts", "bloodshot", "gory", "killing", "surgery", "vivisection", 
    "massacre", "hemoglobin", "suicide","ahegao", "pinup", "ballgag", "playboy", "bimbo", "pleasure", "bodily fluids", "pleasures", 
    "boudoir", "rule34", "brothel", "seducing", "dominatrix", "seductive", "erotic", "fuck", "sensual", "hardcore", "sexy", "hentai", 
    "shag", "horny", "shibari", "incest", "smut", "jav", "succubus", "jerk off king at pic", "thot", "kinbaku", "transparent", 
    "legs spread", "twerk", "making love", "voluptuous", "naughty", "wincest", "orgy", "sultry", "xxx", "bondage", "bdsm", 
    "dog collar", "slavegirl", "transparent", "translucent","arse", "labia", "ass", "mammaries", "badonkers", "minge", "big ass", 
    "mommy milker", "booba", "nipple", "booty", "oppai", "bosom", "organs", "breasts", "ovaries", "busty", "penis", "clunge", 
    "phallus", "crotch", "sexy female", "dick", "skimpy", "girth", "thick", "honkers", "vagina", "hooters", "veiny", "knob", 
    "no clothes", "au naturale", "no shirt", "bare chest", "nude", "barely dressed", "bra", "risqué", "clear", "scantily", "clad", 
    "cleavage", "stripped", "full frontal", "unclothed", "invisible clothes", "wearing nothing", "lingerie", "with no shirt", "naked", 
    "without clothes on", "negligee", "zero clothes","taboo", "fascist", "nazi", "prophet mohammed", "slave", "coon", "honkey","drugs", 
    "cocaine", "heroin", "meth", "crack","torture", "disturbing", "farts", "fart", "poop", "warts", "shit", "brown pudding", "bunghole", 
    "vomit", "voluptuous", "seductive", "sperm", "hot", "sexy", "sensored", "censored", "silenced", "deepfake", "inappropriate", "pus", 
    "waifu", "mp5", "succubus", "1488", "surgery"]`;
  }

  initPrototypeSlots() {
    this.newSlot("manager", null);
    this.newSlot("mjVersion", "5.1");
    this.newSlot("prompt", null);

    this.newSlot("taskId", null);

    this.newSlot("pollCount", 0);
    this.newSlot("pollingMs", 4000);

    this.newSlot("progress", 0);
    this.newSlot("imageUrl", 0);

    this.newSlot("status", "");
    this.newSlot("error", null);
    this.newSlot("requestId", null);
    this.newSlot("requestStartTime", 0);
    this.newSlot("timeTaken", 0);
    this.newSlot("errorMessage", "");
  }

  init() {
    super.init();
    this.setIsDebugging(false);
  }

  newRequest() {
    const request = MJRequest.clone();
    request.setService(this);
    return request;
  }

  isApiV2() {
    return this.apiBaseUrl().includes("v2");
  }

  onChange() {
    HostSession.shared().updateImageProgress(this);
  }

  updateTimeTaken() {
    this.setTimeTaken(new Date().getTime() - this.requestStartTime());
  }

  throwError(error) {
    console.warn(error.message);
    this.setStatus("error: " + error.message);
    this.setErrorMessage(error.message);
    this.onChange();
    debugger;
    throw error;
  }

  assertReady() {
    assert(this.prompt());
    assert(this.mjVersion());
    assert(this.requestId());
    assert(this.isApiV2());
  }

  async asyncFetch() {
    try {
      this.assertReady();

      this.setRequestStartTime(new Date().getTime());
      //debugger;
      await this.sendStartRequest();
      await this.pollUntilReadyOrTimeout();
      await this.sendUpscaleRequest();

      return this.imageUrl();
    } catch (error) {
      this.throwError(error);
    }
  }

  async sendStartRequest() {
    this.setStatus("sending image gen request");

    this.setProgress(0);
    this.onChange();

    const body = {
      prompt: this.prompt() + " --v " + this.mjVersion()
    };

    const json = await this.newRequest().setEndpointPath("/imagine").setBody(body).asyncSend();
    if (json.errors) {
      this.throwError(new Error(JSON.stringify(json)));
    }

    this.setTaskId(json.taskId);

    this.debugLog(json);
    this.setStatus("image request sent");
    this.setProgress(json.percentage || 0);
    this.onChange();
  }

  async pollPause() {
    return new Promise((r) => setTimeout(r, this.pollingMs())); // pause until next poll
  }

  async pollUntilReadyOrTimeout () {
    assert(this.taskId());
    this.setStatus("polling");
    this.onChange();


    const startTime = new Date().getTime();
    let json;

    do {
      if (new Date().getTime() - startTime > 120000) {
        this.throwError(new Error("Timeout waiting for Midjourney"));
      }
      await this.pollPause(); // pause until next poll
      json = await this.pollRequest()
      
    } while (!json.imageURL);

    this.setImageUrl(json.imageURL); // non-upscaled version set until we have the full version
    this.setStatus("got low scale image");
    this.setProgress(99);
    this.onChange();
  }

  async pollRequest () {
    this.setPollCount(this.pollCount() + 1);

    const json = await this.newRequest()
      .setEndpointPath("/result")
      .setBody({ taskId: this.taskId() })
      .asyncSend();
    this.debugLog(json);

    if (json.errors) {
      this.throwError(new Error(JSON.stringify(json)));
    }

    if (json.percentage) {
      this.setStatus("rendering " + json.percentage + "%");
      this.setProgress(json.percentage);
      this.onChange();
    } else {
      this.setStatus("polled " + this.pollCount() + " times waiting for rendering to begin");
      this.onChange();
    }
    return json;
  }

  async sendUpscaleRequest () {
    const startTime = new Date().getTime();
    let json;

    this.setStatus("upscaling");
    this.onChange();

    this.setPollCount(0);
    do {
      if (new Date().getTime() - startTime > 120000) {
        this.throwError(new Error("Timeout waiting for midjourney"));
      }

      await new Promise((r) => setTimeout(r, this.pollingMs()));
      json = await this.newRequest()
        .setEndpointPath("/upscale")
        .setBody({ 
          taskId: this.taskId(), 
          position: 1 // choose the first image of the set
        })
        .asyncSend();
      this.debugLog(json);

      if (json.errors) {
        this.throwError(new Error(JSON.stringify(json)));
      }

      if (json.imageURL) {
        this.setImageUrl(json.imageURL);
        this.updateTimeTaken();
        this.setStatus("complete");
        this.setProgress(100);
        this.onChange();

        break;
      } else {
        this.setPollCount(this.pollCount() + 1);
        this.setStatus("polled " + this.pollCount() + " times");
        this.onChange();
      }
    } while (true);


  }

}).initThisClass();
