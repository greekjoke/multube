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
        
    menuItems: [
      { id:'load', title:'Load from file' },
      { id:'select', title:'Select internet text' },          
      { id:'rtext', title:'Reverse text', bool:true, serializable:true },
      { id:'rword', title:'Reverse word', bool:true, serializable:true },
      { id:'mhoriz', title:'Mirror horizontal', bool:true, serializable:true },
      { id:'mvert', title:'Mirror vertical', bool:true, serializable:true },

      /*
      { id:'voice', title:'Voice text', bool:true },            
      { id:'vtype', title:'Voice type', },
      { id:'vpitch', title:'Voice pitch', },
      */
    ],

    createMenuItems: function(elem) {      
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

    isSupport: function(cap) {      
      return suportCaps.indexOf(cap) != -1;
    },

    command: function(code, target) {
      if (isRemoteLink(code)) {
        this.switchToLink(code);
        this.releaseMenu();
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
      this.updateViewFlags();      
      if (this.reading) {
        const rd = this.reading;        
        rd.revWord = this.envelope.rword;
        rd.revText = this.envelope.rtext;
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
        onStatusChanged: function() {
          if (!this.isPlaying && this.isPaused) {
            self.setStatus('general', 'paused');
          } else if (this.isPlaying && !this.isPaused) {
            self.setStatus('general', 'playing');
          } else if (!this.isPlaying && !this.isPaused) {
            self.setStatus('general', 'ready');
          }
        },
        onEnded: function() {          
          self.setStatus('general', 'ended');
        },
      };

      const rd = new MtReading(rdOptions);
      rd.revWord = this.envelope.rword;
      rd.revText = this.envelope.rtext;
      rd.init(text, this.content);
      this.reading = rd; 
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

    play: function() { 
      if (this.reading && this.isReady) {
        this.reading.play();
      }
    },

    stop: function() { 
      if (this.reading && this.isReady) {
        this.reading.stop();
      }
    },
    
    pause: function() { 
      if (this.reading && this.isReady) {
        this.reading.pause();
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
