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

    let SSU = null;

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
        const self = this;

        console.log('MtAudio.Speaker.init');
        
        MtAudio.loadVoices();

        if (!SSU) {
          console.log('MtAudio.Speaker.init', 'create SSU');
          SSU = new SpeechSynthesisUtterance();
          //SSU.onboundary = (e) => console.log('onboundary', e);
          SSU.onerror = (e) => console.error('SpeechSynthesisUtterance', e);
          SSU.onstart = (e) => {
            //console.log('onstart', e);
            opt.onSpeakStart.call(self, e);
          };
          SSU.onend = (e) => {
            //console.log('onend', e);
            opt.onSpeakEnd.call(self, e);
          };
        }
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
        console.log('to speak @1', text);

        if (!SSU) return;
        if (!text) return;
        if (!this.isPresent) return;
        if (this.isSpeaking) return;

        console.log('to speak @2', text);

        const trimmed = text.trim();
        if (!trimmed) return;

        const vlist = this.voices || [];
        if (vlist.length < 1) return;

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

        const voiceItem = this.voices[voiceIndex];

        SSU.text = trimmed;        
        SSU.voice = voiceItem;
        SSU.lang = voiceItem.lang;
        SSU.volume = this.volume;
        SSU.rate = this.rate;
        SSU.pitch = this.pitch;

        MtAudio.synth.cancel();
        MtAudio.synth.speak(SSU);
      },

    }; // obj
  },

} // window.MtAudio
