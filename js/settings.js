'use strict';

const mapSeries = require('promise-map-series')

const mspHelper = require('./../js/msp/MSPHelper');
const { GUI } = require('./gui');
const FC = require('./fc');
const { globalSettings, UnitType } = require('./globalSettings');
const i18n = require('./localization');

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
                        return mspHelper.setSetting(settingPair.setting, settingPair.value);
                    });
                }
            });
        });
    };


    /**
     * 
     * @param {JQuery Element} input 
     * @param {String} inputUnit Unit from HTML Dom input
     */
    self.convertToUnitSetting = function (element, inputUnit) {

        // One of the following;
        // none, OSD, imperial, metric
        const configUnitType = globalSettings.unitType;

        // Small closure to grab the unit as described by either 
        // the app settings or the app OSD settings, confused? yeah
        const getUnitDisplayTypeValue = () => {
            // Try and match the values 
            switch (configUnitType) {
                case UnitType.imperial:
                    return 0;
                    break;
                case UnitType.metric:
                    return 1;
                    break;
                case UnitType.OSD: // Match the OSD value on the UI
                    return globalSettings.osdUnits;
                    break;
                case UnitType.none:
                default:
                    return -1;
                    break;
            }
        }

        // Sets the int value of the way we want to display the 
        // units. We use the OSD unit values here for easy
        const uiUnitValue = getUnitDisplayTypeValue();

        const oldValue = element.val();

        // Display names for the units
        const unitDisplayNames = {
            // Misc
            'cw' : 'cW',
            'percent'   : '%',
            'cmss'      : 'cm/s/s',
            // Time
            'us'        : "uS",
            'msec'      : 'ms',
            'msec-nc'   : 'ms', // Milliseconds, but not converted.
            'dsec'      : 'ds',
            'sec'       : 's',
            'mins'      : 'm',
            'hours'     : 'h',
            'tzmins'    : 'm',
            'tzhours'   : 'hh:mm',
            // Angles
            'centideg'      : 'centi&deg;',
            'centideg-deg'  : 'centi&deg;', // Centidegrees, but always converted to degrees by default
            'deg'           : '&deg;',
            'decideg'       : 'deci&deg;',
            'decideg-lrg'   : 'deci&deg;', // Decidegrees, but always converted to degrees by default
            // Rotational speed
            'degps'     : '&deg; per second',
            'decadegps' : 'deca&deg; per second',
            // Temperature
            'decidegc'  : 'deci&deg;C',
            'degc'      : '&deg;C',
            'degf'      : '&deg;F',
            // Speed
            'cms'       : 'cm/s',
            'v-cms'     : 'cm/s',
            'ms'        : 'm/s',
            'kmh'       : 'Km/h',
            'mph'       : 'mph',
            'hftmin'    : 'x100 ft/min',
            'fts'       : 'ft/s',
            'kt'        : 'Kt',
            // Distance
            'cm'    : 'cm',
            'm'     : 'm',
            'km'    : 'Km',
            'm-lrg' : 'm', // Metres, but converted to larger units
            'ft'    : 'ft',
            'mi'    : 'mi',
            'nm'    : 'NM'
        }

        // Hover full descriptions for the units
        const unitExpandedNames = {
            // Misc
            'cw'        : 'CentiWatts',
            'percent'   : 'Percent',
            'cmss'      : 'Centimetres per second, per second',
            // Time
            'us'        : "Microseconds",
            'msec'      : 'Milliseconds',
            'msec-nc'   : 'Milliseconds',
            'dsec'      : 'Deciseconds',
            'sec'       : 'Seconds',
            'mins'      : 'Minutes',
            'hours'     : 'Hours',
            'tzmins'    : 'Minutes',
            'tzhours'   : 'Hours:Minutes',
            // Angles
            'centideg'      : 'CentiDegrees',
            'centideg-deg'  : 'CentiDegrees',
            'deg'           : 'Degrees',
            'decideg'       : 'DeciDegrees',
            'decideg-lrg'   : 'DeciDegrees',
            // Rotational speed
            'degps'     : 'Degrees per second',
            'decadegps' : 'DecaDegrees per second',
            // Temperature
            'decidegc'  : 'DeciDegrees Celsius',
            'degc'      : 'Degrees Celsius',
            'degf'      : 'Degrees Fahrenheit',
            // Speed
            'cms'       : 'Centimetres per second',
            'v-cms'     : 'Centimetres per second',
            'ms'        : 'Metres per second',
            'kmh'       : 'Kilometres per hour',
            'mph'       : 'Miles per hour',
            'hftmin'    : 'Hundred feet per minute',
            'fts'       : 'Feet per second',
            'kt'        : 'Knots',
            // Distance
            'cm'    : 'Centimetres',
            'm'     : 'Metres',
            'km'    : 'Kilometres',
            'm-lrg' : 'Metres',
            'ft'    : 'Feet',
            'mi'    : 'Miles',
            'nm'    : 'Nautical Miles'
        }

        // Ensure we can do conversions
        if (!inputUnit || !oldValue || !element) {
            return;
        }

        //this is used to get the factor in which we multiply
        //to get the correct conversion, the first index is the from
        //unit and the second is the too unit
        //unitConversionTable[toUnit][fromUnit] -> factor
        const unitRatioTable = {
            'cm' : {
                'm' : 100, 
                'ft' : 30.48
            },
            'm' : {
                'm' : 1,
                'ft' : 0.3048
            },
            'm-lrg' : {
                'km' : 1000,
                'mi' : 1609.344,
                'nm' : 1852
            },
            'cms' : { // Horizontal speed
                'kmh' : 27.77777777777778, 
                'kt': 51.44444444444457, 
                'mph' : 44.704,
                'ms' : 100
            },
            'v-cms' : { // Vertical speed
                'ms' : 100,
                'hftmin' : 50.8,
                'fts' : 30.48
            },
            'msec-nc' : {
                'msec-nc' : 1
            },
            'msec' : {
                'sec' : 1000
            },
            'dsec' : {
                'sec' : 10
            },
            'mins' : {
                'hours' : 60
            },
            'tzmins' : {
                'tzhours' : 'TZHOURS'
            },
            'centideg' : {
                'deg' : 0.1
            },
            'centideg-deg' : {
                'deg' : 0.1
            },
            'decideg' : {
                'deg' : 10
            },
            'decideg-lrg' : {
                'deg' : 10
            },
            'decadegps' : {
                'degps' : 0.1
            },
            'decidegc' : {
                'degc' : 10,
                'degf' : 'FAHREN'
            },
        };

        //this holds which units get converted in which unit systems
        const conversionTable = {
            0: { //imperial
                'cm' : 'ft',
                'm' : 'ft',
                'm-lrg' : 'mi',
                'cms' : 'mph',
                'v-cms' : 'fts',
                'msec' : 'sec',
                'dsec' : 'sec',
                'mins' : 'hours',
                'tzmins' : 'tzhours',
                'decadegps' : 'degps',
                'centideg' : 'deg',
                'centideg-deg' : 'deg',
                'decideg' : 'deg',
                'decideg-lrg' : 'deg',
                'decidegc' : 'degf',
            },
            1: { //metric
                'cm': 'm',
                'm' : 'm',
                'm-lrg' : 'km',
                'cms' : 'kmh',
                'v-cms' : 'ms',
                'msec' : 'sec',
                'dsec' : 'sec',
                'mins' : 'hours',
                'tzmins' : 'tzhours',
                'decadegps' : 'degps',
                'centideg' : 'deg',
                'centideg-deg' : 'deg',
                'decideg' : 'deg',
                'decideg-lrg' : 'deg',
                'decidegc' : 'degc',
            },
            2: { //metric with MPH
                'cm': 'm',
                'm' : 'm',
                'm-lrg' : 'km',
                'cms' : 'mph',
                'v-cms' : 'ms',
                'decadegps' : 'degps',
                'centideg' : 'deg',
                'centideg-deg' : 'deg',
                'decideg' : 'deg',
                'decideg-lrg' : 'deg',
                'msec' : 'sec',
                'dsec' : 'sec',
                'mins' : 'hours',
                'tzmins' : 'tzhours',
                'decidegc' : 'degc',
            },
            3:{ //UK
                'cm' : 'ft',
                'm' : 'ft',
                'm-lrg' : 'mi',
                'cms' : 'mph',
                'v-cms' : 'fts',
                'decadegps' : 'degps',
                'centideg' : 'deg',
                'centideg-deg' : 'deg',
                'decideg' : 'deg',
                'decideg-lrg' : 'deg',
                'msec' : 'sec',
                'dsec' : 'sec',
                'mins' : 'hours',
                'tzmins' : 'tzhours',
                'decidegc' : 'degc',
            },
            4: { //General aviation
                'cm' : 'ft',
                'm' : 'ft',
                'm-lrg' : 'nm',
                'cms': 'kt',
                'v-cms' : 'hftmin',
                'decadegps' : 'degps',
                'centideg' : 'deg',
                'centideg-deg' : 'deg',
                'decideg' : 'deg',
                'decideg-lrg' : 'deg',
                'msec' : 'sec',
                'dsec' : 'sec',
                'mins' : 'hours',
                'tzmins' : 'tzhours',
                'decidegc' : 'degc',
            },
            default: { //show base units
                'decadegps' : 'degps',
                'decideg-lrg' : 'deg',
                'centideg' : 'deg',
                'centideg-deg' : 'deg',
                'tzmins' : 'tzhours',
            }
        };

        //this returns the factor in which to multiply to convert a unit
        const getUnitMultiplier = () => {
            let uiUnits = (uiUnitValue != -1) ? uiUnitValue : 'default';

            if (conversionTable[uiUnits]){
                const fromUnits = conversionTable[uiUnits];
                if (fromUnits[inputUnit]){
                    const multiplier = unitRatioTable[inputUnit][fromUnits[inputUnit]];
                    return {'multiplier':multiplier, 'unitName':fromUnits[inputUnit]};
                }
            }
            return {multiplier:1, unitName:inputUnit};
        }

        // Get the default multi obj or the custom       
        const multiObj = getUnitMultiplier();

        const multiplier = multiObj.multiplier;
        const unitName = multiObj.unitName;

        let decimalPlaces = 0;
        // Update the step, min, and max; as we have the multiplier here.
        if (element.attr('type') == 'number') {
            let step = parseFloat(element.attr('step')) || 1;
            
            if (multiplier !== 1) { 
                decimalPlaces = Math.min(Math.ceil(multiplier / 100), 3);
                // Add extra decimal place for non-integer conversions.
                if (multiplier % 1 != 0 && decimalPlaces < 3) {
                    decimalPlaces++;
                }
                step = 1 / Math.pow(10, decimalPlaces);
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
            newValue = Number((oldValue / multiplier)).toFixed(decimalPlaces);
        }

        element.val(newValue);
        element.data('setting-multiplier', multiplier);

        // Now wrap the input in a display that shows the unit
        element.wrap(`<div data-unit="${unitDisplayNames[unitName]}" title="${unitExpandedNames[unitName]}" class="unit_wrapper unit"></div>`);

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

                if (value > parseInt(input.data('default-max'))) {
                    value = parseInt(input.data('default-max'));
                }

                if (value < parseInt(input.data('default-min'))) {
                    value = parseInt(input.data('default-min'));
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
          let deg = parseInt(trail, 10);
          return deg;
        }
        // count decimals for number in representation like "0.123456"
        if (Math.floor(value) !== value) {
          return value.toString().split(".")[1].length || 0;
        }
        return 0;
    };

    self.pickAndSaveSingleInput = function(inputs, finalCallback) {
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
            self.configureInputs().then(callback);
            self.linkHelpIcons();
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

module.exports = Settings;
