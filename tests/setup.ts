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
            dispatchEvent: () => false,
        } as any;
    };
}

if (
    typeof globalThis !== "undefined" &&
    typeof (globalThis as any).ResizeObserver !== "function"
) {
    (globalThis as any).ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
}

if (
    typeof globalThis !== "undefined" &&
    typeof (globalThis as any).IntersectionObserver !== "function"
) {
    (globalThis as any).IntersectionObserver = class {
        constructor(_cb: any) {}
        observe() {}
        unobserve() {}
        disconnect() {}
    };
}

if (
    typeof globalThis !== "undefined" &&
    typeof (globalThis as any).HTMLDialogElement !== "undefined"
) {
    const proto = (globalThis as any).HTMLDialogElement?.prototype;
    if (proto && typeof proto.showModal !== "function") {
        proto.showModal = () => undefined;
    }
    if (proto && typeof proto.show !== "function") {
        proto.show = () => undefined;
    }
    if (proto && typeof proto.close !== "function") {
        proto.close = () => undefined;
    }
}

// JSDOM doesn't implement Web Animations; Svelte transitions may call element.animate().
if (
    typeof Element !== "undefined" &&
    typeof (Element.prototype as any).animate !== "function"
) {
    (Element.prototype as any).animate = () => {
        const animation = {
            onfinish: null as null | (() => void),
            finished: Promise.resolve(),
            cancel: () => undefined,
            play: () => undefined,
            pause: () => undefined,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
        };
        return animation;
    };
}
