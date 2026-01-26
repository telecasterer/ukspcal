import { isIosUserAgent } from "./inAppBrowser";

export type BeforeInstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>;
};

export function getNavigatorStandalone(navigatorLike: unknown): boolean {
	return Boolean((navigatorLike as { standalone?: boolean } | null | undefined)?.standalone);
}

export function getDisplayModeStandalone(matchMediaResult: MediaQueryList | null | undefined): boolean {
	return Boolean(matchMediaResult?.matches);
}

export function computeIsStandalone(options: {
	userAgent: string;
	displayModeStandalone: boolean;
	navigatorStandalone: boolean;
}): boolean {
	const iosStandalone = isIosUserAgent(options.userAgent) && options.navigatorStandalone;
	return options.displayModeStandalone || iosStandalone;
}

export function shouldShowIosInstallHelp(options: { userAgent: string; isStandalone: boolean }): boolean {
	return isIosUserAgent(options.userAgent) && !options.isStandalone;
}
