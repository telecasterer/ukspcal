/**
 * Detect if the user agent is Facebook's in-app browser.
 */
export function isFacebookInAppBrowserUserAgent(userAgent: string): boolean {
    return /FBAN|FBAV/i.test(userAgent ?? "");
}

/**
 * Detect if the user agent is an iOS device.
 */
export function isIosUserAgent(userAgent: string): boolean {
    return /iPad|iPhone|iPod/i.test(userAgent ?? "");
}

/**
 * Check if the URL has forceFbInApp=1 query param.
 */
export function isForceFacebookInAppEnabled(href: string): boolean {
    try {
        const url = new URL(href);
        return url.searchParams.get("forceFbInApp") === "1";
    } catch {
        return false;
    }
}

/**
 * Detect if the current environment is Facebook's in-app browser, using user agent and URL.
 */
export function detectFacebookInAppBrowser(options: {
    userAgent: string;
    href: string;
}): boolean {
    return (
        isForceFacebookInAppEnabled(options.href) ||
        isFacebookInAppBrowserUserAgent(options.userAgent)
    );
}

/**
 * Detect Facebook's in-app browser using window.navigator and window.location.
 */
export function detectFacebookInAppBrowserFromWindow(): boolean {
    if (typeof window === "undefined") return false;
    return detectFacebookInAppBrowser({
        userAgent: navigator.userAgent ?? "",
        href: window.location.href,
    });
}
