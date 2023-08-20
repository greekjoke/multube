/* reading library */

window.MtReading = function() {
  let uiElem = false;
  let instId = false;
  let lexemes = false;
  let position = -1;
  let timer = null;
  let timerDelay = 400;
  let isPlay = false;
  let isPaused = false;

  const createUI = function(con) {    
    const html = $('#tpl-reading').html();
    const elem = $(html);      
    con.addClass('reading-view');
    con.attr('id', instId = MtUtils.genUid());
    $(con).html('');
    $(con).append(elem);
    return con;
  };

  const parse = function(text) {
    const lexemes = [];
    text = text.replaceAll(/\n\r/gi, ' ');
    text.split(' ').forEach(x => {
      x = x.trim();
      if (x.length < 1) return;
      if (/[\.\,\!\?]+$/gi.test(x)) {
        const z = x.substr(-1);
        x = x.substr(0, x.length-1);
        lexemes.push(x);
        lexemes.push({ char:z });
      } else {
        lexemes.push(x);
      }
    });    
    return lexemes;
  };

  const getNextPunctuationMark = function(i) {
    i = typeof(i) !== 'undefined' ? i : position;
    i++;
    if (i >= lexemes.length) return false;
    const x = lexemes[i];
    return typeof(x) === 'object' ? x.char : false;
  };

  const getNearestString = function(i) {
    i = typeof(i) !== 'undefined' ? i : position;
    if (i < 0 || i >= lexemes.length) return false;
    const x = lexemes[i];
    let res = [];    
    if (typeof(x) === 'object') {
      const a = getNearestString(i-1);
      if (a !== false) {                
        res = res.concat(a);
      } else {
        res.push(x.char);
      }
    } else {
      res.push(x);
      const z = getNextPunctuationMark(i);
      if (z !== false) {        
        res.push(z);
      }
    }
    return res;
  };

  const printString = function(v) {
    if (Array.isArray(v)) {
      v = v.join('');
    }
    const elem = uiElem.find('.center');      
    elem.text(v);
  };

  const updateCounters = function() {    
    const passed = position;
    const left = lexemes.length - position;
    uiElem.find('.sidebar-left').text(passed);
    uiElem.find('.sidebar-right').text(left);
  };

  return {

    get count() { return lexemes ? lexemes.length : false; },
    get pos() { return position; },

    init: function(text, con) {
      const self = this;

      uiElem = createUI(con);
      lexemes = parse(text);
      position = -1;
      
      this.next();

      uiElem.find('.bnPrev').click(() => self.prev());
      uiElem.find('.bnNext').click(() => self.next());
      uiElem.find('.bnPlay').click(() => self.play());
      uiElem.find('.bnStop').click(() => self.stop());
      uiElem.find('.bnPause').click(() => self.pause());
    },

    next: function() {      
      const ar = getNearestString(position + 1);      
      if (ar) {
        position += ar.length;
        printString(ar);
        updateCounters();
        if (isPlay) {
          this.play();
        }
      }
    },

    prev: function() {      
      const ar = getNearestString(position - 1);
      if (ar) {        
        position -= ar.length;
        printString(ar);
        updateCounters();
      }
    },

    play: function() {
      const self = this;      
      clearTimeout(timer);
      isPlay = true;
      isPaused = false;
      timer = setTimeout(() => self.next(), timerDelay);
    },

    pause: function() {
      isPlay = false;
      isPaused = true;
    },

    stop: function() {
      isPlay = false;
      isPaused = false;
      clearTimeout(timer);
      position = -1;
      printString('---');
      updateCounters();
    },

  }; // obj

} // window.MtReading
