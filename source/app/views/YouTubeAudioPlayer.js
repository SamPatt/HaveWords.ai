"use strict";

/* 
    YouTubeAudioPlayer

*/

(class YouTubeAudioPlayer extends Base {
  initPrototypeSlots() {
    this.newSlot("element", null);
    this.newSlot("player", null); // to store the YouTube player
    this.newSlot("isReady", false); 
    this.newSlot("videoId", null);
    this.newSlot("shouldRepeat", true);
    this.newSlot("frameIsReady", null);
    this.newSlot("volume", 0.1);
    //this.newSlot("playerActionQueue", []);
  }

  init() {
    super.init();
    this.loadFrameAPI(); // set this up, then we'll set up the player
    this.setIsDebugging(true);
  }

  // action queue

  queueAction (methodName, args) {
    this.playerActionQueue().push({methodName: methodName, args: args});

  }

  // ----------------------------------


  setVideoId (vid) {
    if (this._videoId !== vid) {
      this._videoId = vid;
    }
    return this;
  }

  loadFrameAPI() {
    // Load the YouTube IFrame Player API asynchronously
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    return this;
  }

  onFrameReady() {
    this.setFrameIsReady(true);
    this.setupPlayer()
    return this;
  }

  player () {
    if (!this._player) {
      this.setupPlayer();
    }
    return this._player
  }

  setupPlayer() {
    this.debugLog("------------------ setupPlayer ---------------- ");
    const json = {
      height: '0',
      width: '0',
      events: {
        onReady: (event) => {
          this.onPlayerReady(event);
        },
        onStateChange: (event) => {
          this.onPlayerStateChange(event);
        },
        onError: (event) => {
          this.onPlayerError(event);
        },
      },
      playerVars: {
        autoplay: 1, // Auto-play the video
        controls: 0, // Hide player controls
        showinfo: 0, // Hide video information
        rel: 0, // Do not show related videos
        modestbranding: 1, // Show minimal YouTube branding
      },
    };

    /*
    if (this.videoId()) {
      json.videoId = this.videoId();
    }
    */

    try {
      const player = new YT.Player("player", json);
      //debugger;
      this.setPlayer(player);
    } catch (error) {
      console.warn(error);
      throw error;
    }
    this.setIsReady(false)
    return this;
  }

  play() {
    //debugger;
    if (this.isReady() && this.videoId()) {
      const startSeconds = 0.0;
      this.debugLog("play()");
      this.player().loadVideoById(this.videoId(), startSeconds);
      //this.player().playVideo();
      this.updateVolume();
    } else {
      console.log("-------------- player not set up yet, but video should start when it is -------------");
    }
    return this
  }

  isPlaying() {
    if (this.isReady()) {
      return this.player().getPlayerState() === YT.PlayerState;
    }
    return false;
  }

  onPlayerError(event) {
    // Handle the error based on the error code
    //debugger;
    const error = Number(event.data);
    this.debugLog("------------------ onPlayerError " + error + " videoId: '" + this.videoId() + "'")

    switch (error) {
      case 2: // Invalid parameter
        console.error('The request contains an invalid parameter value. For example, this error occurs if you specify a video ID that does not have 11 characters, or if the video ID contains invalid characters, such as exclamation points or asterisks.');
        break;
      case 5:
        console.error("The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.");
        break;
      case 100: // Video not found
        console.error('Video not found.');
        break;
      case 101: // Playback not allowed
        console.error("The owner of the requested video does not allow it to be played in embedded players.");
        break;
      case 150: // Playback not allowed
        console.error("The owner of the requested video does not allow it to be played in embedded players.");
        break;
      default: // Unexpected error
        console.error('An unexpected error occurred while loading the video.');
    }
  }

  // The API will call this function when the video player is ready
  onPlayerReady(event) {
    //this.setupFrameExceptionCatcher()
    console.log("---------------------- onPlayerReady ------------------------------");
    this.setIsReady(true);
    const player = event.target;
    assert(player === this.player());
    this.play();
    //this.player().style.display = "none";

  }

  /*
  setupFrameExceptionCatcher () {
    const iframes = document.getElementsByTagName('iframe');
    const playerFrame = iframes[0];
    // TODO: add code to catch exceptions within the iframe?
  }
  */

  // The API calls this function when the player's state changes
  onPlayerStateChange(event) {
    this.debugLog("onPlayerStateChange " + event.data)

    const state = Number(event.data);
    switch (state) {
      case -1:
        console.log("Video unstarted");
        break;

      case YT.PlayerState.ENDED:
        console.log("Video ENDED");
        this.onPlayerEnd(event);
        break;

      case YT.PlayerState.PLAYING:
        console.log("Video PLAYING");
        break;

      case YT.PlayerState.PAUSED:
        console.log("Video PAUSED");
        break;

      case YT.PlayerState.BUFFERING:
        console.log("Video BUFFERING");
        break;

      case YT.PlayerState.CUED:
        console.log("Video CUED");
        break;

      default:
        console.log("Video unknown state chage");
    }
  }

  onPlayerEnd(event) {
    if (this.shouldRepeat()) {
      this.player().playVideo(); // Replay the video when it ends
    }
  }

  setVolume(v) { // 0.0 to 1.0
    assert(v >= 0 && v <= 1.0);
    this._volume = v;
    this.updateVolume();
    return this;
  }

  updateVolume() {
    if (this.player()) {
      const v = this.volume()*100;
      //debugger;
      if (this.isReady()) {
        this.debugLog("setting volume to ", v)
        this.debugLog("1 getVolume: ", this.player().getVolume())
        this.player().setVolume(v);
        this.debugLog("2 getVolume: ", this.player().getVolume())
      }
    }
    return this;
  }

  stop() {
    const player = this.player();
    if (this.isReady()) {
      this.player().stopVideo();
    }
    return this;
  }

  shutdown() {
    const player = this.player();
    if (player) {
      player.stopVideo();
      player.destroy();
      this.setPlayer(null);
    }
    return this;
  }
}).initThisClass();

function onYouTubeIframeAPIReady() {
  // called after API code downloads
  YouTubeAudioPlayer.shared().onFrameReady();
}

YouTubeAudioPlayer.shared() // get the iframe and player setup
