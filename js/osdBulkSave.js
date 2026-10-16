'use strict';

/**
 * Ids whose entry differs between oldLayout and newLayout. Two hidden
 * entries count as unchanged whatever their stored position.
 */
export function changedItemIds(oldLayout, newLayout) {
    return Object.keys(newLayout).filter(function (id) {
        var before = oldLayout[id];
        var after = newLayout[id];
        if (before.isVisible === false && after.isVisible === false) {
            return false;
        }
        return before.x !== after.x || before.y !== after.y ||
            before.position !== after.position || before.isVisible !== after.isVisible;
    });
}

/** Ids that are visible in layout, i.e. the ones a "clear" has to write. */
export function visibleItemIds(layout) {
    return Object.keys(layout).filter(function (id) {
        return layout[id].isVisible === true;
    });
}

/**
 * Writes the given entries of layout one at a time with saveItem({id}).
 * layout is expected to already hold the requested values. On the first
 * refused write that entry and every one after it are put back from
 * oldLayout, so layout keeps matching what the flight controller holds and
 * a retry writes them again. Resolves true only if every write landed.
 */
export async function saveLayoutItems(layout, oldLayout, ids, saveItem) {
    for (var i = 0; i < ids.length; i++) {
        if (await saveItem({ id: ids[i] })) {
            continue;
        }
        ids.slice(i).forEach(function (id) {
            layout[id] = JSON.parse(JSON.stringify(oldLayout[id]));
        });
        return false;
    }
    return true;
}
