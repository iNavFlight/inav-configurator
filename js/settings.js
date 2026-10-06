'use strict';

import mapSeries from 'promise-map-series';

import mspHelper from './../js/msp/MSPHelper';
import GUI from './gui';
import FC from './fc';
import { globalSettings } from './globalSettings';
import i18n from './localization';
import {
    getUnitDecimals,
    getUnitDisplayName,
    getUnitExpandedName,
    getUnitMultiplier,
    smartRound
} from './unitConversion';

function padZeros(val, length) {
    let str = val.toString();

    if (str.length < length) {
        if (str.charAt(0) === '-') {
            str = "-0" + str.substring(1);
            str = padZeros(str, length);
        } else {
            str = padZeros("0" + str, length);
        }
    }

    return str;
}

var Settings = (function () {
    let self = {};

    self.fillSelectOption = function(s, ii) {
        var name = (s.setting.table ? s.setting.table.values[ii] : null);
        if (name) {
            var localizedName = i18n.getMessage(name);
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
        return option;
    }

    self.configureInputs = function() {
        var inputs = [];
        $('[data-setting!=""][data-setting]').each(function() {
            inputs.push($(this));
        });
        return mapSeries(inputs, function (input, ii) {
            var settingName = input.data('setting');
            var inputUnit = input.data('unit');

            let elementId = input.attr('id');
            if (elementId === undefined) {

                // If the element ID is not defined, we need to create one
                // based on the setting name. If this ID exists, we will not create it
                if ($('#' + settingName).length === 0) {
                    input.attr('id', settingName);
                }
            }

            if (globalSettings.showProfileParameters) {
                if (FC.isBatteryProfileParameter(settingName)) {
                    input.css("background-color","#fef2d5");
                }

                if (FC.isControlProfileParameter(settingName)) {
                    input.css("background-color","#d5ebfe");
                }
            }

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
                    parent.remove();
                    return;
                }
                parent.show();

                input.prop('title', 'CLI: ' + input.data('setting'));

                if (input.prop('tagName') == 'SELECT' || s.setting.table) {
                    if (input.attr('type') == 'checkbox') {
                        input.prop('checked', s.value > 0);
                    } else if (input.attr('type') == 'radio') {
                        input.prop( 'checked', s.value == input.attr('value') );
                    } else {
                        input.empty();
                        let option = null;
                        if (input.data('setting-invert-select') === true) {
                            for (var ii = s.setting.max; ii >= s.setting.min; ii--) {
                                option = null;
                                option = self.fillSelectOption(s, ii);

                                option.appendTo(input);
                            }
                        } else {
                            for (var ii = s.setting.min; ii <= s.setting.max; ii++) {
                                option = null;
                                option = self.fillSelectOption(s, ii);

                                option.appendTo(input);
                            }
                        }
                    }
                } else if (s.setting.type == 'string') {
                    input.val(s.value);
                    input.attr('maxlength', s.setting.max);
                } else if (input.data('presentation') == 'range') {
                    GUI.sliderize(input, s.value, s.setting.min, s.setting.max);
                } else if (s.setting.type == 'float') {
                    input.attr('type', 'number');
                    let dataStep = input.data("step");

                    if (typeof dataStep === 'undefined') {
                        dataStep = self.countDecimals(s.value);
                        dataStep = 1 / Math.pow(10, dataStep);
                        input.data("step", dataStep);
                    }

                    input.attr('step', dataStep);
                    input.attr('min', s.setting.min);
                    input.attr('max', s.setting.max);
                    input.val(s.value.toFixed(self.countDecimals(dataStep)));
                } else {
                    var multiplier = parseFloat(input.data('setting-multiplier') || 1);

                    input.data("step", 1);
                    input.val((s.value / multiplier).toFixed(Math.log10(multiplier)));
                    input.attr('type', 'number');
                    if (typeof s.setting.min !== 'undefined' && s.setting.min !== null) {
                        input.attr('min', (s.setting.min / multiplier).toFixed(Math.log10(multiplier)));
                    }

                    if (typeof s.setting.max !== 'undefined' && s.setting.max !== null) {
                        input.attr('max', (s.setting.max / multiplier).toFixed(Math.log10(multiplier)));
                    }
                }

                // If data is defined, We want to convert this value into
                // something matching the units
                self.convertToUnitSetting(input, inputUnit);

                input.data('setting-info', s.setting);
                if (input.data('live')) {
                    input.on('change', function () {
                        const settingPair = self.processInput(input);
                        if (!settingPair) { return; }
                        return mspHelper.setSetting(settingPair.setting, settingPair.value);
                    });
                }
            }).catch(function(err) {
                // Setting read failed. Log it so the problem is visible, then
                // remove the input so incorrect data is not shown or saved.
                console.error('Failed to read setting "' + settingName + '":', err);
                var parent = input.parents('.setting-container:first');
                if (parent.length == 0) {
                    parent = input.parent();
                }
                parent.remove();
            });
        });
    };

    /**
     * 
     * @param {JQuery Element} input 
     * @param {String} inputUnit Unit from HTML Dom input
     */
    self.convertToUnitSetting = function (element, inputUnit) {

        const oldValue = element.val();

        // Ensure we can do conversions
        if (!inputUnit || !oldValue || !element) {
            return;
        }

        // Get the default multi obj or the custom
        const multiObj = getUnitMultiplier(inputUnit);

        const multiplier = multiObj.multiplier;
        const unitName = multiObj.unitName;

        let decimalPlaces = 0;
        // Update the step, min, and max; as we have the multiplier here.
        if (element.attr('type') == 'number') {
            let step = parseFloat(element.data("step")) || parseFloat(element.attr('step')) || 1;

            if (multiplier !== 1) { 
                decimalPlaces = getUnitDecimals(multiplier);
                step = 1 / Math.pow(10, decimalPlaces);
            } else { 
                decimalPlaces = this.countDecimals(step);
            }
            element.attr('step', step.toFixed(decimalPlaces));

            if (multiplier !== 'FAHREN' && multiplier !== 'TZHOURS' && multiplier !== 1) {
                element.data('default-min', element.attr('min'));
                element.data('default-max', element.attr('max'));
                element.attr('min', (parseFloat(element.attr('min')) / multiplier).toFixed(decimalPlaces));
                element.attr('max', (parseFloat(element.attr('max')) / multiplier).toFixed(decimalPlaces));
            }
        }

        // Update the input with a new formatted unit
        let newValue = "";
        if (multiplier === 'FAHREN') {
            element.attr('min', toFahrenheit(element.attr('min')).toFixed(decimalPlaces));
            element.attr('max', toFahrenheit(element.attr('max')).toFixed(decimalPlaces));
            newValue = toFahrenheit(oldValue).toFixed(decimalPlaces);
        } else if (multiplier === 'TZHOURS') {
            element.attr('type', 'text');
            element.removeAttr('step');
            element.attr('pattern', '([0-9]{2}|[-,0-9]{3}):([0-9]{2})');
            let hours = Math.floor(oldValue/60);
            let mins = oldValue - (hours*60);
            newValue = ((hours < 0) ? padZeros(hours, 3) : padZeros(hours, 2)) + ':' + padZeros(mins, 2);
        } else {
            newValue = smartRound(Number(oldValue / multiplier), decimalPlaces);
        }

        element.val(newValue);
        element.data('setting-multiplier', multiplier);

        // Now wrap the input in a display that shows the unit
        element.wrap(`<div data-unit="${getUnitDisplayName(unitName)}" title="${getUnitExpandedName(unitName)}" class="unit_wrapper unit"></div>`);

        function toFahrenheit(decidegC) {
            return (decidegC / 10) * 1.8 + 32;
        };
    }

    self.processInput = function(input) {
        var settingName = input.data('setting');
        var setting = input.data('setting-info');
        var value;

        if (typeof setting == 'undefined') {
            return null;
        }
        if (setting.table) {
            if (input.attr('type') == 'checkbox') {
                value = input.prop('checked') ? 1 : 0;
            } else if (input.attr('type') == 'radio') {
                if (input.prop('checked')) {
                    value = parseInt(input.val());
                }
            } else {
                value = parseInt(input.val());
            }
        } else if(setting.type == 'string') {
            value = input.val();
        } else {
            var multiplier = input.data('setting-multiplier') || 1;
            if (multiplier == 'FAHREN') {
                value = Math.round(((parseFloat(input.val())-32) / 1.8) * 10);
            } else if (multiplier === 'TZHOURS') {
                let inputTZ = input.val().split(':');
                value = (parseInt(inputTZ[0]) * 60) + parseInt(inputTZ[1]);
                
                if (value > parseInt(input.attr('max'))) {
                    value = parseInt(input.attr('max'));
                }

                if (value < parseInt(input.attr('min'))) {
                    value = parseInt(input.attr('min'));
                }
            } else {
                multiplier = parseFloat(multiplier);
                
                let precision = input.data("step") || 1; // data-step is always based on the default firmware units.
                precision = self.countDecimals(precision);

                if (precision === 0) {
                    value = Math.round(parseFloat(input.val()) * multiplier);
                } else {
                    value = Math.round((parseFloat(input.val()) * multiplier) * Math.pow(10, precision)) / Math.pow(10, precision);
                }

                // data-default-min and data-default-max only exist once a unit
                // multiplier has rewritten the min and max attributes, so they
                // hold the bounds in firmware units. Settings without a
                // multiplier never get them, and parseInt(undefined) is NaN,
                // which makes both comparisons false and skips the clamp
                // entirely. Falling back to the attributes covers those,
                // because without a multiplier the attributes already carry
                // the firmware-unit bounds.
                //
                // This matters because the value is serialized with push8 and
                // friends, which mask rather than reject. An out-of-range
                // entry would otherwise wrap into a different in-range value
                // that the flight controller then accepts as valid.
                let clampMax = Number.parseInt(input.data('default-max'));
                if (Number.isNaN(clampMax)) {
                    clampMax = Number.parseInt(input.attr('max'));
                }
                if (!Number.isNaN(clampMax) && value > clampMax) {
                    value = clampMax;
                }

                let clampMin = Number.parseInt(input.data('default-min'));
                if (Number.isNaN(clampMin)) {
                    clampMin = Number.parseInt(input.attr('min'));
                }
                if (!Number.isNaN(clampMin) && value < clampMin) {
                    value = clampMin;
                }
            }
        }
        return {setting: settingName, value: value};
    };

    self.countDecimals = function(value) {
        let text = value.toString()
        // verify if number 0.000005 is represented as "5e-6"
        if (text.indexOf('e-') > -1) {
          let [base, trail] = text.split('e-');
          let decimals = parseInt(trail, 10);
          return decimals;
        }
        // count decimals for number in representation like "0.123456"
        if (Math.floor(value) !== value) {
          return value.toString().split(".")[1].length || 0;
        }
        return 0;
    };

    self.pickAndSaveSingleInput = function(inputs, finalCallback) {
        // Skip inputs whose settings failed to load (null settingPair), using a
        // loop rather than recursion to avoid stack growth for large null runs.
        while (inputs.length > 0 && !self.processInput(inputs[0])) {
            inputs.shift();
        }
        if (inputs.length > 0) {
            var input = inputs.shift();
            var settingPair = self.processInput(input);
            return mspHelper.setSetting(settingPair.setting, settingPair.value, function() {
                return self.pickAndSaveSingleInput(inputs, finalCallback);
            });
        } else {
            if (finalCallback) {
                finalCallback();
            }
        }
    };

    self.saveInputs = function(finalCallback) {
        var inputs = [];
        $('[data-setting!=""][data-setting]').each(function() {
            inputs.push($(this));
        });
        self.pickAndSaveSingleInput(inputs, finalCallback);
    };

    self.processHtml = function(callback) {
        return function() {
            // Start loading settings in background - don't block rendering
            const settingsPromise = self.configureInputs();
            self.linkHelpIcons();
            // Call callback immediately so page can start rendering
            // Pass settingsPromise so tabs can optionally await it if needed
            callback(settingsPromise);
        };
    };

    self.getInputValue = function(settingName) {
        return $('[data-setting="' + settingName + '"]').val();
    };

    self.linkHelpIcons = function() {
        var helpIcons = [];
        $('.helpicon').each(function(){
            helpIcons.push($(this));
        });

        return mapSeries(helpIcons, function(helpIcon, ii) {
            let forAtt = helpIcon.attr('for');

            if (typeof forAtt !== "undefined" && forAtt !== "") {
                let dataSettingName = $('#' + forAtt).data("setting");

                if (typeof dataSettingName === "undefined" || dataSettingName === "") {
                    dataSettingName = $('#' + forAtt).data("setting-placeholder");
                }

                if (typeof dataSettingName !== "undefined" && dataSettingName !== "") {
                    helpIcon.wrap('<a class="helpiconLink" href="' + globalSettings.docsTreeLocation + 'Settings.md#' + dataSettingName + '" target="_blank"></a>');
                }
            }

            return;
        });
    };

    return self;
})();

export default  Settings;
export { smartRound };
