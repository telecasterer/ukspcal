import { describe, expect, it } from "vitest";
import {
	computeIsStandalone,
	getDisplayModeStandalone,
	getNavigatorStandalone,
	shouldShowIosInstallHelp
} from "../src/lib/utils/pwaInstall";

describe("pwaInstall utils", () => {
	it("getNavigatorStandalone reads iOS standalone flag", () => {
		expect(getNavigatorStandalone({ standalone: true })).toBe(true);
		expect(getNavigatorStandalone({ standalone: false })).toBe(false);
		expect(getNavigatorStandalone({})).toBe(false);
		expect(getNavigatorStandalone(null)).toBe(false);
	});

	it("getDisplayModeStandalone reads matchMedia result", () => {
		expect(getDisplayModeStandalone({ matches: true } as MediaQueryList)).toBe(true);
		expect(getDisplayModeStandalone({ matches: false } as MediaQueryList)).toBe(false);
		expect(getDisplayModeStandalone(null)).toBe(false);
	});

	it("computeIsStandalone returns true for display-mode standalone", () => {
		expect(
			computeIsStandalone({
				userAgent: "Mozilla/5.0 (Linux; Android 14)",
				displayModeStandalone: true,
				navigatorStandalone: false
			})
		).toBe(true);
	});

	it("computeIsStandalone returns true for iOS navigator.standalone", () => {
		expect(
			computeIsStandalone({
				userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
				displayModeStandalone: false,
				navigatorStandalone: true
			})
		).toBe(true);
	});

	it("computeIsStandalone ignores navigator.standalone on non-iOS", () => {
		expect(
			computeIsStandalone({
				userAgent: "Mozilla/5.0 (Linux; Android 14)",
				displayModeStandalone: false,
				navigatorStandalone: true
			})
		).toBe(false);
	});

	it("shouldShowIosInstallHelp only on iOS when not standalone", () => {
		expect(
			shouldShowIosInstallHelp({
				userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
				isStandalone: false
			})
		).toBe(true);

		expect(
			shouldShowIosInstallHelp({
				userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
				isStandalone: true
			})
		).toBe(false);

		expect(
			shouldShowIosInstallHelp({
				userAgent: "Mozilla/5.0 (Linux; Android 14)",
				isStandalone: false
			})
		).toBe(false);
	});
});
