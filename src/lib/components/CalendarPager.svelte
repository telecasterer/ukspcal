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
        <div class="w-full sm:w-auto">
            <div
                class="grid grid-cols-2 min-[480px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-2"
            >
                <Button
                    onclick={onPrevious}
                    color="light"
                    class="w-full min-w-0 min-[480px]:min-w-[6.5rem] px-2.5 py-2 text-xs min-[390px]:text-sm"
                    disabled={!canGoPrevious}
                >
                    Previous
                </Button>
                <div
                    class="order-3 min-[480px]:order-none px-2.5 h-8 inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-xs min-[390px]:text-sm font-semibold text-gray-900 dark:text-white"
                >
                    {visibleRangeLabel}
                </div>
                <Button
                    onclick={onNext}
                    color="light"
                    class="order-2 min-[480px]:order-none w-full min-w-0 min-[480px]:min-w-[6.5rem] px-2.5 py-2 text-xs min-[390px]:text-sm"
                    disabled={!canGoNext}
                >
                    Next
                </Button>
                <Button
                    onclick={onToday}
                    color="light"
                    class="order-4 min-[480px]:order-none w-full min-w-0 px-2.5 py-2 text-xs min-[390px]:text-sm"
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
</div>
