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
import { GUI, TABS } from './../js/gui';
import i18n from './../js/localization';
import { mixer } from './../js/model';
import interval from './../js/intervals';
import jBox from 'jbox';

TABS.magnetometer = {};


TABS.magnetometer.initialize = function (callback) {
    var self = this;

    var modal;
    // var accel_data_45 = [0, 0, 0];
    var heading_flat;

    if (GUI.active_tab != 'magnetometer') {
        GUI.active_tab = 'magnetometer';
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
                    console.log("while settting align_mag_roll, data is null or undefined");
                    return;
                }
                self.alignmentConfig.roll = parseInt(data.value, 10) / 10;
                self.mag_saved_roll = self.alignmentConfig.roll;
            }).then(callback)
        },
        function (callback) {
            mspHelper.getSetting("align_mag_pitch").then(function (data) {
                if (data == null) {
                    console.log("while settting align_mag_pitch, data is null or undefined");
                    return;
                }
                self.alignmentConfig.pitch = parseInt(data.value, 10) / 10;
                self.mag_saved_pitch = self.alignmentConfig.pitch;
            }).then(callback)
        },
        function (callback) {
            mspHelper.getSetting("align_mag_yaw").then(function (data) {
                if (data == null) {
                    console.log("while settting align_mag_yaw, data is null or undefined");
                    return;
                }
                self.alignmentConfig.yaw = parseInt(data.value, 10) / 10;
                self.mag_saved_yaw = self.alignmentConfig.yaw;
            }).then(callback)
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
        self.pageElements.board_roll_slider.val(self.boardAlignmentConfig.roll);
        self.pageElements.orientation_board_roll.val(self.boardAlignmentConfig.roll);
        updateMagOrientationWithPreset();
        updateFCCliString();
        self.render3D();
    }

    function updateBoardPitchAxis(value) {
        self.boardAlignmentConfig.pitch = Number(value);
        self.pageElements.board_pitch_slider.val(self.boardAlignmentConfig.pitch);
        self.pageElements.orientation_board_pitch.val(self.boardAlignmentConfig.pitch);
        updateMagOrientationWithPreset();
        updateFCCliString();
        self.render3D();
    }

    function updateBoardYawAxis(value) {
        self.boardAlignmentConfig.yaw = Number(value);
        self.pageElements.board_yaw_slider.val(self.boardAlignmentConfig.yaw);
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
        self.pageElements.roll_slider.val(self.alignmentConfig.roll);
        self.pageElements.orientation_mag_roll.val(self.alignmentConfig.roll);
        updateMagCliString();
        self.render3D();
    }

    //Called when pitch values change
    function updatePitchAxis(value) {
        self.alignmentConfig.pitch = Number(value);
        self.pageElements.pitch_slider.val(self.alignmentConfig.pitch);
        self.pageElements.orientation_mag_pitch.val(self.alignmentConfig.pitch);
        updateMagCliString();
        self.render3D();
    }

    //Called when yaw values change
    function updateYawAxis(value) {
        self.alignmentConfig.yaw = Number(value);
        self.pageElements.yaw_slider.val(self.alignmentConfig.yaw);
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
            updateBoardPitchAxis(values[handle]);
        });
        self.pageElements.board_roll_slider[0].noUiSlider.on('update', (values, handle) =>  {
            updateBoardRollAxis(values[handle]);
        });
        self.pageElements.board_yaw_slider[0].noUiSlider.on('update', (values, handle) =>  {
            updateBoardYawAxis(values[handle]);
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
            updatePitchAxis(values[handle]);
        });
        self.pageElements.roll_slider[0].noUiSlider.on('update', (values, handle) =>  {
            updateRollAxis(values[handle]);
        });
        self.pageElements.yaw_slider[0].noUiSlider.on('update', (values, handle) =>  {
            updateYawAxis(values[handle]);
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


    function getMagHeading() {
        // console.log(FC.SENSOR_DATA.magnetometer);
        let magADC = FC.SENSOR_DATA.magnetometer.map((x) => x * 1090);
        
        // The gain and scale are done by inav in compass.c right after the values are read, 
       
        let magHeading = rad2degrees ( Math.atan2(-1 * magADC[1], magADC[0]) );
        console.log("magHeading (degrees): " + magHeading.toString());
        return magHeading;
    }

    function accComputeYaw(changed, upside) {
        // Is upside down just -1 X the upside up value?
        var corrections = {
            'up': {
                 0: {
                    45: -90, // Confirmed
                    135: 0,  // Double check
                    180: 0,  // Double check
                    315: 90  // Confirmed
                },
                22: {
                    22: -45,
                    338: 45
                },
                45: {
                    0: 0,   // Confirmed
                    45: -45,
                    90: -90,
                    270: 90 // May be upside down
                },
                315: {
                    0: 180, // Confirmed
                    90: -90,
                    270: 90
                 },
                338: {
                  22: -135, // aka 225
                  338: 135
                }
            },
            'down': {
                0: {
                  45: -90 // 90?
                },
                45: {
                    0: -90 // Double check
                }
            }
        };
        if (typeof corrections[upside][changed[0]][changed[1]] != 'undefined') {
            console.log(corrections[upside][changed[0]][changed[1]]);
            return (corrections[upside][changed[0]][changed[1]]);
        } else {
            return(-1);
        }
    }

    function accAutoAlignReadFlat() {

        let acc_g_flat = [FC.SENSOR_DATA.accelerometer];

        let A = Math.sqrt(acc_g_flat[0] ** 2 + acc_g_flat[1] ** 2 + acc_g_flat[2] ** 2);

        if (A > 1.15 || A < 0.85) {
            modal = new jBox('Modal', {
                width: 460,
                height: 360,
                animation: false,
                closeOnClick: true,
                content: $('#modal-acc-align-calibration-error')
            }).open();
            return;
        }



        let roll = ( Math.atan2(acc_g_flat[1], acc_g_flat[2]) * 180/Math.PI ) % 360;
        let pitch = ( Math.atan2(-1 * acc_g_flat[0], Math.sqrt(acc_g_flat[1] ** 2 + acc_g_flat[2] ** 2)) * 180/Math.PI ) % 360;
        self.acc_flat_xyz = new Array(pitch, roll, 0);
        console.log("pitch: " + pitch + ", roll: " + roll);

        this.heading_flat = getMagHeading();

        modal = new jBox('Modal', {
            width: 460,
            height: 360,
            animation: false,
            closeOnClick: false,
            content: $('#modal-acc-align-45')
        }).open();
    }



    function accAutoAlignRead45() {
        var changed = [0, 0, 0];
        let raw_changed = [0, 0, 0];
        var acc_align;
        var i;

        let acc_g_45 = [...FC.SENSOR_DATA.accelerometer];

        let roll = Math.atan2(acc_g_45[1], acc_g_45[2]) * 180/Math.PI;
        let pitch = Math.atan2(-1 * acc_g_45[0], Math.sqrt(acc_g_45[1] ** 2 + acc_g_45[2] ** 2)) * 180/Math.PI;
        let acc_45_xyz = new Array(pitch, roll, 0);

        for (i = 0; i < acc_g_45.length; i++) {
            self.acc_flat_xyz[i] = Math.round( self.acc_flat_xyz[i] / 45 ) * 45;
            raw_changed[i] = self.acc_flat_xyz[i] - acc_45_xyz[i];
        }
        console.log("raw_changed: " + raw_changed);

 
        // Check for 45° mounting (25.5mm boards)
        let corner_raised = false;
        if (
               Math.abs(raw_changed[0]) > 13 &&  Math.abs(raw_changed[0]) < 30 &&
               Math.abs(raw_changed[1]) > 13 &&  Math.abs(raw_changed[1]) < 30
        ) {
            corner_raised = true;
        }

        for (i = 0; i < acc_g_45.length; i++) {
            if (corner_raised) {
                changed[i] = ( 360 + Math.round(raw_changed[i] / 22) * 22 ) % 360;
            } else {
                changed[i] = ( 360 + Math.round(raw_changed[i] / 45) * 45 ) % 360;
            }
        }

        // var boardRotation = new THREE.Euler( THREE.Math.degToRad( -self.boardAlignmentConfig.pitch ), THREE.Math.degToRad( -self.boardAlignmentConfig.yaw ), THREE.Math.degToRad( -self.boardAlignmentConfig.roll ), 'YXZ');
        // var matrix1 = (new THREE.Matrix4()).makeRotationFromEuler(boardRotation);

        /*
            Get the actual down direction.
            Get which edge or corner was lifted.
            Define front as the edge or corner that was lifted.
            Define the absolute orientation as that which has the correct part down and the correct part front.
            Apply sensor orientation on the board.
            Rotate the current settings according to the needed correction matrix.
            
            
            OR
            
            Get the rotation needed so that pitch and roll are near zero.
            Define front as the edge or corner that was lifted.
            Define the relative orientation (correction needed) as that which has the correct part down and the correct part front. (Relative to current settings).
            Rotate the current settings according to the needed correction matrix.
            
        */

      	// console.log(axis);
       	// planet.position.applyQuaternion(quaternion);
        
        let upside = 'up';
        // If the board is reading as upside down, fix that.
        if ( roll > 120 ) {
            // self.acc_flat_xyz[1] = (self.acc_flat_xyz[1] + 180) % 360;
            upside = 'down';
        }
    
        console.log("changed:");
        console.log(changed);
        console.log("upside: " + upside);
    
        acc_yaw = accComputeYaw(changed, upside);
        self.acc_flat_xyz[2] = acc_yaw;
    
    
        // Ray TODO rotate based on current board alignment (board) and new board alignment (compass)
        // The acc readings are relative to the current settings. :(
        // Alternatively, set alignments to 0,0,0, save and reboot, then finish the wizard.
        let newPitch = ( self.boardAlignmentConfig.saved_pitch + (Math.round(self.acc_flat_xyz[0] / 45) * 45) ) % 360;
        let newRoll  = ( self.boardAlignmentConfig.saved_roll  + (Math.round(self.acc_flat_xyz[1] / 45) * 45) ) % 360;
        let newYaw   = ( self.boardAlignmentConfig.saved_yaw   + acc_yaw ) % 360;
    
        updateBoardPitchAxis(newPitch % 360 );
        updateBoardRollAxis (newRoll  % 360 );
        updateBoardYawAxis(newYaw % 360);
    
    
        /*
        const quaternion = new THREE.Quaternion();
        // const axis = new THREE.Vector3(self.acc_flat_xyz).normalize();
        const axis = new THREE.Vector3(...FC.SENSOR_DATA.accelerometer).normalize();
    
        console.debug("axis: " + axis);
        quaternion.setFromAxisAngle(axis, 0.05);
        */

        $("#modal-acc-align-setting").text(newPitch + ", " + newRoll + ", " + newYaw);
    }



    // Ray TODO - account for how the sensor is mounted to the board? SENSOR_ALIGNMENT.align_acc, SENSOR_ALIGNMENT.align_mag
    // #define IMU_MPU6500_ALIGN        CW90_DEG

    function OLDaccAutoAlignRead45() {
        var changed = [0, 0, 0];
        var acc_align;
        var i;

        let accel_data_45 = [FC.SENSOR_DATA.accelerometer];

        let roll = Math.atan2(acc_g_45[1], acc_g_45[2]) * 180/Math.PI;
        let pitch = Math.atan2(-1 * acc_g_45[0], Math.sqrt(acc_g_45[1] ** 2 + acc_g_45[2] ** 2)) * 180/Math.PI;
        let acc_45_xyz = new Array(pitch, roll, 0);

        for (i = 0; i < acc_g_45.length; i++) {
            self.acc_flat_xyz[i] = Math.round( self.acc_flat_xyz[i] / 45 ) * 45;
            // acc_45_xyz[i] = rad2degrees(acc_45_xyz[i]);
            changed[i] = ( 360 + Math.round((self.acc_flat_xyz[i] - acc_45_xyz[i]) / 45) * 45 ) % 360;
        }



        let upside = 'up';
        // If the board is reading as upside down, fix that.
        if ( roll > 120 ) {
            // self.acc_flat_xyz[1] = (self.acc_flat_xyz[1] + 180) % 360;
            upside = 'down';
        }

        console.log("changed:");
        console.log(changed);
        console.log("upside: " + upside);

        acc_yaw = accComputeYaw(changed, upside);
        self.acc_flat_xyz[2] = acc_yaw;


        // Ray TODO rotate based on current board alignment (board) and new board alignment (compass)
        // Alternatively, set alignments to 0,0,0, save and reboot, then finish the wizard.
        let newPitch = ( self.boardAlignmentConfig.saved_pitch + (Math.round(self.acc_flat_xyz[0] / 45) * 45) ) % 360;
        let newRoll  = ( self.boardAlignmentConfig.saved_roll  + (Math.round(self.acc_flat_xyz[1] / 45) * 45) ) % 360;
        let newYaw   = ( self.boardAlignmentConfig.saved_yaw   + acc_yaw ) % 360;

        updateBoardPitchAxis(newPitch % 360 );
        updateBoardRollAxis (newRoll  % 360 );
        updateBoardYawAxis(newYaw % 360);

        $("#modal-acc-align-setting").text(newPitch + ", " + newRoll + ", " + newYaw);
    }

    function accAutoAlignCompass() {
        let roll_correction_needed = 0;

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
        if ( (Math.abs(this.heading_flat % 45) < 15) && Math.abs(correction_needed % 45) < 15 ) {
            yaw_correction_needed = ( Math.round(correction_needed / 45) * 45 ) % 360;
        } else {
            yaw_correction_needed = ( Math.round(correction_needed / 90) * 90 ) % 360;
        }

        console.log("heading_flat: " + this.heading_flat + ", change: " + heading_change + ", correction: " + correction_needed % 360);


       // Adjust for what the NEW rotation of the FC will be

        var magAdjustment = new THREE.Euler(-THREE.Math.degToRad(self.mag_saved_pitch),
                THREE.Math.degToRad(-180 - yaw_correction_needed), THREE.Math.degToRad(roll_correction_needed), 'YXZ');
        var matrixMag = (new THREE.Matrix4()).makeRotationFromEuler(magAdjustment);

        var boardRotation = new THREE.Euler( THREE.Math.degToRad( -self.acc_flat_xyz[0] ),
                THREE.Math.degToRad( -self.acc_flat_xyz[2] ),
                THREE.Math.degToRad( -self.acc_flat_xyz[1] ), 'YXZ');
        var matrixBoard = (new THREE.Matrix4()).makeRotationFromEuler(boardRotation);
        // Ray TODO use the inverse of the board rotation. 
        madAdjustment.premultiply(matrixBoard);




        var rollCurrent90 = Math.round(self.mag_saved_roll / 90) * 90;
        updateRollAxis( (rollCurrent90 - roll_correction_needed) % 360 );

        updateYawAxis( (self.mag_saved_yaw + yaw_correction_needed) % 360 );
        updatePitchAxis(self.mag_saved_pitch);

        $("#modal-compass-align-setting").text(
                self.alignmentConfig.roll + ", " + self.mag_saved_pitch + ", " + self.alignmentConfig.yaw
        );

        modal = new jBox('Modal', {
            width: 460,
            height: 360,
            animation: false,
            closeOnClick: true,
            content: $('#modal-acc-align-done')
        }).open();
    }

    function accAutoAlignButton(event) {
        var step = event.data.step;

        // Steps: 1 start, 2 craft is flat north, 3 craft is nose up, 4 craft is flat and east
        if ( typeof step == "undefined" ) {
            step = "1";
        }

        if ( typeof modal != "undefined" ) {
          modal.close();
        }


        if (step == "1") {
            modal = new jBox("Modal", {
                animation: false,
                height: 200,
                width: 500,
                closeOnClick: false,
                content: $("#modal-acc-align-start")
            }).open();
            // self.imu_interval = setInterval( function() { MSP.send_message(MSPCodes.MSP_RAW_IMU, false, false) }, 200);
            helper.mspBalancedInterval.add('imu_data', 40, 1, function() {MSP.send_message(MSPCodes.MSP_RAW_IMU, false, false)} );

        }


        else if (step == "2") {
            // MSP.send_message( MSPCodes.MSP_RAW_IMU, false, false, function() { headingSettled(accAutoAlignReadFlat) } );
            MSP.send_message(MSPCodes.MSP_CALIBRATION_DATA, false, false, accAutoAlignReadFlat);
            // accAutoAlignReadFlat();
        }

        else if (step == "3") {
            var next_step;
            next_step = $('#modal-acc-align-east');
            if (FC.SENSOR_DATA.magnetometer[0] === 0 && FC.SENSOR_DATA.magnetometer[2] === 0) {
                next_step = $('#modal-acc-align-done');
            }

            // MSP.send_message(MSPCodes.MSP_RAW_IMU, false, false, accAutoAlignRead45);
            accAutoAlignRead45();
            modal = new jBox('Modal', {
                width: 460,
                height: 360,
                animation: false,
                closeOnClick: true,
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


TABS.magnetometer.initialize3D = function () {

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

    // webgl capability detector
    // it would seem the webgl "enabling" through advanced settings will be ignored in the future
    // and webgl will be supported if gpu supports it by default (canary 40.0.2175.0), keep an eye on this one
    var detector_canvas = document.createElement('canvas');
    if (window.WebGLRenderingContext && (detector_canvas.getContext('webgl') || detector_canvas.getContext('experimental-webgl'))) {
        renderer = new THREE.WebGLRenderer({canvas: canvas.get(0), alpha: true, antialias: true});
        useWebGlRenderer = true;
    }
    
    // initialize render size for current canvas size
    renderer.setSize(wrapper.width() * 2, wrapper.height() * 2);


    // modelWrapper adds an extra axis of rotation to avoid gimbal lock with the euler angles
    modelWrapper = new THREE.Object3D();

    // load the model including materials
    if (useWebGlRenderer) {
        if (FC.MIXER_CONFIG.appliedMixerPreset === -1) {
            model_file = 'custom';
            // GUI_control.prototype.log("<span style='color: red; font-weight: bolder'><strong>" + i18n.getMessage("mixerNotConfigured") + "</strong></span>");
            // GUI.prototype.log("<span style='color: red; font-weight: bolder'><strong>" + i18n.getMessage("mixerNotConfigured") + "</strong></span>");
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

    this.render3D = function () {

        if (!magModels || !fc)
            return;

        magModels.forEach( (m,i) => m.visible = i == self.elementToShow );
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

        // draw
        if (camera != null)
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


TABS.magnetometer.cleanup = function (callback) {
    $(window).off('resize', this.resize3D);

    if (callback) callback();
};
