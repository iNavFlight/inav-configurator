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

    self.getFwMotorOutput = function (index) {
        return getOutput(index, TIM_USE_FW_MOTOR);
    };

    self.getMrMotorOutput = function (index) {
        return getOutput(index, TIM_USE_MC_MOTOR);
    };

    self.getMrServoOutput = function (index) {
        return getOutput(index, TIM_USE_MC_SERVO);
    };

    return self;
}