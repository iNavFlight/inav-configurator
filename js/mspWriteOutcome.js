'use strict';

/**
 * Settles an MSP.promise() write into true (landed) or false (refused, or
 * dropped by the queue after exhausting retries - MSP.promise() resolves
 * with false rather than rejecting for that case). The success callback runs
 * only when the write actually landed; its own exceptions are not swallowed
 * here, so a bug in a save-chain continuation surfaces instead of looking
 * like a routine refusal.
 */
export function resolveMspWrite(mspPromise, callback) {
    return mspPromise.then(
        function (result) { return result !== false; },
        function () { return false; }
    ).then(function (landed) {
        if (landed && callback) {
            callback();
        }
        return landed;
    });
}
