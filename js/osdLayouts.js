'use strict';

// OSD ALT 1, 2 and 3 have the permanent mode ids 42, 43 and 44
const OSD_ALT_MODE_ID_BEFORE_FIRST = 41;
// Logic condition operation "Set OSD Layout", and its operand type for a fixed value
const SET_OSD_LAYOUT = 32;
const OPERAND_VALUE = 0;

// What can show each layout in flight: the firmware picks OSD ALT 3, 2 or 1 when its mode is on,
// then the layout a logic condition sets (layout null when taken from a value), then the default
export function layoutReach(modeRanges, conditions, layoutCount) {
    const ranges = [[]];
    const reached = [true];
    for (let layout = 1; layout < layoutCount; layout++) {
        ranges[layout] = modeRanges.filter(function (modeRange) {
            return modeRange.id == OSD_ALT_MODE_ID_BEFORE_FIRST + layout && modeRange.range.start < modeRange.range.end;
        });
        reached[layout] = ranges[layout].length > 0;
    }

    const picks = [];
    conditions.forEach(function (condition, index) {
        if (condition.enabled && condition.operation == SET_OSD_LAYOUT) {
            // The firmware brings a fixed value into the layout range
            const fixed = Math.min(Math.max(condition.operandAValue, 0), layoutCount - 1);
            picks.push({index: index, layout: condition.operandAType == OPERAND_VALUE ? fixed : null});
        }
    });
    picks.forEach(function (pick) {
        for (let layout = 1; layout < layoutCount; layout++) {
            if (pick.layout === null || pick.layout == layout) {
                reached[layout] = true;
            }
        }
    });

    return {ranges: ranges, reached: reached, picks: picks};
}

// Positions only, what each layout shows stays: the { layout, id, x, y, position } to write. The layouts
// stay as they are, so a write that fails leaves nothing to undo and a second copy tries it again.
// An element hidden in the source has no position anyone chose there, so it keeps its own.
export function positionsToCopy(layouts, from) {
    const changes = [];
    layouts.forEach(function (items, layout) {
        if (layout == from) {
            return;
        }
        items.forEach(function (target, id) {
            const source = layouts[from][id];
            if (!source.isVisible || (target.x == source.x && target.y == source.y)) {
                return;
            }
            changes.push({layout: layout, id: id, x: source.x, y: source.y, position: source.position});
        });
    });
    return changes;
}
