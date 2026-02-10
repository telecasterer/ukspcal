<script lang="ts">
    export let title: string;
    export let showInAppBanner: boolean = false;
    export let iconSrc: string = "/favicon.svg";
    export let iconAlt: string = "App icon";
</script>

<nav
    class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50"
>
    {#if showInAppBanner}
        <!-- Info banner for in-app browser users -->
        <div
            class="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900"
        >
            <div class="max-w-7xl mx-auto px-4 py-1">
                <p
                    class="text-xs text-amber-800 dark:text-amber-200 leading-snug"
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
    <div class="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
        <div class="flex items-center gap-2">
            <img
                src={iconSrc}
                alt={iconAlt}
                class="w-7 h-7"
                style="margin-bottom:2px;"
            />
            <span class="text-2xl font-bold text-blue-600 dark:text-blue-400"
                >{title}</span
            >
        </div>
        <div class="topbar-actions flex items-center gap-2">
            <slot name="actions" />
        </div>
    </div>
</nav>
