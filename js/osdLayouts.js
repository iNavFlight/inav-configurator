'use strict';

// Positions only, what each layout shows stays; returns the { layout, id } to save.
// An element hidden in the source has no position anyone chose there, so it keeps its own.
export function copyPositions(layouts, from) {
    const changed = [];
    layouts.forEach(function (items, layout) {
        if (layout == from) {
            return;
        }
        items.forEach(function (target, id) {
            const source = layouts[from][id];
            if (!source.isVisible || (target.x == source.x && target.y == source.y)) {
                return;
            }
            target.x = source.x;
            target.y = source.y;
            target.position = source.position;
            changed.push({layout: layout, id: id});
        });
    });
    return changed;
}
