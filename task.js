/* task's base object */

window.MtTask = function() {
  const app = MtApp;
  let uiElem = null;
  let dataEnv = null;
  
  return {

    menuItems: [
      { id:'remove', title:'Remove' }
    ],

    statusItems: [
      { id:'test', html:'<i class="fa-solid fa-battery-three-quarters"></i>' }
    ],

    get envelope() { return dataEnv; },
    set envelope(v) { dataEnv = v; },

    get element() { return uiElem; },
    get id() { return dataEnv.id; },

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
        type: 'MtTask',
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

  };

} // window.MtTask
