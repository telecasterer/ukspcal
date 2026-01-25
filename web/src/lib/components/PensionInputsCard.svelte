<script lang="ts">
    import { Alert, Datepicker, Input, Label, Select } from "flowbite-svelte";
    import { calculateStatePensionAge } from "$lib/utils/statePensionAge";
    import { generatePayments, type Payment } from "$lib/pensionEngine";

    type Props = {
        ni: string;
        dob: string;
        startYear: number;
        endYear: number;
        cycleDays: number;
        error: string;
        bankHolidays: Record<string, string>;
        onFirstPaymentAfterSpa?: (payment: Payment | null) => void;
    };

    let {
        ni = $bindable(),
        dob = $bindable(),
        startYear = $bindable(),
        endYear = $bindable(),
        cycleDays = $bindable(),
        error = $bindable(),
        bankHolidays,
        onFirstPaymentAfterSpa
    }: Props = $props();

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 50 }, (_, i) => currentYear - 25 + i);

    let startYearSelect = $state("");
    let endYearSelect = $state("");
    let cycleDaysSelect = $state(String(cycleDays ?? 28));

    let dobDate = $state<Date | undefined>(undefined);

    function isoToDateLocal(iso: string): Date | null {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
        const [y, m, d] = iso.split("-").map((p) => Number.parseInt(p, 10));
        if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
        return new Date(y, m - 1, d);
    }

    function dateToIsoLocal(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    $effect.pre(() => {
        startYearSelect = String(startYear);
        endYearSelect = String(endYear);
        cycleDaysSelect = String(cycleDays);
    });

    $effect.pre(() => {
        dobDate = dob ? isoToDateLocal(dob) ?? undefined : undefined;
    });

    function applyStartYear() {
        const n = Number.parseInt(startYearSelect, 10);
        if (Number.isFinite(n)) startYear = n;
    }

    function applyEndYear() {
        const n = Number.parseInt(endYearSelect, 10);
        if (Number.isFinite(n)) endYear = n;
    }

    function applyCycleDays() {
        const n = Number.parseInt(cycleDaysSelect, 10);
        if (Number.isFinite(n)) cycleDays = n;
    }

    function isValidNiCode(value: string): boolean {
        return /^\d{2}[A-D]$/i.test(value.trim());
    }

    const spa = $derived.by(() => {
        if (!dob) return null;
        try {
            return calculateStatePensionAge(dob);
        } catch {
            return null;
        }
    });

    const spaDateFormatted = $derived.by(() => {
        if (!spa) return "";
        const d = new Date(spa.spaDate + "T00:00:00Z");
        return d.toLocaleDateString("en-GB", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    });

    function formatIsoLong(iso: string): string {
        const d = new Date(iso + "T00:00:00Z");
        return d.toLocaleDateString("en-GB", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }

    const spaSchedule = $derived.by(() => {
        if (!spa) return null;
        if (!ni || !isValidNiCode(ni)) return null;

        const spaYear = Number(spa.spaDate.slice(0, 4));
        return generatePayments(ni.trim(), spaYear, spaYear + 2, cycleDays, bankHolidays);
    });

    const firstPaymentAfterSpa = $derived.by(() => {
        if (!spa || !spaSchedule) return null;

        // Find the first *scheduled* payment on/after SPA.
        // We compare against `due` so that an early-paid date that lands before SPA doesn't get selected.
        return spaSchedule.payments.find((p) => p.due >= spa.spaDate) ?? null;
    });

    const secondPaymentAfterSpa = $derived.by(() => {
        if (!spa || !spaSchedule) return null;

        const idx = spaSchedule.payments.findIndex((p) => p.due >= spa.spaDate);
        if (idx === -1) return null;
        return spaSchedule.payments[idx + 1] ?? null;
    });

    function daysBetweenIsoUtcInclusive(startIso: string, endIso: string): number {
        const start = new Date(startIso + "T00:00:00Z");
        const end = new Date(endIso + "T00:00:00Z");
        const ms = end.getTime() - start.getTime();
        const days = Math.max(0, Math.floor(ms / 86400000));
        return days + 1;
    }

    const comprisingText = $derived.by(() => {
        if (!spa || !firstPaymentAfterSpa) return "";
        const days = daysBetweenIsoUtcInclusive(spa.spaDate, firstPaymentAfterSpa.due);
        const weeks = Math.floor(days / 7);
        const rem = days % 7;
        return `Comprising ${weeks} week(s) and ${rem} day(s) pension`;
    });

    const firstPaymentDueFormatted = $derived.by(() => {
        const p = firstPaymentAfterSpa;
        if (!p) return "";
        return formatIsoLong(p.due);
    });

    const firstPaymentPaidFormatted = $derived.by(() => {
        const p = firstPaymentAfterSpa;
        if (!p) return "";
        return formatIsoLong(p.paid);
    });

    const secondPaymentDueFormatted = $derived.by(() => {
        const p = secondPaymentAfterSpa;
        if (!p) return "";
        return formatIsoLong(p.due);
    });

    const secondPaymentPaidFormatted = $derived.by(() => {
        const p = secondPaymentAfterSpa;
        if (!p) return "";
        return formatIsoLong(p.paid);
    });


    let lastFirstPaymentAfterSpaKey = $state<string | null>(null);

    $effect.pre(() => {
        const key = firstPaymentAfterSpa ? `${firstPaymentAfterSpa.due}|${firstPaymentAfterSpa.paid}` : null;
        if (key === lastFirstPaymentAfterSpaKey) return;
        lastFirstPaymentAfterSpaKey = key;
        onFirstPaymentAfterSpa?.(firstPaymentAfterSpa);
    });

</script>

<div class="p-6 space-y-6">
    <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Inputs</h2>
        <p class="text-sm text-gray-600 dark:text-gray-300">
            Enter your NI code and date of birth to generate the payment schedule.
        </p>
    </div>

    <div class="grid grid-cols-1 2xl:grid-cols-2 gap-8 items-start">
        <div class="space-y-5">
            <div class="space-y-3">
                <div>
                    <Label for="ni-code" class="block mb-1 text-sm">NI code (last 3 characters of NI number)</Label>
                    <Input
                        id="ni-code"
                        bind:value={ni}
                        placeholder="e.g., 22D"
                        class="w-full sm:max-w-[12rem] text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        The last 3 characters of your National Insurance number (2 digits + letter A–D), e.g. 22D.
                    </p>
                    {#if ni.trim() && !isValidNiCode(ni)}
                        <p class="text-xs text-amber-700 dark:text-amber-300 mt-1">Format: 2 digits then A–D (e.g. 22D).</p>
                    {/if}
                </div>

                <div>
                    <Label for="dob" class="block mb-1 text-sm">Date of birth</Label>
                    <div class="w-full sm:max-w-[14rem]">
                        <Datepicker
                            bind:value={dobDate}
                            defaultDate={new Date(1960, 0, 1)}
                            required
                            locale="en-GB"
                            inputClass="w-full text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            inputProps={{ id: "dob", name: "dob" }}
                            onselect={(x) => {
                                if (x instanceof Date) dob = dateToIsoLocal(x);
                            }}
                            onclear={() => {
                                dob = "";
                            }}
                        />
                    </div>
                    {#if !dob}
                        <p class="text-xs text-amber-700 dark:text-amber-300 mt-1">Required to calculate your State Pension age and calendar start.</p>
                    {/if}
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <a
                            href="/help#state-pension-age"
                            class="underline underline-offset-2 text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                        >
                            More help
                        </a>
                    </p>
                </div>

                <div class="grid grid-cols-1 sm:inline-grid sm:grid-cols-2 gap-3">
                    <div>
                        <Label for="start-year" class="block mb-1 text-sm">Start Year</Label>
                        <Select
                            id="start-year"
                            bind:value={startYearSelect}
                            onchange={applyStartYear}
                            class="w-full sm:max-w-[10rem] text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            {#each years as year}
                                <option value={String(year)}>{year}</option>
                            {/each}
                        </Select>
                    </div>

                    <div>
                        <Label for="end-year" class="block mb-1 text-sm">End Year</Label>
                        <Select
                            id="end-year"
                            bind:value={endYearSelect}
                            onchange={applyEndYear}
                            class="w-full sm:max-w-[10rem] text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            {#each years as year}
                                <option value={String(year)}>{year}</option>
                            {/each}
                        </Select>
                    </div>
                </div>

                <div>
                    <Label for="cycle-days" class="block mb-1 text-sm">Payment Frequency</Label>
                    <Select
                        id="cycle-days"
                        bind:value={cycleDaysSelect}
                        onchange={applyCycleDays}
                        class="w-full sm:max-w-[10rem] text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="7">7 days</option>
                        <option value="14">14 days</option>
                        <option value="28">28 days (default)</option>
                        <option value="91">13 weeks</option>
                    </Select>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Payment frequency is normally every 28 days.
                    </p>
                </div>

                {#if error}
                    <Alert color="red" class="dark:bg-red-900 dark:text-red-200 text-sm">
                        <span class="font-medium">Error:</span> {error}
                    </Alert>
                {/if}
            </div>
        </div>

        <div class="space-y-3">
            {#if dob && !spa}
                <Alert color="red" class="text-sm">Please enter a valid date.</Alert>
            {/if}

            {#if spa}
                <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4">
                    <div class="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                        You reach State Pension age (SPA) on
                    </div>
                    <div class="mt-1 text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{spaDateFormatted}</div>
                    {#if spa.source !== "fixed"}
                        <div class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            Based on an age of {spa.spaAgeYears}{#if spa.spaAgeMonths}y {spa.spaAgeMonths}m{/if}.
                        </div>
                    {/if}

                    {#if firstPaymentAfterSpa}
                        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div class="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                First payment after reaching pension age
                            </div>
                            <div class="mt-1 text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                                {firstPaymentDueFormatted}
                            </div>
                            <div class="mt-1 text-sm text-gray-600 dark:text-gray-300">{comprisingText}</div>

                            {#if firstPaymentAfterSpa.early && firstPaymentAfterSpa.paid !== firstPaymentAfterSpa.due}
                                <div class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                    Paid early on {firstPaymentPaidFormatted}.
                                </div>
                            {/if}

                            {#if secondPaymentAfterSpa}
                                <div class="mt-3">
                                    <div class="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                        Second payment
                                    </div>
                                    <div class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                                        {secondPaymentDueFormatted}
                                    </div>
                                    {#if secondPaymentAfterSpa.early && secondPaymentAfterSpa.paid !== secondPaymentAfterSpa.due}
                                        <div class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                            Paid early on {secondPaymentPaidFormatted}.
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {:else if ni}
                        <div class="mt-4 text-xs text-gray-500 dark:text-gray-400">
                            Enter a valid NI code to estimate your first payment date.
                        </div>
                    {/if}

                </div>
            {/if}
        </div>
    </div>
</div>
