'use strict';

// Offer a reasonable choice of logging rates (if people want weird steps they can use CLI)
const PRESET_RATES = [
    {num: 1, denom: 32},
    {num: 1, denom: 16},
    {num: 1, denom: 8},
    {num: 1, denom: 5},
    {num: 1, denom: 4},
    {num: 1, denom: 3},
    {num: 1, denom: 2},
    {num: 2, denom: 3},
    {num: 3, denom: 4},
    {num: 4, denom: 5},
    {num: 7, denom: 8},
    {num: 1, denom: 1},
];

function gcd(a, b) {
    while (b !== 0) {
        [a, b] = [b, a % b];
    }
    return a;
}

// The configured rate is always offered, so one set over the CLI (e.g. 1/256) survives a save
export function buildLoggingRateOptions(rateNum, rateDenom) {
    // Anything but two positive integers falls back to 1/1; the firmware logs every iteration then
    if (!(Number.isInteger(rateNum) && Number.isInteger(rateDenom) && rateNum > 0 && rateDenom > 0)) {
        rateNum = 1;
        rateDenom = 1;
    }

    const
        divisor = gcd(rateNum, rateDenom),
        current = {num: rateNum / divisor, denom: rateDenom / divisor},
        rates = PRESET_RATES.filter((rate) => rate.num !== current.num || rate.denom !== current.denom);

    rates.push(current);
    rates.sort((a, b) => a.num / a.denom - b.num / b.denom);

    return {
        selected: current.num + '/' + current.denom,
        options: rates.map((rate) => {
            const
                value = rate.num + '/' + rate.denom,
                ratio = rate.num / rate.denom,
                percent = Math.round(ratio * 100),
                // Below 1% a rounded percentage would read 0%
                shown = ratio < 0.01 ? Number((ratio * 100).toPrecision(2)) : percent;

            return {value: value, percent: percent, label: value + ' (' + shown + '%)'};
        }),
    };
}
