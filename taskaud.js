/* audio task */

window.MtTaskAudio = function() {
  const app = MtApp;  
  const suportCaps = [MtTask.CAPS.PLAYBACK, MtTask.CAPS.VOLUME, MtTask.CAPS.SPEED, MtTask.CAPS.POSITION];
  const parent = MtTask();

  const isRemoteLink = function(link) {
    return link.toLowerCase().indexOf('http') === 0 ||
           link.toLowerCase().indexOf('media/') === 0;
  };

  const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

  parent.statusItems.unshift({ 
    id:'right', 
    html:'<i class="fa-solid fa-arrow-right"></i>' 
  });

  parent.statusItems.unshift({ 
    id:'left', 
    html:'<i class="fa-solid fa-arrow-left"></i>' 
  });

  const obj = {        
    playerReady: false,

    get type() { return 'MtTaskAudio'; },
    get isReady() { return this.playerReady; },
    
    menuItems: [
      { id:'load', title:'Load from file' },
      { id:'left', title:'Left ear', bool:true },
      { id:'right', title:'Right ear', bool:true },
    ],

    get balance() { return this.envelope.balance || 0; },
    set balance(v) { 
      v = parseInt(v);
      if (this.envelope.balance === v)
        return; 
      this.envelope.balance = v; 
      if (this.stereoNode)
        this.stereoNode.pan.value = v;
      this.updateBalanceMenu();      
      app.settingsWrite(true);
    },

    isSupport: function(cap) {      
      return suportCaps.indexOf(cap) != -1;
    },

    command: function(code, target) {
      if (isRemoteLink(code)) {
        this.title = $(target).text();
        this.switchToLink(code);  
        this.releaseMenu();
        return;
      }      
      switch(code) {
        case 'load':
          this.loadFromFile();
          break;
        case 'left':
          this.toggleLeft();          
          break;
        case 'right':
          this.toggleRight();          
          break;
        default:
          parent.command(code, target);
          break;
      };
    },

    toggleLeft: function() {
      const v = this.balance;
      if (v < 1) {
        this.balance = 1; // only right
      } else {
        this.balance = 0; // both
      }
    },

    toggleRight: function() {
      const v = this.balance;
      if (v > -1) {
        this.balance = -1; // only left
      } else {
        this.balance = 0; // both
      }
    },

    updateBalanceMenu: function() {
      const v = this.balance;
      if (v == -1) {
        this.setMenuCheck('left', 1);
        this.setMenuCheck('right', 0);
        this.setStatus('left', 1);
        this.setStatus('right', 0);
      } else if (v == 1) {
        this.setMenuCheck('left', 0);
        this.setMenuCheck('right', 1);
        this.setStatus('left', 0);
        this.setStatus('right', 1);
      } else {
        this.setMenuCheck('left', 1);
        this.setMenuCheck('right', 1);
        this.setStatus('left', 1);
        this.setStatus('right', 1);
      }      
    },

    loadFromFile: function() {
      const self = this;

      MtUtils.selectFile(async (file) => {
        if (file === null) return; // cancel
        
        try {          
          self.title = file.name;
          const url = await toBase64(file);          
          self.switchToLink(url);          
       } catch(error) {
          console.error(error);
          return;
       }
          
      }, '.mp3,.ogg,.wav');
    },

    init: function(link) {
      const self = this;

      console.log('MtTaskAudio.init@1');

      parent.init();

      this.setStatus('general', 'unready');
      this.playerReady = false;

      if (typeof this.balance === undefined) {
        this.balance = 0; // initialize
      }

      this.updateBalanceMenu();

      this.content.html(''); // clear
      this.audioElem = false;
      this.stereoNode = false;

      link = link || this.envelope.link;            
      console.log('MtTaskAudio.init@2', link ? link.substr(0, 20) : false);
      
      if (!link) {
        if (this.title !== 'Untitled') {
          this.content.html(`<div>Data has not been saved</div>`);
        } else {
          this.content.html('empty');
        }
        return;
      }

      this.audioElem = $('<audio controls="controls"></audio>')[0];

      $(this.audioElem).on('canplay ended pause play loadedmetadata', e => {
        switch(e.type) {
          case 'loadedmetadata':
            //console.log('meta', e);
            break;
          case 'canplay':
            self.playerReady = true;
            self.setStatus('general', 'ready');
            break;
          case 'ended':
            self.setStatus('general', 'ended');
            break;
          case 'pause':
            self.setStatus('general', 'paused');
            break;
          case 'play':
            self.tryToInitAudioExt();  
            self.setStatus('general', 'playing');            
            break;
        }        
      });

      this.audioElem.crossOrigin = "anonymous";
      this.audioElem.src = link;

      this.content.append(this.audioElem);
    },

    tryToInitAudioExt: function() {      
      if (this.stereoNode) return;

      AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext(); 
      const track = audioContext.createMediaElementSource(this.audioElem);

      const stereoNode = new StereoPannerNode(
        audioContext, { pan: this.balance });
      //stereoNode.pan.value = 1; // -1=left, 1=right, 0=center

      track
        .connect(stereoNode)
        .connect(audioContext.destination);

      this.stereoNode = stereoNode;
    },

    switchToLink: function(link) {      
      if (!link) return false;
      const save = isRemoteLink(link);
      if (save) {
        if (this.envelope.link == link) return false;
        this.envelope.link = link;   
      } else {
        this.envelope.link = false;
      }
      this.init(link);        
      app.settingsWrite(true);
      return true;
    },    

    play: function() { 
      if (this.audioElem && this.isReady) {        
        this.audioElem.play();
      }
    },

    stop: function() { 
      if (this.audioElem && this.isReady) {
        this.audioElem.load();
      }
    },
    
    pause: function() { 
      if (this.audioElem && this.isReady) {
        this.audioElem.pause();
      }
    },

    mute: function() { 
      if (this.audioElem && this.isReady) {
        this.audioElem.muted = true;
      }
    },

    unmute: function() { 
      if (this.audioElem && this.isReady) {
        this.audioElem.muted = false;
      }
    },

    speed: function(v) { 
      if (this.audioElem && this.isReady) {
        this.audioElem.playbackRate = v;
      }
    },

    duration: function() { 
      if (this.audioElem && this.isReady) {
        return this.audioElem.duration;
      }
      return false; 
    },

    pos: function(v) { 
      if (this.audioElem && this.isReady) {
        const seconds = parseInt(v || 0);
        return this.audioElem.currentTime = seconds;
      }      
    },

  }; // object

  obj.__proto__ = parent;

  return obj;

} // window.MtTaskAudio
