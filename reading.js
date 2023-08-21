/* reading library */

window.MtReading = function(opt) {
  opt = opt || {};

  opt.onStatusChanged = opt.onStatusChanged || function(){};
  opt.onEnded = opt.onEnded || function(){};

  const timerDelay = opt.timerDelay || 500;
  const sentenceEndDelayRatio = 0.7;
  const wordMaxDelayRatio = 0.8;
  const wordLenNorm = 5;
  const wordLenMax = 15;  

  let uiContainer = false;
  let uiElem = false;
  let instId = false;
  let lexemes = false;
  let position = -1;
  let timer = null;  
  let isPlay = false;
  let isPaused = false;
  let speedRatio = 1.0;
  let lastWord = false;
  let EOS = false; // reached the end of sentence

  const createUI = function(con) {    
    const html = $('#tpl-reading').html();
    const elem = $(html);          
    elem.attr('id', instId = MtUtils.genUid());
    $(con).html('');
    $(con).append(elem);
    uiContainer = con;
    return elem;
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

  const getNearestString = function(i, splitForwards) {
    i = typeof(i) !== 'undefined' ? i : position;
    if (i < 0 || i >= lexemes.length) return false;
    const x = lexemes[i];
    let res = [];    
    EOS = false;
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
        if (splitForwards) {
          res.pop();
          res.push(x + z);
        } else {
          res.push(z);
        }
        if (['.', '!', '?'].indexOf(z) !== -1) {
          EOS = true;
        }
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
    lastWord = v;
  };

  const updateCounters = function() {    
    const passed = position;
    const left = lexemes.length - position;
    uiElem.find('.sidebar-left').text(passed);
    uiElem.find('.sidebar-right').text(left);
  };

  const calcDelay = function() {    
    let ratio = speedRatio;

    if (lastWord !== false) {
      const n = MtUtils.clamp(lastWord.length, wordLenNorm, wordLenMax) - wordLenNorm;                
      const f = 1.0 * n / (wordLenMax - wordLenNorm);
      const x = 1.0 - f * (1.0 - wordMaxDelayRatio);
      ratio *= x;
    }
    
    if (EOS) {
      ratio *= sentenceEndDelayRatio;
    }
    
    return (1.0 / ratio) * timerDelay;
  };

  return {

    get count() { return lexemes ? lexemes.length : false; },
    get isPlaying() { return isPlay; },
    get isPaused() { return isPaused; },
    
    get pos() { return position; },
    set pos(v) { this.seek(v); },
    
    get speed() { return speedRatio; },
    set speed(v) { speedRatio = parseFloat(v || 1); },

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
          if (uiContainer.find('#' + instId).length > 0) {
            this.play();
          } else {
            // seems that our view has been removed from the container
          }
        }
      } else {        
        opt.onEnded.call(this);        
      }
    },

    prev: function() {      
      const ar = getNearestString(position - 1, true);      
      if (ar) {        
        position -= ar.length;        
        printString(ar);
        updateCounters();
      }
    },

    seek: function(v) {
      v = parseInt(v || 0);
      if (v < 0) v = 0;
      if (v >= lexemes.length) v = lexemes.length - 1;
      position = v;
      const ar = getNearestString(v);
      if (ar) {              
        printString(ar);
        updateCounters();
      }
    },

    play: function() {
      const self = this;      
      const old = isPlay;
      const old2 = isPaused;
      clearTimeout(timer);
      isPlay = true;
      isPaused = false;

      const delay = calcDelay();
      //console.log('delay', delay, lastWord, EOS);
      timer = setTimeout(() => self.next(), delay);

      if (isPlay !== old || isPaused != old2) {
        opt.onStatusChanged.call(this);
      }
    },

    pause: function() {
      const old = isPlay;
      const old2 = isPaused;
      isPlay = false;
      isPaused = true;
      if (isPlay !== old || isPaused != old2) {
        opt.onStatusChanged.call(this);
      }
    },

    stop: function() {
      const old = isPlay;
      const old2 = isPaused;
      isPlay = false;
      isPaused = false;
      clearTimeout(timer);
      position = -1;
      printString('---');
      updateCounters();
      if (isPlay !== old || isPaused != old2) {
        opt.onStatusChanged.call(this);
      }
    },

  }; // obj

} // window.MtReading