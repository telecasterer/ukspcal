<script lang="ts">
    import { capturePosthog } from "$lib/utils/posthog";

    function handleFeedbackClick() {
        capturePosthog("feedback_opened");
    }
</script>

<a
    href="https://tally.so/r/q4Vbq2"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Send feedback"
    onclick={handleFeedbackClick}
    class="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out hover:scale-110"
    title="Send feedback"
>
    <svg
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
    </svg>
</a>
