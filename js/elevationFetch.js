'use strict';

// opentopodata allows one request per second per client; anything faster is answered
// with 429 and shows up in the console as a failed request. Every elevation lookup
// goes through this gate, which spaces the requests out - callers reserve their slot
// in call order and otherwise just fetch.
let nextSlot = 0;

export default async function elevationFetch(url, options) {
    const now = Date.now();
    const wait = Math.max(0, nextSlot - now);
    nextSlot = now + wait + 1100;
    if (wait > 0) {
        await new Promise(resolve => setTimeout(resolve, wait));
    }
    return fetch(url, options);
}
