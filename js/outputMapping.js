/*global bit_check*/
'use strict';

let OutputMappingCollection = function () {
    let self = {},
        data = [];

    const TIM_USE_ANY = 0;
    const TIM_USE_PPM = 0;
    const TIM_USE_PWM = 1;
    const TIM_USE_MC_MOTOR = 2;     // Multicopter motor output
    const TIM_USE_MC_SERVO = 3;     // Multicopter servo output (i.e. TRI)
    const TIM_USE_MC_CHNFW = 4;     // Deprecated and not used after removal of CHANNEL_FORWARDING feature
    const TIM_USE_FW_MOTOR = 5;
    const TIM_USE_FW_SERVO = 6;
    const TIM_USE_LED = 24;
    const TIM_USE_BEEPER = 25;

    const OUTPUT_TYPE_MOTOR = 0;
    const OUTPUT_TYPE_SERVO = 1;

    function getTimerMap(isMR, motors, servos) {
        let timerMap = [],
            motorsToGo = motors,
            servosToGo = servos;

        for (let i = 0; i < data.length; i++) {
            timerMap[i] = null;

            if (isMR) {
                if (servosToGo > 0 && bit_check(data[i], TIM_USE_MC_SERVO)) {
                    servosToGo--;
                    timerMap[i] = OUTPUT_TYPE_SERVO;
                } else if (motorsToGo > 0 && bit_check(data[i], TIM_USE_MC_MOTOR)) {
                    motorsToGo--;
                    timerMap[i] = OUTPUT_TYPE_MOTOR;
                }
            } else {
                if (servosToGo > 0 && bit_check(data[i], TIM_USE_FW_SERVO)) {
                    servosToGo--;
                    timerMap[i] = OUTPUT_TYPE_SERVO;
                } else if (motorsToGo > 0 && bit_check(data[i], TIM_USE_FW_MOTOR)) {
                    motorsToGo--;
                    timerMap[i] = OUTPUT_TYPE_MOTOR;
                }
            }

        }

        return timerMap;
    };

    self.getOutputTable = function (isMR, motors, servos) {
        let currentMotorIndex = 1,
            currentServoIndex = 0,
            timerMap = getTimerMap(isMR, motors, servos.length),
            outputMap = [],
            offset = getFirstOutputOffset();

        for (let i = 0; i < self.getOutputCount(); i++) {
            
            let assignment = timerMap[i + offset];

            if (assignment === null) {
                outputMap[i] = "-";
            } else if (assignment == OUTPUT_TYPE_MOTOR) {
                outputMap[i] = "Motor " + currentMotorIndex;
                currentMotorIndex++;
            } else if (assignment == OUTPUT_TYPE_SERVO) {
                outputMap[i] = "Servo " + servos[currentServoIndex];
                currentServoIndex++;
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
            if (
                bit_check(data[i], TIM_USE_MC_MOTOR) ||
                bit_check(data[i], TIM_USE_MC_SERVO) ||
                bit_check(data[i], TIM_USE_FW_MOTOR) ||
                bit_check(data[i], TIM_USE_FW_SERVO)
            ) {
                retVal++;
            };
        }

        return retVal;
    }

    function getFirstOutputOffset() {
        for (let i = 0; i < data.length; i++) {
            if (
                bit_check(data[i], TIM_USE_MC_MOTOR) ||
                bit_check(data[i], TIM_USE_MC_SERVO) ||
                bit_check(data[i], TIM_USE_FW_MOTOR) ||
                bit_check(data[i], TIM_USE_FW_SERVO)
            ) {
                return i;
            }
        }
        return 0;
    }

    function getOutput(servoIndex, bit) {

        let offset = getFirstOutputOffset();

        let lastFound = 0;

        for (let i = offset; i < data.length; i++) {
            if (bit_check(data[i], bit)) {
                if (lastFound == servoIndex) {
                    return i - offset + 1;
                } else {
                    lastFound++;
                }
            }
        }

        return null;
    }

    self.getFwServoOutput = function (servoIndex) {
        return getOutput(servoIndex, TIM_USE_FW_SERVO);
    };

    self.getMrServoOutput = function (index) {
        return getOutput(index, TIM_USE_MC_SERVO);
    };

    return self;
}