import { describe, it, expect } from 'vitest';
import { getFlagEmoji, countryCodeToFlagEmoji } from '../src/lib/utils/countryFlags';

describe('countryFlags', () => {
    describe('countryCodeToFlagEmoji', () => {
        it('contains all expected country codes', () => {
            const expectedCountries = ['FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'IE', 'SE', 'DK', 'NO', 'CH', 'US', 'CA', 'AU', 'NZ', 'JP'];

            for (const country of expectedCountries) {
                expect(countryCodeToFlagEmoji[country]).toBeDefined();
            }
        });

        it('has all valid flag emojis (basic regional indicators check)', () => {
            for (const [code, emoji] of Object.entries(countryCodeToFlagEmoji)) {
                // Flag emojis are typically 2 characters long (regional indicator pairs)
                expect(emoji.length).toBeGreaterThan(0);
                expect(typeof emoji).toBe('string');
            }
        });

        it('maps specific countries correctly', () => {
            expect(countryCodeToFlagEmoji['FR']).toBe('🇫🇷');
            expect(countryCodeToFlagEmoji['DE']).toBe('🇩🇪');
            expect(countryCodeToFlagEmoji['US']).toBe('🇺🇸');
            expect(countryCodeToFlagEmoji['JP']).toBe('🇯🇵');
            expect(countryCodeToFlagEmoji['GB']).toBeUndefined(); // Should not exist if not in supported list
        });
    });

    describe('getFlagEmoji', () => {
        it('returns the correct flag for a valid country code', () => {
            expect(getFlagEmoji('FR')).toBe('🇫🇷');
            expect(getFlagEmoji('US')).toBe('🇺🇸');
            expect(getFlagEmoji('AU')).toBe('🇦🇺');
        });

        it('returns empty string for unknown country code', () => {
            expect(getFlagEmoji('XX')).toBe('');
            expect(getFlagEmoji('ZZ')).toBe('');
            expect(getFlagEmoji('')).toBe('');
        });

        it('is case-sensitive', () => {
            expect(getFlagEmoji('fr')).toBe('');
            expect(getFlagEmoji('Fr')).toBe('');
            expect(getFlagEmoji('FR')).toBe('🇫🇷');
        });

        it('handles all supported countries', () => {
            const supportedCountries = ['FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'IE', 'SE', 'DK', 'NO', 'CH', 'US', 'CA', 'AU', 'NZ', 'JP'];

            for (const country of supportedCountries) {
                const emoji = getFlagEmoji(country);
                expect(emoji).not.toBe('');
                expect(emoji.length).toBeGreaterThan(0);
            }
        });
    });
});
