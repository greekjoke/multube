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
      app.settingsWrite(true);
    },

    get isReady() { return true; },

    createEnvelope: function() {
      if (dataEnv)
        return console.error('task data envelope already initialized');
      return dataEnv = {
        id: MtUtils.genUid(),
        type: this.type,
        title: 'Untitled',        
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

      this.createMenuItems(elem);      
      this.createMenuSamples(elem);
      this.createMenuRecent(elem);

      const statusElem = elem.find('.bar .status');

      this.statusItems.forEach(x => {
        x.elem = $(x.html);
        x.elem.addClass('status-'+x.id);
        statusElem.append(x.elem);
      });
      
      return uiElem = elem;      
    },

    createMenuItems: function(elem) {
      const self = this;
      const menuElem = elem.find('.bar .settings .submenu');
      const htmlCheck = '<i class="fa-solid fa-check"></i>';

      this.menuItems.forEach(x => {
        if (x.bool) {
          const flagValue = (x.serializable ? (self.envelope[x.id]?1:0) : 0);
          menuElem.append(`<li action="taskCmd" value="${x.id}" flag="${flagValue}">${htmlCheck}${x.title}</li>`);
          menuElem.addClass('has-flags');
        } else {
          menuElem.append(`<li action="taskCmd" value="${x.id}">${x.title}</li>`);
        }
      });

      return menuElem;
    },

    createMenuRecent: function(elem) {
      elem = elem || uiElem;

      const m = elem.find('.bar .settings .submenu');
      const r = app.getRecent(this.type);
      const samples = app.getSamples(this.type);

      m.find('li.recent').remove(); // remove old menu

      if (r.length < 1)
        return;

      const sub = $('<ul action="taskCmd"></ul>');

      r.sort((a, b) => a.title.localeCompare(b.title)); // sort by alphabet

      r.forEach(x => {
        const smp = samples.find(y => y.value === x.value);
        const title = smp ? smp.title : x.title;
        sub.append(`<li value="${x.value}" title="${x.title}">${title}</li>`);
      });
      
      const item = $('<li class="recent"><b>Recent</b></li>');
      item.append(sub);
      m.append(item);

      return sub;
    },

    createMenuSamples: function(elem) {
      elem = elem || uiElem;

      const m = elem.find('.bar .settings .submenu');
      const r = app.getSamples(this.type);

      m.find('li.samples').remove(); // remove old menu

      if (r.length < 1)
        return;

      const sub = $('<ul action="taskCmd"></ul>');

      r.sort((a, b) => a.title.localeCompare(b.title)); // sort by alphabet

      r.forEach(x => {
        sub.append(`<li value="${x.value}">${x.title}</li>`);
      });
      
      const item = $('<li class="samples"><b>Samples</b></li>');
      item.append(sub);
      m.append(item);

      return sub;
    },

    releaseMenu: function() {
      const m = uiElem.find('.bar .settings');
      app.releaseMenu(m);
    },

    setMenuCheck: function(id, flag, menuElem) {
      menuElem = menuElem || uiElem.find('.bar .settings .submenu');
      menuElem.find(`li[value="${id}"]`).attr('flag', flag ? '1' : '0');
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
          if (!this.handleMenuFlags(code)) {            
            console.error('invalid task command', code, target);
          }
          break;
      };
    },

    handleMenuFlags: function(code) {
      const i = this.menuItems.findIndex(x => x.serializable && x.id == code);
      if (i !== -1) {
        const item = this.menuItems[i];
        const id = item.id;
        if (!id) return;
        this.envelope[id] = !this.envelope[id];
        this.onMenuFlagChanged(id, this.envelope[id]);            
        return true;
      }
      return false;
    },

    onMenuFlagChanged: function(id, value) {
      this.setMenuCheck(id, value);
      app.settingsWrite(true);
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
      app.addRecent(this.type, title, value);      
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
