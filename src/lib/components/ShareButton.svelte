<script lang="ts">
    import { copyLinkToClipboard as copyLinkToClipboardUtil } from "$lib/utils/clipboard";
    import { capturePosthog } from "$lib/utils/posthog";
    import { Button } from "flowbite-svelte";

    export let shareTitle = "UK State Pension Payment Calendar";
    export let shareText =
        "Calculate your State Pension Age and payment calendar.";
    export let shareUrl: string | null = null;
    export let toastDurationMs = 4000;
    export let size: "xs" | "sm" | "md" | "lg" | "xl" | undefined = undefined;

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
                capturePosthog("share_attempt", { method: "native" });
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url,
                });
                capturePosthog("share_success", { method: "native" });
                shareStatus = "Share opened.";
                shareStatusTimeout = setTimeout(() => {
                    shareStatus = "";
                    shareStatusTimeout = null;
                }, toastDurationMs);
                return;
            }
        } catch {
            capturePosthog("share_failed", { method: "native" });
            // Fall back to copy below
        }

        capturePosthog("share_attempt", { method: "copy" });
        const ok = await copyLinkToClipboardUtil(url);
        capturePosthog("share_result", { method: "copy", success: ok });
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
