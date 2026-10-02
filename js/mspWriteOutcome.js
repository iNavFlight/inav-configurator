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

/**
 * Same idea as resolveMspWrite(), for a plain MSP.send_message() completion
 * callback instead of an MSP.promise(). MSP.send_message()'s callback fires
 * with the literal false MSP.promise() would otherwise reject on when the
 * queue drops the write after exhausting retries - wrapping the next step
 * of a chained send with this skips it for that case, so the chain stops
 * instead of advancing past a write that never landed.
 */
export function guardMspCallback(onFinish) {
    return function (result) {
        if (result !== false && onFinish) {
            onFinish(result);
        }
    };
}
