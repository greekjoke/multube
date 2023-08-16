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
    ]
  },

  tlist: {},
  ready: false,

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
    }
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
    const index = ar.indexOf(p);

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
    p.tasks.splice(p.tasks.indexOf(t), 1);
    delete this.tlist[t.id];      
    this.settingWrite();
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
    console.log(t);
    const data = t.createEnvelope();
    const elem = t.createUI();

    this._registerTaskUI(elem);    
    this.tlist[t.id] = t;
    p.tasks.push(data);
    t.init();

    this.settingWrite();
    this.releaseMenu();    
  },

  addTaskYt: function() {
    this._addTaskCore('MtTaskYt');
  },

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
    this.getReadyTasks('playback').forEach(t => t.play());    
  },

  gcStop: function() {
    this.getReadyTasks('playback').forEach(t => t.stop());
  },

  gcPause: function() {
    this.getReadyTasks('playback').forEach(t => t.pause());    
  },

  gcMute: function() {
    this.getReadyTasks('volume').forEach(t => t.mute());
  },

  gcUnmute: function() {
    this.getReadyTasks('volume').forEach(t => t.unmute());
  },

  gcSpeed: function(value) {
    this.getReadyTasks('speed').forEach(t => t.speed(value));
  },

  gcRewindRand: function() {
    // TODO: get duration, set position
  },

}; // window.MtApp
