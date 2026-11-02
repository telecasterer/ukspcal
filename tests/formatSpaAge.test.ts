import { describe, expect, it } from "vitest";
import { formatSpaAge } from "#lib/utils/statePensionAge";

describe("formatSpaAge", () => {
    it("separates the years from the months with a space", () => {
        expect(formatSpaAge(66, 9)).toBe("Age 66 years 9 months");
    });
    it("shows just the age when there are no extra months", () => {
        expect(formatSpaAge(66, 0)).toBe("Age 66");
    });
});
