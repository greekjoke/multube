/* reading task */

window.MtTaskRead = function() {
  const app = MtApp;    
  const parent = MtTask();
  const defaultLink = 'http://lib.ru/PROZA/BABEL/rasskazy.txt';
  const defaultCharset = 'windows-1251';
  const suportCaps = [MtTask.CAPS.PLAYBACK, MtTask.CAPS.SPEED, MtTask.CAPS.POSITION];

  const menuCharset = [    
    { id:'windows-1251', title:'windows-1251'},
    { id:'utf-8', title:'UTF-8' },
    { id:'iso-8859-5', title:'iso-8859-5'},
    { id:'x-mac-cyrillic', title:'x-mac-cyrillic'},    
  ];

  const isRemoteLink = function(link) {    
    return link.toLowerCase().indexOf('http') === 0 ||
           link.toLowerCase().indexOf('media/') === 0;
  };

  const isAbv = function(value) {
    return value && value instanceof ArrayBuffer && value.byteLength !== undefined;
  };
  
  const getRemoteText = function(link, cb) {
    const oReq = new XMLHttpRequest();
    oReq.open("GET", link, true);
    oReq.responseType = "arraybuffer";
    oReq.onload = function(oEvent) {
      var arrayBuffer = oReq.response;
      cb(arrayBuffer);    
    };
    oReq.send();
  };

  const obj = {        
    dataReady: false,

    get type() { return 'MtTaskRead'; },
    get isReady() { return this.dataReady; },
    get link() { return this.envelope.link; },

    get charset() { return this.envelope.charset; },
    set charset(v) {
      if (this.envelope.charset === v) return;
      this.envelope.charset = v;      
      app.settingsWrite(true);
    },

    
    get isNeedSpeaking() {
      return this.speaker && this.envelope.speak;      
    },
        
    menuItems: [
      { id:'load', title:'Load from file' },
      { id:'select', title:'Select internet text' },          
      { id:'rtext', title:'Reverse text', bool:true, serializable:true },
      { id:'rword', title:'Reverse word', bool:true, serializable:true },
      { id:'mhoriz', title:'Mirror horizontal', bool:true, serializable:true },
      { id:'mvert', title:'Mirror vertical', bool:true, serializable:true },
      { id:'speak', title:'Speak text', bool:true, serializable:true },
    ],

    createMenuItems: function(elem) { 
      
      this.envelope.speak = false; // always off at start
      
      const m = parent.createMenuItems.call(this, elem);
      const sub = $('<ul action="taskCmd" class="has-flags"></ul>');
      const htmlCheck = '<i class="fa-solid fa-check"></i>';

      menuCharset.forEach(x => {        
        sub.append(`<li value="${x.id}" flag="0">${htmlCheck}${x.title}</li>`);        
      });
      
      const item = $('<li class="charset"><b>Charset</b></li>');
      item.append(sub);
      m.append(item);

      return m;
    },

    createMenuVoices: function(elem) {
      elem = elem || this.element;

      const htmlCheck = '<i class="fa-solid fa-check"></i>';
      const m = elem.find('.bar .settings .submenu');
      const list = this.speaker.voices || [];

      m.find('li.voices').remove(); // remove old menu

      if (list.length < 1 || !this.envelope.speak)
        return;

      const sub = $('<ul action="taskCmd" class="has-flags"></ul>');

      list.forEach((x, i) => {                
        sub.append(`<li value="voice:${i}" flag="0" title="${x.name}">${htmlCheck}${x.name}</li>`);
      });
      
      const item = $('<li class="voices"><b>Voices</b></li>');
      item.append(sub);
      //m.append(item);
      item.insertAfter(m.find('li[value="speak"]'));

      return sub;
    },

    isSupport: function(cap) {      
      return suportCaps.indexOf(cap) != -1;
    },

    command: function(code, target) {
      if (isRemoteLink(code)) {
        this.switchToLink(code);
        this.releaseMenu();
        return;
      }    
      if (code.indexOf('voice:') === 0) {
        code = code.substr('voice:'.length);
        this.switchVoice(code);
        return;
      }  
      switch(code) {
        case 'select':
          this.selectLink();
          break;
        case 'load':
          this.loadFromFile();
          break;
        case 'utf-8':
        case 'windows-1251':
        case 'iso-8859-5':
        case 'x-mac-cyrillic':
          this.switchCharset(code);
          break;        
        default:
          if (!this.handleMenuFlags(code)) {
            parent.command(code, target);
          }
          break;
      };
    },

    onMenuFlagChanged: function(id, value) {
      parent.onMenuFlagChanged(id, value);

      if (id == 'speak') {        
        if (this.envelope.speak && this.speaker) {
          this.reading.pauseAtEOS = true;
          this.speaker.init();
          this.createMenuVoices();
          this.switchVoice(this.envelope.voice);
        } else if (!this.envelope.speak) {
          this.reading.pauseAtEOS = false;
          this.createMenuVoices();
        }
      } else {
        this.updateViewFlags();      
        if (this.reading) {
          const rd = this.reading;
          rd.revWord = this.envelope.rword;
          rd.revText = this.envelope.rtext;
        }
      }
    },

    updateViewFlags: function() {
      const self = this;
      const list = ['rtext', 'rword', 'mhoriz', 'mvert'];
      list.forEach(x => {
        const v = !!self.envelope[x];
        if (v) {
          self.element.addClass('view-' + x);
        } else {
          self.element.removeClass('view-' + x);
        }
      });
    },

    loadFromFile: function() {      
      const self = this;
      MtUtils.loadFromFile((e, file) => {
        if (e === null) return; // cancel
        const bin = e.target.result;
        self.title = file.name;
        self.switchToLink(bin);
      }, (e) => {
        console.error(e);
      }, {ext:'.txt', asBuffer:true});
    },

    init: function(link) {
      const self = this;

      console.log('MtTaskRead.init@1');

      parent.init();

      this.setStatus('general', 'unready');
      this.reading = false;      
      this.dataReady = false;      
      this.charset = this.charset || defaultCharset;      
      this.updateViewFlags();
      this.switchCharset(this.charset);      
      this.content.html(''); // clear

      link = link || this.link;
      console.log('MtTaskRead.init@2', link);
      
      if (!link) {
        if (this.title !== 'Untitled') {
          this.content.html(`<div>Data has not been saved</div>`);
        } else {
          this.content.html('empty');
        }
        return;
      }

      const oldSpeaker = this.speaker;

      this.speaker = MtAudio.Speaker({        
        onSpeakEnd: (e) => {
          console.log('onSpeakEnd');          
          self.tryToSpeakText();
        },
      });      

      if (oldSpeaker) {
        this.speaker.curVoice = this.envelope.voice || 0;
        this.speaker.init();
      }

      if (isAbv(link)) {
        this.onTextReady(link);
      } else {
        getRemoteText(link, bin => {          
          self.onTextReady(bin);
        });
      }
    },

    onTextReady: function(bin) {    
      const self = this;

      this.binData = bin;
      this.dataReady = true;
      this.setStatus('general', 'ready');            

      const td = new TextDecoder(this.charset);
      const text = td.decode(bin);

      const rdOptions = {        
        onStatusChanged: function(byUser) {
          if (!this.isPlaying && this.isPaused) {
            self.setStatus('general', 'paused');
            if (!byUser) {
              self.tryToSpeakText();
            }
            if (self.speaker && byUser) {
              self.speaker.pause();
            }
          } else if (this.isPlaying && !this.isPaused) {
            self.setStatus('general', 'playing');
            if (self.speaker && byUser) {
              self.speaker.resume();
            }
          } else if (!this.isPlaying && !this.isPaused) {
            self.setStatus('general', 'ready');
            if (self.speaker && byUser) {
              self.speaker.stop();
            }
          }
        },
        onEnded: function() {          
          self.setStatus('general', 'ended');
          if (self.speaker) {
            //self.speaker.stop();
          }
        },
        onNext: function(startPos) {
          const str = this.getSentence(startPos);
          console.log('new senctence', str, startPos);
          if (self.isNeedSpeaking) {
            console.log('onReadingNext');
            self.nextSpeakText = str;
            self.tryToSpeakText();
          }
        },
      };

      const rd = new MtReading(rdOptions);
      rd.revWord = this.envelope.rword;
      rd.revText = this.envelope.rtext;
      rd.init(text, this.content);
      this.reading = rd; 
    },

    tryToSpeakText: function() {
      const r = this.reading;
      console.log('tryToSpeakText', this.nextSpeakText, r.isPaused);
      if (this.nextSpeakText) {
        if (!this.speaker.isSpeaking) {
          if (this.speaker.speak(this.nextSpeakText) !== false) {
            this.nextSpeakText = false;
          }
        }
      }
      if (r) {
        if (r.isPaused) {          
          r.play(); // next reading
        }
      }
    },

    selectLink: function() {
      const self = this;      
      const linkDefault = this.envelope.link || defaultLink;
      app.showPrompt('Enter link to txt file', linkDefault, function(link) {
        self.switchToLink(link);        
      });
    },

    switchToLink: function(link) {      
      if (!link) return false;      
      const save = !isAbv(link) && isRemoteLink(link);
      if (save) {
        if (this.envelope.link == link) return false;
        this.envelope.link = link;   
        this.title = link.split("/").splice(-1).pop();
        this.addRecent(this.title, this.link);
      } else {
        this.envelope.link = false;
      }
      this.init(link);        
      app.settingsWrite(true);
      return true;      
    },    

    switchCharset: function(v) {      
      const refresh = (this.charset === v);
      const m = this.element.find('.bar .settings .submenu .charset');      
      app.updateSwithFlags(m, v);
      this.charset = v;
      if (!refresh && this.binData) {
        this.init(this.binData); // reload
      }
    },

    testVoice: function() {      
      const testText = this.content.find('.center').text();
      if (testText && this.speaker) {
        // test speaking with current word        
        this.speaker.speak(testText);
      }
    },

    switchVoice: function(v) {
      v = parseInt(v || 0);
      //if (this.envelope.voice === v) return;
      if (this.speaker) {
        const list = this.speaker.voices || [];
        if (v < 0 || v >= list.length) v = 0;
        this.envelope.voice = v;
        this.speaker.curVoice = v;
        this.testVoice();
      } else {
        this.envelope.voice = false;
      }      
      const m = this.element.find('.bar .settings .submenu .voices');      
      app.updateSwithFlags(m, 'voice:'+v);
      app.settingsWrite(true);
    },

    play: function() { 
      if (this.reading && this.isReady) {        
        this.reading.play(true);        
      }      
    },

    stop: function() { 
      if (this.reading && this.isReady) {
        this.reading.stop(true);        
      }      
    },
    
    pause: function() { 
      if (this.reading && this.isReady) {
        this.reading.pause(true);        
      }      
    },

    speed: function(v) { 
      if (this.reading && this.isReady) {
        this.reading.speed = v;
      }
    },

    duration: function() { 
      if (this.reading && this.isReady) {
        return this.reading.count - 1;
      }
      return false; 
    },

    pos: function(v) { 
      if (this.reading && this.isReady) {
        this.reading.pos = v;
      }
    },

  }; // object

  obj.__proto__ = parent;

  return obj;

} // window.MtTaskRead
