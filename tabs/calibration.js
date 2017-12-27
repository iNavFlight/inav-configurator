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
            privateScope.step++;
        }

        if (privateScope.step > 6) {
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

    /**
     *
     * @param {int} currentStep
     */
    function updateCalibrationSteps(currentStep) {
        for (var i = 1; i <= 6; i++) {
            var $element = $('[data-step="' + i + '"]');

            if (currentStep === null) {
                $element.removeClass('finished').removeClass('active');
            } else if (i < currentStep) {
                $element.addClass("finished").removeClass('active');
            } else if (currentStep === i) {
                $element.addClass('active').removeClass('finished');
            }

        }
    }

    function updateSensorData() {
        var pos = ['X', 'Y', 'Z'];
        pos.forEach(function(item) {
            $('[name=accGain'+item+']').val(CALIBRATION_DATA.accGain[item]);
            $('[name=accZero'+item+']').val(CALIBRATION_DATA.accGain[item]);
            $('[name=Mag'+item+']').val(CALIBRATION_DATA.magZero[item]);
        });
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

            helper.interval.pause('status_pull');

            var countdown = 30;
            helper.interval.add('compass_calibration_interval', function () {
                countdown--;
                $('#modal-compass-countdown').text(countdown);
                if (countdown === 0) {
                    $(button).removeClass('disabled');

                    modalProcessing.close();
                    GUI.log(chrome.i18n.getMessage('initialSetupMagCalibEnded'));
                    helper.interval.resume('status_pull');
                    helper.interval.remove('compass_calibration_interval');
                }
            }, 1000);
        });

        $('#calibrate-start-button').click(function () {
            var newStep = TABS.calibration.model.next(),
                $button = $(this);

            if (newStep === 1) {
                updateCalibrationSteps(newStep);
                modalStart = new jBox('Modal', {
                    width: 400,
                    height: 200,
                    animation: false,
                    closeOnClick: false,
                    closeOnEsc: false,
                    content: $('#modal-acc-calibration-start')
                }).open();
            }

            /*
             * Communication
             */
            if (newStep > 1 || newStep === null) {

                $button.addClass('disabled');

                modalProcessing = new jBox('Modal', {
                    width: 400,
                    height: 100,
                    animation: false,
                    closeOnClick: false,
                    closeOnEsc: false,
                    content: $('#modal-acc-processing')
                }).open();

                helper.interval.pause('status_pull');
                MSP.send_message(MSPCodes.MSP_ACC_CALIBRATION, false, false, function () {
                    GUI.log(chrome.i18n.getMessage('initialSetupAccelCalibStarted'));
                });

                helper.timeout.add('acc_calibration_timeout', function () {

                    updateCalibrationSteps(newStep);

                    $button.removeClass('disabled');

                    modalProcessing.close();

                    helper.interval.resume('status_pull');
                    GUI.log(chrome.i18n.getMessage('initialSetupAccelCalibEnded'));

                    if (newStep === null) {
                        modalStop = new jBox('Modal', {
                            width: 400,
                            height: 200,
                            animation: false,
                            closeOnClick: false,
                            closeOnEsc: false,
                            content: $('#modal-acc-calibration-stop')
                        }).open();
                    }
                }, 2000);
            }

        });

        $('#modal-start-button').click(function () {
            modalStart.close();
        });

        $('#modal-stop-button').click(function () {
            modalStop.close();
        });

        updateCalibrationSteps(TABS.calibration.model.getStep());

        // translate to user-selected language
        localize();

        helper.interval.add('status_pull', function status_pull() {
            if (semver.gte(CONFIG.flightControllerVersion, "1.5.0")) {
                MSP.send_message(MSPCodes.MSP_SENSOR_STATUS, false, false, updateSensorData);
            } else {
                MSP.send_message(MSPCodes.MSP_STATUS);
            }
        }, 250, true);
        GUI.content_ready(callback);
    }
};

TABS.calibration.cleanup = function (callback) {
    if (callback) callback();
};
