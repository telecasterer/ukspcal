<script lang="ts">
    import { formatDateForCSV } from "$lib/utils/dateFormatting";
    import { DATE_FORMAT_LONG, DATE_FORMAT_SHORT } from "$lib/utils/dateFormats";

    export let payments: Array<any> = [];
</script>

<ul class="mt-2 max-h-64 overflow-auto divide-y divide-gray-100 dark:divide-gray-800">
    {#each payments as p}
        <li class="py-2 px-1">
            <div class="flex justify-between items-start">
                <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDateForCSV(p.paid, DATE_FORMAT_LONG)}
                    </div>
                    {#if p.early}
                        <div class="text-xs text-orange-600 dark:text-orange-300">
                            Early (due {formatDateForCSV(p.due, DATE_FORMAT_SHORT)})
                        </div>
                    {/if}
                </div>
                {#if p.holidays && p.holidays.length}
                    <div class="text-xs text-gray-500 dark:text-gray-400 ml-4 text-right">
                        {p.holidays.join(', ')}
                    </div>
                {/if}
            </div>
        </li>
    {/each}
</ul>

<style>
    /* keep presentational css minimal; layout is via Tailwind */
</style>
