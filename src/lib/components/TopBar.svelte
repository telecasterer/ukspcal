<script lang="ts">
    export let title: string;
    export let showInAppBanner: boolean = false;
    export let iconSrc: string = "/favicon.svg";
    export let iconAlt: string = "App icon";
</script>

<nav
    class="bg-white/95 dark:bg-gray-900/95 border-b border-gray-300 dark:border-gray-700 sticky top-0 z-50 backdrop-blur"
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
                        >Tip: works best in Safari/Chrome/Edge (use “Open in
                        browser”).</span
                    >
                    <span class="hidden sm:inline"
                        >Tip: this app works best in Safari/Chrome/Edge (use
                        “Open in browser”).</span
                    >
                </p>
            </div>
        </div>
    {/if}
    <div class="max-w-7xl mx-auto flex flex-col gap-2 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between px-4 py-2">
        <div class="flex items-center gap-2">
            <img
                src={iconSrc}
                alt={iconAlt}
                class="w-7 h-7"
                style="margin-bottom:2px;"
            />
            <span class="text-base min-[390px]:text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-300"
                >{title}</span
            >
        </div>
        <div
            class="topbar-actions ml-auto inline-flex max-w-full min-[520px]:ml-0 items-center justify-end gap-1.5 min-[390px]:gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100/90 dark:bg-gray-800/70 px-1.5 min-[390px]:px-2 py-1 overflow-x-auto whitespace-nowrap"
        >
            <slot name="actions" />
        </div>
    </div>
</nav>
