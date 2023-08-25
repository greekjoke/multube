/* audio routines */

window.MtAudio = {  

  synth: false,
  voices: false,   

  speakingInit: function() {
    if (this.synth !== false) return;
    this.synth = window.speechSynthesis || null;
    if (!this.synth) {
      console.warn('speechSynthesis is not supported');
      $('body').addClass('speaking-na');    
    } else {
      $('body').addClass('speaking-present');    
    }
  },

  loadVoices: function() {
    if (this.voices !== false) return this.voices;
    const list = (this.synth ? this.synth.getVoices() : false) || [];
    console.log('voices', list);
    if (!list || list.length < 1) {
      $('body').addClass('voices-list-empty');
      $('body').removeClass('voices-list');
    } else {
      $('body').removeClass('voices-list-empty');
      $('body').addClass('voices-list');
    }
    return this.voices = list;
  },

  Speaker: function(opt) {
    opt = opt || {};

    opt.onSpeakStart = opt.onSpeakStart || function(){};
    opt.onSpeakEnd = opt.onSpeakEnd || function(){};

    MtAudio.speakingInit();

    const splitToParts = function(text) {
      const partMaxLen = opt.partMaxLen || 120;
      const ar = [];
      let buf = '';      

      text = text.trim();
      text = text.replaceAll(/[\n\r]+/gi, ' ');    
      text.split(' ').forEach(x => {
        x = x.trim();
        if (x.length < 1) return;
        const str = buf + x;        
        if (str.length > partMaxLen) {
          ar.push(buf);
          buf = x;
        } else {
          buf = str;
        }
        buf += ' ';
      });    

      if (buf.length > 0) {
        ar.push(buf);
      }

      return ar;
    };

    return {

      get isPresent() { return !!MtAudio.synth; },
      get isSpeaking() { return MtAudio.synth && MtAudio.synth.speaking; },
      get isPaused() { return MtAudio.synth && MtAudio.synth.paused; },
      get voices() { return MtAudio.voices; },      
      curVoice: 0,
      volume: 1.0,
      rate: 1.0,
      pitch: 1.0,

      init: function() {        
        MtAudio.loadVoices();
      },

      stop: function() {
        if (this.isSpeaking) {
          MtAudio.synth.cancel();          
        }
      },

      pause: function() {
        if (this.isSpeaking) {
          MtAudio.synth.pause();          
        }
      },

      resume: function() {
        if (this.isSpeaking) {
          MtAudio.synth.resume();          
        }
      },

      speak: function(text) {
        if (!text) return false;
        if (!this.isPresent) return false;
        if (this.isSpeaking) return false;

        const trimmed = text.trim();
        if (!trimmed) return false;

        const vlist = this.voices || [];
        if (vlist.length < 1) return false;

        let voiceIndex = false;

        if (this.curVoice == -1) { // auto
          voiceIndex = voices.findIndex(
            (voice) => voice.name === 'Google UK English Male'
          );
          if (voiceIndex == -1) {
            voiceIndex = voices.findIndex( // fallback variant
              (voice) => (voice.lang === 'en-GB' || voice.lang === 'en-US')
              //(voice) => (voice.lang === 'ru-RU')
            );
          }
          if (voiceIndex == -1) {
            voiceIndex = 0; // finally fallback
          }
        } else {
          voiceIndex = MtUtils.clamp(this.curVoice, 0, vlist.length);
        }

        const self = this;
        const voiceItem = this.voices[voiceIndex];
        const ar = splitToParts(trimmed);

        if (ar.length > 1)
          console.warn('spk text splitted', ar);

        MtAudio.synth.cancel();

        ar.forEach(str => {
          const u = new SpeechSynthesisUtterance();          
          u.onerror = (e) => console.error('SpeechSynthesisUtterance', e);
          u.onstart = (e) => opt.onSpeakStart.call(self, e);
          u.onend = (e) => opt.onSpeakEnd.call(self, e);
          u.text = str;
          u.voice = voiceItem;
          u.lang = voiceItem.lang;
          u.volume = self.volume;
          u.rate = self.rate;
          u.pitch = self.pitch;
          MtAudio.synth.speak(u);
        });

        return ar.length;
      },

    }; // obj
  },

} // window.MtAudio
