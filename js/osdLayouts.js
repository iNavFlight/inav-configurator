'use strict';

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
