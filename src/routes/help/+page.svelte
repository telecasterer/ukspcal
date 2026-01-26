<script lang="ts">
    import { Accordion, AccordionItem, Button, Card, Footer } from "flowbite-svelte";
    import { onMount } from "svelte";
    import { buildInfo } from "$lib/buildInfo";

    function formatIsoForDisplay(iso: string): string {
        if (!iso || iso === "unknown") return "unknown";
        const d = new Date(iso);
        return Number.isNaN(d.getTime())
            ? iso
            : d.toLocaleString("en-GB", { hour12: false });
    }

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

<div class="flex flex-col min-h-screen">
    <div class="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100 flex-1">
        <div class="max-w-4xl mx-auto space-y-6">
        <div class="flex items-start justify-between gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                    Help
                </h1>
                <p class="mt-2 text-gray-600 dark:text-gray-300">
                    This app calculates your UK State Pension age and payment
                    calendar and allows you to print or export the calendar as
                    csv or ics files.
                </p>
            </div>
            <Button color="light" href="/" class="shrink-0">← Back</Button>
        </div>

        <Card
            class="w-full max-w-none bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        >
            <div class="p-6 space-y-3">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Data Privacy (no user data is saved)
                </h2>
                <div class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <p>
                        This app does not save your NI code or date of birth or
                        any other data on a server. Calculations run entirely in
                        your browser.
                    </p>
                    <p>
                        Exports (CSV/ICS) are files created locally on your
                        device. Printing uses your browser’s print dialog.
                    </p>
                </div>
            </div>
        </Card>

        <Accordion class="w-full">
            <AccordionItem bind:open={spaOpen}>
                {#snippet header()}
                    <span id="state-pension-age"
                        >Date of birth & State Pension age</span
                    >
                {/snippet}
                <div class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <p>
                        Your date of birth is required to calculate the date you
                        reach UK State Pension age (SPA) and to set the calendar
                        start month.
                    </p>
                    <p>
                        The calendar is automatically clamped so it won’t show
                        months before your first payment after reaching SPA.
                    </p>
                    
                    <p>
                        State Pension age can change based on government policy.
                        For the most up-to-date result, validate using GOV.UK’s
                        official checker.
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        Note: the payment rules in this app assume your SPA is on or after <strong>6 April 2016</strong>.
                        If your SPA is earlier than that, results may be inaccurate (the app will show a warning).
                    </p>
                </div>
            </AccordionItem>

            <AccordionItem bind:open={generatorOpen}>
                {#snippet header()}
                    <span id="payment-calendar">Payment calendar generator</span
                    >
                {/snippet}
                <div class="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                    <p>
                        This tool calculates your UK State Pension payment dates
                        based on a repeating payment cycle and UK bank holidays.
                    </p>

                    <ul class="list-disc pl-6 space-y-1">
                        <li>
                            The calendar updates automatically once the inputs
                            are valid.
                        </li>
                        <li>
                            The earliest month shown is the first payment after
                            you reach state pension age (SPA).
                        </li>
                    </ul>

                    <ul class="list-disc pl-6 space-y-1">
                        <li>
                            Payment dates are calculated based on a repeating
                            payment cycle (normally every 28 days).
                        </li>
                        <li>
                            Your normal payment weekday is determined from your
                            NI code (the last 3 characters of your National
                            Insurance number).
                        </li>
                        <li>
                            Payments that would fall on a weekend or UK bank
                            holiday are adjusted so they are paid earlier.
                        </li>
                    </ul>

                    <div class="space-y-2">
                        <h3
                            class="text-sm font-semibold text-gray-900 dark:text-white"
                        >
                            NI code
                        </h3>
                        <p>
                            When the app asks for an NI code, it means the last
                            3 characters of your National Insurance number: 2
                            digits + a letter A–D (for example, 22D).
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            Important: for the <strong
                                >14-day (fortnightly)</strong
                            > cycle, the letter (A–D) is not used. Only the digits
                            are used.
                        </p>
                    </div>

                    <div class="space-y-2">
                        <h3
                            class="text-sm font-semibold text-gray-900 dark:text-white"
                        >
                            Payment Frequency
                        </h3>
                        <p>
                            By default, UK State Pension is usually paid every
                            28 days (4 weeks). Some people report that
                            alternative payment frequencies (such as every 14
                            days or every 7 days) can be arranged by contacting
                            the Pension Service. Pensioners living outside the
                            UK may choose to be paid every 13 weeks.
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            Note: official GOV.UK guidance documents the 28-day
                            cycle; other cycles may depend on individual
                            arrangements.
                        </p>
                    </div>

                    <div class="space-y-2">
                        <h3
                            class="text-sm font-semibold text-gray-900 dark:text-white"
                        >
                            28-day (4-week, the default) rule
                        </h3>
                        <p>
                            For the <strong>28-day</strong> cycle, the app uses
                            the NI suffix letter (A–D) as a
                            <strong>phase</strong> (which week within the repeating
                            4-week pattern), and the last two digits to choose your
                            normal weekday.
                        </p>
                        <ul class="list-disc pl-6 space-y-1">
                            <li>
                                <strong>Payment weekday</strong> comes from the last
                                two digits: 00–19 Mon, 20–39 Tue, 40–59 Wed, 60–79
                                Thu, 80–99 Fri.
                            </li>
                            <li>
                                <strong>Phase (A–D)</strong> shifts the schedule
                                in one-week steps (A, B, C, D).
                            </li>
                            <li>
                                Payments then repeat every 28 days.
                                Weekend/bank-holiday payments are paid early
                                (previous working day).
                            </li>
                        </ul>
                    </div>

                    <div class="space-y-2">
                        <h3
                            class="text-sm font-semibold text-gray-900 dark:text-white"
                        >
                            Weekly (7-day) rule
                        </h3>
                        <p>
                            For the <strong>7-day</strong> cycle, the app uses the
                            same NI-based weekday/phase mapping as the 28-day schedule,
                            but repeats every 7 days.
                        </p>
                        <ul class="list-disc pl-6 space-y-1">
                            <li>
                                Your normal weekday comes from the last two
                                digits (00–19 Mon … 80–99 Fri).
                            </li>
                            <li>The suffix letter (A–D) affects the phase.</li>
                            <li>
                                Payments repeat every 7 days, with
                                weekend/bank-holiday payments paid early.
                            </li>
                        </ul>
                    </div>

                    <div class="space-y-2">
                        <h3
                            class="text-sm font-semibold text-gray-900 dark:text-white"
                        >
                            Fortnightly (14-day) rule
                        </h3>
                        <p>
                            For the <strong>14-day</strong> cycle, payments run on
                            a national two-week rhythm (Week 1 / Week 2). The app
                            applies these confirmed rules (anchored to January 2026):
                        </p>
                        <ul class="list-disc pl-6 space-y-1">
                            <li>
                                <strong>Week 1 vs Week 2</strong> is based on the
                                parity (odd/even) of the final digit of the NI number:
                                even → Week 1, odd → Week 2.
                            </li>
                            <li>
                                <strong>Week anchors</strong>: Week 1 starts
                                Monday 5 Jan 2026; Week 2 starts Monday 12 Jan
                                2026.
                            </li>
                            <li>
                                <strong>Payment weekday</strong> comes from the last
                                two digits: 00–19 Mon, 20–39 Tue, 40–59 Wed, 60–79
                                Thu, 80–99 Fri.
                            </li>
                            <li>
                                Payments then repeat every 14 days.
                                Weekend/bank-holiday payments are paid early
                                (previous working day).
                            </li>
                            <li>
                                The NI suffix letter (A–D) is <strong
                                    >ignored</strong
                                > for this cycle.
                            </li>
                        </ul>
                    </div>

                    <div class="space-y-2">
                        <h3
                            class="text-sm font-semibold text-gray-900 dark:text-white"
                        >
                            13-week (91-day) rule
                        </h3>
                        <p>
                            For the <strong>91-day</strong> cycle (often used for
                            some overseas payments), the app again uses the same
                            NI-based weekday/phase mapping, but repeats every 91
                            days.
                        </p>
                        <ul class="list-disc pl-6 space-y-1">
                            <li>
                                Your normal weekday comes from the last two
                                digits (00–19 Mon … 80–99 Fri).
                            </li>
                            <li>The suffix letter (A–D) affects the phase.</li>
                            <li>
                                Payments repeat every 91 days, with
                                weekend/bank-holiday payments paid early.
                            </li>
                        </ul>
                    </div>

                    <div class="space-y-2">
                        <h3
                            class="text-sm font-semibold text-gray-900 dark:text-white"
                        >
                            Date range
                        </h3>
                        <p>
                            Choose the start and end year you want to include.
                            Only payment dates within that range are shown. If
                            your calculated first payment after SPA falls
                            outside the selected years, the app will expand the
                            range to include it.
                        </p>
                    </div>

                    <div class="space-y-2">
                        <h3
                            class="text-sm font-semibold text-gray-900 dark:text-white"
                        >
                            Early payments
                        </h3>
                        <p>
                            Payments are not made on weekends or UK bank
                            holidays. If a payment date would fall on one, it is
                            usually paid earlier.
                        </p>
                        <p>
                            Where available, the reason for an early payment is
                            shown in the calendar and included in exports.
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
                        <li>
                            <strong>CSV</strong> (spreadsheet data) for Excel/Google
                            Sheets etc.
                        </li>
                        <li>
                            <strong>ICS</strong> (calendar file) to import into Apple/Google/Outlook
                            calendars.
                        </li>
                    </ul>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        Note: calendar apps differ. Category/colour in an ICS
                        file may be ignored (Google Calendar often ignores event
                        colour from ICS imports).
                    </p>
                    <p>
                        Use <strong>Print</strong> to print the calendar. Print output
                        is optimized for paper.
                    </p>
                </div>
            </AccordionItem>

            <AccordionItem bind:open={aboutOpen}>
                {#snippet header()}
                    <span id="about">About and disclaimer</span>
                {/snippet}
                <div class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <p>Developer: Paul Robins</p>
                    <div
                        class="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-3"
                    >
                        <div
                            class="text-xs font-semibold tracking-wide text-gray-600 dark:text-gray-300"
                        >
                            Version
                        </div>
                        <div
                            class="mt-1 font-mono text-xs text-gray-800 dark:text-gray-200"
                        >
                            {buildInfo.version} (commit {buildInfo.commit})
                        </div>
                        <div
                            class="mt-2 text-xs text-gray-600 dark:text-gray-300"
                        >
                            Commit date: {formatIsoForDisplay(
                                buildInfo.commitDate,
                            )}
                        </div>
                        <div
                            class="mt-1 text-xs text-gray-600 dark:text-gray-300"
                        >
                            Build date: {formatIsoForDisplay(
                                buildInfo.buildTime,
                            )}
                        </div>
                    </div>
                    <p>
                        This is an unofficial calculator. It is not affiliated
                        with, endorsed by, or connected to DWP, HMRC, or GOV.UK.
                    </p>
                    <p>
                        Dates and calculations are based on publicly available
                        information (for example, published pension schedules,
                        the State Pension age timetable, and bank holiday lists)
                        and may change.
                    </p>
                    <p>
                        No warranty is provided. Use at your own risk and always
                        check official sources if you need a definitive answer.
                    </p>
                </div>
            </AccordionItem>

            <AccordionItem bind:open={troubleshootingOpen}>
                {#snippet header()}
                    <span id="troubleshooting">Troubleshooting</span>
                {/snippet}
                <div class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <ul class="list-disc pl-6 space-y-1">
                        <li>
                            If exports are blocked, check your browser download
                            permissions/pop-up settings.
                        </li>
                        <li>
                            Dates are calculated in UTC to avoid timezone
                            issues.
                        </li>
                        <li>
                            If the calendar looks unstyled after an update, do a
                            hard refresh.
                        </li>
                    </ul>
                </div>
            </AccordionItem>
        </Accordion>
    </div>
</div>

<Footer>
    <div class="text-sm text-gray-500 dark:text-gray-400">
        Sources: GOV.UK State Pension age guidance, the published State
        Pension age timetable, and UK bank holiday lists.
    </div>

    <div class="text-sm text-gray-500 dark:text-gray-400">
        <a href="https://github.com/telecasterer/ukspcal" target="_blank" rel="noopener noreferrer" class="hover:underline flex items-center gap-2">
            <svg
            width="1em"
            height="1em"
            viewBox="0 0 98 96"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            class="inline align-text-bottom"
            >
                <g clip-path="url(#clip0_730_27126)">
                    <path
                    d="M41.4395 69.3848C28.8066 67.8535 19.9062 58.7617 19.9062 46.9902C19.9062 42.2051 21.6289 37.0371 24.5 33.5918C23.2559 30.4336 23.4473 23.7344 24.8828 20.959C28.7109 20.4805 33.8789 22.4902 36.9414 25.2656C40.5781 24.1172 44.4062 23.543 49.0957 23.543C53.7852 23.543 57.6133 24.1172 61.0586 25.1699C64.0254 22.4902 69.2891 20.4805 73.1172 20.959C74.457 23.543 74.6484 30.2422 73.4043 33.4961C76.4668 37.1328 78.0937 42.0137 78.0937 46.9902C78.0937 58.7617 69.1934 67.6621 56.3691 69.2891C59.623 71.3945 61.8242 75.9883 61.8242 81.252L61.8242 91.2051C61.8242 94.0762 64.2168 95.7031 67.0879 94.5547C84.4102 87.9512 98 70.6289 98 49.1914C98 22.1074 75.9883 6.69539e-07 48.9043 4.309e-07C21.8203 1.92261e-07 -1.9479e-07 22.1074 -4.3343e-07 49.1914C-6.20631e-07 70.4375 13.4941 88.0469 31.6777 94.6504C34.2617 95.6074 36.75 93.8848 36.75 91.3008L36.75 83.6445C35.4102 84.2188 33.6875 84.6016 32.1562 84.6016C25.8398 84.6016 22.1074 81.1563 19.4277 74.7441C18.375 72.1602 17.2266 70.6289 15.0254 70.3418C13.877 70.2461 13.4941 69.7676 13.4941 69.1934C13.4941 68.0449 15.4082 67.1836 17.3223 67.1836C20.0977 67.1836 22.4902 68.9063 24.9785 72.4473C26.8926 75.2227 28.9023 76.4668 31.2949 76.4668C33.6875 76.4668 35.2187 75.6055 37.4199 73.4043C39.0469 71.7773 40.291 70.3418 41.4395 69.3848Z"
                    fill="currentColor"
                    />
                </g>
                <defs>
                    <clipPath id="clip0_730_27126">
                        <rect width="98" height="96" fill="white" />
                    </clipPath>
                </defs>
            </svg>
            View the source code on GitHub
        </a>
    </div>
</Footer>
</div>