import { describe, it, expect } from 'vitest';
import BitHelper from '../../js/bitHelper.js';

describe('BitHelper', () => {
    describe('highByte', () => {
        it('extracts high byte from 16-bit value', () => {
            expect(BitHelper.highByte(0xFF00)).toBe(0xFF);
            expect(BitHelper.highByte(0x1234)).toBe(0x12);
            expect(BitHelper.highByte(0x00FF)).toBe(0x00);
        });

        it('handles zero', () => {
            expect(BitHelper.highByte(0)).toBe(0);
        });

        it('handles max 16-bit value', () => {
            expect(BitHelper.highByte(0xFFFF)).toBe(0xFF);
        });
    });

    describe('lowByte', () => {
        it('extracts low byte from 16-bit value', () => {
            expect(BitHelper.lowByte(0xFF00)).toBe(0x00);
            expect(BitHelper.lowByte(0x1234)).toBe(0x34);
            expect(BitHelper.lowByte(0x00FF)).toBe(0xFF);
        });

        it('handles zero', () => {
            expect(BitHelper.lowByte(0)).toBe(0);
        });

        it('handles max 16-bit value', () => {
            expect(BitHelper.lowByte(0xFFFF)).toBe(0xFF);
        });
    });

    describe('specificByte', () => {
        it('extracts byte at specified position', () => {
            const value = 0x12345678;
            expect(BitHelper.specificByte(value, 0)).toBe(0x78);
            expect(BitHelper.specificByte(value, 1)).toBe(0x56);
            expect(BitHelper.specificByte(value, 2)).toBe(0x34);
            expect(BitHelper.specificByte(value, 3)).toBe(0x12);
        });

        it('handles zero', () => {
            expect(BitHelper.specificByte(0, 0)).toBe(0);
            expect(BitHelper.specificByte(0, 1)).toBe(0);
        });
    });

    describe('bit_check', () => {
        it('returns true when bit is set', () => {
            expect(BitHelper.bit_check(0b00000001, 0)).toBe(true);
            expect(BitHelper.bit_check(0b00000010, 1)).toBe(true);
            expect(BitHelper.bit_check(0b10000000, 7)).toBe(true);
        });

        it('returns false when bit is not set', () => {
            expect(BitHelper.bit_check(0b00000001, 1)).toBe(false);
            expect(BitHelper.bit_check(0b00000000, 0)).toBe(false);
            expect(BitHelper.bit_check(0b01111111, 7)).toBe(false);
        });

        it('handles checking multiple bits', () => {
            const flags = 0b10101010;
            expect(BitHelper.bit_check(flags, 1)).toBe(true);
            expect(BitHelper.bit_check(flags, 3)).toBe(true);
            expect(BitHelper.bit_check(flags, 5)).toBe(true);
            expect(BitHelper.bit_check(flags, 7)).toBe(true);
            expect(BitHelper.bit_check(flags, 0)).toBe(false);
            expect(BitHelper.bit_check(flags, 2)).toBe(false);
        });
    });

    describe('bit_set', () => {
        it('sets the specified bit', () => {
            expect(BitHelper.bit_set(0, 0)).toBe(0b00000001);
            expect(BitHelper.bit_set(0, 7)).toBe(0b10000000);
        });

        it('preserves existing bits', () => {
            expect(BitHelper.bit_set(0b00000001, 1)).toBe(0b00000011);
            expect(BitHelper.bit_set(0b10101010, 0)).toBe(0b10101011);
        });

        it('is idempotent when bit already set', () => {
            expect(BitHelper.bit_set(0b00000001, 0)).toBe(0b00000001);
        });
    });

    describe('bit_clear', () => {
        it('clears the specified bit', () => {
            expect(BitHelper.bit_clear(0b00000001, 0)).toBe(0);
            expect(BitHelper.bit_clear(0b10000000, 7)).toBe(0);
        });

        it('preserves other bits', () => {
            expect(BitHelper.bit_clear(0b11111111, 0)).toBe(0b11111110);
            expect(BitHelper.bit_clear(0b11111111, 4)).toBe(0b11101111);
        });

        it('is idempotent when bit already cleared', () => {
            expect(BitHelper.bit_clear(0, 0)).toBe(0);
            expect(BitHelper.bit_clear(0b11111110, 0)).toBe(0b11111110);
        });
    });

    describe('combined operations', () => {
        it('can set and clear bits correctly', () => {
            let value = 0;
            value = BitHelper.bit_set(value, 0);
            value = BitHelper.bit_set(value, 2);
            value = BitHelper.bit_set(value, 4);
            expect(value).toBe(0b00010101);

            value = BitHelper.bit_clear(value, 2);
            expect(value).toBe(0b00010001);
            expect(BitHelper.bit_check(value, 0)).toBe(true);
            expect(BitHelper.bit_check(value, 2)).toBe(false);
            expect(BitHelper.bit_check(value, 4)).toBe(true);
        });
    });
});
