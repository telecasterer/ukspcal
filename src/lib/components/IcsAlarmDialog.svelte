<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { Input, Label, Button, Modal } from "flowbite-svelte";

  export let open: boolean;
  export let alarmEnabled: boolean = false;
  export let daysBefore: number = 1;
  export let alarmTitle: string = "Upcoming UK state pension Payment";
  export let alarmDescription: string = "Your UK state pension payment is due soon.";

  const dispatch = createEventDispatcher();

  let localAlarmEnabled = alarmEnabled;
  let localDaysBefore = daysBefore;
  let localAlarmTitle = alarmTitle;
  let localAlarmDescription = alarmDescription;

  onMount(() => {
    localAlarmEnabled = alarmEnabled;
    localDaysBefore = daysBefore;
    localAlarmTitle = alarmTitle;
    localAlarmDescription = alarmDescription;
  });

  function save() {
    dispatch("save", {
      alarmEnabled: localAlarmEnabled,
      daysBefore: localDaysBefore,
      alarmTitle: localAlarmTitle,
      alarmDescription: localAlarmDescription
    });
    dispatch("close");
  }

  function cancel() {
    dispatch("close");
  }
</script>

<Modal title="ICS Alarm Settings" bind:open={open} size="md">
  <div class="space-y-4">
    <div>
      <Label class="flex items-center gap-2">
        <input type="checkbox" bind:checked={localAlarmEnabled} />
        Enable alarm for payment days
      </Label>
    </div>
    <div class="flex gap-2 items-center">
      <Label for="days-before" class="text-sm">Days before event</Label>
      <Input id="days-before" type="number" min="0" max="30" bind:value={localDaysBefore} class="w-20" disabled={!localAlarmEnabled} />
    </div>
    <div>
      <Label for="alarm-title" class="text-sm">Alarm title</Label>
      <Input id="alarm-title" type="text" bind:value={localAlarmTitle} class="w-full" disabled={!localAlarmEnabled} />
    </div>
    <div>
      <Label for="alarm-description" class="text-sm">Alarm description</Label>
      <Input id="alarm-description" type="text" bind:value={localAlarmDescription} class="w-full" disabled={!localAlarmEnabled} />
    </div>
    <div class="flex gap-2 justify-end">
      <Button color="light" onclick={cancel}>Cancel</Button>
      <Button color="blue" onclick={save}>Save</Button>
    </div>
  </div>
</Modal>
