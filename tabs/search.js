const { GUI, TABS } = require('./../js/gui');
const path = require('path');
const i18n = require('./../js/localization');



TABS.search = { };


tabNames = [
 "adjustments",
 "advanced_tuning",
 "auxiliary",
 "calibration",
 "cli",
 "configuration",
 "debug_trace",
 "failsafe",
 "firmware_flasher",
 "gps",
 "landing",
 "led_strip",
 "logging",
 "magnetometer",
 "mission_control",
 "mixer",
 "onboard_logging",
 "options",
 "osd",
 "outputs",
 "pid_tuning",
 "ports",
 "programming",
 "receiver",
 "receiver_msp",
 "sensors",
 "setup",
 "sitl"
];


  TABS.search.searchMessages = function (keyword) {
    var resultsDiv = document.getElementById('search-results');
    keyword = keyword.toLowerCase();
    resultsDiv.innerHTML = '';

    simClick = function (evt) {
      tabName = evt.currentTarget.getAttribute("tabName");
      tabLink = document.getElementsByClassName("tab_".concat(tabName))[0].getElementsByTagName("a")[0];
      tabLink.click();
    };


    for (const [key, value] of Object.entries(this.messages)) {
      // Get plain text of message (with tags)
      var message = value.message.toLowerCase().replace(new RegExp('<[^>]*>'), '');

      if ( message.includes(keyword) ) {
        if (this.key2page.get(key) ) {
          var pages = this.key2page.get(key);
          var kwEscaped = keyword.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
          var context = message.match( new RegExp( `([a-z]{0,10}.{0,14}${kwEscaped}.{0,14}[a-z]{0,10})`, 'i') )[1];
          for (const page of pages) {
            var rHTML = "<li><button class=\"searchResult\" tabName=\"{0}\">{1} tab</button>: {2}</li>".format(page, page, context);
            resultsDiv.innerHTML= resultsDiv.innerHTML.concat(rHTML);
          }
        }
      }
    }

    for (const [key, value] of this.setting2page) {
    // for (const [key, value] of Object.entries(this.setting2page)) {
      if ( key.toLowerCase().includes(keyword) ) {
        for (const page of value) {
          var rHTML = "<li><button class=\"searchResult\" tabName=\"{0}\">{1} tab</button>: {2}</li>".format(page, page, key);
          resultsDiv.innerHTML= resultsDiv.innerHTML.concat(rHTML);
        }
      }
    }

    for ( result of document.getElementsByClassName("searchResult") ) {
      result.addEventListener('click', simClick, false);
    }
  }
  
  
  TABS.search.getMessages = function () {
    const res_messages = fetch('locale/en/messages.json');
    res_messages
      .then (data => data.json())
      .then (data => {
         this.messages = data;
      })
      .catch((error) => {
         console.error(error)
      });
  }
  
  TABS.search.geti18nHTML = function (filename, filecontents) {
  
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(filecontents, 'text/html');
    var hasDataI18n = htmlDoc.querySelectorAll('[data-i18n]:not([data-i18n=""])');
    for (const element of hasDataI18n) {
      key = element.getAttribute('data-i18n');
      if (! this.key2page.has(key) ) {
        this.key2page.set( key, new Set() );
      }
      this.key2page.get(key).add(filename);
    }
    hasDataI18n = htmlDoc.querySelectorAll('[i18n]:not([i18n=""])');
    for (const element of hasDataI18n) {
      key = element.getAttribute('i18n');
      if (! this.key2page.has(key) ) {
        this.key2page.set( key, new Set() );
      }
      this.key2page.get(key).add(filename);
    }

    settings = htmlDoc.querySelectorAll('[data-setting]:not([data-setting=""])');
    for (const element of settings) {
      key = element.getAttribute('data-setting');
      if (! this.setting2page.has(key) ) {
        this.setting2page.set( key, new Set() );
      }
      this.setting2page.get(key).add(filename);
    }

  }


  TABS.search.geti18nJs = function (filename, filecontents) {
    var re = /(?:data-i18n=|i18n.getMessage\()["']([^"']*)['"]/g
 
    while (match = re.exec(filecontents)) {
      key = match[1];
      if (! this.key2page.has(key) ) {
        this.key2page.set( key, new Set() );
      }
      this.key2page.get(key).add(filename);
    }
  }


  TABS.search.indexTab =  async function indexTab(tabName) {
    var response = fetch(`tabs/${tabName}.js`);
    response
      .then (data => data.text()) 
      .then (data => {
        this.geti18nJs(tabName, data);
      })
      .catch((error) => {
        console.error(error)
      });


    response = fetch(`tabs/${tabName}.html`);
    response
      .then (data => data.text())
      .then (data => {
        this.geti18nHTML(tabName, data);
      })
      .catch((error) => {
        console.error(error)
      });
  };
  

TABS.search.initialize = function (callback) {
    var self = this;
    this.key2page = new Map();
    this.setting2page = new Map();
    this.messages;

    if (GUI.active_tab != 'search') {
        GUI.active_tab = 'search';
    }

    function searchKeyword() {
      TABS.search.searchMessages(document.getElementById('search-keyword').value);
    }

    function searchKeywordTyping() {
      if (document.getElementById('search-keyword').value.length > 2) {
        TABS.search.searchMessages(document.getElementById('search-keyword').value);
      }
    }
    GUI.load(path.join(__dirname, "search.html"), function () {
        i18n.localize();
        document.getElementById('search-label').addEventListener('click', searchKeyword, false);
        document.getElementById('search-keyword').addEventListener('keyup', searchKeywordTyping, false);
        GUI.content_ready(callback);
    } );
    self.getMessages();
    for (let tab of tabNames) {
        self.indexTab(tab);
    }
}


TABS.search.cleanup = function (callback) {
    if (callback) callback();
};

