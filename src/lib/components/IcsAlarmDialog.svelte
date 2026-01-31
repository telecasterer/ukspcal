<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { Input, Label, Button, Modal } from "flowbite-svelte";

  export let open: boolean;
  export let alarmEnabled: boolean = false;
  export let daysBefore: number = 1;

  const dispatch = createEventDispatcher();

  let localReminderEnabled = alarmEnabled;
  let localDaysBefore = daysBefore;

  onMount(() => {
    localReminderEnabled = alarmEnabled;
    localDaysBefore = daysBefore;
  });

  function save() {
    dispatch("save", {
      alarmEnabled: localReminderEnabled,
      daysBefore: localDaysBefore
    });
    dispatch("close");
  }

  function cancel() {
    dispatch("close");
  }
</script>

<Modal title="Payment Reminder Settings" bind:open={open} size="md">
  <div class="space-y-4">
    <div>
      <Label class="flex items-center gap-2">
        <input type="checkbox" bind:checked={localReminderEnabled} />
        Enable reminder for payment days
      </Label>
    </div>
    <div class="flex gap-2 items-center">
      <Label for="days-before" class="text-sm">Days before event</Label>
      <Input id="days-before" type="number" min="0" max="30" bind:value={localDaysBefore} class="w-20" disabled={!localReminderEnabled} />
    </div>
    <div class="flex gap-2 justify-end">
      <Button color="light" onclick={cancel}>Cancel</Button>
      <Button color="blue" onclick={save}>Save</Button>
    </div>
  </div>
</Modal>
