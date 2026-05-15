'use strict';

import BitHelper from "./bitHelper";

var OutputMappingCollection = function () {
    let self = {},
        data = [],
        timerOverrides = {},
        directAssignments = [];

    const colorTable = [
            "#8ecae6",
            "#2a9d8f",
            "#e9c46a",
            "#f4a261",
            "#e76f51",
            "#ef476f",
            "#ffc300"
        ];

    const TIM_USE_ANY = 0;
    const TIM_USE_PPM = 0;
    const TIM_USE_PWM = 1;
    const TIM_USE_MOTOR = 2;     // Motor output
    const TIM_USE_SERVO = 3;     // Servo output (i.e. TRI)
    //const TIM_USE_MC_CHNFW = 4;     // Deprecated and not used after removal of CHANNEL_FORWARDING feature
    //const TIM_USE_FW_MOTOR = 5;
    //const TIM_USE_FW_SERVO = 6;
    const TIM_USE_LED = 24;
    const TIM_USE_BEEPER = 25;
    const TIM_USE_PINIO = 26;

    const OUTPUT_TYPE_MOTOR = 0;
    const OUTPUT_TYPE_SERVO = 1;
    const OUTPUT_TYPE_LED   = 2;
    const OUTPUT_TYPE_PINIO = 3;

    const SPECIAL_LABEL_LED = 1;
    const SPECIAL_LABEL_PINIO_BASE = 2;  // values 2..5 = USER1..USER4 (add channel index 0-3)

    self.TIMER_OUTPUT_MODE_AUTO = 0;
    self.TIMER_OUTPUT_MODE_MOTORS = 1;
    self.TIMER_OUTPUT_MODE_SERVOS = 2;
    self.TIMER_OUTPUT_MODE_LED = 3;
    self.TIMER_OUTPUT_MODE_PINIO = 4;

    self.flushTimerOverrides = function() {
        timerOverrides = {};
    }

    self.flushDirectAssignment = function() {
        directAssignments = [];
    }

    self.setDirectAssignment = function(outputIndex, type, number) {
        directAssignments.push({ outputIndex, type, number });
    }

    self.hasDirectAssignment = function() {
        return directAssignments.length > 0;
    }

    // Build output table from firmware-reported direct assignments.
    // Falls back gracefully: outputs not present in directAssignments show as '-'.
    self.getOutputTableDirect = function() {
        let offset = getFirstOutputOffset();
        let outputCount = self.getOutputCount();
        let outputMap = new Array(outputCount).fill('-');

        for (let entry of directAssignments) {
            let displayIndex = entry.outputIndex - offset;
            if (displayIndex < 0 || displayIndex >= outputCount) continue;
            if (entry.type === 1) {
                outputMap[displayIndex] = 'Motor ' + entry.number;
            } else if (entry.type === 2) {
                outputMap[displayIndex] = 'Servo ' + entry.number;
            }
        }

        return outputMap;
    }

    self.setTimerOverride = function (timer, outputMode) {
        timerOverrides[timer] = parseInt(outputMode, 10);
    }

    self.getTimerOverride = function (timer) {
        return timerOverrides[timer];
    }

    self.getTimerColor = function (timer) {
        let timerIndex = self.getUsedTimerIds().indexOf(String(timer));
     
        return colorTable[timerIndex % colorTable.length];
    }

    self.isLedPin = function(timer) {
        return data[timer].specialLabels == SPECIAL_LABEL_LED;
    }

    self.getOutputTimerColor = function (output) {
        let timerId = self.getTimerId(output);

        return self.getTimerColor(timerId);
    }

    self.getUsedTimerIds = function (timer) {
        let used = {};
        let outputCount = self.getOutputCount();

        for (let i = 0; i < outputCount; ++i) {
            let timerId = self.getTimerId(i);
            used[timerId] = 1;
        }

        return Object.keys(used).sort((a, b) => a - b);
    }

    function getTimerMap(isMR, motors, servos) {
        let timerMap = [],
            motorsToGo = motors,
            servosToGo = servos;

        for (let i = 0; i < data.length; i++) {
            timerMap[i] = null;
        }

        // Pre-assign PINIO outputs — identified by specialLabels, not timer priority
        for (let i = 0; i < data.length; i++) {
            if (data[i]['specialLabels'] >= SPECIAL_LABEL_PINIO_BASE) {
                timerMap[i] = OUTPUT_TYPE_PINIO;
            }
        }

        // Two priority passes: dedicated outputs first, then auto.
        // Matches firmware pwmBuildTimerOutputList() behavior.
        for (let priority = 0; priority < 2; priority++) {
            let isDedicated = (priority === 0);

            for (let i = 0; i < data.length; i++) {
                if (timerMap[i] !== null) continue;

                let flags = data[i]['usageFlags'];
                let timerId = data[i]['timerId'];
                let mode = timerOverrides[timerId] || self.TIMER_OUTPUT_MODE_AUTO;

                // Pass 1: skip dedicated overrides — they were handled (or intentionally skipped) in Pass 0
                if (!isDedicated && (mode === self.TIMER_OUTPUT_MODE_MOTORS || mode === self.TIMER_OUTPUT_MODE_SERVOS)) {
                    continue;
                }

                if (motorsToGo > 0 && BitHelper.bit_check(flags, TIM_USE_MOTOR)
                        && (isDedicated ? mode === self.TIMER_OUTPUT_MODE_MOTORS : mode !== self.TIMER_OUTPUT_MODE_MOTORS)) {
                    timerMap[i] = OUTPUT_TYPE_MOTOR;
                    motorsToGo--;
                } else if (servosToGo > 0 && BitHelper.bit_check(flags, TIM_USE_SERVO)
                        && (isDedicated ? mode === self.TIMER_OUTPUT_MODE_SERVOS : mode !== self.TIMER_OUTPUT_MODE_SERVOS)) {
                    timerMap[i] = OUTPUT_TYPE_SERVO;
                    servosToGo--;
                } else if (!isDedicated && BitHelper.bit_check(flags, TIM_USE_LED)) {
                    timerMap[i] = OUTPUT_TYPE_LED;
                }
            }
        }

        return timerMap;
    };

    self.getOutputTable = function (isMR, motors, servos) {
        let currentServoIndex = 0,
            timerMap = getTimerMap(isMR, motors, servos.length),
            motorNumbers = {},
            outputMap = [],
            offset = getFirstOutputOffset();

        // Number motors in assignment order: dedicated (OUTPUT_MODE_MOTORS) first, then auto.
        // Matches firmware timMotors[] build order in pwmBuildTimerOutputList().
        let motorNum = 1;
        for (let i = 0; i < data.length; i++) {
            if (timerMap[i] !== OUTPUT_TYPE_MOTOR) continue;
            let mode = timerOverrides[data[i]['timerId']] || self.TIMER_OUTPUT_MODE_AUTO;
            if (mode === self.TIMER_OUTPUT_MODE_MOTORS) motorNumbers[i] = motorNum++;
        }
        for (let i = 0; i < data.length; i++) {
            if (timerMap[i] === OUTPUT_TYPE_MOTOR && motorNumbers[i] === undefined) motorNumbers[i] = motorNum++;
        }
        for (let i = 0; i < self.getOutputCount(); i++) {

            let assignment = timerMap[i + offset];

            if (assignment === null) {
                outputMap[i] = "-";
            } else if (assignment == OUTPUT_TYPE_MOTOR) {
                outputMap[i] = "Motor " + motorNumbers[i + offset];
            } else if (assignment == OUTPUT_TYPE_SERVO) {
                outputMap[i] = "Servo " + servos[currentServoIndex];
                currentServoIndex++;
            } else if (assignment == OUTPUT_TYPE_LED) {
                outputMap[i] = "Led";
            } else if (assignment == OUTPUT_TYPE_PINIO) {
                outputMap[i] = "USER" + (data[i + offset]['specialLabels'] - SPECIAL_LABEL_PINIO_BASE + 1);
            }
        }

        return outputMap;
    };

    self.flush = function () {
        data = [];
    };

    self.put = function (element) {
        data.push(element);
    };

    self.getOutputCount = function () {
        let retVal = 0;

        for (let i = 0; i < data.length; i++) {
            let flags = data[i]['usageFlags'];
            if (
                BitHelper.bit_check(flags, TIM_USE_MOTOR) ||
                BitHelper.bit_check(flags, TIM_USE_SERVO) ||
                BitHelper.bit_check(flags, TIM_USE_LED) ||
                BitHelper.bit_check(flags, TIM_USE_PINIO) ||
                data[i]['specialLabels'] >= SPECIAL_LABEL_PINIO_BASE
            ) {
                retVal++;
            };
        }

        return retVal;
    }

    function getFirstOutputOffset() {
        for (let i = 0; i < data.length; i++) {
            if (
                BitHelper.bit_check(data[i]['usageFlags'], TIM_USE_MOTOR) ||
                BitHelper.bit_check(data[i]['usageFlags'], TIM_USE_SERVO) ||
                BitHelper.bit_check(data[i]['usageFlags'], TIM_USE_LED) ||
                BitHelper.bit_check(data[i]['usageFlags'], TIM_USE_PINIO) ||
                data[i]['specialLabels'] >= SPECIAL_LABEL_PINIO_BASE
            ) {
                return i;
            }
        }
        return 0;
    }

    function getTimerId(outputIndex) {
        return data[outputIndex]['timerId'];
    }

    function getOutput(servoIndex, bit) {

        let offset = getFirstOutputOffset();

        let lastFound = 0;

        for (let i = offset; i < data.length; i++) {
            if (BitHelper.bit_check(data[i]['usageFlags'], bit)) {
                if (lastFound == servoIndex) {
                    return i - offset + 1;
                } else {
                    lastFound++;
                }
            }
        }

        return null;
    }

    self.getTimerId = function(outputIndex) {
        return getTimerId(outputIndex)
    }

    self.getFwServoOutput = function (servoIndex) {
        return getOutput(servoIndex, TIM_USE_SERVO);
    };

    self.getMrServoOutput = function (index) {
        return getOutput(index, TIM_USE_SERVO);
    };

    return self;
}

export default OutputMappingCollection;