/* draggable handling */

window.MtDraggable = function(area, opt) {
  opt = opt || {};
  
  area = $(area).first();
  if (area.length != 1 || area.hasClass('drag-area'))
    return false;

  const allowSorting = opt.sorting || false;
  const sortHoriz = opt.sortHoriz || false;
  
  const onDropAllow = opt.onDropAllow || function(movId, recvId) { 
    return true; 
  }

  const onDrop = opt.onDrop || function(movId, recv) { 
    const mov = document.getElementById(movId);
    recv.append(mov); 
  }

  const onDragImage = opt.onDragImage || function(mov) {
    return mov[0];
  }

  const onDragFinish = opt.onDragFinish || function(mov) {}
  let lastMovId = null;

  area.addClass('drag-area');

  area.find('.draggable').each(function() {
    const mov = $(this);
    const movId = mov.attr('id');

    let handle = mov.hasClass('handle') ? mov : mov.find('.handle');
    if (handle.length < 1) handle = mov

    handle.each(function() {
      const h = $(this);
      h.prop('draggable', true);    
      h.on('dragstart', function(e) {
        mov.addClass('dragging');
        let img = onDragImage.call(this, mov);
        let ox = 0;//$(img).width() / 3;
        let oy = 0;
        if (img.xOffset !== undefined) {
          ox = img.xOffset;
          oy = img.yOffset;
          img = img.image;
        }        
        const ee = e.originalEvent;        
        ee.dataTransfer.effectAllowed = "move";
        ee.dataTransfer.setData("text", movId);        
        ee.dataTransfer.setDragImage(img, ox, oy);
        lastMovId = movId;
      });
      h.on('dragend', function(e) {
        mov.removeClass('dragging');
        onDragFinish.call(this, mov);        
      });      
    });

  });

  area.find('.drop-receiver').each(function() {
    const recv = $(this);
    const recvId = recv.attr('id');
    
    recv.on('dragover', function(e) {     
      e.stopPropagation();

      const ee = e.originalEvent;
      const movId = ee.dataTransfer.getData("text") || lastMovId;

      if (recvId == movId) return; // в себя нельзя
      if (!onDropAllow.call(this, movId, recvId)) return;      
      
      recv.addClass('dragover');
            
      if (allowSorting) {
        const rect = this.getBoundingClientRect();        
        const y = sortHoriz ? 
          (ee.clientX - rect.left) : (ee.clientY - rect.top); 
        const pad = sortHoriz ? 
          (rect.width / 2 + 1) : (rect.height / 2 + 1);        
        let cls = false;

        if (y < pad) cls = 'drop-before';
        else cls = 'drop-after';

        recv.removeClass('drop-before drop-after');

        if (cls) {
          recv.addClass(cls);
        }
      }
      
      e.preventDefault(); // allow drop           
    });

    recv.on('dragleave', function(e) {      
      recv.removeClass('dragover drop-before drop-after');      
    });

    recv.on('drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const movId = e.originalEvent.dataTransfer.getData("text");      
      if (!movId) return;                  
      onDrop.call(this, movId, recv);
      area.find('.drop-receiver') // clean
        .removeClass('dragover drop-before drop-after');      
    });

  });  
  
  return {  } 
}