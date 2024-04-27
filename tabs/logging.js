'use strict';

const path = require('path');
const fs = require('fs');
const { dialog } = require("@electron/remote");
const Store = require('electron-store');
const store = new Store();

const MSPCodes = require('./../js/msp/MSPCodes');
const MSP = require('./../js/msp');
const { GUI, TABS } = require('./../js/gui');
const FC = require('./../js/fc');
const CONFIGURATOR = require('./../js/data_storage');
const interval = require('./../js/intervals');
const i18n = require('./../js/localization');
const { zeroPad } = require('./../js/helpers');


TABS.logging = {};
TABS.logging.initialize = function (callback) {
    var self = this;

    let loggingFileName = null;
    let readyToWrite = false;

    if (GUI.active_tab != 'logging') {
        GUI.active_tab = 'logging';
    }

    var requested_properties = [],
        samples = 0,
        requests = 0,
        log_buffer = [];

    if (CONFIGURATOR.connectionValid) {
        var get_motor_data = function () {
            MSP.send_message(MSPCodes.MSP_MOTOR, false, false, load_html);
        }

        var load_html = function () {
            GUI.load(path.join(__dirname, "logging.html"), process_html);
        }

        MSP.send_message(MSPCodes.MSP_RC, false, false, get_motor_data);
    }

    function process_html() {
        // translate to user-selected language
        i18n.localize();;

        // UI hooks
        $('a.log_file').on('click', prepare_file);

        $('a.logging').on('click', function () {
            if (GUI.connected_to) {
                if (readyToWrite) {
                    var clicks = $(this).data('clicks');

                    if (!clicks) {
                        // reset some variables before start
                        samples = 0;
                        requests = 0;
                        log_buffer = [];
                        requested_properties = [];

                        $('.properties input:checked').each(function () {
                            requested_properties.push($(this).prop('name'));
                        });

                        if (requested_properties.length) {
                            // print header for the csv file
                            print_head();

                            var log_data_poll = function () {
                                if (requests) {
                                    // save current data (only after everything is initialized)
                                    crunch_data();
                                }

                                // request new
                                for (var i = 0; i < requested_properties.length; i++, requests++) {
                                    MSP.send_message(MSPCodes[requested_properties[i]]);
                                }
                            }

                            interval.add('log_data_poll', log_data_poll, parseInt($('select.speed').val()), true); // refresh rate goes here
                            interval.add('write_data', function write_data() {
                                if (log_buffer.length && readyToWrite) { // only execute when there is actual data to write

                                    fs.writeFileSync(loggingFileName, log_buffer.join('\n') + '\n', {
                                        "flag": "a"
                                    })

                                    $('.samples').text(samples += log_buffer.length);

                                    log_buffer = [];
                                }
                            }, 1000);

                            $('.speed').prop('disabled', true);
                            $(this).text(i18n.getMessage('loggingStop'));
                            $(this).data("clicks", !clicks);
                        } else {
                            GUI.log(i18n.getMessage('loggingErrorOneProperty'));
                        }
                    } else {
                        interval.killAll(['global_data_refresh', 'msp-load-update', 'ltm-connection-check']);

                        $('.speed').prop('disabled', false);
                        $(this).text(i18n.getMessage('loggingStart'));
                        $(this).data("clicks", !clicks);
                    }
                } else {
                    GUI.log(i18n.getMessage('loggingErrorLogFile'));
                }
            } else {
                GUI.log(i18n.getMessage('loggingErrorNotConnected'));
            }
        });

        GUI.content_ready(callback);
    }

    function print_head() {
        var head = "timestamp";

        for (var i = 0; i < requested_properties.length; i++) {
            switch (requested_properties[i]) {
                case 'MSP_RAW_IMU':
                    head += ',' + 'gyroscopeX';
                    head += ',' + 'gyroscopeY';
                    head += ',' + 'gyroscopeZ';

                    head += ',' + 'accelerometerX';
                    head += ',' + 'accelerometerY';
                    head += ',' + 'accelerometerZ';

                    head += ',' + 'magnetometerX';
                    head += ',' + 'magnetometerY';
                    head += ',' + 'magnetometerZ';
                    break;
                case 'MSP_ATTITUDE':
                    head += ',' + 'kinematicsX';
                    head += ',' + 'kinematicsY';
                    head += ',' + 'kinematicsZ';
                    break;
                case 'MSP_ALTITUDE':
                    head += ',' + 'altitude';
                    break;
                case 'MSP_RAW_GPS':
                    head += ',' + 'gpsFix';
                    head += ',' + 'gpsNumSat';
                    head += ',' + 'gpsLat';
                    head += ',' + 'gpsLon';
                    head += ',' + 'gpsAlt';
                    head += ',' + 'gpsSpeed';
                    head += ',' + 'gpsGroundCourse';
                    break;
                case 'MSP_ANALOG':
                    head += ',' + 'voltage';
                    head += ',' + 'amperage';
                    head += ',' + 'mAhdrawn';
                    head += ',' + 'rssi';
                    break;
                case 'MSP_RC':
                    for (var chan = 0; chan < FC.RC.active_channels; chan++) {
                        head += ',' + 'RC' + chan;
                    }
                    break;
                case 'MSP_MOTOR':
                    for (var motor = 0; motor < FC.MOTOR_DATA.length; motor++) {
                        head += ',' + 'Motor' + motor;
                    }
                    break;
                case 'MSP_DEBUG':
                    for (var debug = 0; debug < FC.SENSOR_DATA.debug.length; debug++) {
                        head += ',' + 'Debug' + debug;
                    }
                    break;
            }
        }
        log_buffer.push(head);
    }

    function crunch_data() {
        var sample = millitime();

        for (var i = 0; i < requested_properties.length; i++) {
            switch (requested_properties[i]) {
                case 'MSP_RAW_IMU':
                    sample += ',' + FC.SENSOR_DATA.gyroscope;
                    sample += ',' + FC.SENSOR_DATA.accelerometer;
                    sample += ',' + FC.SENSOR_DATA.magnetometer;
                    break;
                case 'MSP_ATTITUDE':
                    sample += ',' + FC.SENSOR_DATA.kinematics[0];
                    sample += ',' + FC.SENSOR_DATA.kinematics[1];
                    sample += ',' + FC.SENSOR_DATA.kinematics[2];
                    break;
                case 'MSP_ALTITUDE':
                    sample += ',' + FC.SENSOR_DATA.altitude;
                    break;
                case 'MSP_RAW_GPS':
                    sample += ',' + FC.GPS_DATA.fix;
                    sample += ',' + FC.GPS_DATA.numSat;
                    sample += ',' + (FC.GPS_DATA.lat / 10000000);
                    sample += ',' + (FC.GPS_DATA.lon / 10000000);
                    sample += ',' + FC.GPS_DATA.alt;
                    sample += ',' + FC.GPS_DATA.speed;
                    sample += ',' + FC.GPS_DATA.ground_course;
                    break;
                case 'MSP_ANALOG':
                    sample += ',' + FC.ANALOG.voltage;
                    sample += ',' + FC.ANALOG.amperage;
                    sample += ',' + FC.ANALOG.mAhdrawn;
                    sample += ',' + FC.ANALOG.rssi;
                    break;
                case 'MSP_RC':
                    for (var chan = 0; chan < FC.RC.active_channels; chan++) {
                        sample += ',' + FC.RC.channels[chan];
                    }
                    break;
                case 'MSP_MOTOR':
                    sample += ',' + FC.MOTOR_DATA;
                    break;
                case 'MSP_DEBUG':
                    sample += ',' + FC.SENSOR_DATA.debug;
                    break;
            }
        }

        log_buffer.push(sample);
    }

    function prepare_file() {
        // create or load the file

        const date = new Date();
        const filename = 'inav_data_log_' + date.getFullYear() + '-'  + zeroPad(date.getMonth() + 1, 2) + '-'
                + zeroPad(date.getDate(), 2) + '_' + zeroPad(date.getHours(), 2) + zeroPad(date.getMinutes(), 2)
                + zeroPad(date.getSeconds(), 2);

        var options = {
            defaultPath: filename,
            filters: [ { name: "TXT file", extensions: ['txt'] } ]
        };
        dialog.showSaveDialog(options).then(result => {
            if (result.canceled) {
                return;
            }
            
            loggingFileName = result.filePath;
            readyToWrite = true;
            store.set('logging_file_name', loggingFileName);
            store.set('logging_file_ready', readyToWrite);
                          
        });
    }

    function millitime() {
        return new Date().getTime();
    }
};

TABS.logging.cleanup = function (callback) {
    if (callback) callback();
};
