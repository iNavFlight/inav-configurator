/*global $*/
'use strict';

function constrain(input, min, max) {

    if (input < min) {
        return min;
    }

    if (input > max) {
        return max;
    }

    return input;
}