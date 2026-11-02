<script lang="ts">
    import { onMount } from "svelte";
    import {
        loadSavedProfiles,
        saveProfiles,
        generateId,
        type SavedProfile,
    } from "#lib/utils/profilePersistence";

    type Props = {
        ni: string;
        dob: string;
        /** Name of the profile last loaded or saved; cleared by the parent on "Restore defaults". */
        loadedProfileName?: string | null;
        /** Called after the user picks a saved profile. */
        onLoad: (profile: SavedProfile) => void;
    };

    let { ni, dob, loadedProfileName = $bindable(null), onLoad }: Props = $props();

    let savedProfiles: SavedProfile[] = $state([]);
    let isNamingProfile: boolean = $state(false);
    let profileNameDraft: string = $state("");

    onMount(() => {
        savedProfiles = loadSavedProfiles();
    });

    function startSaveProfile() {
        profileNameDraft = loadedProfileName ?? "";
        isNamingProfile = true;
        // Focus the input after it renders, selecting any default name so
        // typing replaces it, or Enter re-saves under the same name.
        queueMicrotask(() => {
            const el = document.getElementById("profile-name-input");
            if (el instanceof HTMLInputElement) {
                el.focus();
                el.select();
            }
        });
    }

    function commitSaveProfile() {
        const name = profileNameDraft.trim();
        if (!name) {
            isNamingProfile = false;
            return;
        }
        const existing = savedProfiles.find((p) => p.name === name);
        const newProfile: SavedProfile = {
            id: existing ? existing.id : generateId(),
            name,
            ni,
            dob,
        };
        savedProfiles = [...savedProfiles.filter((p) => p.name !== name), newProfile];
        saveProfiles(savedProfiles);
        loadedProfileName = name;
        isNamingProfile = false;
        profileNameDraft = "";
    }

    function cancelSaveProfile() {
        isNamingProfile = false;
        profileNameDraft = "";
    }

    function loadProfile(p: SavedProfile) {
        loadedProfileName = p.name;
        isNamingProfile = false;
        onLoad(p);
    }

    function deleteProfile(id: string) {
        const deleted = savedProfiles.find((p) => p.id === id);
        if (deleted && deleted.name === loadedProfileName) {
            loadedProfileName = null;
        }
        savedProfiles = savedProfiles.filter((p) => p.id !== id);
        saveProfiles(savedProfiles);
    }
</script>

{#if savedProfiles.length > 0 || (ni.trim() && dob)}
    <div class="pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex flex-wrap gap-2 items-center">
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wide mr-2"
                >Profiles:</span
            >
            {#each savedProfiles as p}
                <div class="inline-flex rounded-lg shadow-xs">
                    <button
                        type="button"
                        class="min-h-10 px-3 py-1.5 text-sm font-medium text-blue-700 bg-white border border-gray-200 rounded-s-lg hover:bg-blue-50 hover:text-blue-800 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-blue-400 dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white"
                        onclick={() => loadProfile(p)}
                        title="Load profile: {p.name}"
                    >
                        {p.name}
                    </button>
                    <button
                        type="button"
                        class="inline-flex min-h-10 min-w-10 items-center justify-center px-2 py-1.5 text-xs font-medium text-gray-400 bg-white border border-s-0 border-gray-200 rounded-e-lg hover:bg-red-50 hover:text-red-600 focus:z-10 focus:ring-2 focus:ring-red-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-gray-700 dark:focus:ring-red-500"
                        onclick={() => deleteProfile(p.id)}
                        title="Delete profile {p.name}"
                        aria-label="Delete profile {p.name}"
                    >
                        <svg
                            class="w-4 h-4"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
            {/each}
            {#if ni.trim() && dob && !isNamingProfile}
                <button
                    type="button"
                    class="min-h-10 px-3 py-1.5 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
                    onclick={startSaveProfile}
                >
                    + Save current
                </button>
            {/if}
        </div>
        {#if isNamingProfile}
            <div class="flex gap-2 items-center mt-2">
                <input
                    id="profile-name-input"
                    type="text"
                    bind:value={profileNameDraft}
                    placeholder="Name, e.g. Partner"
                    aria-label="Profile name"
                    maxlength={30}
                    class="min-h-10 min-w-0 flex-1 sm:flex-none sm:w-56 px-2.5 py-1.5 text-sm rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    onkeydown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            commitSaveProfile();
                        }
                        if (e.key === "Escape") {
                            e.preventDefault();
                            cancelSaveProfile();
                        }
                    }}
                />
                <button
                    type="button"
                    class="min-h-10 shrink-0 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600"
                    onclick={commitSaveProfile}
                >
                    Save
                </button>
                <button
                    type="button"
                    class="min-h-10 shrink-0 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                    onclick={cancelSaveProfile}
                >
                    Cancel
                </button>
            </div>
        {/if}
    </div>
{/if}
