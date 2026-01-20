<script lang="ts">
    import { generatePayments, type PensionResult, type Payment } from "$lib/pensionEngine";
    import { fetchUKBankHolidays } from "$lib/fetchBankHolidays";
    import "$lib/pensionEngine.test";
    import { Button, Label, Input, Select, Card, Table, TableBody, TableHead, TableHeadCell, TableBodyCell, Alert, Navbar, NavBrand, Tabs, TabItem, Checkbox } from "flowbite-svelte";

    let ni = "";
    let startYear = new Date().getFullYear();
    let endYear = startYear + 1;
    let cycleDays: number = 28;
    let activeTab = "list";
    let showWeekends = true;
    let showBankHolidays = true;
    let currentCalendarMonth = new Date().getMonth();
    let currentCalendarYear = new Date().getFullYear();
    
    export let data;

    const { bankHolidays } = data;

    let result: PensionResult | null = null;
    let error = "";

    function generate() {
        error = "";

        if (!/^\d{2}[A-D]$/.test(ni)) {
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
        return new Date(Date.UTC(year, month, 1)).getUTCDay();
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
<Navbar class="bg-white border-b border-gray-200 px-4 py-2.5">
    <NavBrand href="/" class="flex items-center">
        <div class="text-2xl font-bold text-blue-600">📅 Pension Calendar</div>
    </NavBrand>
</Navbar>

<!-- Main Content -->
<div class="bg-gradient-to-b from-blue-50 to-white min-h-screen py-8 px-4">
    <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
            <h1 class="text-4xl font-bold text-gray-900 mb-2">UK State Pension Payment Calendar</h1>
            <p class="text-lg text-gray-600">Calculate your pension payment schedule based on your NI code</p>
        </div>

        <!-- Input Card -->
        <Card class="mb-8 shadow-lg">
            <div class="p-6">
                <h2 class="text-2xl font-semibold text-gray-900 mb-6">Generate Payment Schedule</h2>
                
                <form on:submit|preventDefault={generate} class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
                        <p class="text-xs text-gray-500 mt-1">Last 3 chars (e.g. 22D)</p>
                    </div>

                    <!-- Start Year -->
                    <div>
                        <Label for="start-year" class="block mb-2 text-sm font-medium">From Year</Label>
                        <Input
                            id="start-year"
                            type="number"
                            bind:value={startYear}
                        />
                    </div>

                    <!-- End Year -->
                    <div>
                        <Label for="end-year" class="block mb-2 text-sm font-medium">To Year</Label>
                        <Input
                            id="end-year"
                            type="number"
                            bind:value={endYear}
                        />
                    </div>

                    <!-- Payment Cycle -->
                    <div>
                        <Label for="cycle" class="block mb-2 text-sm font-medium">Cycle</Label>
                        <Select id="cycle" bind:value={cycleDays}>
                            <option value={28}>Every 28 days</option>
                            <option value={14}>Every 14 days</option>
                            <option value={7}>Every 7 days</option>
                        </Select>
                    </div>

                    <!-- Submit Button -->
                    <div class="flex items-end">
                        <Button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5">
                            Generate
                        </Button>
                    </div>
                </form>

                {#if error}
                    <Alert color="red" closable>
                        <span class="font-medium">Error:</span> {error}
                    </Alert>
                {/if}
            </div>
        </Card>

        <!-- Results Section -->
        {#if result}
            <div class="space-y-6">
                <!-- Summary Card -->
                <Card class="shadow-lg">
                    <div class="p-6">
                        <h2 class="text-2xl font-semibold text-gray-900 mb-4">Payment Schedule Summary</h2>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div class="bg-blue-50 p-6 rounded-lg border border-blue-200 shadow-sm">
                                <p class="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">NI Code</p>
                                <p class="text-3xl font-bold text-blue-700">{result.ni}</p>
                            </div>
                            <div class="bg-emerald-50 p-6 rounded-lg border border-emerald-200 shadow-sm">
                                <p class="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Normal Payment Day</p>
                                <p class="text-3xl font-bold text-emerald-700">{result.normalDay}</p>
                            </div>
                            <div class="bg-violet-50 p-6 rounded-lg border border-violet-200 shadow-sm">
                                <p class="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-2">Cycle</p>
                                <p class="text-3xl font-bold text-violet-700">Every<br />{result.cycleDays}d</p>
                            </div>
                            <div class="bg-orange-50 p-6 rounded-lg border border-orange-200 shadow-sm">
                                <p class="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">Total Payments</p>
                                <p class="text-3xl font-bold text-orange-700">{result.payments.length}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <!-- Payments Table -->
                <Card class="shadow-lg overflow-hidden">
                    <div class="p-6">
                        <Tabs bind:activeTab style="underline">
                            <TabItem open title="📋 List View" name="list">
                                <div class="p-6">
                                    <div class="overflow-x-auto">
                                        <Table striped hoverable>
                                            <TableHead>
                                                <TableHeadCell class="bg-gray-100">Date</TableHeadCell>
                                                <TableHeadCell class="bg-gray-100">Day</TableHeadCell>
                                                <TableHeadCell class="bg-gray-100">Status</TableHeadCell>
                                                <TableHeadCell class="bg-gray-100">Notes</TableHeadCell>
                                            </TableHead>
                                            <TableBody>
                                                {#each result.payments as payment, idx}
                                                    <tr class={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                                        <TableBodyCell class="font-semibold text-gray-900">
                                                            {formatDate(payment.paid)}
                                                        </TableBodyCell>
                                                        <TableBodyCell>
                                                            {getDayName(payment.paid)}
                                                        </TableBodyCell>
                                                        <TableBodyCell>
                                                            {#if payment.early}
                                                                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
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
                                                                <span class="text-sm text-gray-600">Holiday: {payment.holidays.join(", ")}</span>
                                                            {:else}
                                                                <span class="text-sm text-gray-400">—</span>
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
                                    <!-- Calendar Options -->
                                    <div class="mb-8 flex flex-wrap gap-6 pb-6 border-b border-gray-200">
                                        <label class="flex items-center gap-3 cursor-pointer hover:text-blue-600 transition">
                                            <Checkbox bind:checked={showWeekends} />
                                            <span class="text-sm font-medium text-gray-700">Show weekends</span>
                                        </label>
                                        <label class="flex items-center gap-3 cursor-pointer hover:text-blue-600 transition">
                                            <Checkbox bind:checked={showBankHolidays} />
                                            <span class="text-sm font-medium text-gray-700">Show bank holidays</span>
                                        </label>
                                    </div>

                                    <!-- Calendar Navigation -->
                                    <div class="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <Button on:click={previousMonth} class="bg-slate-500 hover:bg-slate-600 text-white w-full sm:w-auto">← Previous</Button>
                                        <h3 class="text-3xl font-bold text-gray-900 whitespace-nowrap">{monthName(currentCalendarMonth)} {currentCalendarYear}</h3>
                                        <Button on:click={nextMonth} class="bg-slate-500 hover:bg-slate-600 text-white w-full sm:w-auto">Next →</Button>
                                    </div>

                                    <!-- Calendar Grid -->
                                    <div class="overflow-x-auto mb-8">
                                        <!-- Day headers -->
                                        <div class="grid grid-cols-7 gap-1 mb-2">
                                            {#each ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as dayName}
                                                <div class="text-center font-bold text-gray-600 text-xs sm:text-sm py-3 bg-gray-100 rounded">
                                                    {dayName}
                                                </div>
                                            {/each}
                                        </div>

                                        <!-- Calendar days -->
                                        <div class="grid grid-cols-7 gap-1">
                                            {#each generateCalendarDays() as day}
                                                {#if day === null}
                                                    <div class="aspect-square"></div>
                                                {:else}
                                                    {@const payment = getPaymentForDate(currentCalendarYear, currentCalendarMonth, day)}
                                                    {@const holiday = getBankHolidayForDate(currentCalendarYear, currentCalendarMonth, day)}
                                                    {@const isWeekendDay = isWeekend(day)}
                                                    <div 
                                                        class="aspect-square p-1.5 sm:p-2 rounded border text-xs sm:text-sm flex flex-col items-center justify-center transition-all
                                                        {payment ? 'bg-green-100 border-green-400 border-2 font-bold shadow-md' : 
                                                         holiday && showBankHolidays ? 'bg-red-100 border-red-400' :
                                                         isWeekendDay && showWeekends ? 'bg-gray-100 border-gray-300' :
                                                         'bg-white border-gray-200 hover:border-gray-300'}"
                                                        title="{holiday ? 'Bank Holiday: ' + holiday : ''}"
                                                    >
                                                        <div class="font-semibold text-gray-900 leading-tight">{day}</div>
                                                        {#if payment}
                                                            <div class="text-xs mt-0.5 {payment.early ? 'text-amber-700 font-bold' : 'text-green-700 font-bold'}">
                                                                {payment.early ? "⚡" : "💳"}
                                                            </div>
                                                        {/if}
                                                    </div>
                                                {/if}
                                            {/each}
                                        </div>
                                    </div>

                                    <!-- Legend -->
                                    <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-4">Legend</p>
                                        <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                            <div class="flex items-center gap-2">
                                                <div class="w-5 h-5 bg-green-100 border-2 border-green-400 rounded text-center text-xs leading-tight font-bold text-green-700">💳</div>
                                                <span class="text-xs font-medium text-gray-700">Payment day</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <div class="w-5 h-5 bg-green-100 border-2 border-green-400 rounded text-center text-xs leading-tight font-bold text-amber-700">⚡</div>
                                                <span class="text-xs font-medium text-gray-700">Early payment</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <div class="w-5 h-5 bg-red-100 border border-red-400 rounded"></div>
                                                <span class="text-xs font-medium text-gray-700">Bank holiday</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <div class="w-5 h-5 bg-gray-100 border border-gray-300 rounded"></div>
                                                <span class="text-xs font-medium text-gray-700">Weekend</span>
                                            </div>
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

