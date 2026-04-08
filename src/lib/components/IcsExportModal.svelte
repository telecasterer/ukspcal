<script lang="ts">
    import { Button, Label, Modal, Input } from "flowbite-svelte";
    import { generateICS } from "$lib/utils/exportHelpers";
    import {
        loadIcsAlarmSettings,
        saveIcsAlarmSettings,
        type IcsAlarmSettings,
    } from "$lib/utils/icsAlarmPersistence";
    import { loadIcsEventTime, saveIcsEventTime } from "$lib/utils/icsEventTimePersistence";
    import { capturePosthog } from "$lib/utils/posthog";
    import type { Payment, PensionResult } from "$lib/pensionEngine";
    import type { DateFormat } from "$lib/utils/dateFormatting";
    import IcsReminderDialog from "./IcsAlarmDialog.svelte";

    type Props = {
        open: boolean;
        payments: Payment[];
        result: PensionResult;
        csvDateFormat: DateFormat;
        icsEventName: string;
        icsCategory: string;
        icsColor: string;
        onPersist?: () => void;
    };

    let {
        open = $bindable(),
        payments,
        result,
        csvDateFormat,
        icsEventName = $bindable(),
        icsCategory = $bindable(),
        icsColor = $bindable(),
        onPersist,
    }: Props = $props();

    // Persistent ICS event time (default midday)
    let icsEventTime = $state(loadIcsEventTime());
    $effect(() => { if (icsEventTime) saveIcsEventTime(icsEventTime); });

    // Reminder dialog state
    let reminderDialogOpen = $state(false);
    let reminderSettings: IcsAlarmSettings = $state(loadIcsAlarmSettings());

    // Local drafts — only commit on blur to avoid reactive loops
    let icsEventNameDraft = $state("");
    let icsCategoryDraft = $state("");
    let icsColorDraft = $state("");
    let isEditingIcsEventName = $state(false);
    let isEditingIcsCategory = $state(false);
    let isEditingIcsColorText = $state(false);

    $effect(() => { if (!isEditingIcsEventName) icsEventNameDraft = icsEventName; });
    $effect(() => { if (!isEditingIcsCategory) icsCategoryDraft = icsCategory; });
    $effect(() => { if (!isEditingIcsColorText) icsColorDraft = icsColor; });

    function handleExport() {
        capturePosthog("export_ics", {
            payments_count: payments.length,
            alarm_enabled: reminderSettings.alarmEnabled,
            alarm_days_before: reminderSettings.daysBefore,
            event_time: icsEventTime,
        });
        generateICS(payments, result, {
            csvDateFormat,
            icsEventName,
            icsCategory,
            icsColor,
            icsAlarmEnabled: reminderSettings.alarmEnabled,
            icsAlarmDaysBefore: reminderSettings.daysBefore,
            icsEventTime,
        });
        open = false;
    }

    function handleReminderSave(detail: IcsAlarmSettings) {
        reminderSettings = detail;
        saveIcsAlarmSettings(reminderSettings);
    }
</script>

<Modal title="Add to calendar (ICS)" bind:open size="md">
    <div class="space-y-4">
        <div>
            <Label for="ics-name" class="block mb-2 text-sm">Event name</Label>
            <Input
                id="ics-name"
                bind:value={icsEventNameDraft}
                onfocus={() => { isEditingIcsEventName = true; }}
                onblur={() => {
                    isEditingIcsEventName = false;
                    icsEventName = icsEventNameDraft;
                    onPersist?.();
                }}
                class="w-full text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
        </div>
        <div>
            <Label for="ics-category" class="block mb-2 text-sm">Category</Label>
            <Input
                id="ics-category"
                bind:value={icsCategoryDraft}
                onfocus={() => { isEditingIcsCategory = true; }}
                onblur={() => {
                    isEditingIcsCategory = false;
                    icsCategory = icsCategoryDraft;
                    onPersist?.();
                }}
                class="w-full text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <p class="mt-1 text-xs min-[390px]:text-sm text-gray-500 dark:text-gray-400">
                Some calendar apps ignore categories or don't display them.
            </p>
        </div>
        <div>
            <Label for="ics-event-time" class="block mb-2 text-sm">Event time</Label>
            <Input
                id="ics-event-time"
                type="time"
                bind:value={icsEventTime}
                class="w-28 mb-4"
            />
        </div>
        <div>
            <Label class="block mb-2 text-sm">Colour</Label>
            <div class="flex gap-3 items-center">
                <input
                    id="ics-color"
                    type="color"
                    bind:value={icsColor}
                    onchange={() => onPersist?.()}
                    class="h-12 w-24 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <Input
                    type="text"
                    bind:value={icsColorDraft}
                    onfocus={() => { isEditingIcsColorText = true; }}
                    onblur={() => {
                        isEditingIcsColorText = false;
                        icsColor = icsColorDraft;
                        onPersist?.();
                    }}
                    class="flex-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="#22c55e"
                />
            </div>
            <p class="mt-1 text-xs min-[390px]:text-sm text-gray-500 dark:text-gray-400">
                Best-effort: Apple Calendar may use this; Google Calendar often ignores event
                colour from ICS imports.
            </p>
        </div>
        <div>
            <Button color="light" onclick={() => (reminderDialogOpen = true)}>Reminder settings</Button>
            {#if reminderSettings.alarmEnabled}
                <span class="ml-2 text-xs min-[390px]:text-sm text-green-600 dark:text-green-400">
                    Reminder: {reminderSettings.daysBefore} day(s) before
                </span>
            {/if}
        </div>
        <div class="flex gap-2 justify-end">
            <Button color="light" onclick={() => (open = false)}>Cancel</Button>
            <Button color="blue" onclick={handleExport}>Download ICS</Button>
        </div>
    </div>
</Modal>

<IcsReminderDialog
    bind:open={reminderDialogOpen}
    alarmEnabled={reminderSettings.alarmEnabled}
    daysBefore={reminderSettings.daysBefore}
    onsave={handleReminderSave}
    onclose={() => (reminderDialogOpen = false)}
/>
