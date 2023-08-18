/* iFrame task */

window.MtTaskFrame = function() {
  const app = MtApp;    
  const parent = MtTask();
  const defaultURL = 'https://greekjoke.github.io/counter/';

  const obj = {        
    frameReady: false,

    get type() { return 'MtTaskFrame'; },
    get isReady() { return this.frameReady; },
    get link() { return this.envelope.link; },
        
    menuItems: [
      { id:'select', title:'Select URL' },              
    ],

    command: function(code, target) {   
      if (code.toLowerCase().indexOf('http') === 0) {        
        this.switchToLink(code);  
        this.releaseMenu();
        return;
      }         
      switch(code) {
        case 'select':
          this.selectURL();
          break;        
        default:
          parent.command(code, target);
          break;
      };
    },

    init: function(link) {
      const self = this;

      console.log('MtTaskFrame.init@1');

      parent.init();

      this.setStatus('general', 'unready');
      this.frameReady = false;

      this.content.html(''); // clear

      link = link || this.envelope.link;            
      console.log('MtTaskFrame.init@2', link);
      
      if (!link) {      
        this.content.html('empty');      
        return;
      }

      this.frameElem = $('<iframe />')[0];

      $(this.frameElem).on('load', function() {
        self.frameReady = true;
        self.setStatus('general', 'ready');
        self.title = link;
        self.addRecent(self.title, self.link);
      }); 
      
      this.frameElem.src = link;
      this.content.append(this.frameElem);      
    },

    selectURL: function() {
      const self = this;      
      const linkDefault = this.envelope.link || defaultURL;
      const mes = 'Enter site address (like http://...)';
      app.showPrompt(mes, linkDefault, function(link) {
        if (link.toLowerCase().indexOf('http') !== 0)
          link = 'http://' + link;
        self.switchToLink(link);        
      });
    },

    switchToLink: function(link) {      
      if (!link) return false;      
      if (this.envelope.link == link) return false;
      this.envelope.link = link;   
      
      // TODO:
      //this.title = link.split("/").splice(-1).pop();

      this.init(link);
      app.settingWrite(true);
      return true;      
    },    

  }; // object

  obj.__proto__ = parent;

  return obj;

} // window.MtTaskFrame
