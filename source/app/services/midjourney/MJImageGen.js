"use strict";

/* 
    MJImageGen

*/

(class MJImageGen extends MJService {
  initPrototypeSlots() {
    this.newSlot("prompt", null);
    this.newSlot("mjVersion", "5.1");
    this.newSlot("systemInstructions", `
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
      "waifu", "mp5", "succubus", "1488", "surgery"]`);
      this.newSlot("pollingMs", 1000);
      this.newSlot("timeTaken", null);
    }

  init () {
    super.init();
    this.setIsDebugging(true);
  }

  newRequest () {
    const request = MJRequest.clone();
    request.setService(this);
    return request;
  }

  isApiV2() {
    return this.apiBaseUrl().includes("v2");
  }

  // Calls the OpenAI Image API and returns the image URL fetchOpenAIImageResponse
  async asyncFetch() {
    const requestStartTime = new Date().getTime();

    assert(this.prompt());
    assert(this.mjVersion());

    try {
      AiChatView.shared().updateImageProgress({
        prompt: this.prompt(),
        status: "sending request",
        progressPercentage: 0
      });

      let json = await this.newRequest().setEndpointPath("/imagine").setBody({
        prompt: this.prompt() + " --v " + this.mjVersion()
      }).asyncSend();

      this.debugLog(json);

      AiChatView.shared().updateImageProgress({
        prompt: this.prompt(),
        status: json.status || "request sent",
        progressPercentage: json.percentage || 0
      });

      let body;

      if (this.isApiV2()) {
        body = { taskId: json.taskId };
      }
      else {
        body = { resultId: json.taskId };
      }

      let startTime = new Date().getTime();
      do {
        if (new Date().getTime() - startTime > 120000) {
          throw new Error("Timeout waiting for midjourney");
        }
        await new Promise(r => setTimeout(r, this.pollingMs()));
        json = await this.newRequest().setEndpointPath("/result").setBody(body).asyncSend();
        this.debugLog(json);

        if (json.errors) {
          throw new Error(JSON.stringify(json));
        }

        AiChatView.shared().updateImageProgress({
          prompt: this.prompt(),
          status: json.status || "unknown",
          progressPercentage: json.percentage || 0
        });
      } while(!json.imageURL);

      AiChatView.shared().updateImageProgress({
        prompt: this.prompt(),
        status: json.status || "upscaling",
        progressPercentage: 99
      });

      if (this.isApiV2()) {
        body = { taskId: body.taskId, position: 1 };
      }
      else {
        body = { messageId: json.messageId, jobId: json.jobId, position: 1 };
      }

      startTime = new Date().getTime();
      do {
        if (new Date().getTime() - startTime > 120000) {
          throw new Error("Timeout waiting for midjourney");
        }

        await new Promise(r => setTimeout(r, this.pollingMs()));
        json = await this.newRequest().setEndpointPath("/upscale").setBody(body).asyncSend();
        this.debugLog(json);

        if (json.errors) {
          throw new Error(JSON.stringify(json));
        }
      } while(!json.imageURL);

      this.setTimeTaken(new Date().getTime() - requestStartTime);

      return json.imageURL;

    } catch (error) {
      console.error("Error fetching MJ response:", error);
      AiChatView.shared().addMessage(
        "systemMessage",
        "Error fetching Midjourney.io response. Make sure the model the API key and baseURL is correct.",
        "Host",
        LocalUser.shared().id()
      );
      return undefined
    }
  }
}.initThisClass());

