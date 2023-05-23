"use strict";

/* 
    YouTubeAudioPlayer
*/

(class YouTubeAudioPlayer extends Base {
  initPrototypeSlots() {
    this.newSlot("element", null);
    this.newSlot("playerPromise", null); // resolves once player is available. Use .then() on this to queue actions to wait on it
    this.newSlot("player", null); // to store the YouTube player
    this.newSlot("isReady", false); 
    this.newSlot("videoId", null);
    this.newSlot("shouldRepeat", true);
    this.newSlot("frameIsReady", null);
    this.newSlot("volume", 0.05);
  }

  init() {
    super.init();
    //debugger;
    //this.loadFrameAPI(); // set this up, then we'll set up the player
    this.setIsDebugging(false);
  }

  playerPromise () {
    if (!this._playerPromise) {
      this._playerPromise = new Promise((resolve, reject) => {
        this._resolvePlayer = resolve;
        this._rejectPlayer = reject;
      });
      this.loadFrameAPI(); // this will call setupPlayer after frame is loaded
    }
    return this._playerPromise;
  }

  setPlayer (aPlayer) {
    this._player= aPlayer;
    if (this._resolvePlayer) {
      this._resolvePlayer()
    }
    return this;
  }

  loadFrameAPI() {
    this.debugLog("loadFrameAPI()");
    // Load the YouTube IFrame Player API asynchronously
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    return this;
  }

  onFrameReady() {
    this.debugLog("onFrameReady()");
    this.setFrameIsReady(true);
    this.setupPlayer()
    return this;
  }

  setupPlayer() {
    this.debugLog("setupPlayer()");
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

    try {
      const player = new YT.Player("youTubePlayer", json);
      assert(player);
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
    if (!this.videoId()) {
      return;
    }

    this.playerPromise().then(() => {
      this.debugLog("play() after promise");
      const startSeconds = 0.0;
      this.player().loadVideoById(this.videoId(), startSeconds);
      //this.player().playVideo();
      this.updateVolume();
    })
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
    this.debugLog("onPlayerReady()");
    this.setIsReady(true);
    const player = event.target;
    assert(player === this.player());
    this.play();
    debugger;
    //this.player().style.display = "none";
  }

  // The YouTube API calls this function when the player's state changes
  onPlayerStateChange(event) {
    this.debugLog("onPlayerStateChange " + event.data)

    const state = Number(event.data);
    switch (state) {
      case -1:
        this.debugLog("Video unstarted");
        break;

      case YT.PlayerState.ENDED:
        this.debugLog("Video ENDED");
        this.onPlayerEnd(event);
        break;

      case YT.PlayerState.PLAYING:
        this.debugLog("Video PLAYING");
        break;

      case YT.PlayerState.PAUSED:
        this.debugLog("Video PAUSED");
        break;

      case YT.PlayerState.BUFFERING:
        this.debugLog("Video BUFFERING");
        break;

      case YT.PlayerState.CUED:
        this.debugLog("Video CUED");
        break;

      default:
        this.debugLog("Video unknown state chage");
    }
  }

  onPlayerEnd(event) {
    if (this.shouldRepeat()) {
      this.player().playVideo(); // Replay the video when it ends
    }
  }

  setVolume(v) { // 0.0 to 1.0
    this.playerPromise().then(() => {
      assert(v >= 0 && v <= 1.0);
      this._volume = v;
      this.updateVolume();
    });
    return this;
  }

  updateVolume() {
    this.playerPromise().then(() => {
      const v = this.volume()*100;
      if (this.isReady()) {
        this.debugLog("set volume:", v)
        this.player().setVolume(v);
        this.debugLog("getVolume: ", this.player().getVolume())
        assert(v === this.player().getVolume());
      }
    });
    return this;
  }

  stop() {
    this.playerPromise().then(() => {
      this.player().stopVideo();
    });
    return this;
  }

  shutdown() {
    this.playerPromise().then(() => {
      const player = this.player();
      player.stopVideo();
      player.destroy();
      this.setPlayer(null);
    });
    return this;
  }
}).initThisClass();

function onYouTubeIframeAPIReady() {
  // called after API code downloads
  YouTubeAudioPlayer.shared().onFrameReady();
}

//YouTubeAudioPlayer.shared() // get the iframe and player setup
