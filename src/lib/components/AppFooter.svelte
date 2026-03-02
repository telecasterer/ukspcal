<script lang="ts">
    import { Footer, FooterIcon } from "flowbite-svelte";
    import { GithubSolid } from "flowbite-svelte-icons";
</script>

<Footer
    footerType="default"
    class="rounded-none border-t border-gray-200 dark:border-gray-700 shadow-none p-3 md:p-3"
>
    <div
        class="w-full max-w-7xl mx-auto flex flex-col gap-3"
    >
        <div
            class="w-full sm:w-auto flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100/90 dark:bg-gray-800/70 px-3 py-2 sm:self-start"
        >
            <a
                href="/privacy"
                class="text-sm text-gray-700 hover:underline dark:text-gray-200"
            >
                Privacy Policy
            </a>

            <!-- Feedback link -->
            <a
                href="https://tally.so/r/q4Vbq2"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm text-gray-700 hover:underline dark:text-gray-200"
            >
                Send Feedback
            </a>

            <!-- GitHub link -->
            <div class="inline-flex items-center gap-2">
                <FooterIcon
                    href="https://github.com/telecasterer/ukspcal"
                    ariaLabel="GitHub repository"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                    <GithubSolid class="h-4 w-4" ariaLabel="GitHub repository" />
                </FooterIcon>

                <a
                    href="https://github.com/telecasterer/ukspcal"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm text-gray-700 hover:underline dark:text-gray-200"
                >
                    View on GitHub
                </a>
            </div>
        </div>
    </div>
</Footer>
