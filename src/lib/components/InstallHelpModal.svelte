<script lang="ts">
    import { Button, Modal } from "flowbite-svelte";

    let { open = $bindable(false) }: { open: boolean } = $props();
</script>

<Modal title="Install on iPhone/iPad" bind:open size="md">
    <div class="space-y-3">
        <p class="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
            In Safari, tap the Share button, then choose
            <span class="font-semibold">Add to Home Screen</span>.
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
            If you're viewing inside an in-app browser, use "Open in browser" first.
        </p>
        <div class="flex justify-end">
            <Button color="light" class="toolbar-btn" onclick={() => (open = false)}>Close</Button>
        </div>
    </div>
</Modal>
