<script lang="ts">
    // PensionInputsCard.svelte: Handles user input for pension calculation
import { Alert, Label, Select, Button, Modal } from "flowbite-svelte";
import { createEventDispatcher } from "svelte";

// Modal state for restore defaults
let showRestoreModal = $state(false);
const dispatch = createEventDispatcher();

function handleRestoreDefaultsClick() {
    showRestoreModal = true;
}

function handleRestoreDefaultsConfirm() {
    showRestoreModal = false;
    dispatch("restoreDefaults");
}

function handleRestoreDefaultsCancel() {
    showRestoreModal = false;
}
    import { calculateStatePensionAge } from "$lib/utils/statePensionAge";
    import { generatePayments, type Payment } from "$lib/pensionEngine";

    // --- Props ---
    type Props = {
        ni: string;
        dob: string;
        startYear: number;
        endYear: number;
        cycleDays: number;
        error: string;
        bankHolidays: Record<string, string>;
        onFirstPaymentAfterSpa?: (payment: Payment | null) => void;
        onPersist?: () => void;
        onRecalculate?: () => void;
    };
    let {
        ni = $bindable(),
        dob = $bindable(),
        startYear = $bindable(),
        endYear = $bindable(),
        cycleDays = $bindable(),
        error = $bindable(),
        bankHolidays,
        onFirstPaymentAfterSpa,
        onPersist,
        onRecalculate
    }: Props = $props();

    // --- Year options for selects ---
    const currentYear: number = new Date().getFullYear();
    const years: number[] = Array.from({ length: 50 }, (_, i) => currentYear - 15 + i);

    /**
     * Calculate default DOB as Jan 1 of (current year - 66)
     */
    function getDefaultDob(): string {
        const defaultYear = currentYear - 66;
        return `${defaultYear}-01-01`;
    }

    // --- Local state for controlled inputs ---
    let niDraft: string = $state("");
    let isEditingNi: boolean = $state(false);
    let startYearSelect: string = $state("");
    let endYearSelect: string = $state("");
    let cycleDaysSelect: string = $state(String(cycleDays ?? 28));
    let dobDate: Date | undefined = $state<Date | undefined>(undefined);

    /**
     * Convert ISO date string (YYYY-MM-DD) to local Date
     */
    function isoToDateLocal(iso: string): Date | null {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
        const [y, m, d] = iso.split("-").map((p) => Number.parseInt(p, 10));
        if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
        return new Date(y, m - 1, d);
    }

    /**
     * Convert local Date to ISO date string (YYYY-MM-DD)
     */
    function dateToIsoLocal(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    // --- Effects to sync local state with props ---
    $effect.pre(() => {
        startYearSelect = String(startYear);
        endYearSelect = String(endYear);
        cycleDaysSelect = String(cycleDays);
    });
    $effect.pre(() => {
        // Keep local draft in sync with bound value, but don't stomp while the user is typing.
        if (!isEditingNi && niDraft !== ni) niDraft = ni;
    });
    $effect.pre(() => {
        // Set default DOB if empty (Jan 1 of current year - 66)
        if (!dob) {
            dob = getDefaultDob();
        }
        dobDate = dob ? isoToDateLocal(dob) ?? undefined : undefined;
    });

    /**
     * Apply selected start year to bound value
     */
    function applyStartYear() {
        const n = Number.parseInt(startYearSelect, 10);
        if (Number.isFinite(n)) {
            startYear = n;
            onPersist?.();
            onRecalculate?.();
        }
    }

    function applyEndYear() {
        const n = Number.parseInt(endYearSelect, 10);
        if (Number.isFinite(n)) {
            endYear = n;
            onPersist?.();
            onRecalculate?.();
        }
    }

    function applyCycleDays() {
        const n = Number.parseInt(cycleDaysSelect, 10);
        if (Number.isFinite(n)) {
            cycleDays = n;
            onPersist?.();

            // If we don't have a valid DoB/SPA yet, SPA-based recalculation won't run.
            // Ensure the main schedule still regenerates.
            if (!spa) onRecalculate?.();
        }
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

    const showPre2016SpaWarning = $derived.by(() => {
        if (!spa) return false;
        // ISO 8601 date strings (YYYY-MM-DD) are lexicographically sortable.
        return spa.spaDate < "2016-04-06";
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
        const key = firstPaymentAfterSpa ? `${cycleDays}|${firstPaymentAfterSpa.due}|${firstPaymentAfterSpa.paid}` : null;
        if (key === lastFirstPaymentAfterSpaKey) return;
        lastFirstPaymentAfterSpaKey = key;
        onFirstPaymentAfterSpa?.(firstPaymentAfterSpa);
    });

    function focusDobInput() {
        const el = document.getElementById("dob");
        if (el instanceof HTMLElement) el.focus();
    }

    function commitNi() {
        isEditingNi = false;
        niDraft = niDraft.trim().toUpperCase();
        ni = niDraft;
        onPersist?.();

        // If we don't have a valid DoB/SPA yet, SPA-based recalculation won't run.
        // Ensure the main schedule still regenerates.
        if (!spa) onRecalculate?.();
    }

</script>



<div class="p-6 space-y-6">
    <!-- --- Input Section Header --- -->
    <div class="flex items-center justify-between mb-2">
        <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Inputs</h2>
            <p class="text-sm text-gray-600 dark:text-gray-300">
                Enter your NI code and date of birth to generate the payment schedule.
            </p>
        </div>
        <Button
            color="light"
            size="xs"
            onclick={handleRestoreDefaultsClick}
            tabindex={-1}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" 
            stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
         Restore defaults
        </Button>
    </div>

    <Modal title="Restore default values?" bind:open={showRestoreModal} size="sm" aria-label="Restore defaults confirmation">
        <div class="space-y-4">
            <p class="text-sm text-gray-700 dark:text-gray-200">This will reset all inputs to their default settings.</p>
            <div class="flex gap-2 justify-end mt-4">
                <Button color="light" onclick={handleRestoreDefaultsCancel}>Cancel</Button>
                <Button color="blue" onclick={handleRestoreDefaultsConfirm}>Restore defaults</Button>
            </div>
        </div>
    </Modal>
    <br/>
    <div class="grid grid-cols-1 2xl:grid-cols-2 gap-8 items-start">
        <div class="space-y-5">
            <div class="space-y-3">
                <!-- NI code input -->
                <div>
                    <Label for="ni-code" class="block mb-1 text-sm">NI code (last 3 characters of NI number)</Label>
                    <input
                        id="ni-code"
                        type="text"
                        bind:value={niDraft}
                        maxlength={3}
                        autocomplete="off"
                        autocapitalize="characters"
                        spellcheck={false}
                        placeholder="e.g., 22D"
                        class="block w-full sm:max-w-[12rem] p-2.5 text-sm rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        onfocus={() => {
                            isEditingNi = true;
                        }}
                        onkeydown={(e) => {
                            if (e.key !== "Enter") return;
                            e.preventDefault();
                            commitNi();
                            // Move focus so users can continue without tapping.
                            queueMicrotask(focusDobInput);
                        }}
                        onblur={() => {
                            commitNi();
                        }}
                    />
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        The last 3 characters of your National Insurance number (2 digits + letter A–D), e.g. 22D.
                    </p>
                    {#if niDraft.trim() && !isValidNiCode(niDraft)}
                        <p class="text-xs text-amber-700 dark:text-amber-300 mt-1">Format: 2 digits then A–D (e.g. 22D).</p>
                    {/if}
                </div>

                <!-- Date of birth input -->
                <div>
                    <Label for="dob" class="block mb-1 text-sm">Date of birth</Label>
                    <input
                        type="date"
                        id="dob"
                        name="dob"
                        bind:value={dob}
                        min="1900-01-01"
                        max="{new Date().toISOString().split('T')[0]}"
                        required
                        onchange={() => onPersist?.()}
                        class="block w-full sm:max-w-[18rem] p-2.5 text-sm rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    />
                    {#if !dob}
                        <p class="text-xs text-amber-700 dark:text-amber-300 mt-1">Required to calculate your State Pension age and calendar start.</p>
                    {/if}
                </div>

                <!-- Start/End year selects -->
                <div class="grid grid-cols-1 sm:inline-grid sm:grid-cols-2 gap-3">
                    <div>
                        <Label for="start-year" class="block mb-1 text-sm">Start Year</Label>
                        <Select
                            id="start-year"
                            bind:value={startYearSelect}
                            oninput={applyStartYear}
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
                            oninput={applyEndYear}
                            onchange={applyEndYear}
                            class="w-full sm:max-w-[10rem] text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            {#each years as year}
                                <option value={String(year)}>{year}</option>
                            {/each}
                        </Select>
                    </div>
                </div>

                <!-- Payment frequency select -->
                <div>
                    <Label for="cycle-days" class="block mb-1 text-sm">Payment Frequency</Label>
                    <Select
                        id="cycle-days"
                        bind:value={cycleDaysSelect}
                        oninput={applyCycleDays}
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

                <!-- Error alert -->
                {#if error}
                    <Alert color="red" class="dark:bg-red-900 dark:text-red-200 text-sm">
                        <span class="font-medium">Error:</span> {error}
                    </Alert>
                {/if}
            </div>
        </div>

        <div class="space-y-3">
            <!-- SPA calculation and payment preview -->
            {#if dob && !spa}
                <Alert color="red" class="text-sm">Please enter a valid date.</Alert>
            {/if}

            {#if spa}
                <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4">
                    <!-- Pre-2016 SPA warning -->
                    {#if showPre2016SpaWarning}
                        <div
                            role="alert"
                            class="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-100"
                        >
                            This calculator assumes your State Pension age (SPA) is on or after <strong>6 April 2016</strong>.
                            Your SPA appears to be earlier than that, so results may be inaccurate.
                        </div>
                    {/if}
                    <div class="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                        You reach State Pension age (SPA) on
                    </div>
                    <div class="mt-1 text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{spaDateFormatted}</div>
                    {#if spa.source !== "fixed"}
                        <div class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            Based on an age of {spa.spaAgeYears}{#if spa.spaAgeMonths}y {spa.spaAgeMonths}m{/if}.
                        </div>
                    {/if}

                    <!-- First payment after SPA -->
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

                            <!-- Second payment after SPA -->
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
