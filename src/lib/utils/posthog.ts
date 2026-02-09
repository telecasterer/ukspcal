import posthog from "posthog-js";
import { PUBLIC_POSTHOG_HOST, PUBLIC_POSTHOG_KEY } from "$env/static/public";

type PosthogEventProps = Record<string, string | number | boolean | null | undefined>;

let isInitialized = false;

export function initPosthog(): void {
	if (isInitialized) return;
	if (typeof window === "undefined") return;
	const apiKey = PUBLIC_POSTHOG_KEY?.trim();
	if (!apiKey) return;

	posthog.init(apiKey, {
		api_host: PUBLIC_POSTHOG_HOST?.trim() || "https://app.posthog.com",
		autocapture: true,
		capture_pageview: true
	});

	isInitialized = true;
}

export function capturePosthog(event: string, properties?: PosthogEventProps): void {
	if (!isInitialized) return;
	posthog.capture(event, properties);
}
