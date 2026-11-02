<script lang="ts">
    import type { Snippet } from "svelte";

    type Props = {
        title: string;
        /** Shown instead of `title` on phones, so the bar fits on one row. */
        shortTitle?: string;
        showInAppBanner?: boolean;
        iconSrc?: string;
        iconAlt?: string;
        actions?: Snippet;
    };

    let {
        title,
        shortTitle,
        showInAppBanner = false,
        iconSrc = "/favicon.svg",
        iconAlt = "App icon",
        actions,
    }: Props = $props();
</script>

<nav
    class="safe-area-top bg-white/95 dark:bg-gray-900/95 border-b border-gray-300 dark:border-gray-700 sticky top-0 z-50 backdrop-blur"
>
    {#if showInAppBanner}
        <!-- Info banner for in-app browser users -->
        <div
            class="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900"
        >
            <div class="max-w-7xl mx-auto px-4 py-1">
                <p
                    class="text-xs min-[390px]:text-sm text-amber-800 dark:text-amber-200 leading-snug"
                >
                    <span class="sm:hidden"
                        >Tip: works best in Safari/Chrome/Edge (use “Open in browser”).</span
                    >
                    <span class="hidden sm:inline"
                        >Tip: this app works best in Safari/Chrome/Edge (use “Open in browser”).</span
                    >
                </p>
            </div>
        </div>
    {/if}
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-2 px-4 py-2">
        <div class="flex min-w-0 items-center gap-2">
            <img src={iconSrc} alt={iconAlt} class="w-7 h-7 shrink-0" style="margin-bottom:2px;" />
            {#if shortTitle}
                <!-- Wraps onto two lines rather than being cut off on the narrowest phones. -->
                <span
                    class="text-base leading-tight font-bold text-blue-700 dark:text-blue-300 md:hidden"
                    >{shortTitle}</span
                >
            {/if}
            <span
                class="text-base leading-tight min-[390px]:text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-300"
                class:topbar-full-title={!!shortTitle}>{title}</span
            >
        </div>
        {#if actions}
            <div
                class="topbar-actions inline-flex shrink-0 items-center justify-end gap-1.5 min-[390px]:gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100/90 dark:bg-gray-800/70 px-1.5 min-[390px]:px-2 py-1 whitespace-nowrap"
            >
                {@render actions()}
            </div>
        {/if}
    </div>
</nav>

<style>
    /* With a short title, the full one only shows once there is room for it. */
    .topbar-full-title {
        display: none;
    }

    @media (min-width: 768px) {
        .topbar-full-title {
            display: inline;
        }
    }
</style>
