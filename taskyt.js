/* youtube video task */

window.MtTaskYt = function() {
  const app = MtApp;
  const parent = MtTask();

  const linkParser = function(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return (match && match[7].length == 11) ? match[7] : false;
  }

  const obj = {    
    get type() { return 'MtTaskYt'; },

    menuItems: [
      { id:'select', title:'Select video' },      
    ],

    playerReady: false,

    command: function(code, target) {
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

      if (!window.MtTaskYt.YouTubeIframeAPIReady)
        return;

      const self = this;      
      const dom = $(this.content)[0];
      const link = this.envelope.link;
      if (!link) return;      
      const res = linkParser(link);
      if (!res) return;

      const onPlayerReady = function(event) {  
        self.playerReady = true;
        self.setStatus('general', 'ready');
        const data = self.player.getVideoData();
        if (data.title) {
          self.title = data.title;
        }
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
        width: '100%',
        height: 'auto',
        videoId: res,
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }
      });
    },

    selectVideo: function() {
      const self = this;
      const linkDefault = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      app.showPrompt('Enter link to youtube video', linkDefault, function(link) {
        const res = linkParser(link);
        if (!res) return;
        self.envelope.link = link;        
        self.init();
        app.settingWrite(true);
      });
    },
  };

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