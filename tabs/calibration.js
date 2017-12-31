/*global chrome */
'use strict';

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
                if (CALIBRATION_DATA.acc['Pos' + i] === 1) {
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
        googleAnalytics.sendAppView('Calibration');
    }

    loadChainer.setChain([
        mspHelper.loadStatus,
        mspHelper.loadCalibrationData
    ]);
    loadChainer.setExitPoint(loadHtml);
    loadChainer.execute();

    saveChainer.setChain([
        mspHelper.saveCalibrationData
    ]);
    saveChainer.setExitPoint(loadChainer.execute);

    function loadHtml() {
        $('#content').load("./tabs/calibration.html", processHtml);
    }

    MSP.send_message(MSPCodes.MSP_IDENT, false, false, loadHtml);

    function updateCalibrationSteps() {
        for (var i = 0; i < 6; i++) {
            var $element = $('[data-step="' + (i + 1) + '"]');

            if (CALIBRATION_DATA.acc['Pos' + i] === 0) {
                $element.removeClass('finished').removeClass('active');
            } else {
                $element.addClass("finished").removeClass('active');
            }
        }
    }

    function updateSensorData() {
        var pos = ['X', 'Y', 'Z'];
        pos.forEach(function (item) {
            $('[name=accGain' + item + ']').val(CALIBRATION_DATA.accGain[item]);
            $('[name=accZero' + item + ']').val(CALIBRATION_DATA.accGain[item]);
            $('[name=Mag' + item + ']').val(CALIBRATION_DATA.magZero[item]);
        });
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

    function processHtml() {

        if (SENSOR_CONFIG.magnetometer === 0) {
            //Comment for test
            $('#mag_btn, #mag-calibrated-data').css('pointer-events', 'none').css('opacity', '0.4');
        }

        $('#mag_btn').on('click', function () {
            MSP.send_message(MSPCodes.MSP_MAG_CALIBRATION, false, false, function () {
                GUI.log(chrome.i18n.getMessage('initialSetupMagCalibStarted'));
            });

            var button = $(this);

            $(button).addClass('disabled');

            modalProcessing = new jBox('Modal', {
                width: 400,
                height: 100,
                animation: false,
                closeOnClick: false,
                closeOnEsc: false,
                content: $('#modal-compass-processing')
            }).open();

            var countdown = 30;
            helper.interval.add('compass_calibration_interval', function () {
                countdown--;
                $('#modal-compass-countdown').text(countdown);
                if (countdown === 0) {
                    $(button).removeClass('disabled');

                    modalProcessing.close();
                    GUI.log(chrome.i18n.getMessage('initialSetupMagCalibEnded'));
                    MSP.send_message(MSPCodes.MSP_CALIBRATION_DATA, false, false, updateSensorData);
                    helper.interval.remove('compass_calibration_interval');
                }
            }, 1000);
        });

        $('#calibrate-start-button').click(function () {
            var newStep = null,
                $button = $(this);

            if (TABS.calibration.model.getStep() === null) {
                for (var i = 0; i < 6; i++) {
                    if (CALIBRATION_DATA.acc['Pos' + i] === 1) {
                        CALIBRATION_DATA.acc['Pos' + i] = 0;
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
                    height: 100,
                    animation: false,
                    closeOnClick: false,
                    closeOnEsc: false,
                    content: $('#modal-acc-processing')
                }).open();

                MSP.send_message(MSPCodes.MSP_ACC_CALIBRATION, false, false, function () {
                    GUI.log(chrome.i18n.getMessage('initialSetupAccelCalibStarted'));
                });

                helper.timeout.add('acc_calibration_timeout', function () {
                    $button.removeClass('disabled');

                    modalProcessing.close();
                    MSP.send_message(MSPCodes.MSP_CALIBRATION_DATA, false, false, checkFinishAccCalibrate);
                    GUI.log(chrome.i18n.getMessage('initialSetupAccelCalibEnded'));
                }, 2000);
            }

        });

        $('#modal-start-button').click(function () {
            modalStart.close();
            TABS.calibration.model.next();
        });

        $('#modal-stop-button').click(function () {
            modalStop.close();
        });

        // translate to user-selected language
        localize();
        MSP.send_message(MSPCodes.MSP_CALIBRATION_DATA, false, false, updateSensorData);
        GUI.content_ready(callback);
    }
};

TABS.calibration.cleanup = function (callback) {
    if (callback) callback();
};
