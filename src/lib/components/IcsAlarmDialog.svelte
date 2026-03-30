<script lang="ts">
    import { Input, Label, Button, Modal, Checkbox as FlowbiteCheckbox } from "flowbite-svelte";

    let {
        open = $bindable(),
        alarmEnabled = false,
        daysBefore = 1,
        onsave,
        onclose,
    }: {
        open: boolean;
        alarmEnabled?: boolean;
        daysBefore?: number;
        onsave?: (detail: { alarmEnabled: boolean; daysBefore: number }) => void;
        onclose?: () => void;
    } = $props();

    let localReminderEnabled = $state(false);
    let localDaysBefore = $state(1);

    $effect(() => {
        localReminderEnabled = alarmEnabled;
        localDaysBefore = daysBefore;
    });

    function save() {
        onsave?.({ alarmEnabled: localReminderEnabled, daysBefore: localDaysBefore });
        onclose?.();
    }

    function cancel() {
        onclose?.();
    }
</script>

<Modal title="Payment Reminder Settings" bind:open size="md">
    <div class="space-y-4">
        <div>
            <Label class="flex items-center gap-2 cursor-pointer text-sm">
                <FlowbiteCheckbox bind:checked={localReminderEnabled} />
                <span>Enable reminder for payment days</span>
            </Label>
            <p class="mt-1 text-xs min-[390px]:text-sm text-gray-500 dark:text-gray-300">
                Reminders are included in exported calendar files.
            </p>
        </div>
        <div class="flex gap-2 items-center">
            <Label for="days-before" class="text-sm text-gray-700 dark:text-gray-200"
                >Days before event</Label
            >
            <Input
                id="days-before"
                type="number"
                min="0"
                max="30"
                bind:value={localDaysBefore}
                class="w-20"
                disabled={!localReminderEnabled}
            />
        </div>
        <div class="flex gap-2 justify-end">
            <Button color="light" onclick={cancel}>Cancel</Button>
            <Button color="blue" onclick={save}>Save</Button>
        </div>
    </div>
</Modal>
