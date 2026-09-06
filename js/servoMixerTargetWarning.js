'use strict';

// A servo target can't be higher than the number of servo mixer rules that
// exist (1-based: N rules means valid targets are #1..#N). Returns details
// for the warning, or null if `enteredTarget` is valid.
export function getServoTargetWarning(rules, enteredTarget) {
    const ruleCount = rules.filter((rule) => rule.isUsed()).length;

    if (enteredTarget <= ruleCount) {
        return null;
    }

    return { ruleCount, enteredTarget };
}
