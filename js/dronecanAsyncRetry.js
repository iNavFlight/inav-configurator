'use strict';

// The DroneCAN async request slot is a single shared resource: BUSY means
// something else (e.g. background node-name fetching) currently holds it,
// not that the request itself failed. dronecanAsyncPoll() retries a BUSY
// initial-request response instead of treating it as terminal, up to the
// same attempt budget used for polling the result afterward.
export const DRONECAN_ASYNC_REQUEST_STATUS_OK   = 0;
export const DRONECAN_ASYNC_REQUEST_STATUS_BUSY = 1;

export function shouldRetryBusyRequest(status, attempts, maxAttempts) {
    return status === DRONECAN_ASYNC_REQUEST_STATUS_BUSY && attempts < maxAttempts;
}
