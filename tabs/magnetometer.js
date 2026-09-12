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

const magnetometerTab = {};


magnetometerTab.initialize = function (callback) {
    var self = this;

    var modal;
    // var accel_data_45 = [0, 0, 0];
    var heading_flat;

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
                self.mag_saved_roll = self.alignmentConfig.roll;
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
                self.mag_saved_pitch = self.alignmentConfig.pitch;
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
                self.mag_saved_yaw = self.alignmentConfig.yaw;
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

        $('a.save').on('click', function () {
            saveChainer.execute()
        });

        $('#fc-align-start-button').on('click', {"step": "1"}, accAutoAlignButton);
        $('#modal-acc-align-2').on('click', {"step": "2" }, accAutoAlignButton);
        $('#modal-acc-align-3').on('click', {"step": "3" }, accAutoAlignButton);
        $('#modal-acc-align-4').on('click', {"step": "4" }, accAutoAlignButton);

        // Both buttons below also carry class="save", so the a.save handler
        // above fires too -- that's what actually writes/saves the alignment
        // and reboots. These handlers only close the modal first.
        $('#modal-board-align-save').on('click', function () {
            if (typeof modal != "undefined") {
                modal.close();
            }
        });

        $('#modal-acc-align-done-save').on('click', function () {
            if (typeof modal != "undefined") {
                modal.close();
            }
        });

        $('#modal-board-align-fallback').on('click', function () {
            if (typeof modal != "undefined") {
                modal.close();
            }
            if (!FC.getMagnetometerCalibrated()) {
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
            modal = new jBox('Modal', {
                width: 460,
                height: 360,
                animation: false,
                closeOnClick: true,
                content: $('#modal-acc-align-east')
            }).open();
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

   

    function rad2degrees(radians) {
        return Math.round(radians * (180/Math.PI)) % 360;
    }


    /**
     * Build rotation matrix matching INAV's rotationMatrixFromAngles()
     * Source: inav/src/main/common/maths.c
     *
     * INAV uses ZYX rotation order (yaw -> pitch -> roll)
     * This matrix is used to transform sensor data based on board alignment
     *
     * @param {number} roll_deg - Roll angle in degrees
     * @param {number} pitch_deg - Pitch angle in degrees
     * @param {number} yaw_deg - Yaw angle in degrees
     * @returns {Array<Array<number>>} 3x3 rotation matrix
     */
    function buildRotationMatrix(roll_deg, pitch_deg, yaw_deg) {
        const roll = roll_deg * Math.PI / 180;
        const pitch = pitch_deg * Math.PI / 180;
        const yaw = yaw_deg * Math.PI / 180;

        const cosx = Math.cos(roll);
        const sinx = Math.sin(roll);
        const cosy = Math.cos(pitch);
        const siny = Math.sin(pitch);
        const cosz = Math.cos(yaw);
        const sinz = Math.sin(yaw);

        const coszcosx = cosz * cosx;
        const sinzcosx = sinz * cosx;
        const coszsinx = sinx * cosz;
        const sinzsinx = sinx * sinz;

        // INAV's rotation matrix (matches firmware exactly)
        // This is the matrix R used in the transformation: transformed = R^T * raw
        return [
            [cosz * cosy,                      -cosy * sinz,                      siny                    ],
            [sinzcosx + (coszsinx * siny),     coszcosx - (sinzsinx * siny),      -sinx * cosy            ],
            [(sinzsinx) - (coszcosx * siny),   (coszsinx) + (sinzcosx * siny),    cosy * cosx             ]
        ];
    }

    /**
     * Apply rotation matrix to a vector using standard matrix multiplication
     *
     * IMPORTANT: INAV's rotationMatrixRotateVector uses R^T (columns): transformed = R^T * raw
     * To invert this transformation: raw = R * transformed (apply R, NOT R^T)
     *
     * @param {Array<Array<number>>} R - 3x3 rotation matrix
     * @param {Array<number>} vec - 3D vector [x, y, z]
     * @returns {Array<number>} Rotated vector [x', y', z']
     */
    function applyRotation(R, vec) {
        return [
            R[0][0]*vec[0] + R[0][1]*vec[1] + R[0][2]*vec[2],  // Standard: use rows
            R[1][0]*vec[0] + R[1][1]*vec[1] + R[1][2]*vec[2],
            R[2][0]*vec[0] + R[2][1]*vec[1] + R[2][2]*vec[2]
        ];
    }

    /**
     * Calculate raw sensor data from MSP_RAW_IMU reading
     *
     * MSP_RAW_IMU is misnamed - it returns TRANSFORMED data (after board alignment)
     * when board alignment is non-zero. This function reverses the transformation
     * to get the actual raw sensor readings.
     *
     * @param {Array<number>} transformed - Accelerometer data from MSP_RAW_IMU [x, y, z] in g's
     * @param {number} board_pitch - Current board alignment pitch in degrees
     * @param {number} board_roll - Current board alignment roll in degrees
     * @param {number} board_yaw - Current board alignment yaw in degrees
     * @returns {Array<number>} Raw sensor data [x, y, z] in g's
     */
    function calculateRawFromTransformed(transformed, board_pitch, board_roll, board_yaw) {
        // Build the rotation matrix used by INAV
        const R = buildRotationMatrix(board_roll, board_pitch, board_yaw);

        // INAV applies R^T to get transformed data: transformed = R^T * raw
        // To invert: raw = R * transformed (apply R without transpose)
        return applyRotation(R, transformed);
    }

    function vecCross(a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    }

    function vecNormalize(v) {
        const mag = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        return [v[0] / mag, v[1] / mag, v[2] / mag];
    }

    function vecSquaredDistance(a, b) {
        return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
    }

    // The 16 mounts BOARD_ALIGNMENT's wizard supports: 8 right-side-up and
    // 8 upside-down (roll 0 or 180, pitch always 0), yaw in 45-degree steps.
    // Matches the firmware's own candidate table in compass_orientation.c.
    const BOARD_ALIGNMENT_CANDIDATES = [0, 180].flatMap((roll) =>
        [0, 45, 90, 135, 180, 225, 270, 315].map((yaw) => ({ roll, pitch: 0, yaw }))
    );

    /**
     * Find the BOARD_ALIGNMENT (roll, pitch, yaw) that best explains two
     * measured raw-sensor-frame vectors (rawFlat, rawTilt), given the known
     * aircraft-frame vectors they correspond to (refFlat, refTilt).
     *
     * This can't be done from a single vector (the flat reading alone):
     * a pure roll-180 mount and a pure pitch-180 mount both read as ~(0,0,-1)
     * when level, since gravity doesn't constrain rotation about itself. The
     * second, tilted reading breaks that symmetry.
     *
     * Rather than extract Euler angles from a rotation matrix (which is
     * ambiguous right where this wizard needs precision: asin(sin(180°)) and
     * asin(sin(0°)) are both 0, so a naive extraction silently confuses
     * pitch=180 with pitch=0+180 of roll/yaw), this does a direct search over
     * BOARD_ALIGNMENT_CANDIDATES and picks whichever one best predicts both
     * measured vectors. Verified by round-tripping known mounts through
     * buildRotationMatrix with zero error.
     */
    function findBestBoardAlignment(refFlat, refTilt, rawFlat, rawTilt) {
        const nFlat = vecNormalize(rawFlat);
        const nTilt = vecNormalize(rawTilt);

        let best = null;
        for (const { roll, pitch, yaw } of BOARD_ALIGNMENT_CANDIDATES) {
            const R = buildRotationMatrix(roll, pitch, yaw);
            const predFlat = applyRotation(R, refFlat);
            const predTilt = applyRotation(R, refTilt);
            const err = vecSquaredDistance(predFlat, nFlat) + vecSquaredDistance(predTilt, nTilt);
            if (!best || err < best.err) {
                best = { roll, pitch, yaw, err };
            }
        }
        return best;
    }

    function getMagHeading() {
        // Get magnetometer data from MSP
        // NOTE: This data has BOTH compass alignment AND board alignment applied by firmware
        let mag_transformed = [...FC.SENSOR_DATA.magnetometer];
        console.log("Mag transformed: [" + mag_transformed.map(x => x.toFixed(3)).join(", ") + "]");

        // Check if board has alignment - if so, we need to remove board alignment transformation
        // (We keep compass alignment since that's what we're trying to calibrate)
        const hasAlignment = self.boardAlignmentConfig.pitch !== 0 ||
                           self.boardAlignmentConfig.roll !== 0 ||
                           self.boardAlignmentConfig.yaw !== 0;

        let mag_after_compass_align;
        if (hasAlignment) {
            // Apply inverse of BOARD alignment only (keep compass alignment)
            console.log("Removing board alignment from magnetometer data");
            console.log("Board alignment: pitch=" + self.boardAlignmentConfig.pitch +
                       "°, roll=" + self.boardAlignmentConfig.roll +
                       "°, yaw=" + self.boardAlignmentConfig.yaw + "°");

            const R = buildRotationMatrix(
                self.boardAlignmentConfig.roll,
                self.boardAlignmentConfig.pitch,
                self.boardAlignmentConfig.yaw
            );
            mag_after_compass_align = applyRotation(R, mag_transformed);
            console.log("Mag after removing board alignment: [" + mag_after_compass_align.map(x => x.toFixed(3)).join(", ") + "]");
        } else {
            // No board alignment - data only has compass alignment
            mag_after_compass_align = mag_transformed;
        }

        // Apply scaling and calculate heading
        // The gain and scale are done by inav in compass.c right after the values are read
        let magADC = mag_after_compass_align.map((x) => x * 1090);

        let magHeading = rad2degrees ( Math.atan2(-1 * magADC[1], magADC[0]) );
        console.log("magHeading (degrees): " + magHeading.toString());
        return magHeading;
    }

    function resetAlignButtons() {
        $('.modal__button, #fc-align-start-button').css({ opacity: '', pointerEvents: '' });
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
            console.log("Board has existing alignment - applying inverse transformation");
            console.log("Current alignment: pitch=" + self.boardAlignmentConfig.pitch +
                       "°, roll=" + self.boardAlignmentConfig.roll +
                       "°, yaw=" + self.boardAlignmentConfig.yaw + "°");

            acc_g_flat = calculateRawFromTransformed(
                acc_g_transformed,
                self.boardAlignmentConfig.pitch,
                self.boardAlignmentConfig.roll,
                self.boardAlignmentConfig.yaw
            );
            console.log("Transformed data: [" + acc_g_transformed.map(x => x.toFixed(3)).join(", ") + "] g");
            console.log("Raw data (inverse): [" + acc_g_flat.map(x => x.toFixed(3)).join(", ") + "] g");
        } else {
            // No alignment set - data is already raw (INAV optimization at boardalignment.c:100-102)
            acc_g_flat = acc_g_transformed;
            console.log("No board alignment - data is raw: [" + acc_g_flat.map(x => x.toFixed(3)).join(", ") + "] g");
        }

        // Check gravity magnitude to ensure valid reading
        let A = Math.sqrt(acc_g_flat[0] ** 2 + acc_g_flat[1] ** 2 + acc_g_flat[2] ** 2);
        console.log("Gravity magnitude: " + A.toFixed(3) + "g");

        if (A > 1.15 || A < 0.85) {
            console.error("Gravity magnitude out of range: " + A.toFixed(3) + "g (expected 0.85-1.15g)");
            console.error("This usually means:");
            console.error("  - Board moved during reading");
            console.error("  - Accelerometer needs calibration");
            console.error("  - Board is on an unstable surface");

            resetAlignButtons();
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
        console.log("Calculated attitude: pitch=" + pitch.toFixed(1) + "°, roll=" + roll.toFixed(1) + "°");

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
            modal = new jBox('Modal', {
                width: 460,
                height: 360,
                animation: false,
                closeOnClick: true,
                content: $('#modal-acc-align-vertical-error')
            }).open();
            return;
        }

        self.acc_flat_xyz = new Array(roundedPitch, roundedRoll, 0);
        // Raw (de-rotated) flat-attitude vector, kept for the TRIAD solve in
        // accAutoAlignRead45() -- a single vector reading can't tell a pure
        // roll-180 flip from a pure pitch-180 flip (both read as ~(0,0,-1)g),
        // so roundedPitch/roundedRoll above are NOT the final answer, only a
        // sanity check that the mount is flat-or-upside-down (not on edge).
        self.acc_flat_raw = acc_g_flat;

        heading_flat = getMagHeading();

        modal = new jBox('Modal', {
            width: 460,
            height: 360,
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
            console.log("Applying inverse transformation for 45° reading");
            acc_g_45 = calculateRawFromTransformed(
                acc_g_transformed,
                self.boardAlignmentConfig.pitch,
                self.boardAlignmentConfig.roll,
                self.boardAlignmentConfig.yaw
            );
            console.log("Raw data (45°): [" + acc_g_45.map(x => x.toFixed(3)).join(", ") + "] g");
        } else {
            // No alignment - data is already raw
            acc_g_45 = acc_g_transformed;
        }

        // Check gravity magnitude again
        let A = Math.sqrt(acc_g_45[0] ** 2 + acc_g_45[1] ** 2 + acc_g_45[2] ** 2);
        console.log("Gravity magnitude (45°): " + A.toFixed(3) + "g");

        if (A > 1.15 || A < 0.85) {
            console.error("Gravity magnitude out of range at 45°: " + A.toFixed(3) + "g");
            console.error("Board may have moved between readings!");

            resetAlignButtons();
            modal = new jBox('Modal', {
                width: 460,
                height: 360,
                animation: false,
                closeOnClick: true,
                content: $('#modal-acc-align-calibration-error')
            }).open();
            return false;
        }

        console.log("Raw data (45°, absolute): [" + acc_g_45.map(x => x.toFixed(3)).join(", ") + "] g");

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
        console.log("Best-fit board alignment: pitch=" + bestAlignment.pitch + "°, roll=" + bestAlignment.roll +
                   "°, yaw=" + bestAlignment.yaw + "° (fit error " + bestAlignment.err.toFixed(4) + ")");

        // err is a sum of two squared-distance-between-unit-vectors terms; 1.0
        // tolerates roughly 41 degrees of combined error across both readings
        // (comfortably more than expected accelerometer noise) before giving up.
        if (bestAlignment.err > 1.0) {
            console.error("No supported board mount fits these readings well (fit error " + bestAlignment.err.toFixed(4) + ") -- board may be mounted on edge, moved during the test, or tilted at a non-45° angle");
            resetAlignButtons();
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

        self.acc_flat_xyz = [newPitch, newRoll, newYaw];

        updateBoardPitchAxis(newPitch);
        updateBoardRollAxis (newRoll);
        updateBoardYawAxis(newYaw);

        $("#modal-acc-align-setting").text(newPitch + ", " + newRoll + ", " + newYaw);
        return true;
    }

    function accAutoAlignCompass() {
        let roll_correction_needed = 0;
        let yaw_correction_needed = 0;

        let heading_change = (FC.SENSOR_DATA.kinematics[2] - heading_flat + 360) % 360;
        let correction_needed = (450 - FC.SENSOR_DATA.kinematics[2]) % 360;

        heading_change = Math.round(heading_change / 90) * 90;
        if ( typeof modal != "undefined" ) {
          modal.close();
        }
        
        // If a 90 degree turn caused a 270 degree change, it's upside down.
        if (heading_change > 180) {
            console.log("mag upside down");
            roll_correction_needed = 180;
            // ? yaw_correction_needed = correction_needed + 180;
        }
        // Tinywhoop - If both headings are accurate along a 45° offset, use that. Otherwise round to nearest 90°
        if ( (Math.abs(heading_flat % 45) < 15) && Math.abs(correction_needed % 45) < 15 ) {
            yaw_correction_needed = ( Math.round(correction_needed / 45) * 45 ) % 360;
        } else {
            yaw_correction_needed = ( Math.round(correction_needed / 90) * 90 ) % 360;
        }

        console.log("heading_flat: " + heading_flat + ", change: " + heading_change + ", correction: " + correction_needed % 360);


       // Adjust for what the NEW rotation of the FC will be

        var magAdjustment = new THREE.Euler(-THREE.MathUtils.degToRad(self.mag_saved_pitch),
                THREE.MathUtils.degToRad(-180 - yaw_correction_needed), THREE.MathUtils.degToRad(roll_correction_needed), 'YXZ');
        var matrixMag = (new THREE.Matrix4()).makeRotationFromEuler(magAdjustment);

        var boardRotation = new THREE.Euler( THREE.MathUtils.degToRad( -self.acc_flat_xyz[0] ),
                THREE.MathUtils.degToRad( -self.acc_flat_xyz[2] ),
                THREE.MathUtils.degToRad( -self.acc_flat_xyz[1] ), 'YXZ');
        var matrixBoard = (new THREE.Matrix4()).makeRotationFromEuler(boardRotation);
        // Ray TODO use the inverse of the board rotation.
        matrixMag.premultiply(matrixBoard);




        var rollCurrent90 = Math.round(self.mag_saved_roll / 90) * 90;
        updateRollAxis( (rollCurrent90 - roll_correction_needed + 360) % 360 );

        updateYawAxis( (self.mag_saved_yaw + yaw_correction_needed) % 360 );
        updatePitchAxis(self.mag_saved_pitch);

        $("#modal-compass-align-setting").text(
                self.alignmentConfig.roll + ", " + self.mag_saved_pitch + ", " + self.alignmentConfig.yaw
        );

        modal = new jBox('Modal', {
            width: 460,
            height: 360,
            animation: false,
            closeOnClick: false,
            content: $('#modal-acc-align-done')
        }).open();
    }

    function isRamConstrainedTarget() {
        return !FC.hasCalibrationOrientationDetection();
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
            // after -- this combined flow ends by using the compass, so there's no point
            // walking through the board-alignment steps first if that's doomed to fail.
            if (isRamConstrainedTarget() && BitHelper.bit_check(FC.CONFIG.activeSensors, 2) && !FC.getMagnetometerCalibrated()) {
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
                height: 200,
                width: 500,
                closeOnClick: false,
                content: $("#modal-acc-align-start")
            }).open();
            // self.imu_interval = setInterval( function() { MSP.send_message(MSPCodes.MSP_RAW_IMU, false, false) }, 200);
            interval.add('imu_data', function() { MSP.send_message(MSPCodes.MSP_RAW_IMU, false, false); }, 40);

        }


        else if (step == "2") {
            // MSP.send_message( MSPCodes.MSP_RAW_IMU, false, false, function() { headingSettled(accAutoAlignReadFlat) } );
            MSP.send_message(MSPCodes.MSP_CALIBRATION_DATA, false, false, accAutoAlignReadFlat);
            // accAutoAlignReadFlat();
        }

        else if (step == "3") {
            // MSP.send_message(MSPCodes.MSP_RAW_IMU, false, false, accAutoAlignRead45);
            if (!accAutoAlignRead45()) {
                return;
            }

            if (isRamConstrainedTarget()) {
                var next_step = $('#modal-acc-align-east');
                if (!BitHelper.bit_check(FC.CONFIG.activeSensors, 2)) {
                    // No mag: skip the compass-orientation step.
                    // #modal-acc-align-done also shows a "Compass alignment set to" line, which
                    // accAutoAlignCompass() normally fills in -- fill it in here too since that
                    // step never runs on this path, so it isn't left blank.
                    $("#modal-compass-align-setting").text(i18n.getMessage("accAlignNoMagDetected"));
                    next_step = $('#modal-acc-align-done');
                }
                modal = new jBox('Modal', {
                    width: 460,
                    height: 360,
                    animation: false,
                    closeOnClick: false,
                    content: next_step
                }).open();
            } else {
                $("#modal-board-align-setting").text($("#modal-acc-align-setting").text());

                // No mag: there's no compass step to do after this, unlike the RAM-constrained
                // branch above which special-cases this by skipping straight to "done".
                const hasMag = BitHelper.bit_check(FC.CONFIG.activeSensors, 2);
                $("#modal-board-align-instructions").html(
                    i18n.getMessage(hasMag ? "boardAlignDoneInstructions" : "boardAlignDoneNoMagInstructions")
                );
                $("#modal-board-align-fallback").toggle(hasMag);

                modal = new jBox('Modal', {
                    width: 460,
                    height: 420,
                    animation: false,
                    closeOnClick: false,
                    content: $('#modal-board-align-done')
                }).open();
            }
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


        // Ray TODO this may be pretty much what I need to do.
/*
        if ( self.isSavePreset ) {
          matrix.premultiply(matrix1);  //preset specifies orientation relative to FC, align_max_xxx specify absolute orientation
        }
*/
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
