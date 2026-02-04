import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    fetchHolidaysForCountryAndYear,
    fetchHolidaysForCountryAndYears,
    type NagerHoliday
} from '../src/lib/services/nagerHolidayService';

describe('nagerHolidayService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchHolidaysForCountryAndYear', () => {
        it('fetches holidays for a given country and year', async () => {
            const mockHolidays: NagerHoliday[] = [
                {
                    date: '2026-01-01',
                    localName: 'Jour de l\'an',
                    name: 'New Year',
                    countryCode: 'FR',
                    fixed: true,
                    global: true,
                    type: 'Public',
                },
                {
                    date: '2026-07-14',
                    localName: 'Fête nationale',
                    name: 'Bastille Day',
                    countryCode: 'FR',
                    fixed: true,
                    global: true,
                    type: 'Public',
                },
            ];

            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => mockHolidays,
            });

            const result = await fetchHolidaysForCountryAndYear('FR', 2026);

            expect(result).toEqual(mockHolidays);
            expect(global.fetch).toHaveBeenCalledWith(
                'https://date.nager.at/api/v3/PublicHolidays/2026/FR'
            );
        });

        it('returns empty array on API error', async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: false,
                statusText: 'Not Found',
            });

            const result = await fetchHolidaysForCountryAndYear('XX', 2026);

            expect(result).toEqual([]);
        });

        it('returns empty array on network error', async () => {
            global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

            const result = await fetchHolidaysForCountryAndYear('FR', 2026);

            expect(result).toEqual([]);
        });

        it('handles malformed API response gracefully', async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => {
                    throw new Error('Invalid JSON');
                },
            });

            const result = await fetchHolidaysForCountryAndYear('DE', 2026);

            expect(result).toEqual([]);
        });
    });

    describe('fetchHolidaysForCountryAndYears', () => {
        it('fetches holidays for multiple years and returns aggregated map', async () => {
            const mockHolidays2026: NagerHoliday[] = [
                {
                    date: '2026-01-01',
                    localName: 'New Year',
                    name: 'New Year',
                    countryCode: 'US',
                    fixed: true,
                    global: true,
                    type: 'Public',
                },
            ];

            const mockHolidays2027: NagerHoliday[] = [
                {
                    date: '2027-01-01',
                    localName: 'New Year',
                    name: 'New Year',
                    countryCode: 'US',
                    fixed: true,
                    global: true,
                    type: 'Public',
                },
            ];

            global.fetch = vi.fn()
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockHolidays2026,
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockHolidays2027,
                });

            const result = await fetchHolidaysForCountryAndYears('US', [2026, 2027]);

            expect(result).toEqual({
                '2026-01-01': 'New Year',
                '2027-01-01': 'New Year',
            });
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        it('handles mixed success and failure for multiple years', async () => {
            global.fetch = vi.fn()
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [
                        {
                            date: '2026-01-01',
                            name: 'New Year',
                            countryCode: 'ES',
                            fixed: true,
                            global: true,
                            localName: 'Año Nuevo',
                            type: 'Public',
                        },
                    ],
                })
                .mockResolvedValueOnce({
                    ok: false,
                    statusText: 'Not Found',
                });

            const result = await fetchHolidaysForCountryAndYears('ES', [2026, 2027]);

            expect(result).toEqual({
                '2026-01-01': 'New Year',
            });
        });

        it('returns empty map if all years fail', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

            const result = await fetchHolidaysForCountryAndYears('IT', [2026, 2027]);

            expect(result).toEqual({});
        });

        it('handles empty year array', async () => {
            const result = await fetchHolidaysForCountryAndYears('FR', []);

            expect(result).toEqual({});
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('deduplicates holidays on the same date', async () => {
            // Simulate case where two years might have same date (edge case)
            global.fetch = vi.fn()
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [
                        {
                            date: '2026-12-25',
                            name: 'Christmas',
                            countryCode: 'US',
                            fixed: true,
                            global: true,
                            localName: 'Christmas',
                            type: 'Public',
                        },
                    ],
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [
                        {
                            date: '2026-12-25',
                            name: 'Christmas Day',
                            countryCode: 'US',
                            fixed: true,
                            global: true,
                            localName: 'Christmas Day',
                            type: 'Public',
                        },
                    ],
                });

            const result = await fetchHolidaysForCountryAndYears('US', [2026, 2026]);

            // Last one wins in the aggregation
            expect(result['2026-12-25']).toBe('Christmas Day');
        });
    });
});
