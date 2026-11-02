import { ANDROID_PLAY_STORE_URL } from "#lib/config";
import { detectFacebookInAppBrowserFromWindow, isAndroidUserAgent } from "./inAppBrowser";
import {
    computeIsStandalone,
    getDisplayModeStandalone,
    getNavigatorStandalone,
    shouldShowIosInstallHelp,
    type BeforeInstallPromptEvent,
} from "./pwaInstall";

/**
 * Reactive state and handlers for the "Install" call to action: Android Play Store link,
 * the browser's install prompt, or iOS "Add to Home Screen" help.
 *
 * Call `mount()` from `onMount` and return its result as the cleanup function.
 */
export function createPwaInstall() {
    let isFacebookInAppBrowser = $state(false);
    let isAndroid = $state(false);
    let isStandalone = $state(false);
    let canInstallPwa = $state(false);
    let showIosInstallHelp = $state(false);
    let showInstallHelpModal = $state(false);
    let deferredInstallPrompt: BeforeInstallPromptEvent | null = $state(null);

    const showInstallCta = $derived(
        !isFacebookInAppBrowser &&
            !isStandalone &&
            (isAndroid || canInstallPwa || showIosInstallHelp)
    );

    function mount(): () => void {
        const ua = navigator.userAgent ?? "";
        isFacebookInAppBrowser = detectFacebookInAppBrowserFromWindow();
        isAndroid = isAndroidUserAgent(ua);

        const mq =
            typeof window.matchMedia === "function"
                ? window.matchMedia("(display-mode: standalone)")
                : null;

        const computeStandalone = () => {
            isStandalone = computeIsStandalone({
                userAgent: ua,
                displayModeStandalone: getDisplayModeStandalone(mq),
                navigatorStandalone: getNavigatorStandalone(navigator),
            });
        };

        computeStandalone();
        const onMqChange = () => computeStandalone();
        mq?.addEventListener?.("change", onMqChange);

        const onBeforeInstallPrompt = (e: Event) => {
            // Only relevant in browsers that support install prompts.
            e.preventDefault?.();
            deferredInstallPrompt = e as BeforeInstallPromptEvent;
            canInstallPwa = true;
        };

        const onAppInstalled = () => {
            deferredInstallPrompt = null;
            canInstallPwa = false;
            computeStandalone();
        };

        window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
        window.addEventListener("appinstalled", onAppInstalled);

        // On iOS there's no `beforeinstallprompt`. Offer help instead.
        showIosInstallHelp = shouldShowIosInstallHelp({ userAgent: ua, isStandalone });

        return () => {
            mq?.removeEventListener?.("change", onMqChange);
            window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
            window.removeEventListener("appinstalled", onAppInstalled);
        };
    }

    async function handleInstallClick() {
        if (isFacebookInAppBrowser || isStandalone) return;
        if (isAndroid) {
            window.location.assign(ANDROID_PLAY_STORE_URL);
            return;
        }
        if (canInstallPwa && deferredInstallPrompt) {
            await deferredInstallPrompt.prompt();
            try {
                await deferredInstallPrompt.userChoice;
            } catch {
                /* ignore */
            }
            deferredInstallPrompt = null;
            canInstallPwa = false;
            return;
        }
        if (showIosInstallHelp) {
            showInstallHelpModal = true;
        }
    }

    return {
        get isFacebookInAppBrowser() {
            return isFacebookInAppBrowser;
        },
        get showInstallCta() {
            return showInstallCta;
        },
        get buttonLabel() {
            return isAndroid ? "Get Android app" : "Install";
        },
        get buttonTitle() {
            return isAndroid ? "Get the Android app on Google Play" : "Install app";
        },
        get showInstallHelpModal() {
            return showInstallHelpModal;
        },
        set showInstallHelpModal(value: boolean) {
            showInstallHelpModal = value;
        },
        mount,
        handleInstallClick,
    };
}
