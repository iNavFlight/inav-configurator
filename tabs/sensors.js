'use strict';

const path = require('path');
const Store = require('electron-store');
const store = new Store();

const MSPCodes = require('./../js/msp/MSPCodes');
const MSP = require('./../js/msp');
const mspQueue = require('./../js/serial_queue');
const { GUI, TABS } = require('./../js/gui');
const FC = require('./../js/fc');
const CONFIGURATOR = require('./../js/data_storage');
const interval = require('./../js/intervals');
const i18n = require('./../js/localization');
const BitHelper = require('./../js/bitHelper');

TABS.sensors = {};
TABS.sensors.initialize = function (callback) {
    var self = this;

    if (GUI.active_tab != 'sensors') {
        GUI.active_tab = 'sensors';
    }

    function initSensorData(){
        for (var i = 0; i < 3; i++) {
            FC.SENSOR_DATA.accelerometer[i] = 0;
            FC.SENSOR_DATA.gyroscope[i] = 0;
            FC.SENSOR_DATA.magnetometer[i] = 0;
            FC.SENSOR_DATA.sonar = 0;
            FC.SENSOR_DATA.air_speed = 0;
            FC.SENSOR_DATA.altitude = 0;
            FC.SENSOR_DATA.temperature[i] = 0;
            FC.SENSOR_DATA.debug[i] = 0;
        }
    }

    function initDataArray(length) {
        var data = new Array(length);
        for (var i = 0; i < length; i++) {
            data[i] = new Array();
            data[i].min = -1;
            data[i].max = 1;
        }
        return data;
    }

    function addSampleToData(data, sampleNumber, sensorData) {
        for (var i = 0; i < data.length; i++) {
            var dataPoint = sensorData[i];
            data[i].push([sampleNumber, dataPoint]);
            if (dataPoint < data[i].min) {
                data[i].min = dataPoint;
            }
            if (dataPoint > data[i].max) {
                data[i].max = dataPoint;
            }
        }
        while (data[0].length > 300) {
            for (let i = 0; i < data.length; i++) {
                data[i].shift();
            }
        }
        return sampleNumber + 1;
    }

    var margin = {top: 20, right: 10, bottom: 10, left: 40};
    function updateGraphHelperSize(helpers) {
        helpers.width = helpers.targetElement.width() - margin.left - margin.right;
        helpers.height = helpers.targetElement.height() - margin.top - margin.bottom;

        helpers.widthScale.range([0, helpers.width]);
        helpers.heightScale.range([helpers.height, 0]);

        helpers.xGrid.tickSize(-helpers.height, 0, 0);
        helpers.yGrid.tickSize(-helpers.width, 0, 0);
    }

    function initGraphHelpers(selector, sampleNumber, heightDomain) {
        var helpers = {selector: selector, targetElement: $(selector), dynamicHeightDomain: !heightDomain};

        helpers.widthScale = d3.scale.linear()
            .clamp(true)
            .domain([(sampleNumber - 299), sampleNumber]);

        helpers.heightScale = d3.scale.linear()
            .clamp(true)
            .domain(heightDomain || [1, -1]);

        helpers.xGrid = d3.svg.axis();
        helpers.yGrid = d3.svg.axis();

        updateGraphHelperSize(helpers);

        helpers.xGrid
            .scale(helpers.widthScale)
            .orient("bottom")
            .ticks(5)
            .tickFormat("");

        helpers.yGrid
            .scale(helpers.heightScale)
            .orient("left")
            .ticks(5)
            .tickFormat("");

        helpers.xAxis = d3.svg.axis()
            .scale(helpers.widthScale)
            .ticks(5)
            .orient("bottom")
            .tickFormat(function (d) {return d;});

        helpers.yAxis = d3.svg.axis()
            .scale(helpers.heightScale)
            .ticks(5)
            .orient("left")
            .tickFormat(function (d) {return d;});

        helpers.line = d3.svg.line()
            .x(function (d) {return helpers.widthScale(d[0]);})
            .y(function (d) {return helpers.heightScale(d[1]);});

        return helpers;
    }

    function drawGraph(graphHelpers, data, sampleNumber) {
        var svg = d3.select(graphHelpers.selector);

        if (graphHelpers.dynamicHeightDomain) {
            var limits = [];
            $.each(data, function (idx, datum) {
                limits.push(datum.min);
                limits.push(datum.max);
            });
            graphHelpers.heightScale.domain(d3.extent(limits));
        }
        graphHelpers.widthScale.domain([(sampleNumber - 299), sampleNumber]);

        svg.select(".x.grid").call(graphHelpers.xGrid);
        svg.select(".y.grid").call(graphHelpers.yGrid);
        svg.select(".x.axis").call(graphHelpers.xAxis);
        svg.select(".y.axis").call(graphHelpers.yAxis);

        var group = svg.select("g.data");
        var lines = group.selectAll("path").data(data, function (d, i) {return i;});
        var newLines = lines.enter().append("path").attr("class", "line");
        lines.attr('d', graphHelpers.line);
    }

    function plot_gyro(enable) {
        if (enable) {
            $('.wrapper.gyro').show();
        } else {
            $('.wrapper.gyro').hide();
        }
    }

    function plot_accel(enable) {
        if (enable) {
            $('.wrapper.accel').show();
        } else {
            $('.wrapper.accel').hide();
        }
    }

    function plot_mag(enable) {
        if (enable) {
            $('.wrapper.mag').show();
        } else {
            $('.wrapper.mag').hide();
        }
    }

    function plot_altitude(enable) {
        if (enable) {
            $('.wrapper.altitude').show();
        } else {
            $('.wrapper.altitude').hide();
        }
    }

    function plot_sonar(enable) {
        if (enable) {
            $('.wrapper.sonar').show();
        } else {
            $('.wrapper.sonar').hide();
        }
    }

    function plot_airspeed(enable) {
        if (enable) {
            $('.wrapper.airspeed').show();
        } else {
            $('.wrapper.airspeed').hide();
        }
    }

    function plot_temperature(enable) {
        if (enable) {
            $('.wrapper.temperature').show();
        } else {
            $('.wrapper.temperature').hide();
        }
    }

    function plot_debug(enable) {
        if (enable) {
            $('.wrapper.debug').show();
        } else {
            $('.wrapper.debug').hide();
        }
    }

    GUI.load(path.join(__dirname, "sensors.html"), function load_html() {
        // translate to user-selected language
       i18n.localize();;

        // disable graphs for sensors that are missing
        var checkboxes = $('.tab-sensors .info .checkboxes input');
        if (!BitHelper.bit_check(FC.CONFIG.activeSensors, 2)) { // mag
            checkboxes.eq(2).prop('disabled', true);
        }
        if (!BitHelper.bit_check(FC.CONFIG.activeSensors, 4)) { // sonar
            checkboxes.eq(4).prop('disabled', true);
        }

        if (!BitHelper.bit_check(FC.CONFIG.activeSensors, 6)) { // airspeed
            checkboxes.eq(5).prop('disabled', true);
        }

        if (!BitHelper.bit_check(FC.CONFIG.activeSensors, 7)) {
            checkboxes.eq(6).prop('disabled', true);
        }

        $('.tab-sensors .info .checkboxes input').on('change', function () {
            var enable = $(this).prop('checked');
            var index = $(this).parent().index();

            switch (index) {
                case 0:
                    plot_gyro(enable);
                    break;
                case 1:
                    plot_accel(enable);
                    break;
                case 2:
                    plot_mag(enable);
                    break;
                case 3:
                    plot_altitude(enable);
                    break;
                case 4:
                    plot_sonar(enable);
                    break;
                case 5:
                    plot_airspeed(enable);
                    break;
                case 6:
                    plot_temperature(enable);
                    break;
                case 7:
                    plot_debug(enable);
                    break;
            }

            var checkboxes = [];
            $('.tab-sensors .info .checkboxes input').each(function () {
                checkboxes.push($(this).prop('checked'));
            });

            startPolling();

            store.set('graphs_enabled', checkboxes);
        });

        var graphs_enabled = store.get('graphs_enabled', false);
        if (graphs_enabled) {
            var checkboxes = $('.tab-sensors .info .checkboxes input');
            for (var i = 0; i < graphs_enabled.length; i++) {
                checkboxes.eq(i).not(':disabled').prop('checked', graphs_enabled[i]).trigger('change');
            }
        } else {
            $('.tab-sensors .info input:lt(4):not(:disabled)').prop('checked', true).trigger('change');
        }
        

        // Always start with default/empty sensor data array, clean slate all
        initSensorData();

        // Setup variables
        var samples_gyro_i = 0,
            samples_accel_i = 0,
            samples_mag_i = 0,
            samples_altitude_i = 0,
            samples_sonar_i = 0,
            samples_airspeed_i = 0,
            samples_temperature_i = 0,
            samples_debug_i = 0,
            gyro_data = initDataArray(3),
            accel_data = initDataArray(3),
            mag_data = initDataArray(3),
            altitude_data = initDataArray(2),
            sonar_data = initDataArray(1),
            airspeed_data = initDataArray(1),
            temperature_data = [
            initDataArray(1),
            initDataArray(1),
            initDataArray(1),
            initDataArray(1),
            initDataArray(1),
            initDataArray(1),
            initDataArray(1),
            initDataArray(1)
        ];
        var debug_data = [
            initDataArray(1),
            initDataArray(1),
            initDataArray(1),
            initDataArray(1),
            initDataArray(1),
            initDataArray(1),
            initDataArray(1),
            initDataArray(1)
        ];

        var gyroHelpers = initGraphHelpers('#gyro', samples_gyro_i, [-2000, 2000]);
        var accelHelpers = initGraphHelpers('#accel', samples_accel_i, [-2, 2]);
        var magHelpers = initGraphHelpers('#mag', samples_mag_i, [-1, 1]);
        var altitudeHelpers = initGraphHelpers('#altitude', samples_altitude_i);
        var sonarHelpers = initGraphHelpers('#sonar', samples_sonar_i);
        var airspeedHelpers = initGraphHelpers('#airspeed', samples_airspeed_i);
        var temperatureHelpers = [
            initGraphHelpers('#temperature1', samples_temperature_i),
            initGraphHelpers('#temperature2', samples_temperature_i),
            initGraphHelpers('#temperature3', samples_temperature_i),
            initGraphHelpers('#temperature4', samples_temperature_i),
            initGraphHelpers('#temperature5', samples_temperature_i),
            initGraphHelpers('#temperature6', samples_temperature_i),
            initGraphHelpers('#temperature7', samples_temperature_i),
            initGraphHelpers('#temperature8', samples_temperature_i)
        ];
        var debugHelpers = [
            initGraphHelpers('#debug1', samples_debug_i),
            initGraphHelpers('#debug2', samples_debug_i),
            initGraphHelpers('#debug3', samples_debug_i),
            initGraphHelpers('#debug4', samples_debug_i),
            initGraphHelpers('#debug5', samples_debug_i),
            initGraphHelpers('#debug6', samples_debug_i),
            initGraphHelpers('#debug7', samples_debug_i),
            initGraphHelpers('#debug8', samples_debug_i)
        ];

        var raw_data_text_ements = {
            x: [],
            y: [],
            z: []
        };
        $('.plot_control .x, .plot_control .y, .plot_control .z').each(function () {
            var el = $(this);
            if (el.hasClass('x')) {
                raw_data_text_ements.x.push(el);
            } else if (el.hasClass('y')) {
                raw_data_text_ements.y.push(el);
            } else {
                raw_data_text_ements.z.push(el);
            }
        });

        // set refresh speeds according to configuration saved in storage
        var sensor_settings = store.get('sensor_settings', false) 
        if (sensor_settings) {
            $('.tab-sensors select[name="gyro_refresh_rate"]').val(sensor_settings.rates.gyro);
            $('.tab-sensors select[name="gyro_scale"]').val(sensor_settings.scales.gyro);

            $('.tab-sensors select[name="accel_refresh_rate"]').val(sensor_settings.rates.accel);
            $('.tab-sensors select[name="accel_scale"]').val(sensor_settings.scales.accel);

            $('.tab-sensors select[name="mag_refresh_rate"]').val(sensor_settings.rates.mag);
            $('.tab-sensors select[name="mag_scale"]').val(sensor_settings.scales.mag);

            $('.tab-sensors select[name="baro_refresh_rate"]').val(sensor_settings.rates.baro);
            $('.tab-sensors select[name="sonar_refresh_rate"]').val(sensor_settings.rates.sonar);

            $('.tab-sensors select[name="airspeed_refresh_rate"]').val(sensor_settings.rates.airspeed);

            $('.tab-sensors select[name="debug_refresh_rate"]').val(sensor_settings.rates.debug);

            // start polling data by triggering refresh rate change event
            startPolling();
        } else {
            // start polling immediatly (as there is no configuration saved in the storage)
            startPolling();
        }
        

        $('.tab-sensors .rate select, .tab-sensors .scale select').on('change', function () {
            startPolling();
        });
        
        function startPolling() {
            // if any of the select fields change value, all of the select values are grabbed
            // and timers are re-initialized with the new settings
            var rates = {
                'gyro':      parseInt($('.tab-sensors select[name="gyro_refresh_rate"]').val(), 10),
                'accel':     parseInt($('.tab-sensors select[name="accel_refresh_rate"]').val(), 10),
                'mag':       parseInt($('.tab-sensors select[name="mag_refresh_rate"]').val(), 10),
                'baro':      parseInt($('.tab-sensors select[name="baro_refresh_rate"]').val(), 10),
                'sonar':     parseInt($('.tab-sensors select[name="sonar_refresh_rate"]').val(), 10),
                'airspeed':  parseInt($('.tab-sensors select[name="airspeed_refresh_rate"]').val(), 10),
                'debug':     parseInt($('.tab-sensors select[name="debug_refresh_rate"]').val(), 10)
            };

            var scales = {
                'gyro':  parseFloat($('.tab-sensors select[name="gyro_scale"]').val()),
                'accel': parseFloat($('.tab-sensors select[name="accel_scale"]').val()),
                'mag':   parseFloat($('.tab-sensors select[name="mag_scale"]').val())
            };

            // handling of "data pulling" is a little bit funky here, as MSP_RAW_IMU contains values for gyro/accel/mag but not baro
            // this means that setting a slower refresh rate on any of the attributes would have no effect
            // what we will do instead is = determinate the fastest refresh rate for those 3 attributes, use that as a "polling rate"
            // and use the "slower" refresh rates only for re-drawing the graphs (to save resources/computing power)
            var fastest = d3.min([rates.gyro, rates.accel, rates.mag]);

            // store current/latest refresh rates in the storage
            store.set('sensor_settings', {'rates': rates, 'scales': scales});

            // re-initialize domains with new scales
            gyroHelpers = initGraphHelpers('#gyro', samples_gyro_i, [-scales.gyro, scales.gyro]);
            accelHelpers = initGraphHelpers('#accel', samples_accel_i, [-scales.accel, scales.accel]);
            magHelpers = initGraphHelpers('#mag', samples_mag_i, [-scales.mag, scales.mag]);

            // fetch currently enabled plots
            var checkboxes = [];
            $('.tab-sensors .info .checkboxes input').each(function () {
                checkboxes.push($(this).prop('checked'));
            });

            // timer initialization
            interval.killAll(['status_pull', 'global_data_refresh', 'msp-load-update', 'ltm-connection-check']);

            // data pulling timers
            if (checkboxes[0] || checkboxes[1] || checkboxes[2]) {
                interval.add('IMU_pull', function () {
                    MSP.send_message(MSPCodes.MSP_RAW_IMU, false, false, update_imu_graphs);
                }, fastest, true);
            }

            if (checkboxes[3]) {
                interval.add('altitude_pull', function altitude_data_pull() {
                    MSP.send_message(MSPCodes.MSP_ALTITUDE, false, false, update_altitude_graph);
                }, rates.baro, true);
            }

            if (checkboxes[4]) {
                interval.add('sonar_pull', function sonar_data_pull() {
                    MSP.send_message(MSPCodes.MSP_SONAR, false, false, update_sonar_graphs);
                }, rates.sonar, true);
            }

            if (checkboxes[5]) {
                interval.add('airspeed_pull', function airspeed_data_pull() {
                    MSP.send_message(MSPCodes.MSPV2_INAV_AIR_SPEED, false, false, update_airspeed_graphs);
                }, rates.airspeed, true);
            }

            if (checkboxes[6]) {
                interval.add('temperature_pull', function temperature_data_pull() {
                    MSP.send_message(MSPCodes.MSP2_INAV_TEMPERATURES, false, false, update_temperature_graphs);
                }, 1000, true);
            }

            if (checkboxes[7]) {
                interval.add('debug_pull', function debug_data_pull() {
                    MSP.send_message(MSPCodes.MSP2_INAV_DEBUG, false, false, update_debug_graphs);
                }, rates.debug, true);
            }

            function update_imu_graphs() {
                if (checkboxes[0]) {
                    updateGraphHelperSize(gyroHelpers);

                    samples_gyro_i = addSampleToData(gyro_data, samples_gyro_i, FC.SENSOR_DATA.gyroscope);
                    drawGraph(gyroHelpers, gyro_data, samples_gyro_i);
                    raw_data_text_ements.x[0].text(FC.SENSOR_DATA.gyroscope[0].toFixed(2));
                    raw_data_text_ements.y[0].text(FC.SENSOR_DATA.gyroscope[1].toFixed(2));
                    raw_data_text_ements.z[0].text(FC.SENSOR_DATA.gyroscope[2].toFixed(2));
                }

                if (checkboxes[1]) {
                    updateGraphHelperSize(accelHelpers);

                    samples_accel_i = addSampleToData(accel_data, samples_accel_i, FC.SENSOR_DATA.accelerometer);
                    drawGraph(accelHelpers, accel_data, samples_accel_i);
                    raw_data_text_ements.x[1].text(FC.SENSOR_DATA.accelerometer[0].toFixed(2));
                    raw_data_text_ements.y[1].text(FC.SENSOR_DATA.accelerometer[1].toFixed(2));
                    raw_data_text_ements.z[1].text(FC.SENSOR_DATA.accelerometer[2].toFixed(2));
                }

                if (checkboxes[2]) {
                    updateGraphHelperSize(magHelpers);

                    samples_mag_i = addSampleToData(mag_data, samples_mag_i, FC.SENSOR_DATA.magnetometer);
                    drawGraph(magHelpers, mag_data, samples_mag_i);
                    raw_data_text_ements.x[2].text(FC.SENSOR_DATA.magnetometer[0].toFixed(2));
                    raw_data_text_ements.y[2].text(FC.SENSOR_DATA.magnetometer[1].toFixed(2));
                    raw_data_text_ements.z[2].text(FC.SENSOR_DATA.magnetometer[2].toFixed(2));
                }
            }

            function update_altitude_graph() {
                updateGraphHelperSize(altitudeHelpers);
                samples_altitude_i = addSampleToData(altitude_data, samples_altitude_i, [FC.SENSOR_DATA.altitude, FC.SENSOR_DATA.barometer]);
                drawGraph(altitudeHelpers, altitude_data, samples_altitude_i);
                raw_data_text_ements.x[3].text(FC.SENSOR_DATA.altitude.toFixed(2));
                raw_data_text_ements.y[3].text(FC.SENSOR_DATA.barometer.toFixed(2));
            }

            function update_sonar_graphs() {
                updateGraphHelperSize(sonarHelpers);

                samples_sonar_i = addSampleToData(sonar_data, samples_sonar_i, [FC.SENSOR_DATA.sonar]);
                drawGraph(sonarHelpers, sonar_data, samples_sonar_i);
                raw_data_text_ements.x[4].text(FC.SENSOR_DATA.sonar.toFixed(2));
            }

            function update_airspeed_graphs() {
                updateGraphHelperSize(airspeedHelpers);

                samples_airspeed_i = addSampleToData(airspeed_data, samples_airspeed_i, [FC.SENSOR_DATA.air_speed]);
                drawGraph(airspeedHelpers, airspeed_data, samples_airspeed_i);
                raw_data_text_ements.x[5].text(FC.SENSOR_DATA.air_speed);
            }

            function update_temperature_graphs() {
                for (var i = 0; i < 8; i++) {
                    updateGraphHelperSize(temperatureHelpers[i]);

                    addSampleToData(temperature_data[i], samples_temperature_i, [FC.SENSOR_DATA.temperature[i]]);
                    drawGraph(temperatureHelpers[i], temperature_data[i], samples_temperature_i);
                    raw_data_text_ements.x[6 + i].text(FC.SENSOR_DATA.temperature[i]);
                }
                samples_temperature_i++;
            }

            function update_debug_graphs() {
                for (var i = 0; i < 8; i++) {
                    updateGraphHelperSize(debugHelpers[i]);

                    addSampleToData(debug_data[i], samples_debug_i, [FC.SENSOR_DATA.debug[i]]);
                    drawGraph(debugHelpers[i], debug_data[i], samples_debug_i);
                    raw_data_text_ements.x[6 + 8 + i].text(FC.SENSOR_DATA.debug[i]);
                }
                samples_debug_i++;
            }
        }

        $("a.debug-trace").on('click', function () {
           var debugWin = window.open("tabs/debug_trace.html", "receiver_msp", "width=500,height=510,menubar=no,contextIsolation=no,nodeIntegration=yes");
           debugWin.window.getDebugTrace = function () { return FC.DEBUG_TRACE || ''; };
        });

        GUI.content_ready(callback);
    });
};

TABS.sensors.cleanup = function (callback) {
    CONFIGURATOR.connection.emptyOutputBuffer();

    if (callback) callback();
};
