'use strict';

var Settings = (function () {
    let self = {};

    self.configureInputs = function() {
        var inputs = [];
        $('[data-setting!=""][data-setting]').each(function() {
            inputs.push($(this));
        });
        return Promise.mapSeries(inputs, function (input, ii) {
            var settingName = input.data('setting');
            return mspHelper.getSetting(settingName).then(function (s) {
                // Check if the input declares a parent
                // to be hidden in case of the setting not being available.
                // Otherwise, default to hiding its parent
                var parent = input.parents('.setting-container:first');
                if (parent.length == 0) {
                    parent = input.parent();
                }
                if (!s) {
                    // Setting doesn't exist.
                    input.val(null);
                    parent.hide();
                    return;
                }
                parent.show();
                if (input.prop('tagName') == 'SELECT' || s.setting.table) {
                    if (input.attr('type') == 'checkbox') {
                        input.prop('checked', s.value > 0);
                    } else {
                        input.empty();
                        for (var ii = s.setting.min; ii <= s.setting.max; ii++) {
                            var name = (s.setting.table ? s.setting.table.values[ii] : null);
                            if (name) {
                                var localizedName = chrome.i18n.getMessage(name);
                                if (localizedName) {
                                    name = localizedName;
                                }
                            } else {
                                // Fallback to the number itself
                                name = ii;
                            }
                            var option = $('<option/>').attr('value', ii).text(name);
                            if (ii == s.value) {
                                option.prop('selected', true);
                            }
                            option.appendTo(input);
                        }
                    }
                } else if (s.setting.type == 'string') {
                    input.val(s.value);
                } else if (s.setting.type == 'float') {
                    input.attr('type', 'number');
                    input.attr('step', "0.01");
                    input.attr('min', s.setting.min);
                    input.attr('max', s.setting.max);
                    input.val(s.value.toFixed(2));
                } else {
                    var multiplier = parseFloat(input.data('setting-multiplier') || 1);
                    input.attr('type', 'number');
                    input.attr('step', 1 / multiplier);
                    input.attr('min', s.setting.min / multiplier);
                    input.attr('max', s.setting.max / multiplier);
                    input.val((s.value / multiplier).toFixed(Math.log10(multiplier)));
                }
                input.data('setting-info', s.setting);
                if (input.data('live')) {
                    input.change(function() {
                        self.saveInput(input);
                    });
                }
            });
        });
    };

    self.saveInput = function(input) {
        var settingName = input.data('setting');
        var setting = input.data('setting-info');
        var value;

        if (typeof setting == 'undefined') {
            return null;
        }

        if (setting.table) {
            if (input.attr('type') == 'checkbox') {
                value = input.prop('checked') ? 1 : 0;
            } else {
                value = parseInt(input.val());
            }
        } else if(setting.type == 'string') {
            value = input.val();
        } else {
            var multiplier = parseFloat(input.data('setting-multiplier') || 1);
            value = parseFloat(input.val()) * multiplier;
        }
        return mspHelper.setSetting(settingName, value);
    };

    self.saveInputs = function() {
        var inputs = [];
        $('[data-setting!=""][data-setting]').each(function() {
            inputs.push($(this));
        });
        return Promise.mapSeries(inputs, function (input, ii) {
            return self.saveInput(input);
        });
    };

    self.processHtml = function(callback) {
        return function() {
            self.configureInputs().then(callback);
        };
    };

    self.getInputValue = function(settingName) {
        return $('[data-setting="' + settingName + '"]').val();
    };

    return self;
})();
