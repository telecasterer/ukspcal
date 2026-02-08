<script lang="ts">
    import { copyLinkToClipboard as copyLinkToClipboardUtil } from "$lib/utils/clipboard";
    import { Button } from "flowbite-svelte";

    export let shareTitle = "UK State Pension Payment Calendar";
    export let shareText = "Calculate your State Pension Age and payment calendar.";
    export let shareUrl: string | null = null;
    export let toastDurationMs = 4000;
    export let size: string | undefined = undefined;

    let shareStatus = "";
    let shareStatusTimeout: ReturnType<typeof setTimeout> | null = null;

    async function handleShare(): Promise<void> {
        shareStatus = "";
        if (shareStatusTimeout) {
            clearTimeout(shareStatusTimeout);
            shareStatusTimeout = null;
        }
        if (typeof window === "undefined") return;
        const url = shareUrl ?? window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url,
                });
                shareStatus = "Share opened.";
                shareStatusTimeout = setTimeout(() => {
                    shareStatus = "";
                    shareStatusTimeout = null;
                }, toastDurationMs);
                return;
            }
        } catch {
            // Fall back to copy below
        }

        const ok = await copyLinkToClipboardUtil(url);
        shareStatus = ok
            ? "Link copied."
            : "Couldn't copy automatically — please copy the address bar URL.";
        shareStatusTimeout = setTimeout(() => {
            shareStatus = "";
            shareStatusTimeout = null;
        }, toastDurationMs);
    }
</script>

<Button
    color="light"
    {size}
    onclick={handleShare}
    title="Share this app"
    aria-label="Share this app"
>
    Share
</Button>

{#if shareStatus}
    <div
        class="fixed right-4 top-16 z-[60] rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-md dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        role="status"
        aria-live="polite"
    >
        {shareStatus}
    </div>
{/if}
