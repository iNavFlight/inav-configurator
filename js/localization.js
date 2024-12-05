'use strict';

// Thanks to Betaflight :)
import i18next from 'i18next';

import store from './store'

const availableLanguages = ['en', 'uk'];

const i18n = {};
  
i18n.init = function (callback) {
    const locale = window.electronAPI.appGetLocale();
    const userLanguage = store.get('userLanguage', locale);
    var resources = {};
    availableLanguages.forEach(lng => {
        var msg = require(`./../locale/${lng}/messages.json`).default;
        resources[lng] = {
            messages: this.parseInputFile(msg)
        }
    });
    i18next.init({
        lng: userLanguage,
        getAsync: false,
        debug: true,
        ns: ['messages'],
        defaultNS:['messages'],
        fallbackLng: 'en',
        resources: resources
    }, function(err) {
        if (err) {
            console.error(`Error loading i18n: ${err}`);
        } else {
            console.log('i18n system loaded');
            const detectedLanguage = i18n.getMessage(`language_${i18n.getValidLocale("DEFAULT")}`);
            i18next.addResourceBundle('en', 'messages', { "detectedLanguage": detectedLanguage }, true, true);
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

i18n.getValidLocale = async function(userLocale) {
    let validUserLocale = userLocale;
    if (validUserLocale === 'DEFAULT') {
        validUserLocale = await window.electronAPI.appGetLocale();
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
    }

    return localized;
}
 
export default i18n;
