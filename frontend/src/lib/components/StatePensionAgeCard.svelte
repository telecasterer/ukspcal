<script lang="ts">
    import { Alert, Button, Card, Input, Label } from "flowbite-svelte";
    import { calculateStatePensionAge } from "$lib/utils/statePensionAge";

    type Props = {
        dob: string;
        onUseSpaYear?: (spaYear: number) => void;
    };

    let { dob = $bindable(), onUseSpaYear }: Props = $props();

    const spa = $derived.by(() => {
        if (!dob) return null;
        try {
            return calculateStatePensionAge(dob);
        } catch {
            return null;
        }
    });

    const spaDateFormatted = $derived.by(() => {
        if (!spa) return "";
        const d = new Date(spa.spaDate + "T00:00:00Z");
        return d.toLocaleDateString("en-GB", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    });

    function handleUseSpaYear() {
        if (!spa) return;
        const year = Number(spa.spaDate.slice(0, 4));
        onUseSpaYear?.(year);
    }
</script>

<Card class="shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-6">
    <div class="space-y-4">
        <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">State Pension age</h2>
            <p class="text-sm text-gray-600 dark:text-gray-300">
                Optional: enter your date of birth to estimate the date you reach UK State Pension age.
            </p>
        </div>

        <div>
            <Label for="dob" class="block mb-2 text-sm">Date of birth</Label>
            <Input
                id="dob"
                type="date"
                bind:value={dob}
                class="w-full text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Optional — 
                <a
                    href="/help#state-pension-age"
                    class="ml-1 underline underline-offset-2 text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                >
                    More help
                </a>
            </p>
        </div>

        {#if dob && !spa}
            <Alert color="red" class="text-sm">
                Please enter a valid date.
            </Alert>
        {/if}

        {#if spa}
            <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4">
                <div class="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">You reach State Pension age on</div>
                <div class="mt-1 text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{spaDateFormatted}</div>
                {#if spa.source !== "fixed"}
                    <div class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        Based on an age of {spa.spaAgeYears}{#if spa.spaAgeMonths}y {spa.spaAgeMonths}m{/if}.
                    </div>
                {/if}
            </div>

            {#if onUseSpaYear}
                <Button onclick={handleUseSpaYear} color="blue" class="w-full">
                    Use this year for the payment calendar
                </Button>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                    This sets the calendar range to the year you reach State Pension age.
                </p>
            {/if}
        {/if}

    </div>
</Card>
