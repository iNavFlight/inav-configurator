'use strict';

// magLearnFlags_e in the firmware's sensors/compass_learn.h
export const MAG_LEARN_FLAG = {
    COLLECTING: 1,
    PAUSED: 1 << 1,
    ATTITUDE_FIT: 1 << 2,
    MISFIT: 1 << 3,
    SAVE_DUE: 1 << 4,
    FEW_SECTORS: 1 << 5,
    FEW_HEADINGS: 1 << 6,
    NOT_SPHERE: 1 << 7,
    OFF_SCALE: 1 << 8,
    STEP_TOO_BIG: 1 << 9,
    SAVED: 1 << 10,
    DISARMED_FLYING: 1 << 11,
    DECLINATION_OFF: 1 << 12,
    FITS_DISAGREE: 1 << 13,
    CONFIRMED: 1 << 14,
};

// What the fit against the attitude (heading from GPS) found wrong with the compass, as sentences after the status
function attitudeNotes(learn, getMessage) {
    const notes = [];
    if (learn.flags & MAG_LEARN_FLAG.MISFIT) {
        notes.push(getMessage('magLearnMisfit'));
    }
    if (learn.flags & MAG_LEARN_FLAG.DECLINATION_OFF) {
        // The fitted field is north, west, up: east of north is a negative west component
        const declination = -Math.atan2(learn.field[1], learn.field[0]) * 180 / Math.PI;
        notes.push(getMessage('magLearnDeclinationOff', [declination.toFixed(0)]));
    }
    if (learn.yawTrimDelta) {
        notes.push(getMessage('magLearnYawTrim', [(learn.yawTrimDelta / 10).toFixed(1)]));
    }
    return notes;
}

// The yaw trim the last flight's fit arrived at, in decidegrees, or null without one
export function magLearnedYawTrim(learn, storedDecidegrees) {
    if (!learn.supported || !(learn.flags & MAG_LEARN_FLAG.ATTITUDE_FIT) || !Number.isFinite(storedDecidegrees)) {
        return null;
    }
    return learn.flags & MAG_LEARN_FLAG.SAVED ? storedDecidegrees : storedDecidegrees + learn.yawTrimDelta;
}

function withNotes(text, learn, getMessage) {
    return [text, ...attitudeNotes(learn, getMessage)].join(' ');
}

// A fit ran and left an estimate in delta, saved or not
const FIT_FLAGS = MAG_LEARN_FLAG.ATTITUDE_FIT | MAG_LEARN_FLAG.SAVE_DUE | MAG_LEARN_FLAG.SAVED | MAG_LEARN_FLAG.CONFIRMED |
    MAG_LEARN_FLAG.NOT_SPHERE | MAG_LEARN_FLAG.OFF_SCALE | MAG_LEARN_FLAG.STEP_TOO_BIG | MAG_LEARN_FLAG.FITS_DISAGREE;

// The offsets the last flight's fit arrived at, or null without one. After a save the stored ones already hold them.
export function magLearnedZero(learn, stored) {
    if (!learn.supported || !(learn.flags & FIT_FLAGS)) {
        return null;
    }
    const saved = learn.flags & MAG_LEARN_FLAG.SAVED;
    const learned = {};
    ['X', 'Y', 'Z'].forEach(function (axis, i) {
        learned[axis] = saved ? stored[axis] : stored[axis] + learn.delta[i];
    });
    return learned;
}

// The firmware resets this state at every arming and keeps it in RAM, so it covers the last flight since power-on.
// getMessage is i18n.getMessage, passed in to keep this free of the app's modules.
export function magLearnStatusText(learn, calibrated, getMessage) {
    if (!calibrated) {
        return getMessage('magLearnNeedsCalibration');
    }
    if (learn.flags & (MAG_LEARN_FLAG.COLLECTING | MAG_LEARN_FLAG.PAUSED)) {
        if (learn.flags & MAG_LEARN_FLAG.ATTITUDE_FIT) {
            return withNotes(getMessage('magLearnArmedAttitude', learn.delta), learn, getMessage);
        }
        return withNotes(getMessage('magLearnArmed', [learn.sectors, learn.headings]), learn, getMessage);
    }
    if (learn.flags & MAG_LEARN_FLAG.SAVED) {
        return withNotes(getMessage('magLearnSaved', learn.delta), learn, getMessage);
    }
    if (learn.flags & MAG_LEARN_FLAG.DISARMED_FLYING) {
        return getMessage('magLearnDisarmedFlying');
    }
    if (learn.flags & MAG_LEARN_FLAG.CONFIRMED) {
        return withNotes(getMessage('magLearnConfirmed'), learn, getMessage);
    }
    // Disarmed: the firmware waits out the emergency rearm window, and for the aircraft to be still, before it saves
    if (learn.flags & MAG_LEARN_FLAG.SAVE_DUE) {
        return withNotes(getMessage('magLearnPending'), learn, getMessage);
    }

    const reasons = [];
    if (learn.flags & MAG_LEARN_FLAG.FITS_DISAGREE) {
        reasons.push(getMessage('magLearnFitsDisagree'));
    }
    if (learn.flags & MAG_LEARN_FLAG.FEW_HEADINGS) {
        reasons.push(getMessage('magLearnFewHeadings', [learn.headings]));
    }
    if (learn.flags & MAG_LEARN_FLAG.FEW_SECTORS) {
        reasons.push(getMessage('magLearnFewSectors', [learn.sectors]));
    }
    if (learn.flags & MAG_LEARN_FLAG.NOT_SPHERE) {
        reasons.push(getMessage('magLearnNotSphere', [(learn.spread / 10).toFixed(1)]));
    }
    if (learn.flags & MAG_LEARN_FLAG.OFF_SCALE) {
        reasons.push(getMessage('magLearnOffScale'));
    }
    if (learn.flags & MAG_LEARN_FLAG.STEP_TOO_BIG) {
        reasons.push(getMessage('magLearnStepTooBig', learn.delta));
    }
    if (reasons.length === 0) {
        return getMessage('magLearnNoFlight');
    }
    // Already translated text: escaping it again would show an apostrophe as &#39;
    return withNotes(getMessage('magLearnNotSaved', { 1: reasons.join('; '), interpolation: { escapeValue: false } }), learn, getMessage);
}
