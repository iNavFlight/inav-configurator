'use strict';

TABS.advanced_tuning = {};

TABS.advanced_tuning.initialize = function (callback) {

    var loadChainer = new MSPChainerClass(),
        saveChainer = new MSPChainerClass();

    if (GUI.active_tab != 'advanced_tuning') {
        GUI.active_tab = 'advanced_tuning';
        googleAnalytics.sendAppView('AdvancedTuning');
    }

    loadChainer.setChain([
        mspHelper.loadNavPosholdConfig,
        mspHelper.loadPositionEstimationConfig,
        mspHelper.loadRthAndLandConfig,
        mspHelper.loadFwConfig,
        mspHelper.loadBrakingConfig
    ]);
    loadChainer.setExitPoint(loadHtml);
    loadChainer.execute();

    saveChainer.setChain([
        mspHelper.saveNavPosholdConfig,
        mspHelper.savePositionEstimationConfig,
        mspHelper.saveRthAndLandConfig,
        mspHelper.saveFwConfig,
        mspHelper.saveBrakingConfig,
        mspHelper.saveToEeprom
    ]);
    saveChainer.setExitPoint(reboot);

    function loadHtml() {
        $('#content').load("./tabs/advanced_tuning.html", processHtml);
    }

    function reboot() {
        //noinspection JSUnresolvedVariable
        GUI.log(chrome.i18n.getMessage('configurationEepromSaved'));
        GUI.tab_switch_cleanup(function () {
            MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, reinitialize);
        });
    }

    function reinitialize() {
        //noinspection JSUnresolvedVariable
        GUI.log(chrome.i18n.getMessage('deviceRebooting'));
        GUI.handleReconnect($('.tab_advanced_tuning a'));
    }

    function processHtml() {

        var $userControlMode = $('#user-control-mode'),
            $useMidThrottle = $("#use-mid-throttle"),
            $useGpsVelned = $('#use_gps_velned'),
            $rthClimbFirst = $('#rth-climb-first'),
            $rthClimbIgnoreEmergency = $('#rthClimbIgnoreEmergency'),
            $rthTailFirst = $('#rthTailFirst'),
            $rthAllowLanding = $('#rthAllowLanding'),
            $rthAltControlMode = $('#rthAltControlMode');

        if (semver.gte(CONFIG.flightControllerVersion, "2.1.0")) {

            $('.requires-v2_1').show();
        } else {
            $('.requires-v2_1').hide();
        }

        $rthClimbFirst.prop("checked", RTH_AND_LAND_CONFIG.rthClimbFirst);
        $rthClimbFirst.change(function () {
            if ($(this).is(":checked")) {
                RTH_AND_LAND_CONFIG.rthClimbFirst = 1;
            } else {
                RTH_AND_LAND_CONFIG.rthClimbFirst = 0;
            }
        });
        $rthClimbFirst.change();

        $rthClimbIgnoreEmergency.prop("checked", RTH_AND_LAND_CONFIG.rthClimbIgnoreEmergency);
        $rthClimbIgnoreEmergency.change(function () {
            if ($(this).is(":checked")) {
                RTH_AND_LAND_CONFIG.rthClimbIgnoreEmergency = 1;
            } else {
                RTH_AND_LAND_CONFIG.rthClimbIgnoreEmergency = 0;
            }
        });
        $rthClimbIgnoreEmergency.change();

        $rthTailFirst.prop("checked", RTH_AND_LAND_CONFIG.rthTailFirst);
        $rthTailFirst.change(function () {
            if ($(this).is(":checked")) {
                RTH_AND_LAND_CONFIG.rthTailFirst = 1;
            } else {
                RTH_AND_LAND_CONFIG.rthTailFirst = 0;
            }
        });
        $rthTailFirst.change();

        GUI.fillSelect($rthAltControlMode, FC.getRthAltControlMode(), RTH_AND_LAND_CONFIG.rthAltControlMode);
        $rthAltControlMode.val(RTH_AND_LAND_CONFIG.rthAltControlMode);
        $rthAltControlMode.change(function () {
            RTH_AND_LAND_CONFIG.rthAltControlMode = $rthAltControlMode.val();
        });
        GUI.fillSelect($rthAllowLanding, FC.getRthAllowLanding(), RTH_AND_LAND_CONFIG.rthAllowLanding);
        $rthAllowLanding.val(RTH_AND_LAND_CONFIG.rthAllowLanding);
        $rthAllowLanding.change(function () {
            RTH_AND_LAND_CONFIG.rthAllowLanding = $rthAllowLanding.val();
        });

        GUI.fillSelect($userControlMode, FC.getUserControlMode(), NAV_POSHOLD.userControlMode);
        $userControlMode.val(NAV_POSHOLD.userControlMode);
        $userControlMode.change(function () {
            NAV_POSHOLD.userControlMode = $userControlMode.val();
        });

        $useMidThrottle.prop("checked", NAV_POSHOLD.useThrottleMidForAlthold);
        $useMidThrottle.change(function () {
            if ($(this).is(":checked")) {
                NAV_POSHOLD.useThrottleMidForAlthold = 1;
            } else {
                NAV_POSHOLD.useThrottleMidForAlthold = 0;
            }
        });
        $useMidThrottle.change();

        $useGpsVelned.prop("checked", POSITION_ESTIMATOR.use_gps_velned);
        $useGpsVelned.change(function () {
            if ($(this).is(":checked")) {
                POSITION_ESTIMATOR.use_gps_velned = 1;
            } else {
                POSITION_ESTIMATOR.use_gps_velned = 0;
            }
        });
        $useGpsVelned.change();

        GUI.simpleBind();

        localize();

        $('#advanced-tuning-save-button').click(function () {
            saveChainer.execute();
        });

        GUI.content_ready(callback);
    }
};

TABS.advanced_tuning.cleanup = function (callback) {
    if (callback) callback();
};
