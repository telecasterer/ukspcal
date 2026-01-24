<script lang="ts">
    import { Button, Label, Input, Select, Alert, Card, Checkbox } from "flowbite-svelte";

    export let ni: string;
    export let startYear: number;
    export let endYear: number;
    export let cycleDays: number;
    export let error: string;
    export let onGenerate: () => void;

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 50 }, (_, i) => currentYear - 25 + i);
</script>

<Card class="p-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Generate Schedule</h2>
    <form onsubmit={(e) => { e.preventDefault(); onGenerate(); }} class="space-y-4">
        <div class="space-y-3">
            <!-- NI Code Input -->
            <div>
                <Label for="ni-code" class="block mb-1 text-sm">NI code (last 3 characters)</Label>
                <Input
                    id="ni-code"
                    bind:value={ni}
                    placeholder="e.g., 22D"
                    class="w-full text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    The last 3 characters of your National Insurance number (2 digits + letter A–D), e.g. 22D.
                </p>
            </div>

            <!-- Start Year -->
            <div>
                <Label for="start-year" class="block mb-1 text-sm">Start Year</Label>
                <Select
                    id="start-year"
                    bind:value={startYear}
                    class="w-full text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    {#each years as year}
                        <option value={year}>{year}</option>
                    {/each}
                </Select>
            </div>

            <!-- End Year -->
            <div>
                <Label for="end-year" class="block mb-1 text-sm">End Year</Label>
                <Select
                    id="end-year"
                    bind:value={endYear}
                    class="w-full text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    {#each years as year}
                        <option value={year}>{year}</option>
                    {/each}
                </Select>
            </div>

            <!-- Cycle Days -->
            <div>
                <Label for="cycle-days" class="block mb-1 text-sm">Cycle Days</Label>
                <Input
                    id="cycle-days"
                    type="number"
                    min="1"
                    max="365"
                    bind:value={cycleDays}
                    class="w-full text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Payment frequency in days</p>
            </div>

            <!-- Submit Button -->
            <Button type="submit" class="w-full" color="blue">
                🚀 Generate
            </Button>
        </div>
    </form>
    {#if error}
        <Alert color="red" class="mt-4 dark:bg-red-900 dark:text-red-200 text-sm">
            <span class="font-medium">Error:</span> {error}
        </Alert>
    {/if}
</Card>
