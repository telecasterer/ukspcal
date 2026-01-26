export function isFacebookInAppBrowserUserAgent(userAgent: string): boolean {
	return /FBAN|FBAV/i.test(userAgent ?? "");
}

export function isIosUserAgent(userAgent: string): boolean {
	return /iPad|iPhone|iPod/i.test(userAgent ?? "");
}

export function isForceFacebookInAppEnabled(href: string): boolean {
	try {
		const url = new URL(href);
		return url.searchParams.get("forceFbInApp") === "1";
	} catch {
		return false;
	}
}

export function detectFacebookInAppBrowser(options: { userAgent: string; href: string }): boolean {
	return (
		isForceFacebookInAppEnabled(options.href) ||
		isFacebookInAppBrowserUserAgent(options.userAgent)
	);
}
