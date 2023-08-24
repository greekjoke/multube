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

    MtAudio.speakingInit();

    let SSU = null;

    return {

      get isPresent() { return !!MtAudio.synth; },
      get voices() { return MtAudio.voices; },
      curVoice: 0,
      volume: 1.0,
      rate: 1.0,
      pitch: 1.0,

      init: function() {
        SSU = SSU || new SpeechSynthesisUtterance();       
        voices = MtAudio.loadVoices();
      },

      speak: function(text) {
        if (!this.isPresent) return;
        if (MyAudio.synth.speaking) return;

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
            );
          }
          if (voiceIndex == -1) {
            voiceIndex = 0; // finally fallback
          }
        } else {
          voiceIndex = MtUtils.clamp(this.curVoice, 0, vlist.length);
        }

        const voiceItem = voices[voiceIndex];

        SSU.text = trimmed;        
        SSU.voice = voiceItem;
        SSU.lang = voiceItem.lang;
        SSU.volume = this.volume;
        SSU.rate = this.rate;
        SSU.pitch = this.pitch;

        MtAudio.synth.speak(SSU);
      },

    }; // obj
  },

} // window.MtAudio
