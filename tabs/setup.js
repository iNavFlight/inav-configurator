/*global $,chrome,FC,helper,mspHelper,MIXER_CONFIG,BF_CONFIG*/
'use strict';

TABS.setup = {
    yaw_fix: 0.0
};

TABS.setup.initialize = function (callback) {
    var self = this;

    if (GUI.active_tab != 'setup') {
        GUI.active_tab = 'setup';
        googleAnalytics.sendAppView('Setup');
    }

    var loadChainer = new MSPChainerClass();

    var loadChain = [
        mspHelper.loadBfConfig,
        mspHelper.queryFcStatus,
        mspHelper.loadMixerConfig
    ];

    loadChain.push(mspHelper.loadMiscV2);
    loadChainer.setChain(loadChain);
    loadChainer.setExitPoint(load_html);
    loadChainer.execute();

    function load_html() {
        $('#content').load("./tabs/setup.html", process_html);
    }

    function process_html() {
        // translate to user-selected language
        localize();

        if (!FC.isMotorOutputEnabled()) {
            GUI_control.prototype.log("<span style='color: red; font-weight: bolder'><strong>" + chrome.i18n.getMessage("logPwmOutputDisabled") + "</strong></span>");
        }

        // initialize 3D
        self.initialize3D();

		// set roll in interactive block
        $('span.roll').text(chrome.i18n.getMessage('initialSetupAttitude', [0]));
		// set pitch in interactive block
        $('span.pitch').text(chrome.i18n.getMessage('initialSetupAttitude', [0]));
        // set heading in interactive block
        $('span.heading').text(chrome.i18n.getMessage('initialSetupAttitude', [0]));


        // check if we have magnetometer
        if (!bit_check(CONFIG.activeSensors, 2)) {
            $('a.calibrateMag').addClass('disabled');
            $('default_btn').addClass('disabled');
        }

        self.initializeInstruments();

        $('a.resetSettings').click(function () {
            if (confirm(chrome.i18n.getMessage('confirm_reset_settings'))) {
                MSP.send_message(MSPCodes.MSP_RESET_CONF, false, false, function () {
                    GUI.log(chrome.i18n.getMessage('initialSetupSettingsRestored'));
    
                    GUI.tab_switch_cleanup(function () {
                        TABS.setup.initialize();
                    });
                });
            }
        });

        // display current yaw fix value (important during tab re-initialization)
        $('div#interactive_block > a.reset').text(chrome.i18n.getMessage('initialSetupButtonResetZaxisValue', [self.yaw_fix]));

        // reset yaw button hook
        $('div#interactive_block > a.reset').click(function () {
            self.yaw_fix = SENSOR_DATA.kinematics[2] * - 1.0;
            $(this).text(chrome.i18n.getMessage('initialSetupButtonResetZaxisValue', [self.yaw_fix]));

            console.log('YAW reset to 0 deg, fix: ' + self.yaw_fix + ' deg');
        });

        // cached elements
        var bat_voltage_e = $('.bat-voltage'),
            bat_percent_e = $('.bat-percent'),
            bat_remaining_e = $('.bat-remain-cap'),
            bat_cells_e = $('.bat-cells'),
            bat_thresh_e = $('.bat-thresh'),
            bat_full_e = $('.bat-full'),
            bat_mah_drawn_e = $('.bat-mah-drawn'),
            bat_wh_drawn_e = $('.bat-mwh-drawn'),
            bat_current_draw_e = $('.bat-current-draw'),
            bat_power_draw_e = $('.bat-power-draw'),
            rssi_e = $('.rssi'),
            gpsFix_e = $('.gpsFixType'),
            gpsSats_e = $('.gpsSats'),
            gpsLat_e = $('.gpsLat'),
            gpsLon_e = $('.gpsLon'),
            roll_e = $('dd.roll'),
            pitch_e = $('dd.pitch'),
            heading_e = $('dd.heading');

        function get_slow_data() {
            if (have_sensor(CONFIG.activeSensors, 'gps')) {

                /*
                 * Enable balancer
                 */
                if (helper.mspQueue.shouldDrop()) {
                    return;
                }

                MSP.send_message(MSPCodes.MSP_RAW_GPS, false, false, function () {
                    var gpsFixType = chrome.i18n.getMessage('gpsFixNone');
                    if (GPS_DATA.fix >= 2)
                        gpsFixType = chrome.i18n.getMessage('gpsFix3D');
                    else if (GPS_DATA.fix >= 1)
                        gpsFixType = chrome.i18n.getMessage('gpsFix2D');
                    gpsFix_e.html(gpsFixType);
                    gpsSats_e.text(GPS_DATA.numSat);
                    gpsLat_e.text((GPS_DATA.lat / 10000000).toFixed(4) + ' deg');
                    gpsLon_e.text((GPS_DATA.lon / 10000000).toFixed(4) + ' deg');
                });
            }
        }

        function get_fast_data() {

            /*
             * Enable balancer
             */
            if (helper.mspQueue.shouldDrop()) {
                return;
            }

            MSP.send_message(MSPCodes.MSP_ATTITUDE, false, false, function () {
	            roll_e.text(chrome.i18n.getMessage('initialSetupAttitude', [SENSOR_DATA.kinematics[0]]));
	            pitch_e.text(chrome.i18n.getMessage('initialSetupAttitude', [SENSOR_DATA.kinematics[1]]));
                heading_e.text(chrome.i18n.getMessage('initialSetupAttitude', [SENSOR_DATA.kinematics[2]]));
                self.render3D();
                self.updateInstruments();
            });
        }

        helper.mspBalancedInterval.add('setup_data_pull_fast', 40, 1, get_fast_data);
        helper.mspBalancedInterval.add('setup_data_pull_slow', 250, 1, get_slow_data);

        helper.interval.add('gui_analog_update', function () {
            bat_cells_e.text(chrome.i18n.getMessage('initialSetupBatteryDetectedCellsValue', [ANALOG.cell_count]));
            bat_voltage_e.text(chrome.i18n.getMessage('initialSetupBatteryVoltageValue', [ANALOG.voltage]));
            remaining_capacity_wh_decimals = ANALOG.battery_remaining_capacity.toString().length < 5 ? 3 : (7 - ANALOG.battery_remaining_capacity.toString().length);
            remaining_capacity_value = MISC.battery_capacity_unit == 'mAh' ? ANALOG.battery_remaining_capacity : (ANALOG.battery_remaining_capacity / 1000).toFixed(remaining_capacity_wh_decimals < 0 ? 0 : remaining_capacity_wh_decimals);
            remaining_capacity_unit = MISC.battery_capacity_unit == 'mAh' ? 'mAh' : 'Wh';
            bat_remaining_e.text(chrome.i18n.getMessage('initialSetupBatteryRemainingCapacityValue', ((MISC.battery_capacity > 0) && ANALOG.battery_full_when_plugged_in) ? [remaining_capacity_value, remaining_capacity_unit] : ['NA', '']));
            bat_percent_e.text(chrome.i18n.getMessage('initialSetupBatteryPercentageValue', [ANALOG.battery_percentage]));
            bat_full_e.text(chrome.i18n.getMessage('initialSetupBatteryFullValue', [ANALOG.battery_full_when_plugged_in]));
            bat_thresh_e.text(chrome.i18n.getMessage('initialSetupBatteryThresholdsValue', [ANALOG.use_capacity_thresholds]));
            bat_mah_drawn_e.text(chrome.i18n.getMessage('initialSetupBatteryMahValue', [ANALOG.mAhdrawn]));
            capacity_drawn_decimals = ANALOG.mWhdrawn.toString().length < 5 ? 3 : (7 - ANALOG.mWhdrawn.toString().length);
            bat_wh_drawn_e.text(chrome.i18n.getMessage('initialSetup_Wh_drawnValue', [(ANALOG.mWhdrawn / 1000).toFixed(capacity_drawn_decimals < 0 ? 0 : capacity_drawn_decimals)]));
            bat_current_draw_e.text(chrome.i18n.getMessage('initialSetupCurrentDrawValue', [ANALOG.amperage.toFixed(2)]));
            bat_power_draw_e.text(chrome.i18n.getMessage('initialSetupPowerDrawValue', [ANALOG.power.toFixed(2)]));
            rssi_e.text(chrome.i18n.getMessage('initialSetupRSSIValue', [((ANALOG.rssi / 1023) * 100).toFixed(0)]));
        }, 100, true);

        function updateArminFailure() {
            var flagNames = FC.getArmingFlags();
            for (var bit in flagNames) {
                if (flagNames.hasOwnProperty(bit)) {
                    if (bit_check(CONFIG.armingFlags, bit)) {
                        $('#reason-' + flagNames[bit]).html(chrome.i18n.getMessage('armingCheckFail'));
                    }
                    else {
                        $('#reason-' + flagNames[bit]).html(chrome.i18n.getMessage('armingCheckPass'));
                    }
                }
            }
        }

        /*
         * 1fps update rate will be fully enough
         */
        helper.interval.add('updateArminFailure', updateArminFailure, 500, true);

        GUI.content_ready(callback);
    }
};

TABS.setup.initializeInstruments = function() {
    var options = {size:90, showBox : false, img_directory: 'images/flightindicators/'};
    var attitude = $.flightIndicator('#attitude', 'attitude', options);
    var heading = $.flightIndicator('#heading', 'heading', options);

    this.updateInstruments = function() {
        attitude.setRoll(SENSOR_DATA.kinematics[0]);
        attitude.setPitch(SENSOR_DATA.kinematics[1]);
        heading.setHeading(SENSOR_DATA.kinematics[2]);
    };
};

TABS.setup.initialize3D = function () {
    var self = this,
        loader,
        canvas,
        wrapper,
        renderer,
        camera,
        scene,
        light,
        light2,
        modelWrapper,
        model,
        model_file,
        useWebGlRenderer = false;

    canvas = $('.model-and-info #canvas');
    wrapper = $('.model-and-info #canvas_wrapper');

    // webgl capability detector
    // it would seem the webgl "enabling" through advanced settings will be ignored in the future
    // and webgl will be supported if gpu supports it by default (canary 40.0.2175.0), keep an eye on this one
    var detector_canvas = document.createElement('canvas');
    if (window.WebGLRenderingContext && (detector_canvas.getContext('webgl') || detector_canvas.getContext('experimental-webgl'))) {
        renderer = new THREE.WebGLRenderer({canvas: canvas.get(0), alpha: true, antialias: true});
        useWebGlRenderer = true;
    } else {
        renderer = new THREE.CanvasRenderer({canvas: canvas.get(0), alpha: true});
    }
    // initialize render size for current canvas size
    renderer.setSize(wrapper.width()*2, wrapper.height()*2);


    // modelWrapper adds an extra axis of rotation to avoid gimbal lock with the euler angles
    modelWrapper = new THREE.Object3D();

    // load the model including materials
    if (useWebGlRenderer) {
        if (FC.isNewMixer()) {
            if (MIXER_CONFIG.appliedMixerPreset === -1) {
                model_file = 'custom';
                GUI_control.prototype.log("<span style='color: red; font-weight: bolder'><strong>" + chrome.i18n.getMessage("mixerNotConfigured") + "</strong></span>");
            } else {
                model_file = helper.mixer.getById(MIXER_CONFIG.appliedMixerPreset).model;
            }
        } else {
            model_file = helper.mixer.getById(BF_CONFIG.mixerConfiguration).model;
        }
    } else {
        model_file = 'fallback'
    }

    // Temporary workaround for 'custom' model until akfreak's custom model is merged.
    if (model_file == 'custom') {
        model_file = 'fallback';
    }

    // setup scene
    scene = new THREE.Scene();

    loader = new THREE.JSONLoader();
    loader.load('./resources/models/' + model_file + '.json', function (geometry, materials) {
        var modelMaterial = new THREE.MeshFaceMaterial(materials);
        model = new THREE.Mesh(geometry, modelMaterial);

        model.scale.set(15, 15, 15);

        modelWrapper.add(model);
        scene.add(modelWrapper);
    });

    // stationary camera
    camera = new THREE.PerspectiveCamera(50, wrapper.width() / wrapper.height(), 1, 10000);

    // some light
    light = new THREE.AmbientLight(0x404040);
    light2 = new THREE.DirectionalLight(new THREE.Color(1, 1, 1), 1.5);
    light2.position.set(0, 1, 0);

    // move camera away from the model
    camera.position.z = 125;

    // add camera, model, light to the foreground scene
    scene.add(light);
    scene.add(light2);
    scene.add(camera);
    scene.add(modelWrapper);

    this.render3D = function () {
        if (!model) {
            return;
        }

        // compute the changes
        model.rotation.x = (SENSOR_DATA.kinematics[1] * -1.0) * 0.017453292519943295;
        modelWrapper.rotation.y = ((SENSOR_DATA.kinematics[2] * -1.0) - self.yaw_fix) * 0.017453292519943295;
        model.rotation.z = (SENSOR_DATA.kinematics[0] * -1.0) * 0.017453292519943295;

        // draw
        renderer.render(scene, camera);
    };

    // handle canvas resize
    this.resize3D = function () {
        renderer.setSize(wrapper.width()*2, wrapper.height()*2);
        camera.aspect = wrapper.width() / wrapper.height();
        camera.updateProjectionMatrix();

        self.render3D();
    };

    $(window).on('resize', this.resize3D);
};

TABS.setup.cleanup = function (callback) {
    $(window).off('resize', this.resize3D);

    if (callback) callback();
};
