'use strict';

const fs = require('fs')

let Localiziation = function(locale) {
    let self  = { };
    let messages = null;
    let localized = 0
    let local = locale;
    
    self.loadMessages = function () { 
        var data;
        try {
            data = fs.readFileSync(path.join(__dirname, "./locale/" + local + "/messages.json"), 'utf8',);
            messages = JSON.parse(data);
        } catch (err) {
            console.log("Error while reading languge file");
        }   
    }
    
    self.getMessage = function(messageID, substitutions = null) {
        try {
            if (substitutions) {
                 return messages[messageID].message.replace(/\{(\d+)\}/g, function (t, i) {
                    return substitutions[i] !== void 0 ? substitutions[i] : "{" + (i - substitutions.length) + "}";
                });
            } else {
                return messages[messageID].message;
            }
       } catch {
           console.log("Unable to get messageID: " + messageID)
           return messageID;
       }
    }

    self.translate = function(messageID) {
        localized++;

        if (messages == null) {
            self.loadMessages();
        }
       
        return self.getMessage(messageID);
       
    };

    self.localize = function () {
        
        $('[i18n]:not(.i18n-replaced)').each(function() {
            var element = $(this);

            element.html(self.translate(element.attr('i18n')));
            element.addClass('i18n-replaced');
        });

        $('[data-i18n]:not(.i18n-replaced)').each(function() {
            var element = $(this);

            const translated = self.translate(element.data('i18n'));
            element.html(translated);
            element.addClass('i18n-replaced');
            if (element.attr("title") !== "") {
                element.attr("title", translated);
            }
        });

        $('[i18n_title]:not(.i18n_title-replaced)').each(function() {
            var element = $(this);

            element.attr('title', self.translate(element.attr('i18n_title')));
            element.addClass('i18n_title-replaced');
        });

        $('[data-i18n_title]:not(.i18n_title-replaced)').each(function() {
            var element = $(this);

            element.attr('title', self.translate(element.data('i18n_title')));
            element.addClass('i18n_title-replaced');
        });

        $('[i18n_label]:not(.i18n_label-replaced)').each(function() {
            var element = $(this);

            element.attr('label', self.translate(element.attr('i18n_label')));
            element.addClass('i18n_label-replaced');
        });

        $('[data-i18n_label]:not(.i18n_label-replaced)').each(function() {
            var element = $(this);

            element.attr('label', self.translate(element.data('i18n_label')));
            element.addClass('i18n_label-replaced');
        });

        $('[i18n_value]:not(.i18n_value-replaced)').each(function() {
            var element = $(this);""

            element.val(self.translate(element.attr('i18n_value')));
            element.addClass('i18n_value-replaced');
        });

        $('[i18n_placeholder]:not(.i18n_placeholder-replaced)').each(function() {
            var element = $(this);

            element.attr('placeholder', self.translate(element.attr('i18n_placeholder')));
            element.addClass('i18n_placeholder-replaced');
        });

        return localized;
    }

    return self;

}
