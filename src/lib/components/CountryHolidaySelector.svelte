<script lang="ts">
    import { Label, Select } from "flowbite-svelte";
    import { Checkbox as FlowbiteCheckbox } from "flowbite-svelte";

    type Props = {
        selectedCountry: string;
        detectedCountry?: string;
        isLoadingAdditionalHolidays?: boolean;
        additionalHolidaysError?: string;
        onCountryChange?: (country: string) => void;
        onPersist?: () => void;
    };

    let {
        selectedCountry = $bindable(),
        detectedCountry = "none",
        isLoadingAdditionalHolidays = false,
        additionalHolidaysError = "",
        onCountryChange,
        onPersist,
    }: Props = $props();
</script>

<div class="flex flex-wrap items-center gap-2">
    <Label class="flex items-center gap-2 cursor-pointer text-xs min-[390px]:text-sm">
        <FlowbiteCheckbox
            checked={selectedCountry !== "none"}
            onchange={(e: Event) => {
                const target = e.target as HTMLInputElement;
                if (target.checked && selectedCountry === "none") {
                    const countryToUse = detectedCountry !== "none" ? detectedCountry : "FR";
                    selectedCountry = countryToUse;
                    onCountryChange?.(countryToUse);
                } else if (!target.checked) {
                    selectedCountry = "none";
                    onCountryChange?.("none");
                }
                onPersist?.();
            }}
        />
        <span>Additional holidays</span>
    </Label>
    {#if selectedCountry !== "none"}
        <Select
            id="country-holidays"
            bind:value={selectedCountry}
            onchange={() => {
                onCountryChange?.(selectedCountry);
                onPersist?.();
            }}
            class="w-40"
            classes={{
                select: "text-xs min-[390px]:text-sm !h-8 !py-0 !px-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white",
            }}
        >
            <option value="GB-SCT">Scotland</option>
            <option value="GB-NIR">Northern Ireland</option>
            <option value="FR">France</option>
            <option value="DE">Germany</option>
            <option value="ES">Spain</option>
            <option value="IT">Italy</option>
            <option value="NL">Netherlands</option>
            <option value="BE">Belgium</option>
            <option value="AT">Austria</option>
            <option value="PT">Portugal</option>
            <option value="IE">Ireland</option>
            <option value="SE">Sweden</option>
            <option value="DK">Denmark</option>
            <option value="NO">Norway</option>
            <option value="CH">Switzerland</option>
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
            <option value="NZ">New Zealand</option>
            <option value="JP">Japan</option>
        </Select>
    {/if}
</div>

{#if selectedCountry !== "none" && isLoadingAdditionalHolidays}
    <p class="text-xs min-[390px]:text-sm text-gray-500 dark:text-gray-400" role="status">
        Loading additional holidays...
    </p>
{:else if selectedCountry !== "none" && additionalHolidaysError}
    <p class="text-xs min-[390px]:text-sm text-amber-700 dark:text-amber-300" role="alert">
        {additionalHolidaysError}
    </p>
{/if}
