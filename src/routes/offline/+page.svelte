<script lang="ts">
    import { Button } from "flowbite-svelte";
    import TopBar from "$lib/components/TopBar.svelte";
    import { ExclamationCircleOutline } from "flowbite-svelte-icons";
</script>

<div class="flex flex-col min-h-screen">
    <TopBar title="Offline" showInAppBanner={false} />

    <main class="flex-1 flex flex-col items-center justify-center p-6 text-center app-page-bg">
        <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 max-w-md w-full">
            <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-500 dark:text-gray-400">
                <ExclamationCircleOutline class="w-8 h-8" />
            </div>
            
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                You are offline
            </h1>
            
            <p class="text-gray-600 dark:text-gray-300 mb-8">
                It looks like you've lost your internet connection. We couldn't load this page because it wasn't saved to your device.
            </p>

            <Button href="/" class="w-full">
                Go back Home
            </Button>
            
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">
                The main calendar and your saved schedules are still available offline!
            </p>
        </div>
    </main>
</div>
