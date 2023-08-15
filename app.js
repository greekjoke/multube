/* application core object */

window.MtApp = {

  settings: {
    version: 0.1,
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

  init: function(opt) {
    opt = opt || {};
    this.updateMenuPresets();
  },

  showPrompt: function(text, def, fnOk, fnCancel) {
    fnCancel = fnCancel || function() {};
    const str = window.prompt(text, def || '');
    if (str === null)
      fnCancel.call(this);    
    fnOk.call(this, str);    
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

  updateMenuPresets: function() {    
    const list = $('#topmenuPresets');
    list.html(''); // clear    
    this.settings.presets.forEach(x => {
      list.append('<li value="'+x.id+'">'+x.name+'</li>');
    });    
  },

  updatePreset: function() {
    // TODO: update preset controls
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
    const cur = this.settings.curPreset;

    if (cur === 'default')
      return this.showError('Default preset can\'t be removed');

    const p = this.getPresetById(cur);

    if (!p)
      return console.error('invalid preset id', cur);

    const ar = this.settings.presets;
    const index = ar.indexOf(p);
        
    ar.splice(index, 1);

    this.updateMenuPresets();
    this.switchPreset('default');
  },

  switchPreset: function(value) {
    console.log('switchPreset', value);

    // TODO:

    this.updatePreset();
    this.settingWrite();
  },

  settingWrite: function() {
    // TODO:
  },

  settingsRead: function() {
    // TODO:
  },



};
