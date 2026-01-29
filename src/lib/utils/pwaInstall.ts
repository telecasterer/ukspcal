
// --- PWA install helpers and types ---
import { isIosUserAgent } from "./inAppBrowser";


// Type for the browser's beforeinstallprompt event (PWA install prompt)
export type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>;
};


/**
 * Returns true if the browser is running in standalone mode (iOS Safari)
 */
export function getNavigatorStandalone(navigatorLike: unknown): boolean {
	return Boolean((navigatorLike as { standalone?: boolean } | null | undefined)?.standalone);
}


/**
 * Returns true if the display-mode media query matches 'standalone'
 */
export function getDisplayModeStandalone(matchMediaResult: MediaQueryList | null | undefined): boolean {
	return Boolean(matchMediaResult?.matches);
}


/**
 * Computes whether the app is running standalone (PWA or iOS)
 */
export function computeIsStandalone(options: {
	userAgent: string;
	displayModeStandalone: boolean;
	navigatorStandalone: boolean;
}): boolean {
	const iosStandalone = isIosUserAgent(options.userAgent) && options.navigatorStandalone;
	return options.displayModeStandalone || iosStandalone;
}


/**
 * Returns true if we should show iOS install help (not standalone, on iOS)
 */
export function shouldShowIosInstallHelp(options: { userAgent: string; isStandalone: boolean }): boolean {
	return isIosUserAgent(options.userAgent) && !options.isStandalone;
}
