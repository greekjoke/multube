/* routines */

window.MtUtils = {

  getRandomInt: function(min, max) {
    const range = max - min;
    return Math.floor(Math.random() * range) + Math.floor(min);
  },
  
  genUid: function() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  },

  isMobile: function() {
    return (/Android|iPhone/i.test(navigator.userAgent));
  },

  hasQueryKey: function(key) {
    return document.location.href.indexOf('?' + key + '=') != -1 ||
      document.location.href.indexOf('&' + key + '=') != -1;
  },

  clamp: function(v, min, max) {
    return Math.max(min, Math.min(v, max));
  },

  clone: function(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  ellipsis: function(text, limit = 20, type = 0) {
    text = text || '';
    limit = Math.max(3, parseInt(limit || 20));
    type = parseInt(type || 0) % 3; // [0,2]
    
    const n = text.length;
    const x = n - limit;
    if (n <= limit) return text;

    switch(type) {
      case 0: // cut the end
        text = text.substr(0, limit-3) + '...';
        break;
      case 1: // cut the beggin
        text = '...' + text.substr(x+3);
        break;
      case 2: // cut in the middle
        const half = Math.floor(limit/2);
        const a = text.substr(0, half);
        const b = text.substr(n - half + 3);
        text = a + '...' + b;
        break;
    }

    return text;
  },

  reverse: function(str) {
    return str.split('').reverse().join('');
  },

  setCookie: function(c_name, value, exmins) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (1000 * 60 * exmins));
    const c_value = escape(value) + ((exmins == null) ? "" : "; expires=" + expires.toUTCString());
    document.cookie = c_name + "=" + c_value;
  },

  getCookie: function(c_name) {
    let i, x, y, cookies = document.cookie.split(";");

    for (i=0; i<cookies.length; i++) {
        x=cookies[i].substr(0,cookies[i].indexOf("="));
        y=cookies[i].substr(cookies[i].indexOf("=")+1);
        x=x.replace(/^\s+|\s+$/g,"");
        if (x == c_name) {
            y = unescape(y);
            if (typeof(y) === 'string' && y == 'null')
                y = null;
            if (typeof(y) === 'string' && y == 'true')
                y = true;
            if (typeof(y) === 'string' && y == 'false')
                y = false;
            return y;
        }
    }

    return null;
  },

  storageWrite: function(key, data) {      
    if (window.localStorage === undefined) 
      return false;
    try {
      if (!key) 
        throw new Error('key is required');
      if (!data) {
        window.localStorage.removeItem(key);
      } else {      
        const str = JSON.stringify(data);
        window.localStorage.setItem(key, str);
        console.debug('storageWrite', key + ' length', str.length);
      }
      return true;
    } catch(err) {
      conosle.error('storageWrite', err);
      return false;
    }
  },

  storageRead: function(key) {      
    if (window.localStorage === undefined) 
      return false;
    try {
      if (!key) 
        throw new Error('key is required');
      const data = window.localStorage.getItem(key);
      console.debug('storageRead', key + ' length', data ? data.length : 'null');
      return data ? JSON.parse(data) : false;
    } catch(err) {
      conosle.error('storageRead', err);
      return false;
    }
  },

  saveToFile: function(data, fileName, mime) {
    const str = JSON.stringify(data);
    const blob = new Blob([str], {type: mime || 'octet/stream'});
    var url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    document.body.appendChild(link);
    
    link.href = url;    
    link.download = fileName || 'file.bin';
    link.click();

    window.URL.revokeObjectURL(url);
    link.remove();
  },

  loadFromFile: function(fnLoaded, fnError, opt) {
    const self = this;
    const input = document.createElement('input');        

    if (typeof(opt) === 'string') {
      opt = { ext:opt };
    } else {
      opt = opt || { };
    }

    document.body.appendChild(input);

    const cleanHtml = function() {
      input.remove();   
    };

    $(input).change(function() {
      let files = input.files; 

      if (files.length == 0) {
        fnLoaded.call(self, null);
        cleanHtml();
        return; 
      }

      const file = files[0]; 
      let reader = new FileReader();

      reader.onload = (e) => {   
        fnLoaded.call(self, e, file);          
        cleanHtml();
      };
 
      reader.onerror = (e) => {
        fnError.call(self, e);        
        cleanHtml();
      }

      if (opt.asBuffer) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }      
    });

    input.type = 'file'; 
    input.accept = opt.ext || '.json';
    input.click();
  },

  selectFile: function(fnLoaded, ext) {
    const self = this;
    const input = document.createElement('input');    

    document.body.appendChild(input);

    const cleanHtml = function() {
      input.remove();   
    };

    $(input).change(function() {
      let files = input.files; 

      if (files.length == 0) {
        fnLoaded.call(self, null);
      } else {
        const file = files[0]; 
        fnLoaded.call(self, file);
      }

      cleanHtml();
    });

    input.type = 'file'; 
    input.accept = ext || '.txt';
    input.click();
  },

};
