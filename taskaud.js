/* audio task */

window.MtTaskAudio = function() {
  const app = MtApp;  
  const suportCaps = [MtTask.CAPS.PLAYBACK, MtTask.CAPS.VOLUME, MtTask.CAPS.SPEED, MtTask.CAPS.POSITION];
  const parent = MtTask();

  const obj = {    
    playerReady: false,

    get type() { return 'MtTaskAudio'; },
    get isReady() { return this.playerReady; },
    
    menuItems: [
      { id:'load', title:'Load from file' },
      { id:'left', title:'Left ear' },
      { id:'right', title:'Right ear' },
    ],

    command: function(code, target) {      
      switch(code) {
        case 'load':
          // TODO:
          break;
        case 'left':
          // TODO:
          break;
        case 'right':
          // TODO:
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

      //this.envelope.link = ''; // audio source
      //this.envelope.balance = 0; // -1, 0, 1 

      // TODO:

    },

    isSupport: function(cap) {      
      return suportCaps.indexOf(cap) != -1;
    },

    play: function() { 
      // TODO:
    },

    stop: function() { 
      // TODO:
    },
    
    pause: function() { 
      // TODO:
    },

    mute: function() { 
      // TODO:
    },

    unmute: function() { 
      // TODO:
    },

    speed: function(v) { 
      // TODO:
    },

    duration: function() { 
      // TODO:      
      return false; 
    },

    pos: function(v) { 
      // TODO:
    },

  }; // object

  obj.__proto__ = parent;

  return obj;

} // window.MtTaskAudio
