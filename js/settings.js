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
            var inputUnit = input.data('unit');

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

                    let dataStep = input.data("step");

                    if (dataStep !== undefined) {
                        input.attr('step', dataStep);
                    } else {
                        input.attr('step', "0.01");
                    }

                    input.attr('min', s.setting.min);
                    input.attr('max', s.setting.max);
                    input.val(s.value.toFixed(2));
                } else {
                    var multiplier = parseFloat(input.data('setting-multiplier') || 1);

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
                    input.change(function() {
                        self.saveInput(input);
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

        //display names for the units
        const unitDisplayDames = {
            // Misc
            'us' : "uS",
            'cw' : 'cW',
            'percent' : '%',
            'cmss' : 'cm/s/s',
            // Time
            'msec' : 'ms',
            'dsec' : 'ds',
            'sec' : 's',
            // Angles
            'deg' : '&deg;',
            'decideg' : 'deci&deg;',
            'decideg-lrg' : 'deci&deg;', // Decidegrees, but always converted to degrees by default
            // Rotational speed
            'degps' : '&deg; per second',
            'decadegps' : 'deca&deg; per second',
            // Temperature
            'decidegc' : 'deci&deg;C',
            'degc' : '&deg;C',
            'degf' : '&deg;F',
            // Speed
            'cms' : 'cm/s',
            'v-cms' : 'cm/s',
            'ms' : 'm/s',
            'kmh' : 'Km/h',
            'mph' : 'mph',
            'hftmin' : 'x100 ft/min',
            'fts' : 'ft/s',
            'kt' : 'Kt',
            // Distance
            'cm' : 'cm',
            'm' : 'm',
            'km' : 'Km',
            'm-lrg' : 'm', // Metres, but converted to larger units
            'ft' : 'ft',
            'mi' : 'mi',
            'nm' : 'NM'
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
            'msec' : {
                'sec' : 1000
            },
            'dsec' : {
                'sec' : 10
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
                'decadegps' : 'degps',
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
                'decadegps' : 'degps',
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
                'decideg' : 'deg',
                'decideg-lrg' : 'deg',
                'msec' : 'sec',
                'dsec' : 'sec',
                'decidegc' : 'degc',
            },
            3:{ //UK
                'cm' : 'ft',
                'm' : 'ft',
                'm-lrg' : 'mi',
                'cms' : 'mph',
                'v-cms' : 'fts',
                'decadegps' : 'degpd',
                'decideg' : 'deg',
                'decideg-lrg' : 'deg',
                'msec' : 'sec',
                'dsec' : 'sec',
                'decidegc' : 'degc',
            },
            4: { //General aviation
                'cm' : 'ft',
                'm' : 'ft',
                'm-lrg' : 'nm',
                'cms': 'kt',
                'v-cms' : 'hftmin',
                'decadegps' : 'degps',
                'decideg' : 'deg',
                'decideg-lrg' : 'deg',
                'msec' : 'sec',
                'dsec' : 'sec',
                'decidegc' : 'degc',
            },
            default: { //show base units
                'decadegps' : 'degps',
                'decideg-lrg' : 'deg',
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

        // Update the step, min, and max; as we have the multiplier here.
        if (element.attr('type') == 'number') {
            let step = element.attr('step') || 1;
            let decimalPlaces = 0;
            
            step = step / multiplier;
            
            if (step < 1) {
                decimalPlaces = step.toString().length - step.toString().indexOf(".") - 1;
                if (parseInt(step.toString().slice(-1)) > 1 ) { 
                    decimalPlaces--; 
                }
                step = 1 / Math.pow(10, decimalPlaces);
            }
            element.attr('step', step.toFixed(decimalPlaces));

            if (multiplier != 'FAHREN') {
                element.attr('min', (element.attr('min') / multiplier).toFixed(decimalPlaces));
                element.attr('max', (element.attr('max') / multiplier).toFixed(decimalPlaces));
            }
        }

        // Update the input with a new formatted unit
        let newValue = "";
        if (multiplier == 'FAHREN') {
            element.attr('min', toFahrenheit(element.attr('min')).toFixed(2));
            element.attr('max', toFahrenheit(element.attr('max')).toFixed(2));
            newValue = toFahrenheit(oldValue).toFixed(2);
        } else {
            const convertedValue = Number((oldValue / multiplier).toFixed(2));
            newValue = Number.isInteger(convertedValue) ? Math.round(convertedValue) : convertedValue;
        }
        element.val(newValue);
        element.data('setting-multiplier', multiplier);

        // Now wrap the input in a display that shows the unit
        element.wrap(`<div data-unit="${unitDisplayDames[unitName]}" class="unit_wrapper unit"></div>`);

        function toFahrenheit(decidegC) {
            return (decidegC / 10) * 1.8 + 32;
        };
    }

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
            var multiplier = input.data('setting-multiplier') || 1;
            if (multiplier == 'FAHREN') {
                value = Math.round(((parseFloat(input.val())-32) / 1.8) * 10);
            } else {
                multiplier = parseFloat(multiplier);
                value = Math.round(parseFloat(input.val()) * multiplier);
            }
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
