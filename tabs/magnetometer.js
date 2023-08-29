'use strict';
/*global chrome,GUI,BOARD_ALIGNMENT,TABS,nwdialog,$*/

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

    self.pageElements = {};
    self.isSavePreset = true;
    self.showMagnetometer = true;
    //========================
    // Load chain
    // =======================
    var loadChainer = new MSPChainerClass();

    var loadChain = [
        mspHelper.loadMixerConfig,
        mspHelper.loadBoardAlignment,
        mspHelper.loadSensorAlignment,
        // Pitch and roll must be inverted
        function (callback) {
            mspHelper.getSetting("align_mag_roll").then(function (data) {
                self.alignmentConfig.roll = parseInt(data.value, 10) / 10;
            }).then(callback)
        },
        function (callback) {
            mspHelper.getSetting("align_mag_pitch").then(function (data) {
                self.alignmentConfig.pitch = (parseInt(data.value, 10) / 10) - 180;
            }).then(callback)
        },
        function (callback) {
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
        function (callback) {
            if (self.isSavePreset)
                mspHelper.setSetting("align_mag_roll", 0, callback);
            else
                mspHelper.setSetting("align_mag_roll", self.alignmentConfig.roll * 10, callback);
        },
        function (callback) {
            if (self.isSavePreset)
                mspHelper.setSetting("align_mag_pitch", 0, callback);
            else
                mspHelper.setSetting("align_mag_pitch", (180 + self.alignmentConfig.pitch) * 10, callback);

        },
        function (callback) {
            if (self.isSavePreset)
                mspHelper.setSetting("align_mag_yaw", 0, callback);
            else
                mspHelper.setSetting("align_mag_yaw", self.alignmentConfig.yaw * 10, callback);
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

    function generateRange(min, max, step) {
        const arr = [];
        for (var i = min; i <= max; i += step) {
            arr.push(i)
        }
        return arr;
    }

    /*
    Returns pitch, roll and yaw in degree by the id of a preset.
    Degree are the ones used in the slider
     */
    function getAxisDegreeWithPreset(selectedPreset) {
        switch (selectedPreset) {
            case 1: //CW0_DEG = 1
                return [180, 0, 0];
            case 2: //CW90_DEG = 2
                return [180, 0, 90];
            case 3: //CW180_DEG = 3
                return [180, 0, 180];
            case 4: //CW270_DEG = 4
                return [180, 0, 270];
            case 5: //CW0_DEG_FLIP = 5
                return [0, 0, 0];
            case 6: //CW90_DEG_FLIP = 5
                return [0, 0, 90];
            case 7: //CW180_DEG_FLIP = 5
                return [0, 0, 180];
            case 0: //ALIGN_DEFAULT = 0
            case 8: //CW270_DEG_FLIP = 5
            default://If not recognized, returns defualt
                return [0, 0, 270];
        }
    }

    function isUsingAPreset() {
        return self.alignmentConfig.pitch === -180 && self.alignmentConfig.roll === 0 && self.alignmentConfig.yaw === 0
    }

    //Called when roll values change
    function updateRollAxis(value) {
        self.alignmentConfig.roll = Number(value);
        self.pageElements.roll_slider.val(self.alignmentConfig.roll);
        self.pageElements.orientation_mag_roll.val(self.alignmentConfig.roll);
        self.render3D();
    }

    //Called when pitch values change
    function updatePitchAxis(value) {
        self.alignmentConfig.pitch = Number(value);
        self.pageElements.pitch_slider.val(self.alignmentConfig.pitch);
        self.pageElements.orientation_mag_pitch.val(self.alignmentConfig.pitch);
        self.render3D();
    }

    //Called when yaw values change
    function updateYawAxis(value) {
        self.alignmentConfig.yaw = Number(value);
        self.pageElements.yaw_slider.val(self.alignmentConfig.yaw);
        self.pageElements.orientation_mag_yaw.val(self.alignmentConfig.yaw);
        self.render3D();
    }

    //Called when a preset is selected
    function presetUpdated(degrees) {
        self.isSavePreset = true;
        self.pageElements.orientation_mag_e.css("opacity", 1);
        updatePitchAxis(degrees[0]);
        updateRollAxis(degrees[1]);
        updateYawAxis(degrees[2]);
    }


    function process_html() {
        localize();

        // initialize 3D
        self.initialize3D();

        let alignments = FC.getSensorAlignments();
        self.pageElements.orientation_mag_e = $('select.magalign');
        self.pageElements.orientation_mag_roll = $('#alignRoll');
        self.pageElements.orientation_mag_pitch = $('#alignPitch');
        self.pageElements.orientation_mag_yaw = $('#alignYaw');
        self.pageElements.roll_slider = $('#roll_slider');
        self.pageElements.pitch_slider = $('#pitch_slider');
        self.pageElements.yaw_slider = $('#yaw_slider');

        for (i = 0; i < alignments.length; i++) {
            self.pageElements.orientation_mag_e.append('<option value="' + (i + 1) + '">' + alignments[i] + '</option>');
        }
        self.pageElements.orientation_mag_e.val(SENSOR_ALIGNMENT.align_mag);

        if (isUsingAPreset()) {
            //If using a preset, checking if custom values are equal to 0
            //Update the slider, but don't save the value until they will be not modified.
            const degrees = getAxisDegreeWithPreset(SENSOR_ALIGNMENT.align_mag);
            presetUpdated(degrees);
        }
        else {
            updateRollAxis(self.alignmentConfig.roll);
            updatePitchAxis(self.alignmentConfig.pitch);
            updateYawAxis(self.alignmentConfig.yaw);
            self.pageElements.orientation_mag_e.css("opacity", 0.5);
        }

        const elementToShow = $("#element_to_show");
        elementToShow.change(function () {
            const value = parseInt($(this).val());
            self.showMagnetometer = (value == 0);
            self.render3D();
        });

        function clamp(input, min, max) {
            return Math.min(Math.max(parseInt($(input).val()), min), max);
        }

        self.pageElements.orientation_mag_e.change(function () {
            SENSOR_ALIGNMENT.align_mag = parseInt($(this).val());
            const degrees = getAxisDegreeWithPreset(SENSOR_ALIGNMENT.align_mag);
            presetUpdated(degrees);
        });

        self.pageElements.orientation_mag_roll.change(function () {
            self.isSavePreset = false;
            self.pageElements.orientation_mag_e.css("opacity", 0.5);
            updateRollAxis(clamp(this, -180, 180));
        });

        self.pageElements.orientation_mag_pitch.change(function () {
            self.isSavePreset = false;
            self.pageElements.orientation_mag_e.css("opacity", 0.5);
            updatePitchAxis(clamp(this, -180, 180));

        });

        self.pageElements.orientation_mag_yaw.change(function () {
            self.isSavePreset = false;
            self.pageElements.orientation_mag_e.css("opacity", 0.5);
            updateYawAxis(clamp(this, -180, 360));

        });

        $('a.save').click(function () {
            saveChainer.execute()
        });

        self.pageElements.roll_slider.noUiSlider({
            start: [self.alignmentConfig.roll],
            range: {
                'min': [-180],
                'max': [180]
            },
            step: 1,
        });
        self.pageElements.roll_slider.noUiSlider_pips({
            mode: 'values',
            values: generateRange(-180, 180, 15),
            density: 4,
            stepped: true
        });

        self.pageElements.pitch_slider.noUiSlider({
            start: [self.alignmentConfig.pitch],
            range: {
                'min': [-180],
                'max': [180]
            },
            step: 1,
        });
        self.pageElements.pitch_slider.noUiSlider_pips({
            mode: 'values',
            values: generateRange(-180, 180, 15),
            density: 4,
            stepped: true
        });

        self.pageElements.yaw_slider.noUiSlider({
            start: [self.alignmentConfig.yaw],
            range: {
                'min': [-180],
                'max': [360]
            },
            step: 45,
        });
        self.pageElements.yaw_slider.noUiSlider_pips({
            mode: 'values',
            values: generateRange(-180, 360, 45),
            density: 4,
            stepped: true
        });

        self.pageElements.pitch_slider.Link('lower').to((e) => {
            updatePitchAxis(e);
        });
        self.pageElements.roll_slider.Link('lower').to((e) => {
            updateRollAxis(e);
        });
        self.pageElements.yaw_slider.Link('lower').to((e) => {
            updateYawAxis(e);
        });

        self.pageElements.pitch_slider.change((e) => {
            self.isSavePreset = false;
            self.pageElements.orientation_mag_e.css("opacity", 0.5);
        });
        self.pageElements.roll_slider.change((e) => {
            self.isSavePreset = false;
            self.pageElements.orientation_mag_e.css("opacity", 0.5);
        });
        self.pageElements.yaw_slider.change((e) => {
            self.isSavePreset = false;
            self.pageElements.orientation_mag_e.css("opacity", 0.5);
        });

        GUI.content_ready(callback);
    }

};


TABS.magnetometer.initialize3D = function () {

    var self = this,
        canvas,
        renderer,
        wrapper,
        modelWrapper,
        model_file,
        camera,
        scene,
        gps,
        xyz,
        fc,
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
    }
    else {
        renderer = new THREE.CanvasRenderer({canvas: canvas.get(0), alpha: true});
    }
    // initialize render size for current canvas size
    renderer.setSize(wrapper.width() * 2, wrapper.height() * 2);


    // modelWrapper adds an extra axis of rotation to avoid gimbal lock with the euler angles
    modelWrapper = new THREE.Object3D();

    // load the model including materials
    if (useWebGlRenderer) {
        if (MIXER_CONFIG.appliedMixerPreset === -1) {
            model_file = 'custom';
            GUI_control.prototype.log("<span style='color: red; font-weight: bolder'><strong>" + chrome.i18n.getMessage("mixerNotConfigured") + "</strong></span>");
        }
        else {
            model_file = helper.mixer.getById(MIXER_CONFIG.appliedMixerPreset).model;
        }
    }
    else {
        model_file = 'fallback'
    }

    // Temporary workaround for 'custom' model until akfreak's custom model is merged.
    if (model_file == 'custom') {
        model_file = 'fallback';
    }

    this.render3D = function () {

        if (!gps || !xyz || !fc)
            return;

        gps.visible = self.showMagnetometer;
        xyz.visible = !self.showMagnetometer;
        fc.visible = true;

        var magRotation = new THREE.Euler(-THREE.Math.degToRad(self.alignmentConfig.pitch), THREE.Math.degToRad(-180 - self.alignmentConfig.yaw), THREE.Math.degToRad(self.alignmentConfig.roll), 'YXZ'); 
        var matrix = (new THREE.Matrix4()).makeRotationFromEuler(magRotation);

        var boardRotation = new THREE.Euler( THREE.Math.degToRad( -BOARD_ALIGNMENT.pitch / 10.0 ), THREE.Math.degToRad( -BOARD_ALIGNMENT.yaw / 10.0 ), THREE.Math.degToRad( -BOARD_ALIGNMENT.roll / 10.0 ), 'YXZ');
        var matrix1 = (new THREE.Matrix4()).makeRotationFromEuler(boardRotation);
 
        matrix.multiply(matrix1);

        gps.rotation.setFromRotationMatrix(matrix);
        xyz.rotation.setFromRotationMatrix(matrix);
        fc.rotation.setFromRotationMatrix(matrix1);

        // draw
        if (camera != null)
            renderer.render(scene, camera);
    };

    // handle canvas resize
    this.resize3D = function () {
        renderer.setSize(wrapper.width() * 2, wrapper.height() * 2);
        camera.aspect = wrapper.width() / wrapper.height();
        camera.updateProjectionMatrix();

        this.render3D();
    };

    $(window).on('resize', this.resize3D);

    let getDistanceByModelName = function (name) {
        switch (name) {
            case "quad_x":
                return [0, 0, 3];
            case "quad_vtail":
                return [0, 0, 4.5];
            case "quad_atail":
                return [0, 0, 5];
            case "y4":
            case "y6":
            case "tricopter":
                return [0, 1.4, 0];
            case "hex_x":
            case "hex_plus":
                return [0, 2, 0];
            case "flying_wing":
            case "rudderless_plane":
            case "twin_plane":
            case "vtail_plane":
            case "vtail_single_servo_plane":
                return [0, 1.6, 0];
            case "fallback":
            default:
                return [0, 2.5, 0];

        }
    };

    // setup scene
    scene = new THREE.Scene();

    // stationary camera
    camera = new THREE.PerspectiveCamera(50, wrapper.width() / wrapper.height(), 1, 10000);
    camera.position.set(-95, 82, 50);
    let controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.update();
    controls.addEventListener( 'change', this.render3D );

    // some light
    const light = new THREE.AmbientLight(0x808080);
    const light2 = new THREE.DirectionalLight(new THREE.Color(1, 1, 1), 1);
    const light3 = new THREE.DirectionalLight(new THREE.Color(1, 1, 1), 1);
    light2.position.set(0, 1, 0);
    light3.position.set(0, -1, 0);

    // add camera, model, light to the foreground scene
    scene.add(light);
    scene.add(light2);
    scene.add(light3);
    scene.add(camera);
    scene.add(modelWrapper);

    //Load the models
    const manager = new THREE.LoadingManager();
    const loader = new THREE.GLTFLoader(manager);

    //Load the UAV model
    loader.load('./resources/models/' + model_file + '.gltf', (obj) => {
        const model = obj.scene;
        const scaleFactor = 15;
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);
        modelWrapper.add(model);

        const gpsOffset = getDistanceByModelName(model_file);

        //Load the GPS model
        loader.load('./resources/models/gps.gltf', (obj) => {
            gps = obj.scene;
            const scaleFactor = 0.04;
            gps.scale.set(scaleFactor, scaleFactor, scaleFactor);
            gps.position.set(gpsOffset[0], gpsOffset[1] + 0.5, gpsOffset[2]);
            gps.traverse(child => {
                if (child.material) child.material.metalness = 0;
            });
            gps.rotation.y = 3 * Math.PI / 2;
            model.add(gps);
            this.resize3D();
        });

        //Load the XYZ model
        loader.load('./resources/models/xyz.gltf', (obj) => {
            xyz = obj.scene;
            const scaleFactor = 0.04;
            xyz.scale.set(scaleFactor, scaleFactor, scaleFactor);
            xyz.position.set(gpsOffset[0], gpsOffset[1] + 0.5, gpsOffset[2]);
            xyz.rotation.y = 3 * Math.PI / 2;
            model.add(xyz);
            this.render3D();
        });

        //Load the FC model
        loader.load('./resources/models/fc.gltf', (obj) => {
            fc = obj.scene;
            const scaleFactor = 0.04;
            fc.scale.set(scaleFactor, scaleFactor, scaleFactor);
            fc.position.set(gpsOffset[0], gpsOffset[1] - 0.5, gpsOffset[2]);
            fc.rotation.y = 3 * Math.PI / 2;
            model.add(fc);
            this.render3D();
        });

    });
    this.render3D();
    this.resize3D();
};


TABS.magnetometer.cleanup = function (callback) {
    $(window).off('resize', this.resize3D);

    if (callback) callback();
};
