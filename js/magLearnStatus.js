'use strict';

// magLearnFlags_e in the firmware's sensors/compass_learn.h
export const MAG_LEARN_FLAG = {
    COLLECTING: 1,
    PAUSED: 1 << 1,
    SAVE_DUE: 1 << 4,
    FEW_SECTORS: 1 << 5,
    FEW_HEADINGS: 1 << 6,
    NOT_SPHERE: 1 << 7,
    OFF_SCALE: 1 << 8,
    STEP_TOO_BIG: 1 << 9,
    SAVED: 1 << 10,
    DISARMED_FLYING: 1 << 11,
};

// The firmware resets this state at every arming and keeps it in RAM, so it covers the last flight since power-on.
// getMessage is i18n.getMessage, passed in to keep this free of the app's modules.
export function magLearnStatusText(learn, calibrated, getMessage) {
    if (!calibrated) {
        return getMessage('magLearnNeedsCalibration');
    }
    if (learn.flags & (MAG_LEARN_FLAG.COLLECTING | MAG_LEARN_FLAG.PAUSED)) {
        return getMessage('magLearnArmed', [learn.sectors, learn.headings]);
    }
    if (learn.flags & MAG_LEARN_FLAG.SAVED) {
        return getMessage('magLearnSaved', learn.delta);
    }
    if (learn.flags & MAG_LEARN_FLAG.DISARMED_FLYING) {
        return getMessage('magLearnDisarmedFlying');
    }
    // Disarmed: the firmware waits out the emergency rearm window, and for the aircraft to be still, before it saves
    if (learn.flags & MAG_LEARN_FLAG.SAVE_DUE) {
        return getMessage('magLearnPending');
    }

    const reasons = [];
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
    return getMessage('magLearnNotSaved', { 1: reasons.join('; '), interpolation: { escapeValue: false } });
}
