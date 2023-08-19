/* reading task */

window.MtTaskRead = function() {
  const app = MtApp;    
  const parent = MtTask();
  const defaultLink = 'http://lib.ru/PROZA/BABEL/rasskazy.txt';
  const suportCaps = [MtTask.CAPS.PLAYBACK, MtTask.CAPS.SPEED, MtTask.CAPS.POSITION];

  const isRemoteLink = function(link) {
    return link.toLowerCase().indexOf('http') === 0 ||
           link.toLowerCase().indexOf('media/') === 0;
  };
/*
  const getRemoteText = function(link, cb) {
    $.get(link, function(res) {      
      cb(res);
    }).fail(function(jqXHR, textStatus, errorThrown) {
      console.error(link, errorThrown);
      app.showError('Request failed: ' + link);
    });
  };
*/
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
        
    menuItems: [
      { id:'load', title:'Load from file' },
      { id:'select', title:'Select internet text' },          
      { id:'rtext', title:'Reverse text', bool:true },
      { id:'rword', title:'Reverse word', bool:true },
      { id:'mhoriz', title:'Mirror horizontal', bool:true },
      { id:'mvert', title:'Mirror vertical', bool:true },
      /*
      { id:'enc', title:'Encoding' },
      { id:'utf8', title:'UTF-8', bool:true },
      { id:'win1251', title:'windows-1251', bool:true },
      */
      { id:'voice', title:'Voice text', bool:true },
      /*      
      { id:'vtype', title:'Voice type', },
      { id:'vpitch', title:'Voice pitch', },
      */
    ],

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
        default:
          parent.command(code, target);
          break;
      };
    },

    loadFromFile: function() {      
      const self = this;
      MtUtils.loadFromFile((e, file) => {
        if (e === null) return; // cancel
        const text = 'raw:' + e.target.result;
        self.title = file.name;
        self.switchToLink(text);
      }, (e) => {
        console.error(e);
      }, '.txt');
    },

    init: function(link) {
      const self = this;

      console.log('MtTaskRead.init@1');

      parent.init();

      this.setStatus('general', 'unready');
      this.dataReady = false;

      this.content.html(''); // clear

      link = link || this.envelope.link;            
      console.log('MtTaskRead.init@2', link ? link.substr(0, 20) : false);
      
      if (!link) {
        if (this.title !== 'Untitled') {
          this.content.html(`<div>Data has not been saved</div>`);
        } else {
          this.content.html('empty');
        }
        return;
      }

      const onTextReady = function(text) {        
        self.dataReady = true;
        self.setStatus('general', 'ready');
        
        //let utf8Encode = new TextEncoder();
        //const buf = utf8Encode.encode(text);
        
        console.log('onTextReady', text);

        //let td = new TextDecoder('windows-1251');
        let td = new TextDecoder('utf-8');
        text = td.decode(text);

        


        // TODO: detect encoding
        self.content.text(text); // test      
        
      };

      if (link.indexOf('raw:') === 0) {
        link = link.substr(4);
        onTextReady(link);        
      } else {
        getRemoteText(link, text => {
          onTextReady(text);
        });
      }
    },

    selectLink: function() {
      const self = this;      
      const linkDefault = this.envelope.link || defaultLink;
      app.showPrompt('Enter link to txt file', linkDefault, function(link) {
        self.switchToLink(link);
        self.addRecent(self.title, self.link);
      });
    },

    switchToLink: function(link) {      
      if (!link) return false;
      const save = isRemoteLink(link);
      if (save) {
        if (this.envelope.link == link) return false;
        this.envelope.link = link;   
        this.title = link.split("/").splice(-1).pop();
      } else {
        this.envelope.link = false;
      }
      this.init(link);        
      app.settingWrite(true);
      return true;      
    },    

  }; // object

  obj.__proto__ = parent;

  return obj;

} // window.MtTaskRead
