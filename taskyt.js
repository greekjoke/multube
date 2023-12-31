/* youtube video task */

window.MtTaskYt = function() {
  MtTaskYt.initOnce();

  const app = MtApp;
  const defaultYoutubeVideo = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const suportCaps = [MtTask.CAPS.PLAYBACK, MtTask.CAPS.VOLUME, MtTask.CAPS.SPEED, MtTask.CAPS.POSITION];
  const parent = MtTask();  

  const linkParser = function(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return (match && match[7].length == 11) ? match[7] : false;
  }

  const obj = {    
    playerReady: false,

    get type() { return 'MtTaskYt'; },
    get isReady() { return this.playerReady; },
    get link() { return this.envelope.link; },

    get volume() { return this.envelope.volume || 100; },
    set volume(v) {
      v = parseInt(v);
      if (this.envelope.volume === v) return;
      this.envelope.volume = v;
      app.settingsWrite(true);      
    },

    get playbackRate() { return this.envelope.playbackRate || 1.0; },
    set playbackRate(v) {
      v = parseFloat(v);
      const old = this.envelope.playbackRate || 1.0;
      if (Math.round(old * 100) === Math.round(v * 100)) return;
      this.envelope.playbackRate = v;
      app.settingsWrite(true);
    },

    menuItems: [
      { id:'select', title:'Select Youtube video' },      
    ],

    command: function(code, target) {
      if (code.toLowerCase().indexOf('http') === 0) {
        this.switchToLink(code);
        this.releaseMenu();
        return;
      }
      switch(code) {
        case 'select':
          this.selectVideo();          
          break;
        default:
          parent.command(code, target);
          break;
      };
    },

    init: function() {   

      parent.init();

      this.setStatus('general', 'unready');
      this.playerReady = false;

      if (!window.MtTaskYt.YouTubeIframeAPIReady) {
        //console.error('YoutubeAPI is not ready');
        this.content.html('<span class="error">Youtube API is not ready</span>');
        return;
      }

      const self = this;      
      const link = this.envelope.link;            
      if (!link) return;      
      const res = linkParser(link);
      if (!res) return;

      const dom = $('<div class="content"></div>')[0];
      const wr = this.content.closest('.content-wrap');      
      wr.html('');
      wr.append($(dom));      
                                     
      const onPlayerReady = function(event) {  
        self.playerReady = true;
        self.setStatus('general', 'ready');
        const data = self.player.getVideoData();        
        if (data.title && data.title !== self.title) {
          self.title = data.title;          
        }        
        self.addRecent(self.title, self.link);
        self.player.setVolume(self.volume);
        self.player.setPlaybackRate(self.playbackRate);
      };
    
      const onPlayerStateChange = function(event) {        
        if (event.data == YT.PlayerState.PLAYING) {
          self.setStatus('general', 'playing');
        } else if (event.data == YT.PlayerState.PAUSED) {
          self.setStatus('general', 'paused');
        } else if (event.data == YT.PlayerState.ENDED) {
          self.setStatus('general', 'ended');
        }
      };

      this.player = new YT.Player(dom, {
        width: 'auto',
        height: '100%',
        videoId: res,
        /*
        playerVars: {
          'autoplay': 1,
          'loop': 1,
          'mute': 1
        },*/
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }
      });
    },

    onWindowMessage: function(event) {
      if (!this.player) return;      
      const ifr = this.player.getIframe().contentWindow;
      if (event.source !== ifr) return;          
      const data = JSON.parse(event.data);
      if (data.event === "infoDelivery" && data.info) {        
        if (data.info.volume) {        
          this.volume = data.info.volume;
        } else if (data.info.playbackRate) {        
          this.playbackRate = data.info.playbackRate;
        }
      }
    },

    switchToLink: function(link) {
      const res = linkParser(link);
      if (!res) return false;
      if (this.envelope.link == link) return false;
      this.envelope.link = link;        
      this.init();        
      app.settingsWrite(true);
      return true;
    },

    selectVideo: function() {
      const self = this;      
      const linkDefault = this.envelope.link || defaultYoutubeVideo;
      app.showPrompt('Enter link to youtube video', linkDefault, function(link) {
        self.switchToLink(link);
      });
    },

    isSupport: function(cap) {      
      return suportCaps.indexOf(cap) != -1;
    },

    play: function() { 
      if (this.player && this.playerReady) {        
        this.player.playVideo();
      }
    },

    stop: function() { 
      if (this.player && this.playerReady) {        
        this.player.stopVideo();
      }
    },
    
    pause: function() { 
      if (this.player && this.playerReady) {        
        this.player.pauseVideo();
      }
    },

    mute: function() { 
      if (this.player && this.playerReady) {        
        this.player.mute();
      }
    },

    unmute: function() { 
      if (this.player && this.playerReady) {        
        this.player.unMute();
      }
    },

    speed: function(v) { 
      if (this.player && this.playerReady) {          
        this.player.setPlaybackRate(parseFloat(v));
      }
    },

    duration: function() { 
      if (this.player && this.playerReady) {
        return this.player.getDuration();
      }
      return false; 
    },

    pos: function(v) { 
      const seconds = parseInt(v || 0);
      this.player.seekTo(seconds, true);
    },

  }; // object

  obj.__proto__ = parent;

  return obj;

} // window.MtTaskYt

window.MtTaskYt.YouTubeIframeAPIReady = false;

function onYouTubeIframeAPIReady() {
  console.log('onYouTubeIframeAPIReady');
  window.MtTaskYt.YouTubeIframeAPIReady = true;
  if (!window.MtApp.ready) return;
  for(const i in window.MtApp.tlist) {
    const t = window.MtApp.tlist[i];    
    if (t.type !== 'MtTaskYt') continue;
    t.init();
  }
}

window.MtTaskYt.initOnce = function() {  
  if (window.MtTaskYt.__initOnce) return;
  window.MtTaskYt.__initOnce = true;
  window.addEventListener("message", function(event) {
    for(let id in MtApp.tlist) {
      const t = MtApp.tlist[id];
      if (t.type === 'MtTaskYt') {
        t.onWindowMessage(event); // dispatch to task
      }
    }    
  });  
}
