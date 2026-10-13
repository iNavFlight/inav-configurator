'use strict';

import MSPChainerClass from './../js/msp/MSPchainer';
import mspHelper from './../js/msp/MSPHelper';
import MSPCodes from './../js/msp/MSPCodes';
import MSP from './../js/msp';
import GUI from './../js/gui';
import FC from './../js/fc';
import interval from './../js/intervals';
import VTX from './../js/vtx';
import i18n from './../js/localization';
import Settings from './../js/settings';
import features from './../js/feature_framework';

const configurationTab = {};

function isIna226Selected($meterType) {
    const settingInfo = $meterType.data('setting-info');
    const selectedValue = Number.parseInt($meterType.val());

    return settingInfo?.table?.values?.[selectedValue] === 'INA226';
}

function updateIna226SettingsVisibility() {
    const usesIna226Voltage = isIna226Selected($('#vbat_meter_type'));
    const usesIna226Current = isIna226Selected($('#current_meter_type'));

    $('.ina226-common-setting').prop('hidden', !(usesIna226Voltage || usesIna226Current));
    $('.ina226-current-setting').prop('hidden', !usesIna226Current);
    $('.adc-voltage-setting').toggle(!usesIna226Voltage);
    $('.adc-current-setting').toggle(!usesIna226Current);
}

// sensorIndex_e values the firmware lists in MSP2_INAV_I2C_BUSES, with the
// select whose setting table names the detected hardware
const I2C_SENSOR_ROLES = {
    1: { label: 'sensorAccelerometer', select: '#sensor-acc' },
    2: { label: 'sensorBarometer', select: '#sensor-baro' },
    3: { label: 'sensorMagnetometer', select: '#sensor-mag' },
    4: { label: 'sensorRangefinder', select: '#sensor-rangefinder' },
    5: { label: 'sensorPitot', select: '#sensor-pitot' },
};

// I2CSpeed values, in the order of the i2c_speed table
const I2C_SPEED_KHZ = [400, 800, 100, 200, 1000];

function i2cBusSetting(bus) {
    return 'i2c' + (bus.bus + 1) + '_speed';
}

// Added before the settings are bound, so each select fills from its
// i2cN_speed setting like the static ones and disappears without it.
function addI2cBusRows() {
    const $buses = $('.i2c-buses');
    if (!FC.I2C_BUSES?.length) {
        // keeps I2C Speed the last row, without the separator under it
        $buses.remove();
        return;
    }
    for (const bus of FC.I2C_BUSES) {
        const setting = i2cBusSetting(bus);
        const $row = $('<div class="select i2c-bus"></div>');
        $('<select></select>').attr({ id: setting, 'data-setting': setting }).appendTo($row);
        $('<label></label>').attr('for', setting)
            .append($('<span></span>').text(i18n.getMessage(bus.software ? 'configurationI2cSoftwareBusSpeed' : 'configurationI2cBusSpeed',
                ['I2C' + (bus.bus + 1)])))
            .append('<span class="i2c-bus-sensors"></span>')
            .appendTo($row);
        $('<div class="helpicon cf_tip"></div>').attr({ for: setting, title: i18n.getMessage('configurationI2cBusSpeedHelp') })
            .appendTo($row);
        $row.appendTo($buses);
    }
}

function describeI2cSensor(sensor) {
    const role = I2C_SENSOR_ROLES[sensor.role];
    const address = '0x' + sensor.address.toString(16).toUpperCase().padStart(2, '0');
    if (!role) {
        return address;
    }
    const names = $(role.select).data('setting-info')?.table?.values;
    return i18n.getMessage(role.label) + ' ' + (names?.[sensor.hardware] ?? sensor.hardware) + ' (' + address + ')';
}

// Needs the sensor selects' setting tables, so it runs once the settings are loaded.
function fillI2cBusRows() {
    for (const bus of FC.I2C_BUSES || []) {
        // the firmware table keeps its historical order; show them by speed
        const $select = $('#' + i2cBusSetting(bus));
        const value = $select.val();
        $select.append($select.children('option').get().sort((a, b) => parseInt(a.text, 10) - parseInt(b.text, 10)));
        $select.val(value);
        const sensors = bus.sensors.length ? bus.sensors.map(describeI2cSensor).join(', ') : i18n.getMessage('i2cBusNoSensors');
        const running = i18n.getMessage('i2cBusRunningAt', [I2C_SPEED_KHZ[bus.speed] ?? '?']);
        $select.siblings('label').find('.i2c-bus-sensors')
            .text(sensors + ' · ')
            .append($('<span class="i2c-bus-clock"></span>').text(running));
    }
}

function isMztcPortAssigned() {
    const ports = FC.SERIAL_CONFIG?.ports;
    if (!Array.isArray(ports)) {
        return false;
    }

    return ports.some(port => port.functions?.includes('MZTC_CAMERA'));
}

function updateMztcSettingsVisibility() {
    // The camera settings only reach the firmware over a UART, so the card is
    // meaningless until the peripheral is assigned in the Ports tab.
    $('.config-mztc').toggle(isMztcPortAssigned());
}

// Applying a preset is an action on the firmware, not a stored value. The
// firmware writes the palette, brightness, contrast, enhancement, both denoise
// levels, the shutter mode and the correction interval, then reports them back.
// Sending MSP2_SET_MZTC_PRESET is what makes that happen. Saving the setting on
// its own would only record the label.
function applyMztcPreset(presetIndex, onDone) {
    MSP.send_message(MSPCodes.MSP2_SET_MZTC_PRESET, [presetIndex], false, function () {
        // Re-read every setting so the advanced fields show what the firmware
        // actually applied instead of the values the user was looking at.
        Settings.processHtml(onDone || function () {})();
    });
}

function bindMztcPresetSelector() {
    const $preset = $('#mztc_preset');
    if (!$preset.length) {
        return;
    }

    $preset.on('change', function () {
        const value = Number.parseInt($(this).val(), 10);
        if (Number.isNaN(value)) {
            return;
        }
        applyMztcPreset(value);
    });
}

configurationTab.initialize = function (callback, scrollPosition) {

    if (GUI.active_tab !== this) {
        GUI.active_tab = this;

    }

    var loadChainer = new MSPChainerClass();

    var loadChain = [
        mspHelper.loadFeatures,
        mspHelper.loadSensorAlignment,
        mspHelper.loadAdvancedConfig,
        mspHelper.loadVTXConfig,
        mspHelper.loadBoardAlignment,
        mspHelper.loadCurrentMeterConfig,
        mspHelper.loadMiscV2,
        mspHelper.loadSerialPorts,
        mspHelper.loadI2cBuses
    ];

    loadChainer.setChain(loadChain);
    loadChainer.setExitPoint(load_html);
    loadChainer.execute();

    var saveChainer = new MSPChainerClass();

    var saveChain = [
        mspHelper.saveAccTrim,
        mspHelper.saveAdvancedConfig,
        mspHelper.saveVTXConfig,
        mspHelper.saveCurrentMeterConfig,
        mspHelper.saveMiscV2,
        saveSettings,
        mspHelper.saveToEeprom
    ];

    function saveSettings(onComplete) {
        Settings.saveInputs(onComplete);
    }

    saveChainer.setChain(saveChain);
    saveChainer.setExitPoint(reboot);

    function reboot() {
        //noinspection JSUnresolvedVariable
        GUI.log(i18n.getMessage('configurationEepromSaved'));

        GUI.tab_switch_cleanup(function () {
            MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, reinitialize);
        });
    }

    function reinitialize() {
        //noinspection JSUnresolvedVariable
        GUI.log(i18n.getMessage('deviceRebooting'));
        GUI.handleReconnect($('.tab_configuration a'));
    }

    function load_html() {
        import('./configuration.html?raw').then(({default: html}) => GUI.load(html, function () {
            addI2cBusRows();
            Settings.processHtml(process_html)();
        }));
    }

    function process_html(settingsPromise) {

        let i;

        // generate features
        var fcFeatures = FC.getFeatures();

        var features_e = $('.features');
        for (let i = 0; i < fcFeatures.length; i++) {
            var row_e,
                tips = [],
                feature_tip_html = '';

            if (fcFeatures[i].showNameInTip) {
                tips.push(i18n.getMessage("manualEnablingTemplate").replace("{name}", fcFeatures[i].name));
            }

            if (fcFeatures[i].haveTip) {
                tips.push(i18n.getMessage("feature" + fcFeatures[i].name + "Tip"));
            }

            if (tips.length > 0) {
                feature_tip_html = '<div class="helpicon cf_tip" title="' + tips.join("<br><br>") + '"></div>';
            }

            row_e = $('<div class="checkbox">' +
                '<input type="checkbox" data-bit="' + fcFeatures[i].bit + '" class="feature toggle" name="' + fcFeatures[i].name + '" title="' + fcFeatures[i].name + '"' +
                ' id="feature-' + fcFeatures[i].bit + '" ' +
                '>' +
                '<label for="feature-' + fcFeatures[i].bit + '">' +
                '<span data-i18n="feature' + fcFeatures[i].name + '"></span>' +
                '</label>' +
                feature_tip_html +
                '</div>');

            features_e.each(function () {
                if ($(this).hasClass(fcFeatures[i].group)) {
                    $(this).after(row_e);
                }
            });
        }

        features.updateUI($('.tab-configuration'), FC.FEATURES);

        // translate to user-selected language
       i18n.localize();;

        // VTX
        var config_vtx = $('.config-vtx');
        if (FC.VTX_CONFIG.device_type != VTX.DEV_UNKNOWN) {

            var vtx_band = $('#vtx_band');
            vtx_band.empty();
            var vtx_no_band_note = $('#vtx_no_band');
            if (FC.VTX_CONFIG.band < VTX.BAND_MIN || FC.VTX_CONFIG.band > VTX.BAND_MAX) {
                var noBandName = i18n.getMessage("configurationNoBand");
                $('<option value="0">' + noBandName + '</option>').appendTo(vtx_band);
                vtx_no_band_note.show();
            } else {
                vtx_no_band_note.hide();
            }
            for (var ii = 0; ii < VTX.BANDS.length; ii++) {
                var band_name = VTX.BANDS[ii].name;
                var option = $('<option value="' + VTX.BANDS[ii].code + '">' + band_name + '</option>');
                if (VTX.BANDS[ii].code == FC.VTX_CONFIG.band) {
                    option.prop('selected', true);
                }
                option.appendTo(vtx_band);
            }
            vtx_band.on('change', function () {
                FC.VTX_CONFIG.band = parseInt($(this).val());
            });

            var vtx_channel = $('#vtx_channel');
            vtx_channel.empty();
            for (var ii = VTX.CHANNEL_MIN; ii <= VTX.CHANNEL_MAX; ii++) {
                var option = $('<option value="' + ii + '">' + ii + '</option>');
                if (ii == FC.VTX_CONFIG.channel) {
                    option.prop('selected', true);
                }
                option.appendTo(vtx_channel);
            }
            vtx_channel.on('change', function () {
                FC.VTX_CONFIG.channel = parseInt($(this).val());
            });

            var vtx_power = $('#vtx_power');
            vtx_power.empty();
            for (var ii = FC.VTX_CONFIG.power_min; ii <= FC.VTX_CONFIG.power_count; ii++) {
                var option = $('<option value="' + ii + '">' + ii + '</option>');
                if (ii == FC.VTX_CONFIG.power) {
                    option.prop('selected', true);
                }
                option.appendTo(vtx_power);
            }
            vtx_power.on('change', function () {
                FC.VTX_CONFIG.power = parseInt($(this).val());
            });

            var vtx_low_power_disarm = $('#vtx_low_power_disarm');
            vtx_low_power_disarm.empty();
            for (var ii = VTX.LOW_POWER_DISARM_MIN; ii <= VTX.LOW_POWER_DISARM_MAX; ii++) {
                var name = i18n.getMessage("configurationVTXLowPowerDisarmValue_" + ii);
                if (!name) {
                    name = ii;
                }
                var option = $('<option value="' + ii + '">' + name + '</option>');
                if (ii == FC.VTX_CONFIG.low_power_disarm) {
                    option.prop('selected', true);
                }
                option.appendTo(vtx_low_power_disarm);
            }
            vtx_low_power_disarm.on('change', function () {
                FC.VTX_CONFIG.low_power_disarm = parseInt($(this).val());
            });

            config_vtx.show();
        } else {
            config_vtx.hide();
        }

        // for some odd reason chrome 38+ changes scroll according to the touched select element
        // i am guessing this is a bug, since this wasn't happening on 37
        // code below is a temporary fix, which we will be able to remove in the future (hopefully)
        //noinspection JSValidateTypes
        $('#content').scrollTop((scrollPosition) ? scrollPosition : 0);

        // fill board alignment
        $('input[name="board_align_yaw"]').val((FC.BOARD_ALIGNMENT.yaw / 10.0).toFixed(1));

        // fill magnetometer
        //UPDATE: moved to GPS tab and hidden
        //$('#mag_declination').val(FC.MISC.mag_declination);

        // fill battery voltage
        $('#voltagesource').val(FC.MISC.voltage_source);
        $('#cells').val(FC.MISC.battery_cells);
        $('#celldetectvoltage').val(FC.MISC.vbatdetectcellvoltage);
        $('#mincellvoltage').val(FC.MISC.vbatmincellvoltage);
        $('#maxcellvoltage').val(FC.MISC.vbatmaxcellvoltage);
        $('#warningcellvoltage').val(FC.MISC.vbatwarningcellvoltage);
        $('#voltagescale').val(FC.MISC.vbatscale);

        // fill current
        $('#currentscale').val(FC.CURRENT_METER_CONFIG.scale);
        $('#currentoffset').val(FC.CURRENT_METER_CONFIG.offset / 10);

        // fill battery capacity
        $('#battery_capacity').val(FC.MISC.battery_capacity);
        let batCapWarn = Math.round(FC.MISC.battery_capacity_warning * 100 / FC.MISC.battery_capacity);
        $('#battery_capacity_warning').val(isNaN(batCapWarn) ? "" : batCapWarn);
        let batCapWarnCrit = Math.round(FC.MISC.battery_capacity_critical * 100 / FC.MISC.battery_capacity);
        $('#battery_capacity_critical').val(isNaN(batCapWarnCrit) ? "" : batCapWarnCrit);
        $('#battery_capacity_unit').val(FC.MISC.battery_capacity_unit);

        const $i2cSpeedInfo = $('#i2c_speed-info');

        // One speed per bus, or the single i2c_speed of older firmware
        function updateI2cSpeedInfo() {
            const speeds = $('#i2c_speed, .i2c-bus select').map(function () {
                return $(this).children('option:selected').text();
            }).get();

            $i2cSpeedInfo.removeClass('ok-box info-box warning-box');
            if (speeds.some(speed => speed === '100KHZ' || speed === '200KHZ')) {
                $i2cSpeedInfo.addClass('warning-box').html(i18n.getMessage('i2cSpeedTooLow')).show();
            } else if (speeds.includes('400KHZ')) {
                $i2cSpeedInfo.addClass('info-box').html(i18n.getMessage('i2cSpeedSuggested800khz')).show();
            } else {
                $i2cSpeedInfo.hide();
            }
        }

        $('#i2c_speed, .i2c-bus select').on('change', updateI2cSpeedInfo);

        // Wait for settings to load before triggering change event
        settingsPromise.then(function() {
            fillI2cBusRows();
            updateI2cSpeedInfo();
            $('#vbat_meter_type, #current_meter_type').on('change', updateIna226SettingsVisibility);
            updateIna226SettingsVisibility();
            updateMztcSettingsVisibility();
            bindMztcPresetSelector();
        }).catch(function(error) {
            console.error('Settings load failed, dependent controls not initialized:', error);
        });

        $('a.save').on('click', function () {
            //UPDATE: moved to GPS tab and hidden
            //FC.MISC.mag_declination = parseFloat($('#mag_declination').val());

            FC.MISC.battery_cells = parseInt($('#cells').val());
            FC.MISC.voltage_source = parseInt($('#voltagesource').val());
            FC.MISC.vbatdetectcellvoltage = parseFloat($('#celldetectvoltage').val());
            FC.MISC.vbatmincellvoltage = parseFloat($('#mincellvoltage').val());
            FC.MISC.vbatmaxcellvoltage = parseFloat($('#maxcellvoltage').val());
            FC.MISC.vbatwarningcellvoltage = parseFloat($('#warningcellvoltage').val());
            FC.MISC.vbatscale = parseInt($('#voltagescale').val());

            FC.MISC.battery_capacity = parseInt($('#battery_capacity').val());
            FC.MISC.battery_capacity_warning = parseInt($('#battery_capacity_warning').val() * FC.MISC.battery_capacity / 100);
            FC.MISC.battery_capacity_critical = parseInt($('#battery_capacity_critical').val() * FC.MISC.battery_capacity / 100);
            FC.MISC.battery_capacity_unit = $('#battery_capacity_unit').val();

            features.reset();
            features.fromUI($('.tab-configuration'));
            features.execute(function () {
                FC.CURRENT_METER_CONFIG.scale = parseInt($('#currentscale').val());
                FC.CURRENT_METER_CONFIG.offset = Math.round(parseFloat($('#currentoffset').val()) * 10);
                saveChainer.execute();
            });
        });
        interval.add('config_load_analog', function () {
            $('#batteryvoltage').val([FC.ANALOG.voltage.toFixed(2)]);
            $('#batterycurrent').val([FC.ANALOG.amperage.toFixed(2)]);
        }, 100, true); // 10 fps

        GUI.content_ready(callback);
    }
};

configurationTab.cleanup = function (callback) {
    if (callback) callback();
};

export default configurationTab;
