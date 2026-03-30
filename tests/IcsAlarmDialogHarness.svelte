<script lang="ts">
    import IcsAlarmDialog from "../src/lib/components/IcsAlarmDialog.svelte";

    export let onSave: (detail: { alarmEnabled: boolean; daysBefore: number }) => void =
        () => undefined;
</script>

<IcsAlarmDialog
    open={true}
    alarmEnabled={true}
    daysBefore={2}
    onsave={onSave}
/>
