import "@testing-library/jest-dom/vitest";
import "@testing-library/svelte/vitest";

// Flowbite-Svelte (and Svelte's media-query reactivity) may rely on these browser APIs.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
	window.matchMedia = (query: string) => {
		return {
			matches: false,
			media: query,
			onchange: null,
			addEventListener: () => undefined,
			removeEventListener: () => undefined,
			// Deprecated API (some libs still call it)
			addListener: () => undefined,
			removeListener: () => undefined,
			dispatchEvent: () => false
		} as any;
	};
}

if (typeof globalThis !== "undefined" && typeof (globalThis as any).ResizeObserver !== "function") {
	(globalThis as any).ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}

if (typeof globalThis !== "undefined" && typeof (globalThis as any).IntersectionObserver !== "function") {
	(globalThis as any).IntersectionObserver = class {
		constructor(_cb: any) {}
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}
