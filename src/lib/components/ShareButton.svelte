<script lang="ts">
    import { copyLinkToClipboard as copyLinkToClipboardUtil } from "#lib/utils/clipboard";
    import { Button } from "flowbite-svelte";
    import { ShareNodesOutline } from "flowbite-svelte-icons";

    type Props = {
        shareTitle?: string;
        shareText?: string;
        shareUrl?: string | null;
        toastDurationMs?: number;
        size?: "xs" | "sm" | "md" | "lg" | "xl";
        buttonClass?: string;
        buttonLabel?: string;
    };

    let {
        shareTitle = "UK State Pension Calendar",
        shareText = "Calculate your State Pension Age and payment calendar.",
        shareUrl = null,
        toastDurationMs = 4000,
        size = undefined,
        buttonClass = "",
        buttonLabel = "Share this app",
    }: Props = $props();

    let shareStatus = $state("");
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
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                shareStatus = "Share cancelled.";
                shareStatusTimeout = setTimeout(() => {
                    shareStatus = "";
                    shareStatusTimeout = null;
                }, toastDurationMs);
                return;
            }
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
    class={buttonClass}
    onclick={handleShare}
    title={buttonLabel}
    aria-label={buttonLabel}
>
    <span class="inline-flex items-center gap-1.5">
        <ShareNodesOutline class="h-4 w-4" />
        <span>Share</span>
    </span>
</Button>

{#if shareStatus}
    <div
        class="fixed right-4 top-16 z-[60] rounded-lg border border-gray-300 bg-white/95 px-3 py-2 text-xs min-[390px]:text-sm text-gray-700 shadow-md dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        role="status"
        aria-live="polite"
    >
        {shareStatus}
    </div>
{/if}
