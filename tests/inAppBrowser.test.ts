import { describe, expect, it } from "vitest";
import {
    detectFacebookInAppBrowser,
    isFacebookInAppBrowserUserAgent,
    isForceFacebookInAppEnabled,
    isIosUserAgent,
} from "../src/lib/utils/inAppBrowser";

describe("inAppBrowser utils", () => {
    it("detects Facebook/Messenger webview UA tokens", () => {
        expect(
            isFacebookInAppBrowserUserAgent("Mozilla/5.0 FBAN/FBIOS FBAV/123.0")
        ).toBe(true);
        expect(isFacebookInAppBrowserUserAgent("Mozilla/5.0 (iPhone)")).toBe(
            false
        );
    });

    it("supports forceFbInApp=1 query param", () => {
        expect(
            isForceFacebookInAppEnabled("https://example.com/?forceFbInApp=1")
        ).toBe(true);
        expect(
            isForceFacebookInAppEnabled("https://example.com/?forceFbInApp=0")
        ).toBe(false);
        expect(isForceFacebookInAppEnabled("not-a-url")).toBe(false);
    });

    it("detectFacebookInAppBrowser combines UA + force param", () => {
        expect(
            detectFacebookInAppBrowser({
                userAgent: "Mozilla/5.0 (iPhone)",
                href: "https://example.com/",
            })
        ).toBe(false);

        expect(
            detectFacebookInAppBrowser({
                userAgent: "Mozilla/5.0 (iPhone)",
                href: "https://example.com/?forceFbInApp=1",
            })
        ).toBe(true);

        expect(
            detectFacebookInAppBrowser({
                userAgent: "Mozilla/5.0 FBAV/1",
                href: "https://example.com/",
            })
        ).toBe(true);
    });

    it("detects iOS user agents", () => {
        expect(
            isIosUserAgent(
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"
            )
        ).toBe(true);
        expect(
            isIosUserAgent("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")
        ).toBe(true);
        expect(isIosUserAgent("Mozilla/5.0 (Linux; Android 14)")).toBe(false);
    });
});
