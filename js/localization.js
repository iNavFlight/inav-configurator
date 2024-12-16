'use strict';

// Thanks to Betaflight :)

window.$ = window.jQuery =  require('jquery');
const { app } = require('@electron/remote');
const path = require('path');
const i18next = require('i18next');
const i18nextXHRBackend = require('i18next-xhr-backend');
const Store = require('electron-store');
const store = new Store();


const availableLanguages = ['en', 'ja', 'uk','zh_CN'];

const i18n = {};
  
i18n.init = function (callback) {
        
    i18next.use(i18nextXHRBackend);
    i18next.init({
        lng: store.get('userLanguage', app.getLocale()),
        getAsync: false,
        debug: true,
        ns: ['messages'],
        defaultNS:['messages'],
        fallbackLng: 'en',
        backend: {
            loadPath: path.join(__dirname, "./../locale/{{lng}}/{{ns}}.json"),
            parse: i18n.parseInputFile,
        },
    }, function(err) {
        if (err !== undefined) {
            console.error(`Error loading i18n: ${err}`);
        } else {
            console.log('i18n system loaded');
            const detectedLanguage = i18n.getMessage(`language_${i18n.getValidLocale("DEFAULT")}`);
            i18next.addResourceBundle('en', 'messages', {"detectedLanguage": detectedLanguage }, true, true);
            i18next.on('languageChanged', function () {
                i18n.localize(true);
            });
        }

        if (callback) {
            callback();
        }
    });
}

i18n.parseInputFile = function (data) {
    // Remove the $n interpolate of Chrome $1, $2, ... -> {{1}}, {{2}}, ...
    const REGEXP_CHROME = /\$([1-9])/g;
    const dataChrome = data.replace(REGEXP_CHROME, '{{$1}}');

    // Remove the .message of the nesting $t(xxxxx.message) -> $t(xxxxx)
    const REGEXP_NESTING = /\$t\(([^\)]*).message\)/g;
    const dataNesting = dataChrome.replace(REGEXP_NESTING, '$t($1)');

    // Move the .message of the json object to root xxxxx.message -> xxxxx
    const jsonData = JSON.parse(dataNesting);
    Object.entries(jsonData).forEach(([key, value]) => {
        jsonData[key] = value.message;
    });

    return jsonData;
}

i18n.getValidLocale = function(userLocale) {
    let validUserLocale = userLocale;
    if (validUserLocale === 'DEFAULT') {
        validUserLocale = app.getLocale();
        console.log(`Detected locale ${validUserLocale}`);
    }

    return validUserLocale;
}

i18n.getMessage = function(messageID, parameters) {

    let parametersObject;

    if (!i18next.exists(messageID)) {
        return false;
    }

    // Option 1, no parameters or Object as parameters (i18Next type parameters)
    if ((parameters === undefined) || ((parameters.constructor !== Array) && (parameters instanceof Object))) {
        parametersObject = parameters;

    // Option 2: parameters as $1, $2, etc.
    // (deprecated, from the old Chrome i18n
    } else {

        // Convert the input to an array
        let parametersArray = parameters;
        if (parametersArray.constructor !== Array) {
            parametersArray = [parameters];
        }

        parametersObject = {};
        parametersArray.forEach(function(parameter, index) {
            parametersObject[index + 1] = parameter;
        });
    }

    return i18next.t(messageID, parametersObject);
};

i18n.getCurrentLanguage = function() {
    return i18next.language;
};

i18n.getLanguages = function() {
    return availableLanguages;
}

i18n.changeLanguage = function(languageSelected) {
    store.set('userLanguage', languageSelected);
    i18next.changeLanguage(i18n.getValidLocale(languageSelected));
    //i18n.selectedLanguage = languageSelected;
};

i18n.localize = function (reTranslate = false) {
    
    let localized = 0;

    const translate = function(messageID) {
        localized++;
        return i18n.getMessage(messageID);
    };
    
    if (reTranslate) {
        $('[i18n]').each(function() {
            const element = $(this);
            element.html(translate(element.attr('i18n')));
        });

        $('[data-i18n]').each(function() {
            const element = $(this);

            const translated = translate(element.data('i18n'));
            element.html(translated);
            if (element.attr("title") !== "") {
                element.attr("title", translated);
            }
        });

        $('[i18n_title]').each(function() {
            const element = $(this);
            element.attr('title', translate(element.attr('i18n_title')));
        });

        $('[data-i18n_title]').each(function() {
            const element = $(this);
            element.attr('title', translate(element.data('i18n_title')));
        });

        $('[i18n_label]').each(function() {
            const element = $(this);
            element.attr('label', translate(element.attr('i18n_label')));
        });

        $('[data-i18n_label]').each(function() {
            const element = $(this);
            element.attr('label', translate(element.data('i18n_label')));
        });

        $('[i18n_value]').each(function() {
            const element = $(this);
            element.val(translate(element.attr('i18n_value')));
        });

        $('[i18n_placeholder]').each(function() {
            const element = $(this);
            element.attr('placeholder', translate(element.attr('i18n_placeholder')));
        });

        $('[i18n_lang]').each(function() {
            const element = $(this);
            element.attr('lang', translate(element.attr('i18n_lang')));
        });
    } else {

        $('[i18n]:not(.i18n-replaced)').each(function() {
            const element = $(this);

            element.html(translate(element.attr('i18n')));
            element.addClass('i18n-replaced');
        });

        $('[data-i18n]:not(.i18n-replaced)').each(function() {
            const element = $(this);

            const translated = translate(element.data('i18n'));
            element.html(translated);
            element.addClass('i18n-replaced');
            if (element.attr("title") !== "") {
                element.attr("title", translated);
            }
        });

        $('[i18n_title]:not(.i18n_title-replaced)').each(function() {
            const element = $(this);

            element.attr('title', translate(element.attr('i18n_title')));
            element.addClass('i18n_title-replaced');
        });

        $('[data-i18n_title]:not(.i18n_title-replaced)').each(function() {
            const element = $(this);

            element.attr('title', translate(element.data('i18n_title')));
            element.addClass('i18n_title-replaced');
        });

        $('[i18n_label]:not(.i18n_label-replaced)').each(function() {
            const element = $(this);

            element.attr('label', translate(element.attr('i18n_label')));
            element.addClass('i18n_label-replaced');
        });

        $('[data-i18n_label]:not(.i18n_label-replaced)').each(function() {
            const element = $(this);

            element.attr('label', translate(element.data('i18n_label')));
            element.addClass('i18n_label-replaced');
        });

        $('[i18n_value]:not(.i18n_value-replaced)').each(function() {
            const element = $(this);""

            element.val(translate(element.attr('i18n_value')));
            element.addClass('i18n_value-replaced');
        });

        $('[i18n_placeholder]:not(.i18n_placeholder-replaced)').each(function() {
            const element = $(this);

            element.attr('placeholder', translate(element.attr('i18n_placeholder')));
            element.addClass('i18n_placeholder-replaced');
        });

        $('[i18n_lang]:not(.i18n_lang-replaced)').each(function() {
            const element = $(this);
            element.attr('lang', translate(element.attr('i18n_lang')));
            element.addClass('i18n_lang-replaced');
        });

    }

    return localized;
}
 
module.exports = i18n;
