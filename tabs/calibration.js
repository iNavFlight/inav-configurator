'use strict';

import MSPChainerClass from './../js/msp/MSPchainer';
import mspHelper from './../js/msp/MSPHelper';
import MSPCodes from './../js/msp/MSPCodes';
import MSP from './../js/msp';
import GUI from './../js/gui';
import FC from './../js/fc';
import timeout from './../js/timeouts';
import interval from './../js/intervals';
import i18n from './../js/localization';
import jBox from 'jbox';

const calibrationTab = {};

// Module-scoped (not local to initialize()) so cleanup() below can close it too.
let modalMagAlign;

// Pure functions of their arguments -- module-scoped rather than redeclared on
// every calibrationTab.initialize() call.
function magAlignmentSettingsEqual(a, b) {
    return a.every(function (setting, i) { return setting.value === b[i].value; });
}

function formatMagAlignment(alignment) {
    var roll = alignment[0].value / 10;
    var pitch = alignment[1].value / 10;
    var yaw = alignment[2].value / 10;

    if (roll === 0 && pitch === 0 && yaw === 0) {
        var alignSetting = alignment[3];
        var names = alignSetting.setting?.table?.values || [];
        return names[alignSetting.value] || alignSetting.value;
    }
    return roll + ", " + pitch + ", " + yaw;
}

calibrationTab.model = (function () {
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

calibrationTab.initialize = function (callback) {

    var loadChainer = new MSPChainerClass(),
        saveChainer = new MSPChainerClass(),
        modalStart,
        modalStop,
        modalProcessing;

    modalMagAlign = undefined; // reset the module-scoped modal handle for this tab session

    if (GUI.active_tab !== this) {
        GUI.active_tab = this;
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
        import('./calibration.html?raw').then(({default: html}) => GUI.load(html, processHtml));
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

    // Reads the settings the firmware's compass-orientation auto-detect (run as
    // part of MSP_MAG_CALIBRATION on capable boards, see hasCalibrationOrientationDetection)
    // writes on success. Detection is confidence-gated and simply leaves these
    // untouched on failure, so the caller must diff against a before/after snapshot
    // to tell "detected" from "not confident enough".
    //
    // Known limitation: firmware doesn't expose a separate confidence/success flag over
    // MSP, so a before==after result is ambiguous -- it could mean detection genuinely
    // wasn't confident, OR it confidently redetected an orientation that was already
    // correct (e.g. a previous manual wizard run). reportMagCalibrationOrientation()'s
    // "not detected" modal wording is deliberately hedged to cover both cases; a real fix
    // would need a firmware-side confidence flag added to the MSP response.
    function getMagAlignmentSettings() {
        return Promise.all([
            mspHelper.getSetting("align_mag_roll"),
            mspHelper.getSetting("align_mag_pitch"),
            mspHelper.getSetting("align_mag_yaw"),
            mspHelper.getSetting("align_mag"),
        ]);
    }

    function reportMagCalibrationOrientation(beforePromise) {
        Promise.all([beforePromise, getMagAlignmentSettings()]).then(function (result) {
            var before = result[0], after = result[1];
            var content;
            if (magAlignmentSettingsEqual(before, after)) {
                content = $('#modal-mag-align-not-detected');
            } else {
                $('#modal-mag-align-setting').text(formatMagAlignment(after));
                content = $('#modal-mag-align-done');
            }
            modalMagAlign = new jBox('Modal', {
                width: 460,
                height: 200,
                animation: false,
                closeOnClick: true,
                content: content
            }).open();
        }).catch(function (err) {
            // MSP timeout/disconnect while reading the before/after alignment settings --
            // without this, the calibration finishes silently with no follow-up modal at all.
            console.error('Failed to read compass alignment settings after calibration:', err);
            GUI.log(i18n.getMessage('magCalibOrientationReportFailed'));
        });
    }

    function checkFinishAccCalibrate() {
        if (calibrationTab.model.next() === null) {
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

        if (calibrationTab.model.getStep() === null) {
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
            newStep = calibrationTab.model.next();
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
            // Snapshot before the spin so we can tell whether the firmware's
            // auto-detect actually changed anything (see reportMagCalibrationOrientation).
            var magAlignBefore = FC.hasCalibrationOrientationDetection() ? getMagAlignmentSettings() : null;

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

                        if (magAlignBefore) {
                            reportMagCalibrationOrientation(magAlignBefore);
                        }
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
            calibrationTab.model.next();
        });

        $('#modal-stop-button').on('click', function () {
            modalStop.close();
        });

        $('#modal-mag-align-done-ok, #modal-mag-align-not-detected-ok').on('click', function () {
            if (modalMagAlign) {
                modalMagAlign.close();
            }
        });

        // translate to user-selected language
       i18n.localize();

        setupCalibrationButton();
        $('#calibrate-start-button').on('click', actionCalibrateButton);
       
        MSP.send_message(MSPCodes.MSP_CALIBRATION_DATA, false, false, updateSensorData);

        GUI.content_ready(callback);
    }
};

calibrationTab.cleanup = function (callback) {
    // reportMagCalibrationOrientation() can leave this open if the user switches tabs
    // before dismissing it -- without this, it stays visible over whatever tab they land on.
    if (modalMagAlign) {
        modalMagAlign.close();
    }

    if (callback) callback();
};

export default calibrationTab;
