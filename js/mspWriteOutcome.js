'use strict';

/**
 * True when the FC answered with '!' (MSP_RESULT_ERROR): the reply still
 * completes the request, flagged with unsupported, but the FC did not act on
 * it - nothing stored, nothing started.
 */
export function refusedByFc(result) {
    return Boolean(result?.unsupported);
}

/**
 * A write landed unless the queue dropped it (the literal false) or the FC
 * refused it.
 */
function writeLanded(result) {
    return result !== false && !refusedByFc(result);
}

/**
 * Settles an MSP.promise() write into true (landed) or false (refused by the
 * FC, refused locally, or dropped by the queue after exhausting retries -
 * MSP.promise() resolves with false rather than rejecting for that case). The
 * success callback runs only when the write actually landed; its own exceptions are not swallowed
 * here, so a bug in a save-chain continuation surfaces instead of looking
 * like a routine refusal.
 */
export function resolveMspWrite(mspPromise, callback) {
    return mspPromise.then(
        writeLanded,
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
 * of a chained send with this skips it for that case and for an '!' reply,
 * so the chain stops instead of advancing past a write that never landed.
 */
export function guardMspCallback(onFinish) {
    return function (result) {
        if (writeLanded(result) && onFinish) {
            onFinish(result);
        }
    };
}
