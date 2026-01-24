<script lang="ts">
    import { Accordion, AccordionItem, Button, Card } from "flowbite-svelte";
    import { onMount } from "svelte";
    import { buildInfo } from "$lib/buildInfo";

    let spaOpen = false;
    let generatorOpen = false;
    let exportsOpen = false;
    let aboutOpen = false;
    let troubleshootingOpen = false;

    onMount(() => {
        const applyHash = () => {
            const hash = (window.location.hash || "").replace(/^#/, "");

            spaOpen = false;
            generatorOpen = false;
            exportsOpen = false;
            aboutOpen = false;
            troubleshootingOpen = false;

            switch (hash) {
                case "state-pension-age":
                    spaOpen = true;
                    break;
                case "payment-calendar":
                    generatorOpen = true;
                    break;
                case "exports":
                    exportsOpen = true;
                    break;
                case "about":
                    aboutOpen = true;
                    break;
                case "troubleshooting":
                    troubleshootingOpen = true;
                    break;
            }
        };

        applyHash();
        window.addEventListener("hashchange", applyHash);
        return () => window.removeEventListener("hashchange", applyHash);
    });
</script>

<div class="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen py-8 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100">
    <div class="max-w-4xl mx-auto space-y-6">
        <div class="flex items-start justify-between gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Help</h1>
                <p class="mt-2 text-gray-600 dark:text-gray-300">
                    Use either tool independently: State Pension age (optional) and the payment calendar generator.
                </p>
            </div>
            <Button color="light" href="/" class="shrink-0">← Back</Button>
        </div>

        <Card class="w-full max-w-none bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div class="p-6 space-y-3">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Data Privacy (no user data is saved)</h2>
                <div class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <p>This app does not save your NI code or date of birth. Calculations run entirely in your browser.</p>
                    <p>Exports (CSV/ICS) are files created locally on your device. Printing uses your browser’s print dialog.</p>
                </div>
            </div>
        </Card>

        <Accordion class="w-full">
            <AccordionItem bind:open={spaOpen}>
                {#snippet header()}
                    <span id="state-pension-age">State Pension age (optional)</span>
                {/snippet}
                <div class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <p>Enter your date of birth to estimate the date you reach UK State Pension age.</p>
                    <p>You can use this tool on its own, or use the resulting year to prefill the payment calendar range.</p>
                    <p>
                        State Pension age can change based on government policy. For the most up-to-date result, validate using GOV.UK’s official checker.
                    </p>
                </div>
            </AccordionItem>

            <AccordionItem bind:open={generatorOpen}>
                {#snippet header()}
                    <span id="payment-calendar">Payment calendar generator</span>
                {/snippet}
                <div class="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                    <p>
                        This tool calculates your UK State Pension payment dates based on a repeating payment cycle and UK bank holidays.
                    </p>

                    <ul class="list-disc pl-6 space-y-1">
                        <li>Calculates payment dates using a repeating payment cycle (normally every 28 days).</li>
                        <li>Determines your normal payment weekday from your NI code (the last 3 characters of your National Insurance number).</li>
                        <li>Adjusts payments that would fall on a weekend or UK bank holiday so they are paid earlier.</li>
                    </ul>

                    <div class="space-y-2">
                        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">NI code</h3>
                        <p>
                            When the app asks for an NI code, it means the last 3 characters of your National Insurance number: 2 digits + a letter A–D (for example, 22D).
                        </p>
                    </div>

                    <div class="space-y-2">
                        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Payment cycle (Cycle Days)</h3>
                        <p>
                            By default, UK State Pension is usually paid every 28 days (4 weeks). Some people report that alternative payment frequencies (such as every 14 days or every 7 days)
                            can be arranged by contacting the Pension Service.
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            Note: official GOV.UK guidance documents the 28-day cycle; other cycles may depend on individual arrangements.
                        </p>
                    </div>

                    <div class="space-y-2">
                        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Date range</h3>
                        <p>
                            Choose the start and end year you want to include. Only payment dates within that range are shown.
                        </p>
                    </div>

                    <div class="space-y-2">
                        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Early payments</h3>
                        <p>
                            Payments are not made on weekends or UK bank holidays. If a payment date would fall on one, it is paid earlier.
                        </p>
                        <p>
                            Where available, the reason for an early payment is shown in the calendar and included in exports.
                        </p>
                    </div>
                </div>
            </AccordionItem>

            <AccordionItem bind:open={exportsOpen}>
                {#snippet header()}
                    <span id="exports">Exports and printing</span>
                {/snippet}
                <div class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <p>Use <strong>Export</strong> to download:</p>
                    <ul class="list-disc pl-6 space-y-1">
                        <li><strong>CSV</strong> (spreadsheet) for Excel/Google Sheets.</li>
                        <li><strong>ICS</strong> (calendar file) to import into Apple/Google/Outlook calendars.</li>
                    </ul>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        Note: calendar apps differ. Category/colour in an ICS file may be ignored (Google Calendar often ignores event colour from ICS imports).
                    </p>
                    <p>Use <strong>Print</strong> to print the calendar. Print output is optimized for paper.</p>
                </div>
            </AccordionItem>

            <AccordionItem bind:open={aboutOpen}>
                {#snippet header()}
                    <span id="about">About and disclaimer</span>
                {/snippet}
                <div class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <div class="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-3">
                        <div class="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Version</div>
                        <div class="mt-1 font-mono text-xs text-gray-800 dark:text-gray-200">
                            {buildInfo.version} (commit {buildInfo.commit})
                        </div>
                    </div>
                    <p>
                        This is an unofficial calculator. It is not affiliated with, endorsed by, or connected to DWP, HMRC, or GOV.UK.
                    </p>
                    <p>
                        Dates and calculations are based on publicly available information (for example, published pension schedules, the State Pension age timetable, and bank holiday lists) and may change.
                    </p>
                    <p>
                        No warranty is provided. Use at your own risk and always check official sources if you need a definitive answer.
                    </p>
                </div>
            </AccordionItem>

            <AccordionItem bind:open={troubleshootingOpen}>
                {#snippet header()}
                    <span id="troubleshooting">Troubleshooting</span>
                {/snippet}
                <div class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <ul class="list-disc pl-6 space-y-1">
                        <li>If exports are blocked, check your browser download permissions/pop-up settings.</li>
                        <li>Dates are calculated in UTC to avoid timezone issues.</li>
                        <li>If the calendar looks unstyled after an update, do a hard refresh.</li>
                    </ul>
                </div>
            </AccordionItem>
        </Accordion>

        <div class="text-sm text-gray-500 dark:text-gray-400">
            Sources: GOV.UK State Pension age guidance, the published State Pension age timetable, and UK bank holiday lists.
        </div>
    </div>
</div>
