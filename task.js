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
      { id:'general', html:'<i class="fa-regular fa-face-frown"></i>' }
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

      const menuElem = elem.find('.bar .settings .submenu');

      this.menuItems.forEach(x => {
        menuElem.append(`<li action="taskCmd" value="${x.id}">${x.title}</li>`)
      });

      const statusElem = elem.find('.bar .status');

      this.statusItems.forEach(x => {
        x.elem = $(x.html);
        statusElem.append(x.elem);
      });
      
      return uiElem = elem;      
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

  };

} // window.MtTask
