<script lang="ts">
    import { Accordion, AccordionItem, Button, Label, Input, Select } from "flowbite-svelte";
    import { DATE_FORMAT_OPTIONS, type DateFormat } from "$lib/utils/dateFormatting";
    import { exportCSV, generateICS } from "$lib/utils/exportHelpers";
    import type { Payment, PensionResult } from "$lib/pensionEngine";

    type Props = {
        result: PensionResult;
        payments: Payment[];
        csvDateFormat?: DateFormat;
        icsEventName?: string;
        icsCategory?: string;
        icsColor?: string;
    };

    let {
        result,
        payments,
        csvDateFormat = $bindable("dd/mm/yyyy"),
        icsEventName = $bindable("UK State Pension Payment"),
        icsCategory = $bindable("Finance"),
        icsColor = $bindable("#22c55e")
    }: Props = $props();

    function handleExportCSV() {
        exportCSV(payments, result, csvDateFormat);
    }

    function handleGenerateICS() {
        generateICS(payments, result, { csvDateFormat, icsEventName, icsCategory, icsColor });
    }
</script>


<Accordion class="print:hidden max-w-2xl mx-auto w-full">
    <!-- CSV Export Accordion -->
    <AccordionItem>
        {#snippet header()}
            📥 Export as CSV
        {/snippet}
        <div class="space-y-4 mb-6 pb-6">
            <Label for="csv-format" class="block mb-2 text-sm">Date Format</Label>
            <Select
                id="csv-format"
                bind:value={csvDateFormat}
                class="w-full text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
                {#each DATE_FORMAT_OPTIONS as option}
                    <option value={option.value}>{option.label}</option>
                {/each}
            </Select>
            <Button onclick={handleExportCSV} class="w-full" color="blue">
                📥 Export as CSV
            </Button>
        </div>
    </AccordionItem>

    <!-- ICS Export Accordion -->
    <AccordionItem>
        {#snippet header()}
            📅 Export as ICS
        {/snippet}
        <div class="space-y-4 pb-6">
            <Label for="ics-name" class="block mb-2 text-sm">Event Name</Label>
            <Input
                id="ics-name"
                bind:value={icsEventName}
                class="w-full text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <Label for="ics-category" class="block mb-2 text-sm">Category</Label>
            <Input
                id="ics-category"
                bind:value={icsCategory}
                class="w-full text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <Label class="block mb-2 text-sm">Color</Label>
            <div class="flex gap-3 items-center">
                <input
                    id="ics-color"
                    type="color"
                    bind:value={icsColor}
                    class="h-12 w-24 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <Input
                    type="text"
                    bind:value={icsColor}
                    class="flex-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="#22c55e"
                />
            </div>
            <Button onclick={handleGenerateICS} class="w-full" color="blue">
                📅 Export as ICS
            </Button>
        </div>
    </AccordionItem>

</Accordion>
