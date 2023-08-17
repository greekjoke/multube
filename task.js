/* task's base object */

window.MtTask = function() {
  const app = MtApp;
  let uiElem = null;
  let dataEnv = null;
  
  return {

    menuItems: [      
      { id:'remove', title:'Remove task' },
    ],

    statusItems: [
      { id:'general', html:'<i class="fa-solid fa-question"></i>' }
    ],

    get envelope() { return dataEnv; },
    set envelope(v) { dataEnv = v; },

    get element() { return uiElem; },
    get content() { return uiElem.find('.content'); },
    get id() { return dataEnv.id; },
    get type() { return 'MtTask'; },

    get title() { return dataEnv.title; },
    set title(v) { 
      dataEnv.title = v; 
      uiElem.find('.bar .title').text(v);
      app.settingWrite(true);
    },

    get isReady() { return true; },

    createEnvelope: function() {
      if (dataEnv)
        return console.error('task data envelope already initialized');
      return dataEnv = {
        id: MtUtils.genUid(),
        type: this.type,
        title: 'Untitled',
        recent: [],
        samples: [],
      };
    },

    createUI: function() {
      if (uiElem)
        return console.error('task UI already initialized');
      if (!dataEnv)
        return console.error('task data envelope is not initialized');
      
      const html = $('#tpl-task').html();
      const elem = $(html);
      
      elem.attr('id', dataEnv.id);
      elem.attr('data-type', dataEnv.type);
      elem.find('.bar .title').text(dataEnv.title);

      const menuElem = elem.find('.bar .settings .submenu');

      this.menuItems.forEach(x => {
        menuElem.append(`<li action="taskCmd" value="${x.id}">${x.title}</li>`);
      });

      this.createMenuRecent(menuElem);
      this.createMenuSamples(menuElem);

      const statusElem = elem.find('.bar .status');

      this.statusItems.forEach(x => {
        x.elem = $(x.html);
        statusElem.append(x.elem);
      });
      
      return uiElem = elem;      
    },

    createMenuRecent: function(m) {
      if (dataEnv.recent.length < 1)
        return;

      const sub = $('<ul action="taskCmd"></ul>');

      dataEnv.recent.forEach(x => {
        sub.append(`<li value="${x.value}">${x.title}</li>`);
      });

      const item = $('<li><b>Recent</b></li>');
      item.append(sub);
      m.append(item);
    },

    createMenuSamples: function(m) {
      // TODO:
    },

    releaseMenu: function() {
      const m = uiElem.find('.bar .settings');
      app.releaseMenu(m);
    },

    init: function() {
      // NOTE: task registration is done, get ready to work
    },

    command: function(code, target) {
      switch(code) {
        case 'remove':
          app.removeTask(this.envelope.id);
          break;
        default:
          console.error('invalid task command', code, target);
          break;
      };
    },

    setStatus: function(statusId, value) {
      statusId = statusId || 'general';

      const s = this.statusItems.find(x => {
        return x.id === statusId ? x : undefined;
      });
      
      if (!s) 
        return console.error('invalid status id', statusId);

      s.elem.attr('value', value);
    },

    addRecent: function(title, value) {
      dataEnv.recent = dataEnv.recent || [];

      const index = dataEnv.recent.findIndex(x => x.value === value);
      let item = { title:title, value:value };
      
      if (index != -1) {        
        if (index === 0)
          return; // no any moves needed          
        item = dataEnv.recent.splice(index, 1).pop(); // take exists item
      }
      
      dataEnv.recent.unshift(item); // put at the start of an array

      if (dataEnv.recent.length > 10) {
        dataEnv.recent.splice(10); // remove last one    
      }

      console.log('addRecent@5', item, dataEnv.recent);

      app.settingWrite(true);

      // TODO: rebuild menu
    },

    isSupport: function(cap) {      
      return false;
    },
    
    play: function() { },
    stop: function() { },
    pause: function() { },
    mute: function() { },
    unmute: function() { },
    speed: function(v) { },
    duration: function() { return false; },
    pos: function(v) { },

  }; // object

} // window.MtTask

window.MtTask.CAPS = { // task capability
  PLAYBACK: 'playback', // playback control
  VOLUME: 'volume', // volume control
  SPEED: 'speed', // speed control
  POSITION: 'position', // position control
};
