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

  const obj = {        
    dataReady: false,

    get type() { return 'MtTaskRead'; },
    get isReady() { return this.dataReady; },
    get link() { return this.envelope.link; },
        
    menuItems: [
      { id:'select', title:'Select internet text' },    
      { id:'load', title:'Load from file' },      
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

      MtUtils.selectFile(async (file) => {
        if (file === null) return; // cancel
        
        try {          
          self.title = file.name;

          // TODO:

          /*
          const url = await toBase64(file);
          self.switchToLink(url);          
          */
       } catch(error) {
          console.error(error);
          return;
       }
          
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

      
      // TODO


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
