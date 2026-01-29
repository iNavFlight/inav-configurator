/**
 * Quick Layout preset definitions for LED Strip tab.
 *
 * Each preset is an array of LED entries placed in wire order.
 * Fields match what gets written into FC.LED_STRIP:
 *   x, y        — grid position (0-15)
 *   directions  — string of direction letters (n/e/s/w/u/d)
 *   functions   — string of function letters (f=FlightMode, w=Warnings, i=Indicator, r=Ring, c=Color)
 *   color       — color index (0-15)
 */

const LED_STRIP_PRESETS = {
    xframe: [
        // Front-left arm (NW diagonal) - 5 LEDs (RED - port side)
        { x: 2,  y: 2,  directions: 'nw', functions: 'cwi', color: 2 },
        { x: 3,  y: 3,  directions: 'nw', functions: 'c',   color: 2 },
        { x: 4,  y: 4,  directions: 'nw', functions: 'c',   color: 2 },
        { x: 5,  y: 5,  directions: 'nw', functions: 'c',   color: 2 },
        { x: 6,  y: 6,  directions: 'nw', functions: 'c',   color: 2 },
        // Front-right arm (NE diagonal) - 5 LEDs (GREEN - starboard side)
        { x: 13, y: 2,  directions: 'ne', functions: 'cw',  color: 6 },
        { x: 12, y: 3,  directions: 'ne', functions: 'c',   color: 6 },
        { x: 11, y: 4,  directions: 'ne', functions: 'c',   color: 6 },
        { x: 10, y: 5,  directions: 'ne', functions: 'c',   color: 6 },
        { x: 9,  y: 6,  directions: 'ne', functions: 'c',   color: 6 },
        // Back-left arm (SW diagonal) - 5 LEDs (RED - port side)
        { x: 2,  y: 13, directions: 'sw', functions: 'cwi', color: 2 },
        { x: 3,  y: 12, directions: 'sw', functions: 'c',   color: 2 },
        { x: 4,  y: 11, directions: 'sw', functions: 'c',   color: 2 },
        { x: 5,  y: 10, directions: 'sw', functions: 'c',   color: 2 },
        { x: 6,  y: 9,  directions: 'sw', functions: 'c',   color: 2 },
        // Back-right arm (SE diagonal) - 5 LEDs (GREEN - starboard side)
        { x: 13, y: 13, directions: 'se', functions: 'cwi', color: 6 },
        { x: 12, y: 12, directions: 'se', functions: 'c',   color: 6 },
        { x: 11, y: 11, directions: 'se', functions: 'c',   color: 6 },
        { x: 10, y: 10, directions: 'se', functions: 'c',   color: 6 },
        { x: 9,  y: 9,  directions: 'se', functions: 'c',   color: 6 },
    ],
    crossframe: [
        // Front arm (N) - 5 LEDs (WHITE)
        { x: 7,  y: 2,  directions: 'n',  functions: 'cw',  color: 1 },
        { x: 7,  y: 3,  directions: 'n',  functions: 'c',   color: 1 },
        { x: 7,  y: 4,  directions: 'n',  functions: 'c',   color: 1 },
        { x: 7,  y: 5,  directions: 'n',  functions: 'c',   color: 1 },
        { x: 7,  y: 6,  directions: 'n',  functions: 'c',   color: 1 },
        // Right arm (E) - 5 LEDs (GREEN - starboard side)
        { x: 9,  y: 7,  directions: 'e',  functions: 'c',   color: 6 },
        { x: 10, y: 7,  directions: 'e',  functions: 'c',   color: 6 },
        { x: 11, y: 7,  directions: 'e',  functions: 'c',   color: 6 },
        { x: 12, y: 7,  directions: 'e',  functions: 'c',   color: 6 },
        { x: 13, y: 7,  directions: 'e',  functions: 'cw',  color: 6 },
        // Back arm (S) - 5 LEDs (WHITE)
        { x: 8,  y: 9,  directions: 's',  functions: 'c',   color: 1 },
        { x: 8,  y: 10, directions: 's',  functions: 'c',   color: 1 },
        { x: 8,  y: 11, directions: 's',  functions: 'c',   color: 1 },
        { x: 8,  y: 12, directions: 's',  functions: 'c',   color: 1 },
        { x: 8,  y: 13, directions: 's',  functions: 'cwi', color: 1 },
        // Left arm (W) - 5 LEDs (RED - port side)
        { x: 2,  y: 8,  directions: 'w',  functions: 'cwi', color: 2 },
        { x: 3,  y: 8,  directions: 'w',  functions: 'c',   color: 2 },
        { x: 4,  y: 8,  directions: 'w',  functions: 'c',   color: 2 },
        { x: 5,  y: 8,  directions: 'w',  functions: 'c',   color: 2 },
        { x: 6,  y: 8,  directions: 'w',  functions: 'c',   color: 2 },
    ],
    wing: [
        // Left wing row at y=7 - 10 LEDs (RED - port side)
        { x: 0,  y: 7,  directions: 'w',  functions: 'cwi', color: 2 },
        { x: 1,  y: 7,  directions: 'w',  functions: 'c',   color: 2 },
        { x: 2,  y: 7,  directions: 'w',  functions: 'c',   color: 2 },
        { x: 3,  y: 7,  directions: 'w',  functions: 'c',   color: 2 },
        { x: 4,  y: 7,  directions: 'w',  functions: 'c',   color: 2 },
        { x: 5,  y: 7,  directions: 'w',  functions: 'c',   color: 2 },
        { x: 6,  y: 7,  directions: 'e',  functions: 'c',   color: 6 },
        { x: 7,  y: 7,  directions: 'e',  functions: 'c',   color: 6 },
        { x: 8,  y: 7,  directions: 'e',  functions: 'c',   color: 6 },
        { x: 9,  y: 7,  directions: 'e',  functions: 'cw',  color: 6 },
        // Right wing row at y=9 - 10 LEDs (RED left, GREEN right)
        { x: 6,  y: 9,  directions: 'w',  functions: 'cwi', color: 2 },
        { x: 7,  y: 9,  directions: 'w',  functions: 'c',   color: 2 },
        { x: 8,  y: 9,  directions: 'w',  functions: 'c',   color: 2 },
        { x: 9,  y: 9,  directions: 'w',  functions: 'c',   color: 2 },
        { x: 10, y: 9,  directions: 'w',  functions: 'c',   color: 2 },
        { x: 11, y: 9,  directions: 'e',  functions: 'c',   color: 6 },
        { x: 12, y: 9,  directions: 'e',  functions: 'c',   color: 6 },
        { x: 13, y: 9,  directions: 'e',  functions: 'c',   color: 6 },
        { x: 14, y: 9,  directions: 'e',  functions: 'c',   color: 6 },
        { x: 15, y: 9,  directions: 'e',  functions: 'cw',  color: 6 },
    ],
};

export default LED_STRIP_PRESETS;
