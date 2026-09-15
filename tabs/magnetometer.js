'use strict';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import noUiSlider from 'nouislider';

import MSPChainerClass from './../js/msp/MSPchainer';
import MSP from './../js/msp';
import MSPCodes from './../js/msp/MSPCodes';
import mspHelper from './../js/msp/MSPHelper';
import FC from './../js/fc';
import BitHelper from './../js/bitHelper';
import GUI from './../js/gui';
import i18n from './../js/localization';
import { mixer } from './../js/model';
import interval from './../js/intervals';
import jBox from 'jbox';
import {
    rad2degrees,
    buildRotationMatrix,
    applyRotation,
    calculateRawFromTransformed,
    vecCross,
    vecNormalize,
    vecSquaredDistance,
    findBestBoardAlignment,
    computeCompassYaw,
} from './../js/boardAlignmentMath';

const magnetometerTab = {};


magnetometerTab.initialize = function (callback) {
    var self = this;

    var modal;
    var heading_flat;

    // Gates verbose per-step tracing (raw vectors, intermediate transforms) from the
    // board/compass auto-align wizard. Flip to true when debugging a hardware issue.
    const DEBUG_ALIGN = false;

    if (GUI.active_tab !== this) {
        GUI.active_tab = this;
    }

    self.alignmentConfig = {
        pitch: 0,
        roll: 0,
        yaw: 0
    };

    self.boardAlignmentConfig = {
        pitch: 0,
        roll: 0,
        yaw: 0
    };

    self.pageElements = {};
    self.isSavePreset = true;
    self.elementToShow = 0;
    //========================
    // Load chain
    // =======================
    var loadChainer = new MSPChainerClass();

    var loadChain = [
        mspHelper.loadMixerConfig,
        mspHelper.loadBoardAlignment,
        // Needed by accAutoAlignButton's step-1 FC.getMagnetometerCalibrated() check --
        // without this, opening this tab directly (without having visited Calibration
        // first) leaves FC.CALIBRATION_DATA null.
        mspHelper.loadCalibrationData,
        function (callback) {
            self.boardAlignmentConfig.pitch = Math.round(FC.BOARD_ALIGNMENT.pitch / 10);
            self.boardAlignmentConfig.roll = Math.round(FC.BOARD_ALIGNMENT.roll / 10);
            self.boardAlignmentConfig.yaw = Math.round(FC.BOARD_ALIGNMENT.yaw / 10);
            self.boardAlignmentConfig.saved_pitch = Math.round(FC.BOARD_ALIGNMENT.pitch / 10);
            self.boardAlignmentConfig.saved_roll = Math.round(FC.BOARD_ALIGNMENT.roll / 10);
            self.boardAlignmentConfig.saved_yaw = Math.round(FC.BOARD_ALIGNMENT.yaw / 10);
            callback();
        },
        mspHelper.loadSensorAlignment,
        // Pitch and roll must be inverted
        function (callback) {
            mspHelper.getSetting("align_mag_roll").then(function (data) {
                if (data == null) {
                    console.warn("while setting align_mag_roll, data is null or undefined");
                    return Promise.resolve();
                }
                self.alignmentConfig.roll = parseInt(data.value, 10) / 10;
            }).then(callback).catch(err => {
                console.error('Failed to get align_mag_roll:', err);
                callback();
            });
        },
        function (callback) {
            mspHelper.getSetting("align_mag_pitch").then(function (data) {
                if (data == null) {
                    console.warn("while setting align_mag_pitch, data is null or undefined");
                    return Promise.resolve();
                }
                self.alignmentConfig.pitch = parseInt(data.value, 10) / 10;
            }).then(callback).catch(err => {
                console.error('Failed to get align_mag_pitch:', err);
                callback();
            });
        },
        function (callback) {
            mspHelper.getSetting("align_mag_yaw").then(function (data) {
                if (data == null) {
                    console.warn("while setting align_mag_yaw, data is null or undefined");
                    return Promise.resolve();
                }
                self.alignmentConfig.yaw = parseInt(data.value, 10) / 10;
            }).then(callback).catch(err => {
                console.error('Failed to get align_mag_yaw:', err);
                callback();
            });
        }
    ];

    loadChainer.setChain(loadChain);
    loadChainer.setExitPoint(load_html);
    loadChainer.execute();

    function areAnglesZero() {
        return self.alignmentConfig.pitch === 0 && self.alignmentConfig.roll === 0 && self.alignmentConfig.yaw === 0;
    }

    function isBoardAlignmentZero() {
        return (self.boardAlignmentConfig.pitch == 0 ) && (self.boardAlignmentConfig.roll == 0 ) && (self.boardAlignmentConfig.yaw == 0);
    }

    //========================
    // Save chain
    // =======================
    var saveChainer = new MSPChainerClass();

    var saveChain = [
        function (callback) {
            FC.BOARD_ALIGNMENT.pitch = self.boardAlignmentConfig.pitch * 10;
            FC.BOARD_ALIGNMENT.roll = self.boardAlignmentConfig.roll * 10;
            FC.BOARD_ALIGNMENT.yaw = self.boardAlignmentConfig.yaw * 10;
            callback();
        },
        mspHelper.saveBoardAlignment,
        // Magnetometer alignment
        function (callback) {
            let orientation_mag_e = $('select.magalign');
            FC.SENSOR_ALIGNMENT.align_mag = parseInt(orientation_mag_e.val());
            callback();
        },
        mspHelper.saveSensorAlignment,
        // Pitch/Roll/Yaw
        // Pitch and roll must be inverted - ???
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
                mspHelper.setSetting("align_mag_pitch", self.alignmentConfig.pitch * 10, callback);

        },
        function (callback) {
            if (self.isSavePreset)
                mspHelper.setSetting("align_mag_yaw", 0, callback);
            else {
                var fix = 0;
                if ( areAnglesZero() )  {
                    fix = 1;  //if all angles are 0, then we have to save yaw = 1 (0.1 deg) to enforce usage of angles, not a usage of preset
                }
                mspHelper.setSetting("align_mag_yaw", self.alignmentConfig.yaw * 10 + fix, callback);
            }
        },
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
        GUI.handleReconnect($('.tab_magnetometer a'));
    }

    function load_html() {
        import('./magnetometer.html?raw').then(({default: html}) => GUI.load(html, process_html));
    }

    function generateRange(min, max, step) {
        const arr = [];
        for (var i = min; i <= max; i += step) {
            arr.push(i)
        }
        return arr;
    }

    function toUpperRange(input, max) {
        if (!Number.isFinite(input)) return 0;
        while (input > max) input -= 360;
        while (input + 360 <= max) input += 360;
        return input;
    }

    /*
    Returns pitch, roll and yaw in degree by the id of a preset.
    Degree are the ones used in the slider
     */
    function getAxisDegreeWithPreset(selectedPreset) {
        //pitch, roll, yaw
        switch (selectedPreset) {
            case 1: //CW0_DEG = 1
                return [0, 0, 0];
            case 2: //CW90_DEG = 2
                return [0, 0, 90];
            case 3: //CW180_DEG = 3
                return [0, 0, 180];
            case 4: //CW270_DEG = 4
                return [0, 0, 270];
            case 5: //CW0_DEG_FLIP = 5
                return [180, 0, 0];
            case 6: //CW90_DEG_FLIP = 5
                return [180, 0, 90];
            case 7: //CW180_DEG_FLIP = 5
                return [180, 0, 180];
            case 0: //ALIGN_DEFAULT = 0
            case 8: //CW270_DEG_FLIP = 5
            default://If not recognized, returns default
                return [180, 0, 270];
        }
    }

    function getAxisDegreeWithPresetAndBoardOrientation(selectedPreset) {
        var degree = getAxisDegreeWithPreset(selectedPreset);

        if (isBoardAlignmentZero()) {
           return degree;
        } 

        //degree[0] - pitch
        //degree[1] - roll
        //degree[2] - yaw
        //-(pitch-180), -180 - yaw, roll
        var magRotation = new THREE.Euler(-THREE.MathUtils.degToRad(degree[0]-180), THREE.MathUtils.degToRad(-180 - degree[2]), THREE.MathUtils.degToRad(degree[1]), 'YXZ'); 
        var matrix = (new THREE.Matrix4()).makeRotationFromEuler(magRotation);

        var boardRotation = new THREE.Euler( THREE.MathUtils.degToRad( self.boardAlignmentConfig.pitch ), THREE.MathUtils.degToRad( -self.boardAlignmentConfig.yaw ), THREE.MathUtils.degToRad( self.boardAlignmentConfig.roll ), 'YXZ');
        var matrix1 = (new THREE.Matrix4()).makeRotationFromEuler(boardRotation);

        matrix.premultiply(matrix1);  

        var euler = new THREE.Euler();
        euler.setFromRotationMatrix(matrix, 'YXZ');

        var pitch = toUpperRange( Math.round( THREE.MathUtils.radToDeg(-euler.x)) + 180, 180 );
        var yaw = toUpperRange( Math.round( -180 - THREE.MathUtils.radToDeg(euler.y)), 359 );
        var roll = toUpperRange( Math.round( THREE.MathUtils.radToDeg(euler.z)), 180 );

        return [pitch, roll, yaw];
    }

    function updateMagOrientationWithPreset() {
        if (self.isSavePreset) {
            const degrees = getAxisDegreeWithPresetAndBoardOrientation(FC.SENSOR_ALIGNMENT.align_mag);
            presetUpdated(degrees);
        }
    }

    let _settingSlider = false;

    function updateFCCliString() {
        var s = " align_board_roll=" + (self.boardAlignmentConfig.roll * 10) +  
                " align_board_pitch=" + (self.boardAlignmentConfig.pitch * 10) + 
                " align_board_yaw=" + (self.boardAlignmentConfig.yaw * 10);
        self.pageElements.cli_settings_fc.text(s);
    }

    function updateBoardRollAxis(value) {
        if (value == null) {
            console.log("in updateBoardRollAxis, value is null or undefined");
            return;
        }

        self.boardAlignmentConfig.roll = Number(value);
        if (self.pageElements.board_roll_slider[0].noUiSlider && !_settingSlider) { _settingSlider = true; self.pageElements.board_roll_slider[0].noUiSlider.set(self.boardAlignmentConfig.roll); _settingSlider = false; }
        self.pageElements.orientation_board_roll.val(self.boardAlignmentConfig.roll);
        updateMagOrientationWithPreset();
        updateFCCliString();
        self.render3D();
    }

    function updateBoardPitchAxis(value) {
        self.boardAlignmentConfig.pitch = Number(value);
        if (self.pageElements.board_pitch_slider[0].noUiSlider && !_settingSlider) { _settingSlider = true; self.pageElements.board_pitch_slider[0].noUiSlider.set(self.boardAlignmentConfig.pitch); _settingSlider = false; }
        self.pageElements.orientation_board_pitch.val(self.boardAlignmentConfig.pitch);
        updateMagOrientationWithPreset();
        updateFCCliString();
        self.render3D();
    }

    function updateBoardYawAxis(value) {
        self.boardAlignmentConfig.yaw = Number(value);
        if (self.pageElements.board_yaw_slider[0].noUiSlider && !_settingSlider) { _settingSlider = true; self.pageElements.board_yaw_slider[0].noUiSlider.set(self.boardAlignmentConfig.yaw); _settingSlider = false; }
        self.pageElements.orientation_board_yaw.val(self.boardAlignmentConfig.yaw);
        updateMagOrientationWithPreset();
        updateFCCliString();
        self.render3D();
    }
    
    function updateMagCliString() {
        var fix = 0;
        if ( areAnglesZero() )  {
            fix = 1;  //if all angles are 0, then we have to save yaw = 1 (0.1 deg) to enforce usage of angles, not a usage of preset
        }
		var names = ['DEFAULT', 'CW0', 'CW90', 'CW180', 'CW270', 'CW0FLIP', 'CW90FLIP', 'CW180FLIP', 'CW270FLIP'];
        var s = "align_mag=" + names[FC.SENSOR_ALIGNMENT.align_mag] +  
                " align_mag_roll=" + (self.isSavePreset ? 0 : self.alignmentConfig.roll * 10) +  
                " align_mag_pitch=" + (self.isSavePreset ? 0 : self.alignmentConfig.pitch * 10) + 
                " align_mag_yaw=" + (self.isSavePreset ? 0 : self.alignmentConfig.yaw * 10 + fix);
        self.pageElements.cli_settings_mag.text(s);
        self.pageElements.comment_sensor_mag_preset.css("display", !self.isSavePreset ? "none" : "");
        self.pageElements.comment_sensor_mag_angles.css("display", self.isSavePreset ? "none" : "");
    }

    //Called when roll values change
    function updateRollAxis(value) {
        self.alignmentConfig.roll = Number(value);
        if (self.pageElements.roll_slider[0].noUiSlider && !_settingSlider) { _settingSlider = true; self.pageElements.roll_slider[0].noUiSlider.set(self.alignmentConfig.roll); _settingSlider = false; }
        self.pageElements.orientation_mag_roll.val(self.alignmentConfig.roll);
        updateMagCliString();
        self.render3D();
    }

    //Called when pitch values change
    function updatePitchAxis(value) {
        self.alignmentConfig.pitch = Number(value);
        if (self.pageElements.pitch_slider[0].noUiSlider && !_settingSlider) { _settingSlider = true; self.pageElements.pitch_slider[0].noUiSlider.set(self.alignmentConfig.pitch); _settingSlider = false; }
        self.pageElements.orientation_mag_pitch.val(self.alignmentConfig.pitch);
        updateMagCliString();
        self.render3D();
    }

    //Called when yaw values change
    function updateYawAxis(value) {
        self.alignmentConfig.yaw = Number(value);
        if (self.pageElements.yaw_slider[0].noUiSlider && !_settingSlider) { _settingSlider = true; self.pageElements.yaw_slider[0].noUiSlider.set(self.alignmentConfig.yaw); _settingSlider = false; }
        self.pageElements.orientation_mag_yaw.val(self.alignmentConfig.yaw);
        updateMagCliString();
        self.render3D();
    }

    function enableSavePreset() {
        self.isSavePreset = true;
        self.pageElements.orientation_mag_e.css("opacity", 1);
        self.pageElements.orientation_mag_e.css("text-decoration", "");
        self.pageElements.align_mag_xxx_e.css("opacity", "0.65");
        self.pageElements.align_mag_xxx_e.css("text-decoration", "line-through");
    }

    function disableSavePreset() {
        self.isSavePreset = false;
        self.pageElements.orientation_mag_e.css("opacity", 0.5);
        self.pageElements.orientation_mag_e.css("text-decoration", "line-through");
        self.pageElements.align_mag_xxx_e.css("opacity", "1");
        self.pageElements.align_mag_xxx_e.css("text-decoration", "");
    }


    //Called when a preset is selected
    function presetUpdated(degrees) {
        enableSavePreset();
        updatePitchAxis(degrees[0]);
        updateRollAxis(degrees[1]);
        updateYawAxis(degrees[2]);
        updateMagCliString();
    }


    function process_html() {

       i18n.localize();;

        // initialize 3D
        self.initialize3D();

        let alignments = FC.getSensorAlignments();

        self.pageElements.orientation_board_roll = $('#boardAlignRoll');
        self.pageElements.orientation_board_pitch = $('#boardAlignPitch');
        self.pageElements.orientation_board_yaw = $('#boardAlignYaw');
        self.pageElements.board_roll_slider = $('#board_roll_slider');
        self.pageElements.board_pitch_slider = $('#board_pitch_slider');
        self.pageElements.board_yaw_slider = $('#board_yaw_slider');

        self.pageElements.orientation_mag_e = $('select.magalign');
        self.pageElements.orientation_mag_roll = $('#alignRoll');
        self.pageElements.orientation_mag_pitch = $('#alignPitch');
        self.pageElements.orientation_mag_yaw = $('#alignYaw');
        self.pageElements.roll_slider = $('#roll_slider');
        self.pageElements.pitch_slider = $('#pitch_slider');
        self.pageElements.yaw_slider = $('#yaw_slider');

        self.pageElements.align_mag_xxx_e = $('#align_mag_xxx');

        self.pageElements.cli_settings_fc = $('#cli_settings_fc');
        self.pageElements.cli_settings_mag = $('#cli_settings_mag');

        self.pageElements.comment_sensor_mag_preset = $('#comment_sensor_mag_preset');
        self.pageElements.comment_sensor_mag_angles = $('#comment_sensor_mag_angles');

        self.roll_e = $('dd.roll'),
        self.pitch_e = $('dd.pitch'),
        self.heading_e = $('dd.heading');

        for (let i = 0; i < alignments.length; i++) {
            self.pageElements.orientation_mag_e.append('<option value="' + (i + 1) + '">' + alignments[i] + '</option>');
        }
        self.pageElements.orientation_mag_e.val(FC.SENSOR_ALIGNMENT.align_mag);

        if (areAnglesZero()) {
            //If using a preset, checking if custom values are equal to 0
            //Update the slider, but don't save the value until they will be not modified.
            const degrees = getAxisDegreeWithPresetAndBoardOrientation(FC.SENSOR_ALIGNMENT.align_mag);
            presetUpdated(degrees);
        }
        else {
            updateRollAxis(self.alignmentConfig.roll);
            updatePitchAxis(self.alignmentConfig.pitch);
            updateYawAxis(self.alignmentConfig.yaw);
            disableSavePreset();
        }


        self.pageElements.orientation_board_roll.on('change', function () {
            updateBoardRollAxis(clamp(this, -180, 360));
        });

        self.pageElements.orientation_board_pitch.on('change', function () {
            updateBoardPitchAxis(clamp(this, -180, 360));
        });

        self.pageElements.orientation_board_yaw.on('change', function () {
            updateBoardYawAxis(clamp(this, -180, 360));
        });

        noUiSlider.create(self.pageElements.board_roll_slider[0], {
            start: [self.boardAlignmentConfig.roll],
            range: {
                'min': [-180],
                'max': [360]
            },
            step: 1,
            pips: {
                mode: 'values',
                values: generateRange(-180, 360, 45),
                density: 4,
                stepped: true
            }
        });

        noUiSlider.create(self.pageElements.board_pitch_slider[0], {
            start: [self.boardAlignmentConfig.pitch],
            range: {
                'min': [-180],
                'max': [360]
            },
            step: 1,
            pips: {
                mode: 'values',
                values: generateRange(-180, 360, 45),
                density: 4,
                stepped: true
            }
        });

        noUiSlider.create(self.pageElements.board_yaw_slider[0], {
            start: [self.boardAlignmentConfig.yaw],
            range: {
                'min': [-180],
                'max': [360]
            },
            step: 1,
            pips: {
                 mode: 'values',
                values: generateRange(-180, 360, 45),
                density: 4,
                stepped: true
            }
        });

        
        self.pageElements.board_pitch_slider[0].noUiSlider.on('update', (values, handle) =>  {
            if (!_settingSlider) { _settingSlider = true; updateBoardPitchAxis(values[handle]); _settingSlider = false; }
        });
        self.pageElements.board_roll_slider[0].noUiSlider.on('update', (values, handle) =>  {
            if (!_settingSlider) { _settingSlider = true; updateBoardRollAxis(values[handle]); _settingSlider = false; }
        });
        self.pageElements.board_yaw_slider[0].noUiSlider.on('update', (values, handle) =>  {
            if (!_settingSlider) { _settingSlider = true; updateBoardYawAxis(values[handle]); _settingSlider = false; }
        });
        

        const elementToShow = $("#element_to_show");
        elementToShow.on('change', function () {
            const value = parseInt($(this).val());
            self.elementToShow = value;
            self.render3D();
        });

        function clamp(input, min, max) {
            return Math.min(Math.max(parseInt($(input).val()), min), max);
        }

        self.pageElements.orientation_mag_e.on('change', function () {
            FC.SENSOR_ALIGNMENT.align_mag = parseInt($(this).val());
            const degrees = getAxisDegreeWithPresetAndBoardOrientation(FC.SENSOR_ALIGNMENT.align_mag);
            presetUpdated(degrees);
        });

        self.pageElements.orientation_mag_e.on('mousedown', function () {
            const degrees = getAxisDegreeWithPresetAndBoardOrientation(FC.SENSOR_ALIGNMENT.align_mag);
            presetUpdated(degrees);
        });

        self.pageElements.orientation_mag_roll.on('change', function () {
            disableSavePreset();
            updateRollAxis(clamp(this, -180, 360));
        });

        self.pageElements.orientation_mag_pitch.on('change', function () {
            disableSavePreset();
            updatePitchAxis(clamp(this, -180, 360));
        });

        self.pageElements.orientation_mag_yaw.on('change', function () {
            disableSavePreset();
            updateYawAxis(clamp(this, -180, 360));
        });

        // #modal-acc-align-done-save is handled below (close the modal, then save) rather
        // than by this generic handler, so the modal is guaranteed closed before the
        // save/reboot chain runs, regardless of how long that chain takes.
        $('a.save').not('#modal-acc-align-done-save').on('click', function () {
            saveChainer.execute()
        });

        $('#fc-align-start-button').on('click', {"step": "1"}, accAutoAlignButton);
        $('#modal-acc-align-2').on('click', {"step": "2" }, accAutoAlignButton);
        $('#modal-acc-align-3').on('click', {"step": "3" }, accAutoAlignButton);
        $('#modal-acc-align-4').on('click', {"step": "4" }, accAutoAlignButton);

        $('#modal-acc-align-done-save').on('click', function () {
            if (typeof modal != "undefined") {
                modal.close();
            }
            saveChainer.execute();
        });

        noUiSlider.create(self.pageElements.roll_slider[0], {
            start: [self.alignmentConfig.roll],
            range: {
                'min': [-180],
                'max': [360]
            },
            step: 1,
            pips: {
                mode: 'values',
                values: generateRange(-180, 360, 45),
                density: 4,
                stepped: true
                }
        });

        noUiSlider.create(self.pageElements.pitch_slider[0], {
            start: [self.alignmentConfig.pitch],
            range: {
                'min': [-180],
                'max': [360]
            },
            step: 1,
            pips: {
                mode: 'values',
                values: generateRange(-180, 360, 45),
                density: 4,
                stepped: true
            }
        });

        noUiSlider.create(self.pageElements.yaw_slider[0], {
            start: [self.alignmentConfig.yaw],
            range: {
                'min': [-180],
                'max': [360]
            },
            step: 1,
            pips: {
                mode: 'values',
                values: generateRange(-180, 360, 45),
                density: 4,
                stepped: true
            }
        });

        
        self.pageElements.pitch_slider[0].noUiSlider.on('update', (values, handle) =>  {
            if (!_settingSlider) { _settingSlider = true; updatePitchAxis(values[handle]); _settingSlider = false; }
        });
        self.pageElements.roll_slider[0].noUiSlider.on('update', (values, handle) =>  {
            if (!_settingSlider) { _settingSlider = true; updateRollAxis(values[handle]); _settingSlider = false; }
        });
        self.pageElements.yaw_slider[0].noUiSlider.on('update', (values, handle) =>  {
            if (!_settingSlider) { _settingSlider = true; updateYawAxis(values[handle]); _settingSlider = false; }
        });

        self.pageElements.pitch_slider[0].noUiSlider.on('slide', () => {
            disableSavePreset();
        });
        self.pageElements.roll_slider[0].noUiSlider.on('slide', () => {
            disableSavePreset();
        });
        self.pageElements.yaw_slider[0].noUiSlider.on('slide', () => {
            disableSavePreset();
        });
        

        function get_fast_data() {

            MSP.send_message(MSPCodes.MSP_ATTITUDE, false, false, function () {
	            self.roll_e.text(i18n.getMessage('initialSetupAttitude', [FC.SENSOR_DATA.kinematics[0]]));
	            self.pitch_e.text(i18n.getMessage('initialSetupAttitude', [FC.SENSOR_DATA.kinematics[1]]));
                self.heading_e.text(i18n.getMessage('initialSetupAttitude', [FC.SENSOR_DATA.kinematics[2]]));
                self.render3D();
            });
        }

        interval.add('setup_data_pull_fast', get_fast_data, 40);

    // rad2degrees, snap45, buildRotationMatrix, applyRotation, calculateRawFromTransformed,
    // vecCross, vecNormalize, vecSquaredDistance and findBestBoardAlignment now live in
    // js/boardAlignmentMath.js (imported above) -- pure math with no self/DOM/FC
    // dependency, extracted so it's unit-testable (see tests/board-alignment-math.test.mjs).

    function getMagHeading() {
        // MSP2_INAV_MAG_UNALIGNED is calibrated (zero/gain) but NOT alignment-rotated --
        // firmware never applies align_mag or align_board to it. Unlike MSP_RAW_IMU's
        // magnetometer field, there is no rotation to undo here: whatever the current
        // align_mag/align_board settings are, this reading is unaffected by them, which is
        // exactly why the wizard (trying to determine those settings) uses it instead.
        // FC.SENSOR_DATA.magnetometerUnaligned initializes to [0,0,0] and is only ever
        // overwritten by an actual MSP2_INAV_MAG_UNALIGNED response (see startAlignPoll()).
        // If none has arrived yet -- unstable connection, or older firmware that doesn't
        // support this message -- that [0,0,0] would otherwise look like a perfectly valid
        // (and, worse, perfectly *repeatable*) heading of 0 for both wizard readings,
        // silently producing a bogus alignment. Return null instead so callers can bail.
        if (!self.magUnalignedReceived) {
            return null;
        }
        let mag = FC.SENSOR_DATA.magnetometerUnaligned;
        // Must match firmware's own heading convention (atan2(magY, magX) on
        // magADC directly, confirmed against inav2 rotationMatrixRotateVector output on
        // 2026-09-13 hardware test) so heading_flat/heading_east below are directly
        // comparable to what align_mag_yaw needs to produce.
        let magHeading = rad2degrees ( Math.atan2(mag[1], mag[0]) );
        if (DEBUG_ALIGN) console.log("magHeading (unaligned, degrees): " + magHeading.toString());
        return magHeading;
    }

    function showMagNoDataError() {
        console.error("getMagHeading: no MSP2_INAV_MAG_UNALIGNED response received yet");
        resetAlignButtons();
        stopAlignPoll();
        modal = new jBox('Modal', {
            width: 460,
            height: 360,
            animation: false,
            closeOnClick: true,
            content: $('#modal-acc-align-mag-no-data-error')
        }).open();
    }

    // Scoped to the wizard's own modal ids (all prefixed modal-acc-align-) rather than a
    // bare `.modal__button` selector, so this can't reach into some other modal that
    // happens to share the class name.
    function resetAlignButtons() {
        $('[id^="modal-acc-align-"].modal__button, #fc-align-start-button')
            .css({ opacity: '', pointerEvents: '' });
    }

    // Starts/stops the 40ms MSP_RAW_IMU/MSP2_INAV_MAG_UNALIGNED poll the wizard's readings
    // depend on. Started at wizard step 1, and again if the user takes the manual-compass
    // fallback after a board-alignment-only run (that path needs fresh mag data too).
    // Stopped wherever the wizard actually ends -- error-abort modals and both successful
    // completion points -- so it doesn't keep doubling MSP traffic once the user is done
    // with (or has abandoned) the wizard. Not folded into resetAlignButtons() itself, since
    // that's also called at the top of every step (including mid-wizard progression) purely
    // for button visual feedback, and killing the poll there would starve steps 2-4 of data.
    function startAlignPoll() {
        self.magUnalignedReceived = false;
        interval.add('imu_data', function() {
            MSP.send_message(MSPCodes.MSP_RAW_IMU, false, false);
            MSP.send_message(MSPCodes.MSP2_INAV_MAG_UNALIGNED, false, false, function () {
                self.magUnalignedReceived = true;
            });
        }, 40);
    }

    function stopAlignPoll() {
        interval.remove('imu_data');
    }

    function accAutoAlignReadFlat() {
        // Get accelerometer data from MSP_RAW_IMU
        let acc_g_transformed = [...FC.SENSOR_DATA.accelerometer];

        // Check if board already has non-zero alignment
        const hasAlignment = self.boardAlignmentConfig.pitch !== 0 ||
                           self.boardAlignmentConfig.roll !== 0 ||
                           self.boardAlignmentConfig.yaw !== 0;

        let acc_g_flat;
        if (hasAlignment) {
            // MSP_RAW_IMU returns TRANSFORMED data when alignment is set
            // Apply inverse transformation to get true raw sensor readings
            if (DEBUG_ALIGN) {
                console.log("Board has existing alignment - applying inverse transformation");
                console.log("Current alignment: pitch=" + self.boardAlignmentConfig.pitch +
                           "°, roll=" + self.boardAlignmentConfig.roll +
                           "°, yaw=" + self.boardAlignmentConfig.yaw + "°");
            }

            acc_g_flat = calculateRawFromTransformed(
                acc_g_transformed,
                self.boardAlignmentConfig.pitch,
                self.boardAlignmentConfig.roll,
                self.boardAlignmentConfig.yaw
            );
            if (DEBUG_ALIGN) {
                console.log("Transformed data: [" + acc_g_transformed.map(x => x.toFixed(3)).join(", ") + "] g");
                console.log("Raw data (inverse): [" + acc_g_flat.map(x => x.toFixed(3)).join(", ") + "] g");
            }
        } else {
            // No alignment set - data is already raw (INAV optimization at boardalignment.c:100-102)
            acc_g_flat = acc_g_transformed;
            if (DEBUG_ALIGN) console.log("No board alignment - data is raw: [" + acc_g_flat.map(x => x.toFixed(3)).join(", ") + "] g");
        }

        // Check gravity magnitude to ensure valid reading
        let A = Math.sqrt(acc_g_flat[0] ** 2 + acc_g_flat[1] ** 2 + acc_g_flat[2] ** 2);
        if (DEBUG_ALIGN) console.log("Gravity magnitude: " + A.toFixed(3) + "g");

        if (A > 1.15 || A < 0.85) {
            console.error("Gravity magnitude out of range: " + A.toFixed(3) + "g (expected 0.85-1.15g)");
            console.error("This usually means:");
            console.error("  - Board moved during reading");
            console.error("  - Accelerometer needs calibration");
            console.error("  - Board is on an unstable surface");

            resetAlignButtons();
            stopAlignPoll();
            modal = new jBox('Modal', {
                width: 460,
                height: 360,
                animation: false,
                closeOnClick: true,
                content: $('#modal-acc-align-calibration-error')
            }).open();
            return;
        }

        // Calculate pitch and roll from raw accelerometer data
        // Note: Using standard aerospace conventions
        let roll = ( Math.atan2(acc_g_flat[1], acc_g_flat[2]) * 180/Math.PI ) % 360;
        let pitch = ( Math.atan2(-1 * acc_g_flat[0], Math.sqrt(acc_g_flat[1] ** 2 + acc_g_flat[2] ** 2)) * 180/Math.PI ) % 360;
        if (DEBUG_ALIGN) console.log("Calculated attitude: pitch=" + pitch.toFixed(1) + "°, roll=" + roll.toFixed(1) + "°");

        // Snap to the nearest 45 degrees: this is the board's mounting
        // pitch/roll relative to the (level) airframe.
        let roundedPitch = Math.round(pitch / 45) * 45;
        let roundedRoll = Math.round(roll / 45) * 45;

        // BOARD_ALIGNMENT only supports flat (0) or upside-down (180)
        // pitch/roll. Anything else means the board is mounted on edge
        // (sensor Z axis horizontal) or at a non-standard tilt, which this
        // wizard can't resolve.
        if (Math.abs(roundedPitch) % 180 !== 0 || Math.abs(roundedRoll) % 180 !== 0) {
            console.error("Unsupported board orientation: pitch=" + roundedPitch + "°, roll=" + roundedRoll + "°");
            resetAlignButtons();
            stopAlignPoll();
            modal = new jBox('Modal', {
                width: 460,
                height: 360,
                animation: false,
                closeOnClick: true,
                content: $('#modal-acc-align-vertical-error')
            }).open();
            return;
        }

        // Raw (de-rotated) flat-attitude vector, kept for the TRIAD solve in
        // accAutoAlignRead45() -- a single vector reading can't tell a pure
        // roll-180 flip from a pure pitch-180 flip (both read as ~(0,0,-1)g),
        // so roundedPitch/roundedRoll above are NOT the final answer, only a
        // sanity check that the mount is flat-or-upside-down (not on edge).
        self.acc_flat_raw = acc_g_flat;

        heading_flat = getMagHeading();
        if (heading_flat === null) {
            showMagNoDataError();
            return;
        }

        modal = new jBox('Modal', {
            width: 460,
            height: 460,
            animation: false,
            closeOnClick: false,
            content: $('#modal-acc-align-45')
        }).open();
    }



    function accAutoAlignRead45() {
        // Get accelerometer data from MSP_RAW_IMU
        let acc_g_transformed = [...FC.SENSOR_DATA.accelerometer];

        // Check if board already has non-zero alignment
        const hasAlignment = self.boardAlignmentConfig.pitch !== 0 ||
                           self.boardAlignmentConfig.roll !== 0 ||
                           self.boardAlignmentConfig.yaw !== 0;

        let acc_g_45;
        if (hasAlignment) {
            // Apply inverse transformation to get raw sensor data
            if (DEBUG_ALIGN) console.log("Applying inverse transformation for 45° reading");
            acc_g_45 = calculateRawFromTransformed(
                acc_g_transformed,
                self.boardAlignmentConfig.pitch,
                self.boardAlignmentConfig.roll,
                self.boardAlignmentConfig.yaw
            );
            if (DEBUG_ALIGN) console.log("Raw data (45°): [" + acc_g_45.map(x => x.toFixed(3)).join(", ") + "] g");
        } else {
            // No alignment - data is already raw
            acc_g_45 = acc_g_transformed;
        }

        // Check gravity magnitude again
        let A = Math.sqrt(acc_g_45[0] ** 2 + acc_g_45[1] ** 2 + acc_g_45[2] ** 2);
        if (DEBUG_ALIGN) console.log("Gravity magnitude (45°): " + A.toFixed(3) + "g");

        if (A > 1.15 || A < 0.85) {
            console.error("Gravity magnitude out of range at 45°: " + A.toFixed(3) + "g");
            console.error("Board may have moved between readings!");

            resetAlignButtons();
            stopAlignPoll();
            modal = new jBox('Modal', {
                width: 460,
                height: 360,
                animation: false,
                closeOnClick: true,
                content: $('#modal-acc-align-calibration-error')
            }).open();
            return false;
        }

        if (DEBUG_ALIGN) console.log("Raw data (45°, absolute): [" + acc_g_45.map(x => x.toFixed(3)).join(", ") + "] g");

        // A single vector reading (the flat step) can't tell a pure roll-180
        // mount from a pure pitch-180 mount -- both read as ~(0,0,-1)g when
        // level, since gravity alone doesn't constrain rotation about itself.
        // Solve for roll/pitch/yaw jointly using BOTH readings: the flat
        // reading and the known ~45 degree nose-up tilt give two non-parallel
        // vectors, which is enough to fully determine the mounting rotation,
        // independent of whatever alignment is currently configured on the FC.
        const refFlat = [0, 0, 1];
        // Nose-up is NEGATIVE attitude.values.pitch in INAV (see io/osd.c:
        // "attitude.values.pitch > 0 -> SYM_PITCH_DOWN"), so the canonical
        // reading for a correctly-mounted board tilted nose-up 45 degrees has
        // a POSITIVE x-component here (x = -sin(pitch) = -sin(-45) = +sin45).
        const refTilt = [Math.SQRT1_2, 0, Math.SQRT1_2]; // nose-up 45 degrees

        // Cross-product magnitude of two unit vectors is sin(angle between them);
        // 0.3 ~= sin(17°), i.e. reject if the two readings are less than ~17
        // degrees apart -- tight enough to catch "forgot to tilt" while leaving
        // margin below the ~45 degrees this wizard actually asks for.
        const crossMag = Math.sqrt(vecCross(self.acc_flat_raw, acc_g_45).reduce((s, v) => s + v * v, 0));
        if (crossMag < 0.3) {
            console.error("Flat and 45° readings are too similar (cross magnitude " + crossMag.toFixed(3) + ") -- aircraft probably wasn't tilted enough between readings");
            resetAlignButtons();
            stopAlignPoll();
            modal = new jBox('Modal', {
                width: 460,
                height: 360,
                animation: false,
                closeOnClick: true,
                content: $('#modal-acc-align-tilt-error')
            }).open();
            return false;
        }

        const bestAlignment = findBestBoardAlignment(refFlat, refTilt, self.acc_flat_raw, acc_g_45);
        if (DEBUG_ALIGN) {
            console.log("Best-fit board alignment: pitch=" + bestAlignment.pitch + "°, roll=" + bestAlignment.roll +
                       "°, yaw=" + bestAlignment.yaw + "° (fit error " + bestAlignment.err.toFixed(4) + ")");
        }

        // err is a sum of two squared-distance-between-unit-vectors terms; 1.0
        // tolerates roughly 41 degrees of combined error across both readings
        // (comfortably more than expected accelerometer noise) before giving up.
        if (bestAlignment.err > 1.0) {
            console.error("No supported board mount fits these readings well (fit error " + bestAlignment.err.toFixed(4) + ") -- board may be mounted on edge, moved during the test, or tilted at a non-45° angle");
            resetAlignButtons();
            stopAlignPoll();
            modal = new jBox('Modal', {
                width: 460,
                height: 360,
                animation: false,
                closeOnClick: true,
                content: $('#modal-acc-align-vertical-error')
            }).open();
            return false;
        }

        let newPitch = bestAlignment.pitch;
        let newRoll  = bestAlignment.roll;
        let newYaw   = bestAlignment.yaw;

        updateBoardPitchAxis(newPitch);
        updateBoardRollAxis (newRoll);
        updateBoardYawAxis(newYaw);

        $("#modal-acc-align-setting").text(newPitch + ", " + newRoll + ", " + newYaw);
        return true;
    }

    function accAutoAlignCompass() {
        if ( typeof modal != "undefined" ) {
          modal.close();
        }

        // heading_flat was captured at step 2 ("nose north, flat") by accAutoAlignReadFlat().
        // Capture the second raw (unaligned) reading now, at step 4 ("nose east, flat").
        // Both come from getMagHeading(), which reads MSP2_INAV_MAG_UNALIGNED -- unaffected
        // by the current align_mag/align_board settings, unlike FC.SENSOR_DATA.magnetometer.
        let heading_east = getMagHeading();
        if (heading_east === null) {
            showMagNoDataError();
            return;
        }

        // Flip (right-side-up vs upside-down), and the mounting yaw offset itself, are
        // derived in computeCompassYaw() -- see its doc comment in boardAlignmentMath.js
        // for the full explanation and the hardware-validated derivation (two sign bugs
        // were found and fixed here via live testing on 2026-09-13/14).
        const { change, flipped, yawFromNorth, yawFromEast, yawDiff } = computeCompassYaw(heading_flat, heading_east);

        if (DEBUG_ALIGN) {
            console.log("accAutoAlignCompass: heading_flat=" + heading_flat.toFixed(1) +
                        ", heading_east=" + heading_east.toFixed(1) +
                        ", change=" + change.toFixed(1) + ", flipped=" + flipped +
                        ", yawFromNorth=" + yawFromNorth + ", yawFromEast=" + yawFromEast);
        }

        if (yawDiff > 1) {
            console.error("accAutoAlignCompass: north/east yaw estimates disagree (" +
                           yawFromNorth + " vs " + yawFromEast + ") -- ask the user to retry");
            resetAlignButtons();
            stopAlignPoll();
            modal = new jBox('Modal', {
                width: 460,
                height: 360,
                animation: false,
                closeOnClick: true,
                content: $('#modal-acc-align-mag-disagreement-error')
            }).open();
            return;
        }

        // The wizard always produces a specific angle triple, never a "use the preset
        // as-is" result -- without this, isSavePreset stays true (its default/loaded
        // state), and Save silently writes align_mag_roll/pitch/yaw = 0 instead of the
        // values computed below, discarding the wizard's result.
        disableSavePreset();

        // Flip is encoded as pitch=180 (not roll), matching the CW*FLIP presets
        // (getAxisDegreeWithPreset) so the sliders/3D model/CLI string stay consistent
        // with the rest of the tab.
        updateRollAxis(0);
        updateYawAxis(yawFromNorth);
        updatePitchAxis(flipped ? 180 : 0);

        $("#modal-compass-align-setting").text(
                self.alignmentConfig.roll + ", " + self.alignmentConfig.pitch + ", " + self.alignmentConfig.yaw
        );

        stopAlignPoll();
        modal = new jBox('Modal', {
            width: 460,
            height: 360,
            animation: false,
            closeOnClick: false,
            content: $('#modal-acc-align-done')
        }).open();
    }

    function accAutoAlignButton(event) {
        // Visual feedback so a slow step doesn't look unresponsive and invite repeated clicks.
        resetAlignButtons();
        $(event.target).css({ opacity: 0.5, pointerEvents: 'none' });

        var step = event.data.step;

        // Steps: 1 start, 2 craft is flat north, 3 craft is nose up, 4 craft is flat and east
        if ( typeof step == "undefined" ) {
            step = "1";
        }

        if ( typeof modal != "undefined" ) {
          modal.close();
        }


        if (step == "1") {
            // Check compass calibration before the user does any physical positioning, not
            // after -- this flow ends by using the compass (on every board class -- see the
            // step-3 comment below), so there's no point walking through the board-alignment
            // steps first if that's doomed to fail.
            if (BitHelper.bit_check(FC.CONFIG.activeSensors, 2) && !FC.getMagnetometerCalibrated()) {
                resetAlignButtons();
                modal = new jBox('Modal', {
                    width: 460,
                    height: 360,
                    animation: false,
                    closeOnClick: true,
                    content: $('#modal-acc-align-mag-uncalibrated-error')
                }).open();
                return;
            }
            modal = new jBox("Modal", {
                animation: false,
                height: 460,
                width: 500,
                closeOnClick: false,
                content: $("#modal-acc-align-start")
            }).open();
            startAlignPoll();
        }


        else if (step == "2") {
            MSP.send_message(MSPCodes.MSP_CALIBRATION_DATA, false, false, accAutoAlignReadFlat);
        }

        else if (step == "3") {
            if (!accAutoAlignRead45()) {
                return;
            }

            // The "face east" step costs the user one more modal and one more click on an
            // aircraft they're already holding in position -- cheap enough that every board
            // class gets a complete, immediate board+compass result from this one wizard
            // pass, rather than RAM-capable boards being sent off to do a full compass
            // calibration spin (relying on firmware's calibration-time auto-detection, which
            // stays available and unaffected for anyone who skips this wizard entirely).
            var next_step = $('#modal-acc-align-east');
            if (!BitHelper.bit_check(FC.CONFIG.activeSensors, 2)) {
                // No mag: skip the compass-orientation step.
                // #modal-acc-align-done also shows a "Compass alignment set to" line, which
                // accAutoAlignCompass() normally fills in -- fill it in here too since that
                // step never runs on this path, so it isn't left blank.
                $("#modal-compass-align-setting").text(i18n.getMessage("accAlignNoMagDetected"));
                next_step = $('#modal-acc-align-done');
                // No compass step follows, so the wizard ends here -- stop the poll.
                stopAlignPoll();
            }
            modal = new jBox('Modal', {
                width: 460,
                height: 360,
                animation: false,
                closeOnClick: false,
                content: next_step
            }).open();
        }
        else if (step == "4") {
            accAutoAlignCompass();
        }
    }

        GUI.content_ready(callback);
    }
};


magnetometerTab.initialize3D = function () {

    var self = this,
        canvas,
        renderer,
        wrapper,
        modelWrapper,
        model_file,
        camera,
        scene,
        magModels,
        fc,
        useWebGlRenderer = false;

    canvas = $('.model-and-info #canvas');
    wrapper = $('.model-and-info #canvas_wrapper');

    // Robust WebGL capability detection with fallback
    function tryCreateWebGLContext() {
        if (!window.WebGLRenderingContext) {
            return null;
        }

        const detector_canvas = document.createElement('canvas');
        let gl = null;
        let renderMethod = null;

        // Try 1: Hardware-accelerated WebGL (best performance)
        try {
            gl = detector_canvas.getContext('webgl') || detector_canvas.getContext('experimental-webgl');
            if (gl) {
                renderMethod = 'hardware';
                console.log('[3D Magnetometer] Using hardware-accelerated WebGL');
            }
        } catch (e) {
            console.warn('[3D Magnetometer] Hardware WebGL failed:', e);
        }

        // Try 2: Software-rendered WebGL (slower but more compatible)
        if (!gl) {
            try {
                gl = detector_canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
                     detector_canvas.getContext('experimental-webgl', { failIfMajorPerformanceCaveat: false });
                if (gl) {
                    renderMethod = 'software';
                    console.log('[3D Magnetometer] Using software-rendered WebGL (slower performance)');
                }
            } catch (e) {
                console.warn('[3D Magnetometer] Software WebGL failed:', e);
            }
        }

        return gl ? { context: gl, method: renderMethod } : null;
    }

    const webglResult = tryCreateWebGLContext();

    if (webglResult) {
        try {
            renderer = new THREE.WebGLRenderer({canvas: canvas.get(0), alpha: true, antialias: true});
            useWebGlRenderer = true;

            // Show performance notice if using software rendering
            if (webglResult.method === 'software') {
                GUI_control.prototype.log('<span style="color: orange;">3D view using software rendering (slower). Consider updating graphics drivers or disabling hardware acceleration in Options.</span>');
            }
        } catch (e) {
            console.error('[3D Magnetometer] Failed to create THREE.WebGLRenderer:', e);
            renderer = null;
            useWebGlRenderer = false;
        }
    }

    // Check if WebGL is available
    if (!renderer) {
        // WebGL not supported - show fallback message
        wrapper.html('<div class="webgl-fallback" style="display: flex; align-items: center; justify-content: center; height: 100%; color: #888; text-align: center; padding: 20px;">' +
            '<div>' +
            '<p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">3D view unavailable</p>' +
            '<p style="margin: 0 0 10px 0; font-size: 12px;">WebGL could not be initialized. This may be due to:</p>' +
            '<ul style="text-align: left; margin: 10px 0; padding-left: 20px; font-size: 12px;">' +
            '<li>Graphics drivers need updating</li>' +
            '<li>Hardware acceleration issues</li>' +
            '<li>Browser or system limitations</li>' +
            '</ul>' +
            '<p style="margin: 10px 0 0 0; font-size: 12px; font-style: italic;">Try: Options → Disable 3D Hardware Acceleration, then restart</p>' +
            '</div>' +
            '</div>');

        // Provide no-op functions so the rest of the tab doesn't break
        this.render3D = function () {};
        this.resize3D = function () {};
        return;
    }

    // initialize render size for current canvas size
    renderer.setSize(wrapper.width() * 2, wrapper.height() * 2);


    // modelWrapper adds an extra axis of rotation to avoid gimbal lock with the euler angles
    modelWrapper = new THREE.Object3D();

    // load the model including materials
    if (useWebGlRenderer) {
        if (FC.MIXER_CONFIG.appliedMixerPreset === -1) {
            model_file = 'custom';
            GUI.log("<span style='color: red; font-weight: bolder'><strong>" + i18n.getMessage("mixerNotConfigured") + "</strong></span>");
        }
        else {
            model_file = mixer.getById(FC.MIXER_CONFIG.appliedMixerPreset).model;
        }
    }
    else {
        model_file = 'fallback'
    }

    // Temporary workaround for 'custom' model until akfreak's custom model is merged.
    if (model_file == 'custom') {
        model_file = 'fallback';
    }

    let _renderPending = false;
    this.render3D = function () {

        if (!magModels || !fc)
            return;

        // LIS2MDL and LIS3MDL are visually identical, so reuse the loaded LIS3MDL model.
        const modelToShow = self.elementToShow === 30 ? 20 : self.elementToShow;
        magModels.forEach( (m,i) => m.visible = i == modelToShow );
        fc.visible = true;

        var magRotation = new THREE.Euler(-THREE.MathUtils.degToRad(self.alignmentConfig.pitch-180), THREE.MathUtils.degToRad(-180 - self.alignmentConfig.yaw), THREE.MathUtils.degToRad(self.alignmentConfig.roll), 'YXZ');
        var matrix = (new THREE.Matrix4()).makeRotationFromEuler(magRotation);

        var boardRotation = new THREE.Euler( THREE.MathUtils.degToRad( self.boardAlignmentConfig.pitch), THREE.MathUtils.degToRad( -self.boardAlignmentConfig.yaw ), THREE.MathUtils.degToRad( self.boardAlignmentConfig.roll ), 'YXZ');
        var matrix1 = (new THREE.Matrix4()).makeRotationFromEuler(boardRotation);

        magModels.forEach( (m,i) => m.rotation.setFromRotationMatrix(matrix) );
        fc.rotation.setFromRotationMatrix(matrix1);

        // draw — throttled to one render per animation frame
        if (camera != null && !_renderPending) {
            _renderPending = true;
            requestAnimationFrame(() => {
                _renderPending = false;
                renderer.render(scene, camera);
            });
        }
    };

    // handle canvas resize
    this.resize3D = function () {
        renderer.setSize(wrapper.width() * 2, wrapper.height() * 2);
        camera.aspect = wrapper.width() / wrapper.height();
        camera.updateProjectionMatrix();

        self.render3D();
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
    let controls = new OrbitControls(camera, renderer.domElement);
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
    const loader = new GLTFLoader(manager);

    const magModelNames = ['xyz', 'ak8963c', 'ak8963n', 'ak8975', 'ak8975c', 'bn_880', 'diatone_mamba_m10_pro', 'flywoo_goku_m10_pro_v3', 'foxeer_m10q_120', 'foxeer_m10q_180', 'foxeer_m10q_250', 
        'geprc_gep_m10_dq', 'gy271', 'gy273', 'hglrc_m100', 'qmc5883', 'holybro_m9n_micro', 'holybro_m9n_micro', 'ist8308', 'ist8310', 'lis3mdl',
        'mag3110', 'matek_m8q', 'matek_m9n', 'matek_m10q', 'mlx90393', 'mp9250', 'qmc5883', 'flywoo_goku_m10_pro_v3', 'ws_m181'];
    magModels = [];
    //Load the UAV model
    import(`./../resources/models/model_${model_file}.gltf`).then(({default: model}) => {
    loader.load(model, (obj) => {
            const modelScene = obj.scene;
            const scaleFactor = 15;
            modelScene.scale.set(scaleFactor, scaleFactor, scaleFactor);
            modelWrapper.add(modelScene);

            const gpsOffset = getDistanceByModelName(model_file);

            magModelNames.forEach( (name, i) => 
            {
                import(`./../resources/models/model_${name}.glb`).then(({default: magModel}) => {
                    loader.load(magModel, (obj) => {
                        const gps = obj.scene;
                        const scaleFactor = i==0 ? 0.03 : 0.04;
                        gps.scale.set(scaleFactor, scaleFactor, scaleFactor);
                        gps.position.set(gpsOffset[0], gpsOffset[1] + 0.5, gpsOffset[2]);
                        gps.traverse(child => {
                        if (child.material) child.material.metalness = 0;
                        });
                        gps.rotation.y = 3 * Math.PI / 2;
                        modelScene.add(gps);
                        magModels[i]=gps;
                        this.resize3D();
                    });
                });
            });

            //Load the FC model
            import('./../resources/models/model_fc.gltf').then(({default: fcModel}) => {
                loader.load(fcModel, (obj) => {
                    fc = obj.scene;
                    const scaleFactor = 0.04;
                    fc.scale.set(scaleFactor, scaleFactor, scaleFactor);
                    fc.position.set(gpsOffset[0], gpsOffset[1] - 0.5, gpsOffset[2]);
                    fc.rotation.y = 3 * Math.PI / 2;
                    modelScene.add(fc);
                    this.render3D();
                });
            });

        });
        this.render3D();
        this.resize3D();
    });
};


magnetometerTab.cleanup = function (callback) {
    $(window).off('resize', this.resize3D);

    if (callback) callback();
};

export default magnetometerTab;
