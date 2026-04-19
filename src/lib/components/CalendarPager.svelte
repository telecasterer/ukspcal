<script lang="ts">
    import { Button } from "flowbite-svelte";
    import {
        ArrowLeftOutline,
        ArrowRightOutline,
    } from "flowbite-svelte-icons";

    let {
        visibleRangeLabel,
        canJumpToToday,
        canGoPrevious,
        canGoNext,
        onPrevious,
        onNext,
        onToday,
    }: {
        visibleRangeLabel: string;
        canJumpToToday: boolean;
        canGoPrevious: boolean;
        canGoNext: boolean;
        onPrevious: () => void;
        onNext: () => void;
        onToday: () => void;
    } = $props();
</script>

<div class="w-full flex items-center justify-center pt-2 pb-4 print-hide">
    <div class="flex items-center gap-2 w-full sm:w-auto">
        <Button
            onclick={onPrevious}
            color="light"
            class="w-auto min-w-[2.5rem] px-2.5 py-2 text-xs min-[390px]:text-sm"
            disabled={!canGoPrevious}
            title="Previous"
            aria-label="Previous"
        >
            <ArrowLeftOutline class="h-4 w-4" ariaLabel="Previous" />
        </Button>
        <div
            class="flex-1 sm:flex-none min-w-[140px] px-2.5 h-9 inline-flex items-center justify-center whitespace-nowrap overflow-hidden text-ellipsis rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-xs min-[390px]:text-sm font-semibold text-gray-900 dark:text-white"
        >
            {visibleRangeLabel}
        </div>
        <Button
            onclick={onNext}
            color="light"
            class="w-auto min-w-[2.5rem] px-2.5 py-2 text-xs min-[390px]:text-sm"
            disabled={!canGoNext}
            title="Next"
            aria-label="Next"
        >
            <ArrowRightOutline class="h-4 w-4" ariaLabel="Next" />
        </Button>
        <Button
            onclick={onToday}
            color="light"
            class="w-auto px-3 py-2 text-xs min-[390px]:text-sm"
            disabled={!canJumpToToday}
            title={canJumpToToday
                ? "Jump to current month"
                : "Current month is outside this calendar range"}
            aria-label="Today"
        >
            Today
        </Button>
    </div>
</div>
