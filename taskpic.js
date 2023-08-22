/* picture task */

window.MtTaskPic = function() {
  const app = MtApp;    
  const parent = MtTask();
  const defaultImageLink = 'https://upload.wikimedia.org/wikipedia/en/6/6e/Intrinsic-Harmony.jpg';

  const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

  const isRemoteLink = function(link) {
    return link.toLowerCase().indexOf('http') === 0 ||
           link.toLowerCase().indexOf('media/') === 0;
  };

  const obj = {        
    imgReady: false,

    get type() { return 'MtTaskPic'; },
    get isReady() { return this.imgReady; },
    get link() { return this.envelope.link; },
        
    menuItems: [
      { id:'select', title:'Select internet picture' },    
      { id:'load', title:'Load from file' },      
    ],

    command: function(code, target) {
      if (isRemoteLink(code)) {
        this.switchToLink(code);
        this.releaseMenu();
        return;
      }      
      switch(code) {
        case 'select':
          this.selectImage();
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
          const url = await toBase64(file);
          self.switchToLink(url);          
       } catch(error) {
          console.error(error);
          return;
       }
          
      }, '.jpg,.jpeg,.png,.gif,.svg');      
    },

    init: function(link) {
      const self = this;

      console.log('MtTaskPic.init@1');

      parent.init();

      this.setStatus('general', 'unready');
      this.imgReady = false;
      this.imgElem = false;

      this.content.html(''); // clear

      link = link || this.envelope.link;            
      console.log('MtTaskPic.init@2', link ? link.substr(0, 20) : false);
      
      if (!link) {
        if (this.title !== 'Untitled') {
          this.content.html(`<div>Data has not been saved</div>`);
        } else {
          this.content.html('empty');
        }
        return;
      }

      this.imgElem = $('<img draggable="false" />')[0];

      $(this.imgElem).on('load', function() {        
        self.imgReady = true;
        self.setStatus('general', 'ready');
      }); 
      
      this.imgElem.src = link;
      this.content.append(this.imgElem);      
    },

    selectImage: function() {
      const self = this;      
      const linkDefault = this.envelope.link || defaultImageLink;
      app.showPrompt('Enter internet image link (like http:// ... jpg, png, etc.)', linkDefault, function(link) {
        self.switchToLink(link);        
      });
    },

    switchToLink: function(link) {      
      if (!link) return false;
      const save = isRemoteLink(link);
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

  }; // object

  obj.__proto__ = parent;

  return obj;

} // window.MtTaskPic
