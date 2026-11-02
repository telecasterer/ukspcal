<script lang="ts">
    // PensionInputsCard.svelte: Handles user input for pension calculation
    import { Alert, Label, Select, Button, Modal } from "flowbite-svelte";
    import { RefreshOutline } from "flowbite-svelte-icons";
    import { todayStore } from "#lib/utils/todayStore.svelte";

    // Modal state for restore defaults
    let showRestoreModal = $state(false);
    // dispatch is already declared at the top

    function handleRestoreDefaultsClick() {
        showRestoreModal = true;
    }

    function handleRestoreDefaultsConfirm() {
        showRestoreModal = false;
        loadedProfileName = null;
        onRestoreDefaults?.();
    }

    function handleRestoreDefaultsCancel() {
        showRestoreModal = false;
    }
    import { calculateStatePensionAge } from "#lib/utils/statePensionAge";
    import { MIN_DOB_ISO } from "#lib/config";
    import { generatePayments, type Payment } from "#lib/pensionEngine";
    import type { SavedProfile } from "#lib/utils/profilePersistence";
    import ProfilesBar from "./ProfilesBar.svelte";

    // --- Props ---

    type SpaPreviewData = {
        spaDateFormatted: string;
        spaAgeYears: number;
        spaAgeMonths: number;
        spaSource: string;
        showPre2016Warning: boolean;
        firstPayment: {
            dueFormatted: string;
            paidFormatted: string;
            isEarly: boolean;
            comprisingText: string;
        } | null;
        secondPayment: {
            dueFormatted: string;
            paidFormatted: string;
            isEarly: boolean;
        } | null;
    };

    type Props = {
        ni: string;
        dob: string;
        startYear: number;
        numberOfYears: number;
        cycleDays: number;
        error: string;
        bankHolidays: Record<string, string>;
        onRestoreDefaults?: () => void;
        onFirstPaymentAfterSpa?: (payment: Payment | null) => void;
        onPersist?: () => void;
        onRecalculate?: () => void;
        onSpaPreviewData?: (data: SpaPreviewData | null) => void;
        /** Called when the user changes the date of birth or loads a saved profile. */
        onDobEdited?: () => void;
    };
    let {
        ni = $bindable(),
        dob = $bindable(),
        startYear = $bindable(),
        numberOfYears = $bindable(),
        cycleDays = $bindable(),
        error = $bindable(),
        bankHolidays,
        onRestoreDefaults,
        onFirstPaymentAfterSpa,
        onPersist,
        onRecalculate,
        onSpaPreviewData,
        onDobEdited,
    }: Props = $props();

    const currentYear = $derived(Number(todayStore.iso.slice(0, 4)));
    const todayIso = $derived(todayStore.iso);

    /**
     * Default DOB is Jan 1 of (current year - 66). Most users are close to State Pension
     * age, so this saves them paging a phone date picker back more than 65 years.
     */
    function getDefaultDob(): string {
        return `${currentYear - 66}-01-01`;
    }

    // --- Local state for controlled inputs ---
    let niDraft: string = $state("");
    let isEditingNi: boolean = $state(false);
    let cycleDaysSelect: string = $state(String(cycleDays ?? 28));
    let dobDate: Date | undefined = $state<Date | undefined>(undefined);
    let loadedProfileName: string | null = $state(null);

    function loadProfile(p: SavedProfile) {
        ni = p.ni;
        dob = p.dob;
        niDraft = p.ni;
        onDobEdited?.();
        onPersist?.();
        onRecalculate?.();
    }

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
        cycleDaysSelect = String(cycleDays);
    });
    $effect.pre(() => {
        // Keep local draft in sync with bound value, but don't stomp while the user is typing.
        if (!isEditingNi && niDraft !== ni) niDraft = ni;
    });
    $effect.pre(() => {
        // Pre-fill the default DOB (see getDefaultDob) when empty.
        if (!dob) {
            dob = getDefaultDob();
        }
        dobDate = dob ? (isoToDateLocal(dob) ?? undefined) : undefined;
    });

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
            day: "numeric",
            timeZone: "UTC",
        });
    });

    function formatIsoLong(iso: string): string {
        const d = new Date(iso + "T00:00:00Z");
        return d.toLocaleDateString("en-GB", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "UTC",
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

    function formatPaymentPercentage(days: number, fullCycleDays: number): string {
        if (!Number.isFinite(days) || !Number.isFinite(fullCycleDays) || fullCycleDays <= 0) {
            return "";
        }
        const pct = (days / fullCycleDays) * 100;
        const rounded = Math.round(pct);
        return `${rounded}%`;
    }

    const comprisingText = $derived.by(() => {
        if (!spa || !firstPaymentAfterSpa) return "";
        const days = daysBetweenIsoUtcInclusive(spa.spaDate, firstPaymentAfterSpa.due);
        const weeks = Math.floor(days / 7);
        const rem = days % 7;
        const pctText = formatPaymentPercentage(days, cycleDays);
        const weekStr = weeks === 1 ? "1 week" : `${weeks} weeks`;
        const dayStr = rem === 1 ? "1 day" : `${rem} days`;
        const durationStr = weeks === 0 ? dayStr : rem === 0 ? weekStr : `${weekStr} and ${dayStr}`;
        return `Comprising ${durationStr} pension (${pctText} of a full ${cycleDays}-day payment)`;
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
        const key = firstPaymentAfterSpa
            ? `${cycleDays}|${firstPaymentAfterSpa.due}|${firstPaymentAfterSpa.paid}`
            : null;
        if (key === lastFirstPaymentAfterSpaKey) return;
        lastFirstPaymentAfterSpaKey = key;
        onFirstPaymentAfterSpa?.(firstPaymentAfterSpa);
    });

    $effect.pre(() => {
        if (!spa) {
            onSpaPreviewData?.(null);
            return;
        }
        onSpaPreviewData?.({
            spaDateFormatted,
            spaAgeYears: spa.spaAgeYears,
            spaAgeMonths: spa.spaAgeMonths ?? 0,
            spaSource: spa.source,
            showPre2016Warning: showPre2016SpaWarning,
            firstPayment: firstPaymentAfterSpa
                ? {
                      dueFormatted: firstPaymentDueFormatted,
                      paidFormatted: firstPaymentPaidFormatted,
                      isEarly:
                          firstPaymentAfterSpa.early &&
                          firstPaymentAfterSpa.paid !== firstPaymentAfterSpa.due,
                      comprisingText,
                  }
                : null,
            secondPayment: secondPaymentAfterSpa
                ? {
                      dueFormatted: secondPaymentDueFormatted,
                      paidFormatted: secondPaymentPaidFormatted,
                      isEarly:
                          secondPaymentAfterSpa.early &&
                          secondPaymentAfterSpa.paid !== secondPaymentAfterSpa.due,
                  }
                : null,
        });
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
    <div class="flex items-center justify-between mb-2">
        <div>
            <p class="text-sm text-gray-600 dark:text-gray-300">
                Enter your NI number suffix and date of birth to generate your payment schedule.
            </p>
        </div>
        <Button color="light" size="xs" onclick={handleRestoreDefaultsClick}>
            <RefreshOutline class="mr-1.5 h-4 w-4" ariaLabel="Restore defaults" />
            Restore defaults
        </Button>
    </div>

    <Modal
        title="Restore default values?"
        bind:open={showRestoreModal}
        size="sm"
        aria-label="Restore defaults confirmation"
    >
        <div class="space-y-4">
            <p class="text-sm text-gray-700 dark:text-gray-200">
                This will reset all inputs to their default settings.
            </p>
            <div class="flex gap-2 justify-end mt-4">
                <Button color="light" onclick={handleRestoreDefaultsCancel}>Cancel</Button>
                <Button color="blue" onclick={handleRestoreDefaultsConfirm}>Restore defaults</Button
                >
            </div>
        </div>
    </Modal>

    <ProfilesBar {ni} {dob} bind:loadedProfileName onLoad={loadProfile} />

    <div class="space-y-3">
        <!-- NI code input -->
        <div>
            <Label for="ni-code" class="block mb-1 text-sm">NI number suffix</Label>
            <input
                id="ni-code"
                type="text"
                bind:value={niDraft}
                maxlength={3}
                autocomplete="off"
                autocapitalize="characters"
                spellcheck={false}
                placeholder="e.g. 22D"
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
            <p class="text-xs min-[390px]:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Last 3 characters of your NI number — 2 digits and a letter A–D, for example 22D.
            </p>
            {#if niDraft.trim() && !isValidNiCode(niDraft)}
                <p class="text-xs min-[390px]:text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Format: 2 digits then A–D (e.g. 22D).
                </p>
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
                min={MIN_DOB_ISO}
                max={todayIso}
                required
                oninput={() => onDobEdited?.()}
                onchange={() => onPersist?.()}
                class="block w-full sm:max-w-[12rem] p-2.5 text-sm rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            />
            {#if !dob}
                <p class="text-xs min-[390px]:text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Required to calculate your State Pension age and calendar start.
                </p>
            {/if}
        </div>

        <!-- Payment frequency select -->
        <div>
            <Label for="cycle-days" class="block mb-1 text-sm">Payment frequency</Label>
            <Select
                id="cycle-days"
                bind:value={cycleDaysSelect}
                oninput={applyCycleDays}
                onchange={applyCycleDays}
                class="w-full sm:max-w-[12rem] text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
                <option value="7">1 week</option>
                <option value="14">2 weeks</option>
                <option value="28">4 weeks (default)</option>
                <option value="91">13 weeks</option>
            </Select>
            <p class="text-xs min-[390px]:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Payment frequency is normally every 4 weeks.
            </p>
        </div>

        <!-- Error alert -->
        {#if error}
            <Alert color="red" class="dark:bg-red-900 dark:text-red-200 text-sm">
                <span class="font-medium">Error:</span>
                {error}
            </Alert>
        {/if}
    </div>
</div>
