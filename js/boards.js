'use strict';

var BOARD_DEFINITIONS = [
    {
        name: "ChebuzzF3",
        identifier: "CHF3",
        vcp: false
    }, {
        name: "CJMCU",
        identifier: "CJM1",
        vcp: false
    }, {
        name: "EUSTM32F103RB",
        identifier: "EUF1",
        vcp: false
    }, {
        name: "Naze/Flip32+",
        identifier: "AFNA",
        vcp: false
    }, {
        name: "Naze32Pro",
        identifier: "AFF3",
        vcp: false
    }, {
        name: "Olimexino",
        identifier: "OLI1"
    }, {
        name: "Port103R",
        identifier: "103R",
        vcp: false
    }, {
        name: "SP Racing F3",
        identifier: "SRF3",
        vcp: false
    }
];

var DEFAULT_BOARD_DEFINITION = {
    name: "Unknown",
    identifier: "????",
    vcp: true
};

var BOARD = {
};

BOARD.hasVcp = function (identifier) {
    let board = BOARD.findDefinition(identifier);
    return !!board.vcp;
}

BOARD.findDefinition = function (identifier) {
    for (let i = 0; i < BOARD_DEFINITIONS.length; i++) {
        let candidate = BOARD_DEFINITIONS[i];
        
        if (candidate.identifier == identifier) {
            return candidate;
        }
    }
    return DEFAULT_BOARD_DEFINITION;
};

module.exports = BOARD;

