'use strict';

const path = require('path');

const MSPChainerClass = require('./../js/msp/MSPchainer');
const mspHelper = require('./../js/msp/MSPHelper');
const MSPCodes = require('./../js/msp/MSPCodes');
const MSP = require('./../js/msp');
const { GUI, TABS } = require('./../js/gui');
const FC = require('./../js/fc');
const Settings = require('./../js/settings');
const i18n = require('./../js/localization');
const tabs = require('./../js/tabs');
const features = require('./../js/feature_framework');

TABS.ez_tune = {

};

TABS.ez_tune.initialize = function (callback) {

    let loadChainer = new MSPChainerClass();

    let loadChain = [
        mspHelper.loadEzTune,
    ];

    let EZ_TUNE_PID_RP_DEFAULT = [40, 75, 23, 100];
    let EZ_TUNE_PID_YAW_DEFAULT = [45, 80, 0, 100];

    loadChain.push(mspHelper.loadRateProfileData);

    loadChainer.setChain(loadChain);
    loadChainer.setExitPoint(load_html);
    loadChainer.execute();

    var saveChainer = new MSPChainerClass();

    var saveChain = [
        mspHelper.saveEzTune,
        mspHelper.saveToEeprom
    ];

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
        GUI.log(i18n.getMessage('deviceRebooting'));
        GUI.handleReconnect($('.tab_ez_tune a'));
    }

    if (GUI.active_tab != 'ez_tune') {
        GUI.active_tab = 'ez_tune';
    }

    function load_html() {
        GUI.load(path.join(__dirname, "ez_tune.html"), Settings.processHtml(process_html));
    }

    function getYawPidScale(input) {
        const normalized = (input - 100) * 0.01;
    
        return 1.0 + (normalized * 0.5); 
    }

    function scaleRange(x, srcMin, srcMax, destMin, destMax) {
        let a = (destMax - destMin) * (x - srcMin);
        let b = srcMax - srcMin;
        return ((a / b) + destMin);
    }

    function updatePreview() {

        let axisRatio = $('#ez_tune_axis_ratio').val() / 100;
        let response = $('#ez_tune_response').val();
        let damping = $('#ez_tune_damping').val();
        let stability = $('#ez_tune_stability').val();
        let aggressiveness = $('#ez_tune_aggressiveness').val();
        let rate = $('#ez_tune_rate').val();
        let expo = $('#ez_tune_expo').val();

        $('#preview-roll-p').html(Math.floor(EZ_TUNE_PID_RP_DEFAULT[0] * response / 100));
        $('#preview-roll-i').html(Math.floor(EZ_TUNE_PID_RP_DEFAULT[1] * stability / 100));
        $('#preview-roll-d').html(Math.floor(EZ_TUNE_PID_RP_DEFAULT[2] * damping / 100));
        $('#preview-roll-ff').html(Math.floor(EZ_TUNE_PID_RP_DEFAULT[3] * aggressiveness / 100));

        $('#preview-pitch-p').html(Math.floor(axisRatio * EZ_TUNE_PID_RP_DEFAULT[0] * response / 100));
        $('#preview-pitch-i').html(Math.floor(axisRatio * EZ_TUNE_PID_RP_DEFAULT[1] * stability / 100));
        $('#preview-pitch-d').html(Math.floor(axisRatio * EZ_TUNE_PID_RP_DEFAULT[2] * damping / 100));
        $('#preview-pitch-ff').html(Math.floor(axisRatio * EZ_TUNE_PID_RP_DEFAULT[3] * aggressiveness / 100));

        $('#preview-yaw-p').html(Math.floor(EZ_TUNE_PID_YAW_DEFAULT[0] * getYawPidScale(response)));
        $('#preview-yaw-i').html(Math.floor(EZ_TUNE_PID_YAW_DEFAULT[1] * getYawPidScale(stability)));
        $('#preview-yaw-d').html(Math.floor(EZ_TUNE_PID_YAW_DEFAULT[2] * getYawPidScale(damping)));
        $('#preview-yaw-ff').html(Math.floor(EZ_TUNE_PID_YAW_DEFAULT[3] * getYawPidScale(aggressiveness)));

        $('#preview-roll-rate').html(Math.floor(scaleRange(rate, 0, 200, 30, 90)) * 10 + " dps");
        $('#preview-pitch-rate').html(Math.floor(scaleRange(rate, 0, 200, 30, 90)) * 10 + " dps");
        $('#preview-yaw-rate').html((Math.floor(scaleRange(rate, 0, 200, 30, 90)) - 10) * 10 + " dps");

        $('#preview-roll-expo').html(Math.floor(scaleRange(expo, 0, 200, 40, 100)) + "%");
        $('#preview-pitch-expo').html(Math.floor(scaleRange(expo, 0, 200, 40, 100)) + "%");
        $('#preview-yaw-expo').html(Math.floor(scaleRange(expo, 0, 200, 40, 100)) + "%");

    }

    function process_html() {
       i18n.localize();;

        tabs.init($('.tab-ez_tune'));
        features.updateUI($('.tab-ez_tune'), FC.FEATURES);

        $("#ez_tune_enabled").prop('checked', FC.EZ_TUNE.enabled);

        GUI.sliderize($('#ez_tune_filter_hz'), FC.EZ_TUNE.filterHz, 10, 300);
        GUI.sliderize($('#ez_tune_axis_ratio'), FC.EZ_TUNE.axisRatio, 25, 175);
        GUI.sliderize($('#ez_tune_response'), FC.EZ_TUNE.response, 0, 200);
        GUI.sliderize($('#ez_tune_damping'), FC.EZ_TUNE.damping, 0, 200);
        GUI.sliderize($('#ez_tune_stability'), FC.EZ_TUNE.stability, 0, 200);
        GUI.sliderize($('#ez_tune_aggressiveness'), FC.EZ_TUNE.aggressiveness, 0, 200);

        GUI.sliderize($('#ez_tune_rate'), FC.EZ_TUNE.rate, 0, 200);
        GUI.sliderize($('#ez_tune_expo'), FC.EZ_TUNE.expo, 0, 200);


        $('.ez-element').on('updated', function () {
            updatePreview();
        });

        updatePreview();

        GUI.simpleBind();

        GUI.content_ready(callback);

        $('a.update').on('click', function () {

            if ($("#ez_tune_enabled").is(":checked")) {
                FC.EZ_TUNE.enabled = 1;
            } else {
                FC.EZ_TUNE.enabled = 0;
            }

            FC.EZ_TUNE.filterHz = $('#ez_tune_filter_hz').val();
            FC.EZ_TUNE.axisRatio = $('#ez_tune_axis_ratio').val();
            FC.EZ_TUNE.response = $('#ez_tune_response').val();
            FC.EZ_TUNE.damping = $('#ez_tune_damping').val();
            FC.EZ_TUNE.stability = $('#ez_tune_stability').val();
            FC.EZ_TUNE.aggressiveness = $('#ez_tune_aggressiveness').val();
            FC.EZ_TUNE.rate = $('#ez_tune_rate').val();
            FC.EZ_TUNE.expo = $('#ez_tune_expo').val();

            saveChainer.execute();
        });

    }
    
};

TABS.ez_tune.cleanup = function (callback) {
    if (callback) {
        callback();
    }
};