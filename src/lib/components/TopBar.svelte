<script lang="ts">
    import type { Snippet } from "svelte";
    import { DotsVerticalOutline } from "flowbite-svelte-icons";

    type Props = {
        title: string;
        /** Shown instead of `title` on narrow phones, so the bar fits on one row. */
        shortTitle?: string;
        showInAppBanner?: boolean;
        iconSrc?: string;
        iconAlt?: string;
        /** Always shown in the bar. */
        actions?: Snippet;
        /** Shown in the bar on wider screens, and behind a "More" button on phones. */
        menu?: Snippet;
    };

    let {
        title,
        shortTitle,
        showInAppBanner = false,
        iconSrc = "/favicon.svg",
        iconAlt = "App icon",
        actions,
        menu,
    }: Props = $props();

    let menuOpen = $state(false);
    let navEl: HTMLElement | undefined = $state();

    function closeMenuOnOutsideClick(event: MouseEvent): void {
        if (menuOpen && navEl && !navEl.contains(event.target as Node)) menuOpen = false;
    }

    function closeMenuAfterChoice(event: MouseEvent): void {
        if ((event.target as HTMLElement).closest("button, a")) menuOpen = false;
    }
</script>

<svelte:window
    onclick={closeMenuOnOutsideClick}
    onkeydown={(e) => {
        if (e.key === "Escape") menuOpen = false;
    }}
/>

<nav
    bind:this={navEl}
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
    <div class="relative max-w-7xl mx-auto flex items-center justify-between gap-2 px-4 py-2">
        <div class="flex min-w-0 items-center gap-2">
            <img src={iconSrc} alt={iconAlt} class="w-7 h-7 shrink-0" style="margin-bottom:2px;" />
            {#if shortTitle}
                <span
                    class="truncate text-base min-[390px]:text-lg font-bold text-blue-700 dark:text-blue-300 min-[520px]:hidden"
                    >{shortTitle}</span
                >
            {/if}
            <span
                class="truncate text-base min-[390px]:text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-300"
                class:topbar-full-title={!!shortTitle}>{title}</span
            >
        </div>
        <div
            class="topbar-actions inline-flex shrink-0 items-center justify-end gap-1.5 min-[390px]:gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100/90 dark:bg-gray-800/70 px-1.5 min-[390px]:px-2 py-1 whitespace-nowrap"
        >
            {#if menu}
                <!-- One copy of the menu items: inline on wider screens, a drop-down on phones. -->
                <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
                <div
                    id="topbar-menu"
                    class="topbar-menu"
                    class:open={menuOpen}
                    onclick={closeMenuAfterChoice}
                >
                    {@render menu()}
                </div>
            {/if}
            {@render actions?.()}
            {#if menu}
                <button
                    type="button"
                    class="topbar-menu-toggle"
                    aria-label="More options"
                    aria-haspopup="true"
                    aria-expanded={menuOpen}
                    aria-controls="topbar-menu"
                    onclick={() => (menuOpen = !menuOpen)}
                >
                    <DotsVerticalOutline class="h-5 w-5" />
                </button>
            {/if}
        </div>
    </div>
</nav>

<style>
    /* With a short title, the full one only shows once there is room for it. */
    .topbar-full-title {
        display: none;
    }

    .topbar-menu {
        display: contents;
    }

    .topbar-menu-toggle {
        display: none;
    }

    @media (max-width: 519.98px) {
        .topbar-menu {
            display: none;
            position: absolute;
            top: calc(100% - 0.25rem);
            right: 1rem;
            z-index: 60;
            min-width: 12rem;
            flex-direction: column;
            align-items: stretch;
            gap: 0.25rem;
            padding: 0.375rem;
            border-radius: 0.75rem;
            border: 1px solid rgb(209 213 219);
            background: white;
            box-shadow: 0 12px 30px -12px rgb(15 23 42 / 0.4);
        }

        :global(.dark) .topbar-menu {
            border-color: rgb(55 65 81);
            background: rgb(31 41 55);
        }

        .topbar-menu.open {
            display: flex;
        }

        /* Menu items: full-width rows with room for a thumb. */
        .topbar-menu :global(button),
        .topbar-menu :global(a) {
            justify-content: flex-start;
            width: 100%;
            min-height: 2.75rem;
            font-size: 0.875rem;
            border-color: transparent;
        }

        .topbar-menu-toggle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 2.25rem;
            height: 2.25rem;
            border-radius: 0.5rem;
            color: rgb(55 65 81);
        }

        :global(.dark) .topbar-menu-toggle {
            color: rgb(229 231 235);
        }

        .topbar-menu-toggle:hover,
        .topbar-menu-toggle[aria-expanded="true"] {
            background: rgb(229 231 235);
        }

        :global(.dark) .topbar-menu-toggle:hover,
        :global(.dark) .topbar-menu-toggle[aria-expanded="true"] {
            background: rgb(55 65 81);
        }
    }

    @media (min-width: 520px) {
        .topbar-full-title {
            display: inline;
        }
    }
</style>
