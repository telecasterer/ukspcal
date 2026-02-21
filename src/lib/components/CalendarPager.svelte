<script lang="ts">
    import { Button } from "flowbite-svelte";

    export let visibleRangeLabel: string;
    export let canJumpToToday: boolean;
    export let canGoPrevious: boolean;
    export let canGoNext: boolean;
    export let onPrevious: () => void;
    export let onNext: () => void;
    export let onToday: () => void;
</script>

<div class="w-full calendar-controls">
    <div
        class="bg-white/95 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-3"
    >
        <div class="w-full sm:w-auto flex items-center justify-center gap-2">
            <Button
                onclick={onPrevious}
                color="light"
                class="px-2.5 py-2 text-xs min-[390px]:text-sm"
                disabled={!canGoPrevious}
            >
                Previous
            </Button>
            <div
                class="px-2.5 h-8 inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-xs min-[390px]:text-sm font-semibold text-gray-900 dark:text-white"
            >
                {visibleRangeLabel}
            </div>
            <Button
                onclick={onNext}
                color="light"
                class="px-2.5 py-2 text-xs min-[390px]:text-sm"
                disabled={!canGoNext}
            >
                Next
            </Button>
            <Button
                onclick={onToday}
                color="light"
                class="px-2.5 py-2 text-xs min-[390px]:text-sm"
                disabled={!canJumpToToday}
                title={canJumpToToday
                    ? "Jump to current month"
                    : "Current month is outside this calendar range"}
            >
                Today
            </Button>
        </div>
    </div>
</div>
