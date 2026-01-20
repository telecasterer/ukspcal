<script lang="ts">
    import { generatePayments, type PensionResult, type Payment } from "$lib/pensionEngine";
    import { fetchUKBankHolidays } from "$lib/fetchBankHolidays";
    import { Button, Label, Input, Select, Card, Table, TableBody, TableHead, TableHeadCell, TableBodyCell, Alert, Tabs, TabItem, Checkbox } from "flowbite-svelte";

    let ni = $state("");
    let startYear = $state(new Date().getFullYear());
    let endYear = $state(new Date().getFullYear() + 1);
    let cycleDays = $state<number>(28);
    let activeTab = $state("list");
    let showWeekends = $state(true);
    let showBankHolidays = $state(true);
    let darkMode = $state(
        typeof localStorage !== 'undefined' && localStorage.getItem('darkMode') === 'true'
    );
    
    let { data } = $props();

    const { bankHolidays } = $derived(data);

    let result: PensionResult | null = $state(null);
    let error = $state("");

    let currentCalendarMonth = $state(new Date().getMonth());
    let currentCalendarYear = $state(new Date().getFullYear());

    $effect.pre(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('darkMode', darkMode.toString());
            if (darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    });

    function generate() {
        error = "";

        if (!/^\d{2}[A-D]$/i.test(ni)) {
            error = "NI code must be 2 digits followed by A–D (e.g. 22D)";
            result = null;
            return;
        }

        if (endYear < startYear) {
            error = "End year must be after start year";
            result = null;
            return;
        }

        result = generatePayments(ni, startYear, endYear, cycleDays, bankHolidays);
        
        // Reset calendar to first payment's month if available
        if (result && result.payments.length > 0) {
            const firstPayment = new Date(result.payments[0].paid + "T00:00:00Z");
            currentCalendarMonth = firstPayment.getUTCMonth();
            currentCalendarYear = firstPayment.getUTCFullYear();
        }
    }

    function formatDate(dateStr: string): string {
        const date = new Date(dateStr + "T00:00:00Z");
        return date.toLocaleDateString("en-GB", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    function getDayName(dateStr: string): string {
        const date = new Date(dateStr + "T00:00:00Z");
        return date.toLocaleDateString("en-GB", { weekday: "long" });
    }

    // Calendar helpers
    function getDaysInMonth(year: number, month: number): number {
        return new Date(year, month + 1, 0).getDate();
    }

    function getFirstDayOfMonth(year: number, month: number): number {
        const dow = new Date(Date.UTC(year, month, 1)).getUTCDay();
        // Convert Sunday=0 to Monday=0 format
        return dow === 0 ? 6 : dow - 1;
    }

    function getPaymentForDate(year: number, month: number, day: number): Payment | null {
        if (!result) return null;
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return result.payments.find(p => p.paid === dateStr) || null;
    }

    function getBankHolidayForDate(year: number, month: number, day: number): string | null {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return bankHolidays[dateStr] || null;
    }

    function isWeekend(day: number): boolean {
        const date = new Date(Date.UTC(currentCalendarYear, currentCalendarMonth, day));
        const dow = date.getUTCDay();
        return dow === 0 || dow === 6;
    }

    function monthName(month: number): string {
        return new Date(2000, month, 1).toLocaleDateString("en-GB", { month: "long" });
    }

    function previousMonth() {
        if (currentCalendarMonth === 0) {
            currentCalendarMonth = 11;
            currentCalendarYear--;
        } else {
            currentCalendarMonth--;
        }
    }

    function nextMonth() {
        if (currentCalendarMonth === 11) {
            currentCalendarMonth = 0;
            currentCalendarYear++;
        } else {
            currentCalendarMonth++;
        }
    }

    function generateCalendarDays() {
        const daysInMonth = getDaysInMonth(currentCalendarYear, currentCalendarMonth);
        const firstDay = getFirstDayOfMonth(currentCalendarYear, currentCalendarMonth);
        const days = [];

        // Empty cells before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    }
</script>

<!-- Navigation -->
<nav class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2.5">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">📅 Pension Calendar</div>
        <button 
            onclick={() => { darkMode = !darkMode; }}
            class="btn-icon text-2xl"
            title="Toggle dark mode"
        >
            {#if darkMode}
                ☀️
            {:else}
                🌙
            {/if}
        </button>
    </div>
</nav>

<!-- Main Content -->
<div class="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen py-8 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100">
    <div class="w-full">
        <!-- Header -->
        <div class="mb-8">
            <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">UK State Pension Payment Calendar</h1>
            <p class="text-lg text-gray-600 dark:text-gray-300">Calculate your pension payment schedule based on your NI code</p>
        </div>

        <!-- Input Card -->
        <Card class="w-full mb-8 shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div class="p-6">
                <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Generate Payment Schedule</h2>
                
                <form onsubmit={(e) => { e.preventDefault(); generate(); }} class="space-y-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <!-- NI Code Input -->
                        <div>
                            <Label for="ni-code" class="block mb-2 text-sm font-medium">NI Code</Label>
                            <Input
                                id="ni-code"
                                bind:value={ni}
                                placeholder="e.g. 22D"
                                maxlength="3"
                                autocomplete="off"
                                class="uppercase"
                            />
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Last 3 chars (e.g. 22D)</p>
                        </div>

                        <!-- Start Year -->
                        <div>
                            <Label for="start-year" class="block mb-2 text-sm font-medium dark:text-gray-300">From Year</Label>
                            <Input
                                id="start-year"
                                type="number"
                                bind:value={startYear}
                                class="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>

                        <!-- End Year -->
                        <div>
                            <Label for="end-year" class="block mb-2 text-sm font-medium dark:text-gray-300">To Year</Label>
                            <Input
                                id="end-year"
                                type="number"
                                bind:value={endYear}
                                class="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <!-- Payment Cycle -->
                        <div>
                            <Label for="cycle" class="block mb-2 text-sm font-medium dark:text-gray-300">Cycle</Label>
                            <Select id="cycle" bind:value={cycleDays} class="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <option value={28}>Every 28 days</option>
                                <option value={14}>Every 14 days</option>
                                <option value={7}>Every 7 days</option>
                            </Select>
                        </div>

                        <!-- Submit Button -->
                        <div class="flex items-end">
                            <button type="submit" class="btn-primary w-full py-2.5">
                                Generate
                            </button>
                        </div>
                    </div>
                </form>

                {#if error}
                    <Alert color="red" closable class="dark:bg-red-900 dark:text-red-200">
                        <span class="font-medium">Error:</span> {error}
                    </Alert>
                {/if}
            </div>
        </Card>

        <!-- Results Section -->
        {#if result}
            <div class="space-y-6">
                <!-- Summary Card -->
                <Card class="w-full shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div class="p-4">
                        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Schedule Summary</h2>
                    <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            <div class="bg-blue-50 dark:bg-blue-900 p-2 rounded border border-blue-200 dark:border-blue-700">
                                <p class="text-xs font-semibold text-blue-600 dark:text-blue-300 uppercase mb-1">NI Code</p>
                                <p class="text-lg font-bold text-blue-700 dark:text-blue-100">{result.ni}</p>
                            </div>
                            <div class="bg-emerald-50 dark:bg-emerald-900 p-2 rounded border border-emerald-200 dark:border-emerald-700">
                                <p class="text-xs font-semibold text-emerald-600 dark:text-emerald-300 uppercase mb-1">Payment Day</p>
                                <p class="text-lg font-bold text-emerald-700 dark:text-emerald-100">{result.normalDay}</p>
                            </div>
                            <div class="bg-violet-50 dark:bg-violet-900 p-2 rounded border border-violet-200 dark:border-violet-700">
                                <p class="text-xs font-semibold text-violet-600 dark:text-violet-300 uppercase mb-1">Cycle</p>
                                <p class="text-lg font-bold text-violet-700 dark:text-violet-100">{result.cycleDays}d</p>
                            </div>
                            <div class="bg-orange-50 dark:bg-orange-900 p-2 rounded border border-orange-200 dark:border-orange-700">
                                <p class="text-xs font-semibold text-orange-600 dark:text-orange-300 uppercase mb-1">Payments</p>
                                <p class="text-lg font-bold text-orange-700 dark:text-orange-100">{result.payments.length}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <!-- Payments Table -->
                <Card class="w-full shadow-lg overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div class="p-6">
                        <Tabs bind:activeTab style="underline" class="dark:text-gray-300">
                            <TabItem open title="📋 List View" name="list">
                                <div class="p-6">
                                    <div class="overflow-x-auto">
                                        <Table striped hoverable class="dark:text-gray-300">
                                            <TableHead>
                                                <TableHeadCell class="bg-gray-100 dark:bg-gray-700 dark:text-gray-300">Date</TableHeadCell>
                                                <TableHeadCell class="bg-gray-100 dark:bg-gray-700 dark:text-gray-300">Day</TableHeadCell>
                                                <TableHeadCell class="bg-gray-100 dark:bg-gray-700 dark:text-gray-300">Status</TableHeadCell>
                                                <TableHeadCell class="bg-gray-100 dark:bg-gray-700 dark:text-gray-300">Notes</TableHeadCell>
                                            </TableHead>
                                            <TableBody>
                                                {#each result.payments as payment, idx}
                                                    <tr class={idx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"}>
                                                        <TableBodyCell class="font-semibold text-gray-900 dark:text-gray-200">
                                                            {formatDate(payment.paid)}
                                                        </TableBodyCell>
                                                        <TableBodyCell class="dark:text-gray-300">
                                                            {getDayName(payment.paid)}
                                                        </TableBodyCell>
                                                        <TableBodyCell class="dark:text-gray-300">
                                                            {#if payment.early}
                                                                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                                                                    Early Payment
                                                                </span>
                                                            {:else}
                                                                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                                    On Schedule
                                                                </span>
                                                            {/if}
                                                        </TableBodyCell>
                                                        <TableBodyCell>
                                                            {#if payment.holidays && payment.holidays.length > 0}
                                                                <span class="text-sm text-gray-600 dark:text-gray-400">Holiday: {payment.holidays.join(", ")}</span>
                                                            {:else}
                                                                <span class="text-sm text-gray-400 dark:text-gray-600">—</span>
                                                            {/if}
                                                        </TableBodyCell>
                                                    </tr>
                                                {/each}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </TabItem>

                            <TabItem title="📅 Calendar View" name="calendar">
                                <div class="p-6">
                                    <!-- Calendar Controls -->
                                    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
                                        <div class="flex items-center gap-3">
                                            <button onclick={previousMonth} class="btn-icon text-lg">←</button>
                                            <h3 class="text-xl font-bold min-w-[200px] text-center">
                                                {monthName(currentCalendarMonth)} {currentCalendarYear}
                                            </h3>
                                            <button onclick={nextMonth} class="btn-icon text-lg">→</button>
                                        </div>
                                        <div class="flex flex-wrap gap-3">
                                            <label class="flex items-center gap-2 cursor-pointer text-sm">
                                                <Checkbox bind:checked={showWeekends} />
                                                <span>Weekends</span>
                                            </label>
                                            <label class="flex items-center gap-2 cursor-pointer text-sm">
                                                <Checkbox bind:checked={showBankHolidays} />
                                                <span>Holidays</span>
                                            </label>
                                        </div>
                                    </div>

                                    <!-- Calendar Grid -->
                                    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                                        <!-- Day Headers -->
                                        <div class="grid grid-cols-7 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                            {#each ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as day}
                                                <div class="p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                    {day}
                                                </div>
                                            {/each}
                                        </div>

                                        <!-- Calendar Days -->
                                        <div class="grid grid-cols-7">
                                            {#each generateCalendarDays() as day}
                                                {@const payment = day ? getPaymentForDate(currentCalendarYear, currentCalendarMonth, day) : null}
                                                {@const holiday = day && showBankHolidays ? getBankHolidayForDate(currentCalendarYear, currentCalendarMonth, day) : null}
                                                {@const weekend = day ? isWeekend(day) : false}
                                                
                                                <div class="relative min-h-[100px] border border-gray-100 dark:border-gray-700 p-2
                                                    {!day ? 'bg-gray-50 dark:bg-gray-900' : ''}
                                                    {weekend && !showWeekends && day ? 'bg-gray-50 dark:bg-gray-900 opacity-40' : ''}
                                                    {payment ? 'bg-green-50 dark:bg-green-900/20' : ''}
                                                    {payment?.early ? 'bg-amber-50 dark:bg-amber-900/20' : ''}
                                                    hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                                    
                                                    {#if day}
                                                        <div class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                            {day}
                                                        </div>
                                                        
                                                        {#if payment}
                                                            <div class="absolute inset-0 flex items-center justify-center">
                                                                <div class="text-center px-2">
                                                                    <div class="text-2xl mb-1">
                                                                        {payment.early ? '⚡' : '💳'}
                                                                    </div>
                                                                    <div class="text-xs font-bold
                                                                        {payment.early ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300'}">
                                                                        {payment.early ? 'Early' : 'Payment'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        {/if}
                                                        
                                                        {#if holiday}
                                                            <div class="absolute bottom-1 left-1 right-1">
                                                                <div class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded px-1 py-0.5 truncate" title={holiday}>
                                                                    🎉 {holiday}
                                                                </div>
                                                            </div>
                                                        {/if}
                                                    {/if}
                                                </div>
                                            {/each}
                                        </div>
                                    </div>

                                    <!-- Legend -->
                                    <div class="mt-4 flex flex-wrap gap-4 text-sm">
                                        <div class="flex items-center gap-2">
                                            <div class="w-4 h-4 rounded bg-green-100 dark:bg-green-900/20 border border-green-300"></div>
                                            <span>💳 Regular Payment</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <div class="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/20 border border-amber-300"></div>
                                            <span>⚡ Early Payment</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <div class="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900 border border-blue-300"></div>
                                            <span>🎉 Bank Holiday</span>
                                        </div>
                                    </div>
                                </div>
                            </TabItem>
                        </Tabs>
                    </div>
                </Card>
            </div>
        {/if}
    </div>
</div>

