import { describe, it, expect } from 'vitest';
import { constrain, zeroPad, scaleRangeInt, wrap_360, rad2Deg } from '../../js/helpers.js';

describe('helpers.js', () => {
    describe('constrain', () => {
        it('returns input when within range', () => {
            expect(constrain(50, 0, 100)).toBe(50);
        });

        it('returns min when input is below min', () => {
            expect(constrain(-10, 0, 100)).toBe(0);
        });

        it('returns max when input is above max', () => {
            expect(constrain(150, 0, 100)).toBe(100);
        });

        it('handles negative ranges', () => {
            expect(constrain(-50, -100, -10)).toBe(-50);
            expect(constrain(-150, -100, -10)).toBe(-100);
            expect(constrain(0, -100, -10)).toBe(-10);
        });

        it('handles edge cases at boundaries', () => {
            expect(constrain(0, 0, 100)).toBe(0);
            expect(constrain(100, 0, 100)).toBe(100);
        });
    });

    describe('zeroPad', () => {
        it('pads single digit numbers', () => {
            expect(zeroPad(5, 2)).toBe('05');
            expect(zeroPad(5, 3)).toBe('005');
        });

        it('does not pad when width is met', () => {
            expect(zeroPad(12, 2)).toBe('12');
            expect(zeroPad(123, 3)).toBe('123');
        });

        it('does not truncate when number exceeds width', () => {
            expect(zeroPad(123, 2)).toBe('123');
        });

        it('handles zero', () => {
            expect(zeroPad(0, 2)).toBe('00');
        });

        it('handles strings', () => {
            expect(zeroPad('5', 3)).toBe('005');
        });
    });

    describe('scaleRangeInt', () => {
        it('scales value from one range to another', () => {
            // Scale 50 from [0, 100] to [0, 200]
            expect(scaleRangeInt(50, 0, 100, 0, 200)).toBe(100);
        });

        it('scales PWM range to percentage', () => {
            // RC PWM (1000-2000) to percentage (0-100)
            expect(scaleRangeInt(1500, 1000, 2000, 0, 100)).toBe(50);
            expect(scaleRangeInt(1000, 1000, 2000, 0, 100)).toBe(0);
            expect(scaleRangeInt(2000, 1000, 2000, 0, 100)).toBe(100);
        });

        it('handles inverted destination range', () => {
            expect(scaleRangeInt(0, 0, 100, 100, 0)).toBe(100);
            expect(scaleRangeInt(100, 0, 100, 100, 0)).toBe(0);
        });

        it('rounds to nearest integer', () => {
            // Result should be rounded
            expect(scaleRangeInt(33, 0, 100, 0, 10)).toBe(3);
        });
    });

    describe('wrap_360', () => {
        it('returns angle within 0-360 range', () => {
            expect(wrap_360(45)).toBe(45);
            expect(wrap_360(180)).toBe(180);
            expect(wrap_360(359)).toBe(359);
        });

        it('wraps angles >= 360', () => {
            expect(wrap_360(360)).toBe(0);
            expect(wrap_360(450)).toBe(90);
        });

        it('wraps negative angles', () => {
            expect(wrap_360(-10)).toBe(350);
            expect(wrap_360(-90)).toBe(270);
        });

        it('handles zero', () => {
            expect(wrap_360(0)).toBe(0);
        });
    });

    describe('rad2Deg', () => {
        it('converts radians to degrees', () => {
            expect(rad2Deg(Math.PI)).toBeCloseTo(180);
            expect(rad2Deg(Math.PI / 2)).toBeCloseTo(90);
            expect(rad2Deg(0)).toBe(0);
            expect(rad2Deg(2 * Math.PI)).toBeCloseTo(360);
        });
    });
});
