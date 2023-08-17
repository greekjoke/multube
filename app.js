/* application core object */

window.MtApp = {

  settings: {
    version: '0.1',
    timestamp: '',
    curLang: 'en',
    curScheme: 'default',
    curPreset: 'default',    
    presets: [
      {
        id: 'default',
        name: 'Default',
        tasks: [],
      },      
    ],
    recent: {},    
  },

  tlist: {},
  ready: false,
  maxRecentItems: 10,
  samples: {},

  init: function(opt) {
    opt = opt || {};
    
    if (!MtUtils.hasQueryKey('reset')) {      
      this.settingsRead();
    } else {
      console.info('settings loading was ignoreed by query key');
    }

    this.updateMenuPresets();
    this.updateSwithFlags('#topmenuColors', this.settings.curScheme);
    this.updatePreset();

    this.ready = true;
  },

  releaseMenu: function(menu) {
    menu = menu || '#topmenu';
    $(menu).addClass('disabled');
    setTimeout(() => $(menu).removeClass('disabled'), 100);
  },

  releaseMenuGc: function() {    
    this.releaseMenu($('#gcMenuSpeed'));
  },

  showPrompt: function(text, def, fnOk, fnCancel) {
    fnCancel = fnCancel || function() {};
    const str = window.prompt(text, def || '');    
    if (str === null)
      return fnCancel.call(this);
    fnOk.call(this, str);    
  },

  showConfirm: function(text, fnOk, fnCancel) {
    fnCancel = fnCancel || function() {};    
    if (!window.confirm(text))
      return fnCancel.call(this);
    fnOk.call(this);    
  },

  showError: function(text, fnOk) {    
    window.alert(text);    
    if (fnOk) fnOk.call(this);
  },

  getPresetByName: function(s) {
    return this.settings.presets.find(x => {
      return x.name === s ? x : undefined;
    });
  },

  getPresetById: function(s) {
    return this.settings.presets.find(x => {
      return x.id === s ? x : undefined;
    });
  },

  getPreset: function() {
    return this.getPresetById(this.settings.curPreset);
  },

  updateMenuPresets: function() {     
    const cur = this.settings.curPreset;   
    const htmlCheck = '<i class="fa-solid fa-check"></i>';
    const list = $('#topmenuPresets');
    list.html(''); // clear    
    this.settings.presets.forEach(x => {
      const ch = x.id === cur ? '1' : '0';
      list.append(`<li value="${x.id}" flag="${ch}">${htmlCheck}${x.name}</li>`);
    });    
  },

  updatePreset: function() {
    const p = this.getPreset();
    const con = $('#widgets');

    con.find('.task').remove();

    if (p.tasks.length > 0) {
      con.find('.placeholder').hide();
    } else {
      con.find('.placeholder').show();
    }

    this.tlist = {};

    for(const i in p.tasks) {
      const data = p.tasks[i];
      const fn = window[data.type];
      if (typeof(fn) !== 'function') {
        console.error('invalid task type', data.type);
        continue;
      }      
      const t = fn.call(this);
      t.envelope = data;
      const elem = t.createUI();
      this._registerTaskUI(elem);      
      this.tlist[t.id] = t;
      t.init();
      this.onTaskAdded(t);
    }

    this.updateGlobalCaps();
  },

  updateSwithFlags: function(con, value) {
    const list = $(con);
    list.find('li').attr('flag', 0);
    list.find(`li[value="${value}"]`).attr('flag', 1);
  },

  addPreset: function() {    
    const self = this;

    this.showPrompt('Enter name for new preset', '', str => {      
      str = str.trim().substring(0, 32);      
      
      if (str.length < 1)
        return self.showError('Empty name is not allowed');      
      
      if (self.getPresetByName(str))
        return self.showError('Preset with this name is already in use');

      const id = MtUtils.genUid();
      
      self.settings.presets.push({
        id: id,
        name: str,
        tasks: [],
      });

      self.updateMenuPresets();
      self.switchPreset(id);
    });    
  },

  removePreset: function() {
    const self = this;
    const cur = this.settings.curPreset;

    if (cur === 'default')
      return this.showError('Default preset can\'t be removed');

    const p = this.getPresetById(cur);

    if (!p)
      return console.error('invalid preset id', cur);

    const ar = this.settings.presets;
    const index = ar.findIndex(x => x.id == p.id);

    this.showConfirm(`Remove preset "${p.name}"?`, function() {
      ar.splice(index, 1);
      self.updateMenuPresets();
      self.switchPreset('default');      
    });
  },

  switchPreset: function(value) {
    const cur = this.settings.curPreset;

    if (value === cur)
      return; // already
    
    const p = this.getPresetById(value);

    if (!p)
      return console.error('invalid preset id', value);

    this.settings.curPreset = value;

    this.updateSwithFlags('#topmenuPresets', value);
    this.updatePreset();
    this.settingWrite();
  },

  switchColors: function(value) {
    const cur = this.settings.curScheme;

    if (value === cur)
      return; // already

    this.settings.curScheme = value;

    $('body').attr('color-scheme', value);

    this.updateSwithFlags('#topmenuColors', value);
    this.settingWrite();
  },

  _deferredSettingsWriteTimer: null,

  settingWrite: function(deferred) {
    if (deferred) {
      const self = this;      
      clearTimeout(this._deferredSettingsWriteTimer);            
      _deferredSettingsWriteTimer = setTimeout(function() {        
        self.settingWrite();
      }, 500);
      return;
    }    
    const dt = new Date();    
    this.settings.timestamp = dt.getTime();
    if (!MtUtils.storageWrite('mt', this.settings)) {
      console.error('storage writing failed');
    }
  },

  settingsRead: function() {
    const data = MtUtils.storageRead('mt');
    if (data !== false) {
      this.settings = data;
      return true;
    }
    return false;
  },

  settingsToFile: function() {
    MtUtils.saveToFile(this.settings, 'multube.json');
    this.releaseMenu();
  },

  settingsFromFile: function() {
    const self = this;

    MtUtils.loadFromFile(
      (e) => {
        if (e === null) return; // cancel
        
        const obj = JSON.parse(e.target.result);
          
        if (!obj) 
          return self.showError('json parsing failed');

        if (typeof(obj.version) !== 'string' ||
            typeof(obj.presets) !== 'object')
        {
          return self.showError('invalid or corrupted file');
        }

        self.settings = obj;
        self.settingWrite();  

        document.location.reload();
      }, (e) => {
        self.showError(e.target.error.name);
      }, '.json');
  },

  removeAllTasks: function() {
    const self = this;
    const p = this.getPreset();
    const con = $('#widgets');
    this.showConfirm(`Remove all tasks?`, function() {
      con.find('.task').remove();
      con.find('.placeholder').show();
      p.tasks.forEach(x => self.onTaskRemoved(x));
      p.tasks = [];     
      self.tlist = {};      
      self.settingWrite();
    });
  },

  removeTask: function(id) {
    const self = this;    
    const t = this.getTaskById(id);

    if (!t)
      return console.error('invalid task id', id);

    this.showConfirm(`Remove this task?`, function() {      
      self._removeTaskCore(t);      
    });    
  },

  _removeTaskCore: function(t) {
    const p = this.getPreset();
    t.element.remove();
    const i = p.tasks.findIndex(x => x.id == t.id);
    p.tasks.splice(i, 1);
    delete this.tlist[t.id];      
    this.settingWrite();
    this.onTaskRemoved(t);
    if (p.tasks.length == 0) {
      const con = $('#widgets');
      con.find('.placeholder').show();
    }
  },

  getTaskById: function(id) {
    const t = this.tlist[id];
    return typeof(t) !== undefined ? t : false;
  },

  taskCmd: function(code, target) {
    const elem = $(target).closest('.task');
    const id = elem.attr('id');
    const t = this.getTaskById(id);
    t.command(code, target);
  },

  _registerTaskUI: function(elem) {
    const p = this.getPreset();
    const con = $('#widgets');
    
    if (!p.tasks.length) {
      con.find('.placeholder').hide();
    }

    con.append(elem);    
  },

  _addTaskCore: function(type) {    
    const p = this.getPreset();
    const t = window[type].call(this);
    const data = t.createEnvelope();
    const elem = t.createUI();

    this._registerTaskUI(elem);    
    this.tlist[t.id] = t;
    p.tasks.push(data);
    t.init();

    this.settingWrite();
    this.releaseMenu();     
    this.onTaskAdded(t);
  },

  addTaskYt: function() {
    this._addTaskCore('MtTaskYt');
  },

  addTaskAudio: function() {
    this._addTaskCore('MtTaskAudio');
  },

  // TODO: picture, iframe, text reading

  getReadyTasks: function(checkSupport) {
    const ar = [];
    
    for(const i in this.tlist) {
      const t = this.tlist[i];
      if (t.isReady && (!checkSupport || t.isSupport(checkSupport))) {
        ar.push(t)
      }      
    }

    return ar;
  },

  gcPlay: function() {    
    this.getReadyTasks(MtTask.CAPS.PLAYBACK).forEach(t => t.play());    
  },

  gcStop: function() {
    this.getReadyTasks(MtTask.CAPS.PLAYBACK).forEach(t => t.stop());
  },

  gcPause: function() {
    this.getReadyTasks(MtTask.CAPS.PLAYBACK).forEach(t => t.pause());    
  },

  gcMute: function() {
    this.getReadyTasks(MtTask.CAPS.VOLUME).forEach(t => t.mute());
  },

  gcUnmute: function() {
    this.getReadyTasks(MtTask.CAPS.VOLUME).forEach(t => t.unmute());
  },

  gcSpeed: function(value) {    
    this.getReadyTasks(MtTask.CAPS.SPEED).forEach(t => t.speed(value));    
    this.releaseMenuGc();
  },

  gcRewindRand: function() {
    const list = this.getReadyTasks(MtTask.CAPS.POSITION);
    list.forEach(t => {
      const d = t.duration();
      const lim = d / 3 * 2; // use first 2/3 of time
      const p = MtUtils.getRandomInt(0, lim);
      t.pos(p);
    });
  },

  getSamples: function(type) {    
    return this.samples[type] || [];
  },

  getRecent: function(type) {    
    return this.settings.recent[type] || [];
  },

  addRecent: function(type, title, value) { 
    const r = this.settings.recent[type] || [];
    const index = r.findIndex(x => x.value === value);
    let item = { title:title, value:value };
    
    if (index != -1) {        
      /*
      if (index === 0)
        return; // no any moves needed          
      item = r.splice(index, 1).pop(); // take exists item
      */
      return;
    }
    
    r.unshift(item); // put at the start of an array

    if (r.length > this.maxRecentItems) {
      r.splice(this.maxRecentItems); // remove last one    
    }

    console.log('addRecent@5', item, r);

    this.settings.recent[type] = r;
    this.settingWrite(true);

    for(const i in this.tlist) {
      const t = this.tlist[i];
      t.createMenuRecent(); // rebuild
    }
  },

  onTaskAdded: function(t) {
    this.setupDragging();
    this.updateGlobalCaps();
  },

  onTaskRemoved: function(t) {
    this.updateGlobalCaps();
  },

  setupDragging: function() {
    const self = this;
    const con = $('#widgets');

    con.unbind();
    con.find('.draggable').unbind();
    con.find('.drop-receiver').unbind();
    con.find('.handle').unbind();
    con.removeClass('drag-area');

    window.MtDraggable($('#widgets'), {
      sorting: true,
      sortHoriz: true,
      onDrop: function (movId, recv) {
          const target = $('#' + movId);

          if (target.length != 1) {
              console.error('drop target not found', movId, recv);
              return;
          }

          const a = self._getElemTaskIndex(target);
          const b = self._getElemTaskIndex(recv);
          const p = self.getPreset();
          const list = p.tasks;
          const t = list.splice(a, 1)[0];
          list.splice(b, 0, t);
          
          if (a < b) {
            target.insertAfter(recv);            
          } else {
            target.insertBefore(recv);            
          }

          self.settingWrite(true);
      }
    });
  },

  _getElemTaskIndex: function(elem) {
    const p = this.getPreset();
    const id = $(elem).closest('.task').attr('id');
    const i = p.tasks.findIndex(x => x.id == id);
    return i;
  },

  updateGlobalCaps: function() {
    const self = this;
    const con = $('body');
    const p = this.getPreset();
    const caps = window.MtTask.CAPS;
    
    con.removeClass(`cap-${caps.PLAYBACK} cap-${caps.VOLUME} cap-${caps.SPEED} cap-${caps.POSITION}`);

    p.tasks.forEach(x => {
      const t = self.tlist[x.id];
      if (!t) return;
      for(const k in caps) {
        const str = caps[k];
        if (t.isSupport(str)) {
          con.addClass(`cap-${str}`);
        }
      }
    });
  },

}; // window.MtApp
