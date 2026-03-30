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

<div class="w-full calendar-controls print-hide">
    <div
        class="bg-white/95 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 p-3"
    >
        <div class="w-full sm:w-auto">
            <div
                class="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2"
            >
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
                    class="min-w-0 px-2.5 h-8 inline-flex items-center justify-center whitespace-nowrap overflow-hidden text-ellipsis rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-xs min-[390px]:text-sm font-semibold text-gray-900 dark:text-white"
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
                    class="w-auto min-w-[2.5rem] px-2.5 py-2 text-xs min-[390px]:text-sm"
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
    </div>
</div>
