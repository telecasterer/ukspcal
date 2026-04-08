<script lang="ts">
    import { Button, Label, Modal, Select } from "flowbite-svelte";
    import { DATE_FORMAT_OPTIONS, type DateFormat } from "$lib/utils/dateFormatting";
    import { capturePosthog } from "$lib/utils/posthog";
    import { exportCSV } from "$lib/utils/exportHelpers";
    import type { Payment, PensionResult } from "$lib/pensionEngine";

    type Props = {
        open: boolean;
        payments: Payment[];
        result: PensionResult;
        csvDateFormat: DateFormat;
        onPersist?: () => void;
    };

    let {
        open = $bindable(),
        payments,
        result,
        csvDateFormat = $bindable(),
        onPersist,
    }: Props = $props();

    function handleExport() {
        capturePosthog("export_csv", {
            payments_count: payments.length,
            date_format: csvDateFormat,
        });
        exportCSV(payments, result, csvDateFormat);
        open = false;
    }
</script>

<Modal title="Download spreadsheet (CSV)" bind:open size="md">
    <div class="space-y-4">
        <div>
            <Label for="csv-format" class="block mb-2 text-sm">Date format</Label>
            <Select
                id="csv-format"
                bind:value={csvDateFormat}
                onchange={() => onPersist?.()}
                class="w-full text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
                {#each DATE_FORMAT_OPTIONS as option}
                    <option value={option.value}>{option.label}</option>
                {/each}
            </Select>
            <p class="mt-1 text-xs min-[390px]:text-sm text-gray-500 dark:text-gray-400">
                Best for Excel or Google Sheets.
            </p>
        </div>
        <div class="flex gap-2 justify-end">
            <Button color="light" onclick={() => (open = false)}>Cancel</Button>
            <Button color="blue" onclick={handleExport}>Download CSV</Button>
        </div>
    </div>
</Modal>
