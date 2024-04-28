'use strict';

const path = require('path');

const MSPChainerClass = require('./../js/msp/MSPchainer');
const mspHelper = require('./../js/msp/MSPHelper');
const MSPCodes = require('./../js/msp/MSPCodes');
const MSP = require('./../js/msp');
const { GUI, TABS } = require('./../js/gui');
const FC = require('./../js/fc');
const timeout = require('./../js/timeouts');
const interval = require('./../js/intervals');
const i18n = require('./../js/localization');
const jBox = require('./../js/libraries/jBox/jBox.min');

TABS.calibration = {};

TABS.calibration.model = (function () {
    var publicScope = {},
        privateScope = {};

    privateScope.step = null;

    publicScope.next = function () {

        if (privateScope.step === null) {
            privateScope.step = 1;
        } else {
            var count = 0;
            for (var i = 0; i < 6; i++) {
                if (FC.CALIBRATION_DATA.acc['Pos' + i] === 1) {
                    count++;
                }
            }

            privateScope.step = count;
        }

        console.log(privateScope.step);

        if (privateScope.step > 5) {
            privateScope.step = null;
        }

        return privateScope.step;
    };

    publicScope.getStep = function () {
        return privateScope.step;
    };

    return publicScope;
})();

TABS.calibration.initialize = function (callback) {

    var loadChainer = new MSPChainerClass(),
        saveChainer = new MSPChainerClass(),
        modalStart,
        modalStop,
        modalProcessing;

    if (GUI.active_tab != 'calibration') {
        GUI.active_tab = 'calibration';
    }
    loadChainer.setChain([
        mspHelper.queryFcStatus,
        mspHelper.loadSensorConfig,
        mspHelper.loadCalibrationData
    ]);
    loadChainer.setExitPoint(loadHtml);
    loadChainer.execute();

    saveChainer.setChain([
        mspHelper.saveCalibrationData,
        mspHelper.saveToEeprom
    ]);
    saveChainer.setExitPoint(reboot);

    function reboot() {
        //noinspection JSUnresolvedVariable
        GUI.log(i18n.getMessage('configurationEepromSaved'));

        GUI.tab_switch_cleanup(function() {
            MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, reinitialize);
        });
    }

    function reinitialize() {
        //noinspection JSUnresolvedVariable
        GUI.log(i18n.getMessage('deviceRebooting'));
        GUI.handleReconnect($('.tab_calibration a'));
    }

    function loadHtml() {
        GUI.load(path.join(__dirname, "calibration.html"), processHtml);
    }

    function updateCalibrationSteps() {
        for (var i = 0; i < 6; i++) {
            var $element = $('[data-step="' + (i + 1) + '"]');

            if (FC.CALIBRATION_DATA.acc['Pos' + i] === 0) {
                $element.removeClass('finished').removeClass('active');
            } else {
                $element.addClass("finished").removeClass('active');
            }
        }
    }

    function updateSensorData() {
        var pos = ['X', 'Y', 'Z'];
        pos.forEach(function (item) {
            $('[name=accGain' + item + ']').val(FC.CALIBRATION_DATA.accGain[item]);
            $('[name=accZero' + item + ']').val(FC.CALIBRATION_DATA.accZero[item]);
            $('[name=Mag' + item + ']').val(FC.CALIBRATION_DATA.magZero[item]);
            $('[name=MagGain' + item + ']').val(FC.CALIBRATION_DATA.magGain[item]);
        });
        $('[name=OpflowScale]').val(FC.CALIBRATION_DATA.opflow.Scale);
        updateCalibrationSteps();
    }

    function checkFinishAccCalibrate() {
        if (TABS.calibration.model.next() === null) {
            modalStop = new jBox('Modal', {
                width: 400,
                height: 200,
                animation: false,
                closeOnClick: false,
                closeOnEsc: false,
                content: $('#modal-acc-calibration-stop')
            }).open();
        }
        updateSensorData();
    }

    function calibrateNew() {
        var newStep = null,
            $button = $(this);

        if (TABS.calibration.model.getStep() === null) {
            for (var i = 0; i < 6; i++) {
                if (FC.CALIBRATION_DATA.acc['Pos' + i] === 1) {
                    FC.CALIBRATION_DATA.acc['Pos' + i] = 0;
                }
            }
            updateCalibrationSteps();
            modalStart = new jBox('Modal', {
                width: 400,
                height: 200,
                animation: false,
                closeOnClick: false,
                closeOnEsc: false,
                content: $('#modal-acc-calibration-start')
            }).open();
        } else {
            newStep = TABS.calibration.model.next();
        }

        /*
         * Communication
         */
        if (newStep !== null) {
            $button.addClass('disabled');

            modalProcessing = new jBox('Modal', {
                width: 400,
                height: 120,
                animation: false,
                closeOnClick: false,
                closeOnEsc: false,
                content: $('#modal-acc-processing')
            }).open();

            MSP.send_message(MSPCodes.MSP_ACC_CALIBRATION, false, false, function () {
                GUI.log(i18n.getMessage('initialSetupAccelCalibStarted'));
            });

            timeout.add('acc_calibration_timeout', function () {
                $button.removeClass('disabled');

                modalProcessing.close();
                MSP.send_message(MSPCodes.MSP_CALIBRATION_DATA, false, false, checkFinishAccCalibrate);
                GUI.log(i18n.getMessage('initialSetupAccelCalibEnded'));
            }, 2000);
        }
    }

    function setupCalibrationButton(callback) {
        if (FC.getAccelerometerCalibrated()) {
            $('#calibrate-start-button').html(i18n.getMessage("AccResetBtn"));
            $('#calibrate-start-button').prop("title", i18n.getMessage("AccResetBtn"));
            $('#calibrate-start-button').removeClass("calibrate");
            $('#calibrate-start-button').addClass("resetCalibration");
        } else {
            $('#calibrate-start-button').html(i18n.getMessage("AccBtn"));
            $('#calibrate-start-button').prop("title", i18n.getMessage("AccBtn"));
            $('#calibrate-start-button').addClass("calibrate");
            $('#calibrate-start-button').removeClass("resetCalibration");
        }
    
        if (callback) callback();
    }
    
    function actionCalibrateButton(callback) {
        if ($('#calibrate-start-button').hasClass("resetCalibration")) {
            resetAccCalibration();
        } else {
            calibrateNew();
        }
    
        
    }

    function resetAccCalibration() {
        var pos = ['X', 'Y', 'Z'];
        pos.forEach(function (item) {
            FC.CALIBRATION_DATA.accGain[item] = 4096;
            FC.CALIBRATION_DATA.accZero[item] = 0;
        });

        saveChainer.execute();
    }

    function processHtml() {
        $('#calibrateButtonSave').on('click', function () {
            FC.CALIBRATION_DATA.opflow.Scale = parseFloat($('[name=OpflowScale]').val());
            saveChainer.execute();
        });

        if (FC.SENSOR_CONFIG.magnetometer === 0) {
            //Comment for test
            $('#mag_btn, #mag-calibrated-data').css('pointer-events', 'none').css('opacity', '0.4');
        }

        if (FC.SENSOR_CONFIG.opflow === 0) {
            //Comment for test
            $('#opflow_btn, #opflow-calibrated-data').css('pointer-events', 'none').css('opacity', '0.4');
        }

        $('#mag_btn').on('click', function () {
            MSP.send_message(MSPCodes.MSP_MAG_CALIBRATION, false, false, function () {
                GUI.log(i18n.getMessage('initialSetupMagCalibStarted'));
            });

            var button = $(this);

            $(button).addClass('disabled');

            let modalProcessing = new jBox('Modal', {
                width: 400,
                height: 120,
                animation: false,
                closeOnClick: false,
                closeOnEsc: false,
                content: $('#modal-compass-processing').clone()
            }).open();

            var countdown = 30;
            interval.add('compass_calibration_interval', function () {
                countdown--;
                if (countdown === 0) {
                    setTimeout(function () {
                        $(button).removeClass('disabled');

                        modalProcessing.close();
                        GUI.log(i18n.getMessage('initialSetupMagCalibEnded'));
                        
                        MSP.send_message(MSPCodes.MSP_CALIBRATION_DATA, false, false, updateSensorData);
                        interval.remove('compass_calibration_interval');

                        //Cleanup
                       //delete modalProcessing;
                        $('.jBox-wrapper').remove();
                    }, 1000);
                } else {
                    modalProcessing.content.find('.modal-compass-countdown').text(countdown);
                }

            }, 1000);
        });

        $('#opflow_btn').on('click', function () {
            MSP.send_message(MSPCodes.MSP2_INAV_OPFLOW_CALIBRATION, false, false, function () {
                GUI.log(i18n.getMessage('initialSetupOpflowCalibStarted'));
            });

            var button = $(this);

            $(button).addClass('disabled');

            modalProcessing = new jBox('Modal', {
                width: 400,
                height: 120,
                animation: false,
                closeOnClick: false,
                closeOnEsc: false,
                content: $('#modal-opflow-processing')
            }).open();

            var countdown = 30;
            interval.add('opflow_calibration_interval', function () {
                countdown--;
                $('#modal-opflow-countdown').text(countdown);
                if (countdown === 0) {
                    $(button).removeClass('disabled');

                    modalProcessing.close();
                    GUI.log(i18n.getMessage('initialSetupOpflowCalibEnded'));
                    MSP.send_message(MSPCodes.MSP_CALIBRATION_DATA, false, false, updateSensorData);
                    interval.remove('opflow_calibration_interval');
                }
            }, 1000);
        });

        $('#modal-start-button').on('click', function () {
            modalStart.close();
            TABS.calibration.model.next();
        });

        $('#modal-stop-button').on('click', function () {
            modalStop.close();
        });

        // translate to user-selected language
       i18n.localize();

        setupCalibrationButton();
        $('#calibrate-start-button').on('click', actionCalibrateButton);
       
        MSP.send_message(MSPCodes.MSP_CALIBRATION_DATA, false, false, updateSensorData);

        GUI.content_ready(callback);
    }
};

TABS.calibration.cleanup = function (callback) {
    if (callback) callback();
};
