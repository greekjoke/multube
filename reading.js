/* reading library */

window.MtReading = function(opt) {
  opt = opt || {};

  opt.onStatusChanged = opt.onStatusChanged || function(){};
  opt.onEnded = opt.onEnded || function(){};
  opt.onEOS = opt.onEOS || function(){};
  opt.onNext = opt.onNext || function(){};

  const timerDelay = opt.timerDelay || 400;
  const eosDelayRatio = opt.eosDelayRatio || 0.7;
  const wordMaxDelayRatio = opt.wordMaxDelayRatio || 0.7;
  const wordLenNorm = opt.wordLenNorm || 5;
  const wordLenMax = opt.wordLenMax || 15;  

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
  let EOS = false; // reached the end of the sentence
  let revText = false;
  let revWord = false;
  let pauseAtEOS = opt.pauseAtEOS || false;

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
    text = text.replaceAll(/[\n\r]+/gi, ' ');    
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

  const getLexeme = function(i) {
    if (revText) {
       i = lexemes.length - i - 1;
    }
    return lexemes[i];
  };

  const getNextPunctuationMark = function(i) {
    i = typeof(i) !== 'undefined' ? i : position;
    i++;
    if (i >= lexemes.length) return false;
    const x = getLexeme(i);
    return typeof(x) === 'object' ? x.char : false;
  };

  const isEndChar = function(c) {
    return ['.', '!', '?'].indexOf(c) !== -1;
  };

  const getNearestString = function(i, splitForwards) {
    i = typeof(i) !== 'undefined' ? i : position;
    if (i < 0 || i >= lexemes.length) return false;
    const x = getLexeme(i);
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
        if (isEndChar(z)) {
          EOS = true;
        }
      }
    }
    return res;
  };

  const getNearestSentence = function(i) {
    i = typeof(i) !== 'undefined' ? i : position;
    if (i < 0 || i >= lexemes.length) return false;
    const list = [];
    let c = '';    
    while (!isEndChar(c)) {
      const x = getLexeme(i);
      if (typeof(x) === 'object') {
        list.push(c = x.char);
      } else {
        list.push(c = x);
      }
      i++;
    }
    return list.join(' ');
  };

  const printString = function(v) {
    if (!v) return;
    if (Array.isArray(v)) {
      v = v.join('');
    }
    const elem = uiElem.find('.center');
    if (v.length > 15/*wordLenMax*/) {
      elem.addClass('long-word');
    } else {
      elem.removeClass('long-word');
    }    
    lastWord = v;
    if (revWord) {
      v = MtUtils.reverse(v);
    }
    elem.text(v);
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
      ratio *= eosDelayRatio;
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

    get revWord() { return revWord; },
    set revWord(v) { 
      revWord = !!v;       
      printString(lastWord);
    },
    
    get revText() { return revText; },
    set revText(v) { 
      revText = !!v; 
      printString(lastWord);
    },

    get pauseAtEOS() { return pauseAtEOS; },
    set pauseAtEOS(v) { pauseAtEOS = !!v; },

    getSentence: function(pos) {
      return getNearestSentence(pos);
    },

    init: function(text, con) {
      const self = this;

      uiElem = createUI(con);
      lexemes = parse(text);

      this.stop();

      uiElem.find('.bnPrev').click(() => self.prev(true));
      uiElem.find('.bnNext').click(() => self.next(true));
      uiElem.find('.bnPlay').click(() => self.play(true));
      uiElem.find('.bnStop').click(() => self.stop(true));
      uiElem.find('.bnPause').click(() => self.pause(true));
    },

    next: function(byUser) {      
      const oldEOS = EOS;
      const oldPos = position;
      const ar = getNearestString(position + 1);           
      if (ar) {        
        position += ar.length;        
        printString(ar);
        updateCounters();
        if (isPlay) {
          if (uiContainer.find('#' + instId).length === 0)
            return; // seems that our view has been removed from the container
          if (pauseAtEOS && EOS) {
            this.pause();
          } else {
            this.play();
          }          
          if (oldEOS) {
            opt.onNext.call(this, oldPos + 1, position);
          } else if (EOS) {
            opt.onEOS.call(this, position);
          }        
        }        
      } else {        
        opt.onEnded.call(this);        
      }
    },

    prev: function(byUser) {      
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

    play: function(byUser) {
      const self = this;      
      const old = isPlay;
      const old2 = isPaused;
      
      clearTimeout(timer);
      isPlay = true;
      isPaused = false;

      const delay = calcDelay();      
      timer = setTimeout(() => self.next(), delay);

      if (isPlay !== old || isPaused != old2) {
        opt.onStatusChanged.call(this, byUser);
      }
    },

    pause: function(byUser) {
      const old = isPlay;
      const old2 = isPaused;
      isPlay = false;
      isPaused = true;
      if (isPlay !== old || isPaused != old2) {
        opt.onStatusChanged.call(this, byUser);
      }
    },

    stop: function(byUser) {
      const old = isPlay;
      const old2 = isPaused;
      clearTimeout(timer);
      isPlay = false;
      isPaused = false;
      EOS = true;      
      position = -1;
      printString('---');
      updateCounters();
      if (isPlay !== old || isPaused != old2) {
        opt.onStatusChanged.call(this, byUser);
      }
    },

  }; // obj

} // window.MtReading
