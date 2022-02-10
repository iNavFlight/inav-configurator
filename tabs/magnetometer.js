'use strict';
/*global chrome,GUI,TABS,nwdialog,$*/

TABS.magnetometer = {};




TABS.magnetometer.initialize = function (callback) {
    var self = this;

    if (GUI.active_tab != 'magnetometer') {
        GUI.active_tab = 'magnetometer';
        googleAnalytics.sendAppView('MAGNETOMETER');
    }

    self.alignmentConfig = {
        pitch: 0,
        roll: 0,
        yaw: 0
    };

    //========================
    // Load chain
    // =======================
    var loadChainer = new MSPChainerClass();

    var loadChain = [
        mspHelper.loadMixerConfig,
        mspHelper.loadSensorAlignment,
        // Pitch and roll must be inverted
        function(callback) {
            mspHelper.getSetting("align_mag_roll").then(function (data) {
                self.alignmentConfig.pitch = parseInt(data.value, 10) / 10;
            }).then(callback)
        },
        function(callback) {
            mspHelper.getSetting("align_mag_pitch").then(function (data) {
                self.alignmentConfig.roll = (parseInt(data.value, 10) / 10) - 180;
            }).then(callback)
        },
        function(callback) {
            mspHelper.getSetting("align_mag_yaw").then(function (data) {
                self.alignmentConfig.yaw = parseInt(data.value, 10) / 10;
            }).then(callback)
        }
    ];

    loadChainer.setChain(loadChain);
    loadChainer.setExitPoint(load_html);
    loadChainer.execute();

    //========================
    // Save chain
    // =======================
    var saveChainer = new MSPChainerClass();

    var saveChain = [
        // Magnetometer alignment
        function (callback) {
            let orientation_mag_e = $('select.magalign');
            SENSOR_ALIGNMENT.align_mag = parseInt(orientation_mag_e.val());
            callback();
        },
        mspHelper.saveSensorAlignment,
        // Pitch/Roll/Yaw
        // Pitch and roll must be inverted
        function(callback) {
            mspHelper.setSetting("align_mag_roll", self.alignmentConfig.pitch * 10, callback);
        },
        function(callback) {
            mspHelper.setSetting("align_mag_pitch", (180+self.alignmentConfig.roll) * 10, callback);
        },
        function(callback) {
            mspHelper.setSetting("align_mag_yaw", self.alignmentConfig.yaw * 10, callback);
        },
        function (callbakc){
            console.log("Roll",self.alignmentConfig.roll * 10)
            console.log("Pitch",(180+self.alignmentConfig.pitch) * 10)
            console.log("Yaw",self.alignmentConfig.yaw * 10)

        },
        mspHelper.saveToEeprom
    ];

    saveChainer.setChain(saveChain);
    saveChainer.setExitPoint(reboot);

    function reboot() {
        //noinspection JSUnresolvedVariable
        GUI.log(chrome.i18n.getMessage('configurationEepromSaved'));

        GUI.tab_switch_cleanup(function () {
            MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, reinitialize);
        });
    }

    function reinitialize() {
        GUI.log(chrome.i18n.getMessage('deviceRebooting'));
        GUI.handleReconnect($('.tab_magnetometer a'));
    }

    function load_html() {
        GUI.load("./tabs/magnetometer.html", process_html);
    }

    function process_html() {
        localize();

        // initialize 3D
        self.initialize3D();
        self.render3D();

        let alignments = FC.getSensorAlignments();
        let orientation_mag_e = $('select.magalign');
        let orientation_mag_roll = $('#alignRoll');
        let orientation_mag_pitch = $('#alignPitch');
        let orientation_mag_yaw = $('#alignYaw');

        for (i = 0; i < alignments.length; i++) {
            orientation_mag_e.append('<option value="' + (i + 1) + '">' + alignments[i] + '</option>');
        }
        orientation_mag_e.val(SENSOR_ALIGNMENT.align_mag);

        orientation_mag_roll.val(self.alignmentConfig.roll);
        orientation_mag_pitch.val(self.alignmentConfig.pitch);
        orientation_mag_yaw.val(self.alignmentConfig.yaw);

        function clamp(input, min, max) {
            return Math.min(Math.max(parseInt($(input).val()), min), max);
        }

        orientation_mag_e.change(function () {
            SENSOR_ALIGNMENT.align_mag = parseInt($(this).val());

            self.render3D();
        });

        orientation_mag_roll.change(function () {
            self.alignmentConfig.roll = clamp(this, -180, 180);

            self.render3D();
        });

        orientation_mag_pitch.change(function () {
            self.alignmentConfig.pitch = clamp(this, -180, 180)

            self.render3D();
        });

        orientation_mag_yaw.change(function () {
            self.alignmentConfig.yaw = clamp(this, -180, 360);

            self.render3D();
        });

        $('a.save').click(function () {
            saveChainer.execute()
        });


        GUI.content_ready(callback);
    }

};


TABS.magnetometer.initialize3D = function () {
    var self = this,
        loader,
        canvas,
        wrapper,
        renderer,
        camera,
        scene,
        light,
        light2,
        model,
        model_file,
        gps_model,
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

    // load the model including materials
    if (useWebGlRenderer) {
        if (MIXER_CONFIG.appliedMixerPreset === -1) {
            model_file = 'custom';
            GUI_control.prototype.log("<span style='color: red; font-weight: bolder'><strong>" + chrome.i18n.getMessage("mixerNotConfigured") + "</strong></span>");
        } else {
            model_file = helper.mixer.getById(MIXER_CONFIG.appliedMixerPreset).model;
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

        model.scale.set(10, 10, 10);

        scene.add(model);

        loader.load('./resources/models/gps.json', function (geometry, materials) {
            var modelMaterial = new THREE.MeshFaceMaterial(materials);
            gps_model = new THREE.Mesh(geometry, modelMaterial);

            gps_model.scale.set(2.5, 2.5, 2.5);
            // TODO This should depend on the selected drone model
            gps_model.position.set(0, 0, 27);
            gps_model.rotation.y = 3 * Math.PI / 2

            scene.add(gps_model);

            self.render3D();
        }, function() { console.log("Couldn't load model file", arguments)});

    }, function() { console.log("Couldn't load model file", arguments)});

    // stationary camera
    camera = new THREE.PerspectiveCamera(50, wrapper.width() / wrapper.height(), 1, 10000);

    // some light
    light = new THREE.AmbientLight(0x404040);
    light2 = new THREE.DirectionalLight(new THREE.Color(1, 1, 1), 1.5);
    light2.position.set(0, 1, 0);

    // move camera away from the model
    camera.position.z = 0;
    camera.position.y = 50;
    camera.position.x = -90;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // add camera, model, light to the foreground scene
    scene.add(light);
    scene.add(light2);
    scene.add(camera);

    this.render3D = function () {
        if (!model || !gps_model) {
            return;
        }

        gps_model.rotation.set(THREE.Math.degToRad(self.alignmentConfig.pitch), THREE.Math.degToRad(-180-self.alignmentConfig.yaw), THREE.Math.degToRad(self.alignmentConfig.roll), 'YXZ');

        // draw
        renderer.render(scene, camera);
    };

    // handle canvas resize
    this.resize3D = function () {
        renderer.setSize(wrapper.width() * 2, wrapper.height() * 2);
        camera.aspect = wrapper.width() / wrapper.height();
        camera.updateProjectionMatrix();

        self.render3D();
    };

    $(window).on('resize', this.resize3D);

    this.render3D()
};


TABS.magnetometer.cleanup = function (callback) {
    $(window).off('resize', this.resize3D);

    if (callback) callback();
};
