'use strict';

const path = require('path');

const MSPChainerClass = require('./../js/msp/MSPchainer');
const FC = require('./../js/fc');
const { GUI, TABS } = require('./../js/gui');
const MSP = require('./../js/msp');
const MSPCodes = require('./../js/msp/MSPCodes');
const i18n = require('./../js/localization');
const mspHelper = require('./../js/msp/MSPHelper');
const interval = require('./../js/intervals');
const SerialBackend = require('./../js/serial_backend');
const { mixer } = require('./../js/model');
const BitHelper = require('./../js/bitHelper')

TABS.setup = {
    yaw_fix: 0.0
};

TABS.setup.initialize = function (callback) {
    var self = this;

    if (GUI.active_tab != 'setup') {
        GUI.active_tab = 'setup';
    }

    var loadChainer = new MSPChainerClass();

    var loadChain = [
        mspHelper.loadFeatures,
        mspHelper.queryFcStatus,
        mspHelper.loadMixerConfig,
        mspHelper.loadMiscV2,
        mspHelper.loadSerialPorts
    ];

    loadChainer.setChain(loadChain);
    loadChainer.setExitPoint(load_html);
    loadChainer.execute();

    function load_html() {
        GUI.load(path.join(__dirname, "setup.html"), process_html);
    }

    function process_html() {
        // translate to user-selected language
       i18n.localize();

        if (!FC.isMotorOutputEnabled()) {
            GUI.log("<span style='color: red; font-weight: bolder'><strong>" + i18n.getMessage("logPwmOutputDisabled") + "</strong></span>");
        }

        // initialize 3D
        self.initialize3D();

		// set roll in interactive block
        $('span.roll').text(i18n.getMessage('initialSetupAttitude', [0]));
		// set pitch in interactive block
        $('span.pitch').text(i18n.getMessage('initialSetupAttitude', [0]));
        // set heading in interactive block
        $('span.heading').text(i18n.getMessage('initialSetupAttitude', [0]));


        // check if we have magnetometer
        if (!BitHelper.bit_check(FC.CONFIG.activeSensors, 2)) {
            $('a.calibrateMag').addClass('disabled');
            $('default_btn').addClass('disabled');
        }

        self.initializeInstruments();

        $('a.resetSettings').on('click', function () {
            if (GUI.confirm(i18n.getMessage('confirm_reset_settings'))) {
                MSP.send_message(MSPCodes.MSP_RESET_CONF, false, false, function () {
                    GUI.log(i18n.getMessage('initialSetupSettingsRestored'));
    
                    GUI.tab_switch_cleanup(function () {
                        MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, function() {
                            GUI.log(i18n.getMessage('deviceRebooting'));
                            GUI.handleReconnect();
                        });
                    });
                });
            }
        });

        // display current yaw fix value (important during tab re-initialization)
        $('div#interactive_block > a.reset').text(i18n.getMessage('initialSetupButtonResetZaxisValue', [self.yaw_fix]));

        // reset yaw button hook
        $('div#interactive_block > a.reset').on('click', function () {
            self.yaw_fix = FC.SENSOR_DATA.kinematics[2] * - 1.0;
            $(this).text(i18n.getMessage('initialSetupButtonResetZaxisValue', [self.yaw_fix]));

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
            if (SerialBackend.have_sensor(FC.CONFIG.activeSensors, 'gps')) {
                MSP.send_message(MSPCodes.MSP_RAW_GPS, false, false, function () {
                    var gpsFixType = i18n.getMessage('gpsFixNone');
                    if (FC.GPS_DATA.fix >= 2)
                        gpsFixType = i18n.getMessage('gpsFix3D');
                    else if (FC.GPS_DATA.fix >= 1)
                        gpsFixType = i18n.getMessage('gpsFix2D');
                    gpsFix_e.html(gpsFixType);
                    gpsSats_e.text(FC.GPS_DATA.numSat);
                    gpsLat_e.text((FC.GPS_DATA.lat / 10000000).toFixed(4) + ' deg');
                    gpsLon_e.text((FC.GPS_DATA.lon / 10000000).toFixed(4) + ' deg');
                });
            }
        }

        function get_fast_data() {
            MSP.send_message(MSPCodes.MSP_ATTITUDE, false, false, function () {
	            roll_e.text(i18n.getMessage('initialSetupAttitude', [FC.SENSOR_DATA.kinematics[0]]));
	            pitch_e.text(i18n.getMessage('initialSetupAttitude', [FC.SENSOR_DATA.kinematics[1]]));
                heading_e.text(i18n.getMessage('initialSetupAttitude', [FC.SENSOR_DATA.kinematics[2]]));
                self.render3D();
                self.updateInstruments();
            });
        }

        interval.add('setup_data_pull_fast', get_fast_data, 50);
        interval.add('setup_data_pull_slow', get_slow_data, 250);

        interval.add('gui_analog_update', function () {
            bat_cells_e.text(i18n.getMessage('initialSetupBatteryDetectedCellsValue', [FC.ANALOG.cell_count]));
            bat_voltage_e.text(i18n.getMessage('initialSetupBatteryVoltageValue', [FC.ANALOG.voltage]));
            let remaining_capacity_wh_decimals = FC.ANALOG.battery_remaining_capacity.toString().length < 5 ? 3 : (7 - FC.ANALOG.battery_remaining_capacity.toString().length);
            let remaining_capacity_value = FC.MISC.battery_capacity_unit == 'mAh' ? FC.ANALOG.battery_remaining_capacity : (FC.ANALOG.battery_remaining_capacity / 1000).toFixed(remaining_capacity_wh_decimals < 0 ? 0 : remaining_capacity_wh_decimals);
            let remaining_capacity_unit = FC.MISC.battery_capacity_unit == 'mAh' ? 'mAh' : 'Wh';
            bat_remaining_e.text(i18n.getMessage('initialSetupBatteryRemainingCapacityValue', ((FC.MISC.battery_capacity > 0) && FC.ANALOG.battery_full_when_plugged_in) ? [remaining_capacity_value, remaining_capacity_unit] : ['NA', '']));
            bat_percent_e.text(i18n.getMessage('initialSetupBatteryPercentageValue', [FC.ANALOG.battery_percentage]));
            bat_full_e.text(i18n.getMessage('initialSetupBatteryFullValue', [FC.ANALOG.battery_full_when_plugged_in]));
            bat_thresh_e.text(i18n.getMessage('initialSetupBatteryThresholdsValue', [FC.ANALOG.use_capacity_thresholds]));
            bat_mah_drawn_e.text(i18n.getMessage('initialSetupBatteryMahValue', [FC.ANALOG.mAhdrawn]));
            let capacity_drawn_decimals = FC.ANALOG.mWhdrawn.toString().length < 5 ? 3 : (7 - FC.ANALOG.mWhdrawn.toString().length);
            bat_wh_drawn_e.text(i18n.getMessage('initialSetup_Wh_drawnValue', [(FC.ANALOG.mWhdrawn / 1000).toFixed(capacity_drawn_decimals < 0 ? 0 : capacity_drawn_decimals)]));
            bat_current_draw_e.text(i18n.getMessage('initialSetupCurrentDrawValue', [FC.ANALOG.amperage.toFixed(2)]));
            bat_power_draw_e.text(i18n.getMessage('initialSetupPowerDrawValue', [FC.ANALOG.power.toFixed(2)]));
            rssi_e.text(i18n.getMessage('initialSetupRSSIValue', [((FC.ANALOG.rssi / 1023) * 100).toFixed(0)]));
        }, 100, true);

        function updateArminFailure() {
            var flagNames = FC.getArmingFlags();
            for (var bit in flagNames) {
                if (flagNames.hasOwnProperty(bit)) {
                    if (BitHelper.bit_check(FC.CONFIG.armingFlags, bit)) {
                        $('#reason-' + flagNames[bit]).html(i18n.getMessage('armingCheckFail'));
                    }
                    else {
                        $('#reason-' + flagNames[bit]).html(i18n.getMessage('armingCheckPass'));
                    }
                }
            }
        }

        /*
         * 1fps update rate will be fully enough
         */
        interval.add('updateArminFailure', updateArminFailure, 500, true);

        GUI.content_ready(callback);
    }
};

TABS.setup.initializeInstruments = function() {
    var options = {size:90, showBox : false, img_directory: path.join(__dirname, '/../images/flightindicators/')};
    var attitude = $.flightIndicator('#attitude', 'attitude', options);
    var heading = $.flightIndicator('#heading', 'heading', options);

    this.updateInstruments = function() {
        attitude.setRoll(FC.SENSOR_DATA.kinematics[0]);
        attitude.setPitch(FC.SENSOR_DATA.kinematics[1]);
        heading.setHeading(FC.SENSOR_DATA.kinematics[2]);
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
        if (FC.MIXER_CONFIG.appliedMixerPreset === -1) {
            model_file = 'custom';
            GUI.log("<span style='color: red; font-weight: bolder'><strong>" + i18n.getMessage("mixerNotConfigured") + "</strong></span>");
        } else {
            model_file = mixer.getById(FC.MIXER_CONFIG.appliedMixerPreset).model;
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
    const manager = new THREE.LoadingManager();
    loader = new THREE.GLTFLoader(manager);
    loader.load('./resources/models/' + model_file + '.gltf',  (obj) =>{
        model = obj.scene;
        model.scale.set(15, 15, 15);
        modelWrapper.add(model);
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
        model.rotation.x = (FC.SENSOR_DATA.kinematics[1] * -1.0) * 0.017453292519943295;
        modelWrapper.rotation.y = ((FC.SENSOR_DATA.kinematics[2] * -1.0) - self.yaw_fix) * 0.017453292519943295;
        model.rotation.z = (FC.SENSOR_DATA.kinematics[0] * -1.0) * 0.017453292519943295;

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
