<script lang="ts">
	import { Footer, FooterIcon } from "flowbite-svelte";
</script>

<Footer
	footerType="default"
	class="rounded-none border-t border-gray-200 dark:border-gray-700 shadow-none p-3 md:p-3"
>
	<div class="w-full flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
		<div class="text-xs text-gray-500 dark:text-gray-400">
			Sources: GOV.UK State Pension age guidance, the published State Pension age timetable,
			and UK bank holiday lists.
		</div>

		<div class="flex items-center gap-4">
			<!-- Feedback link -->
			<a
				href="https://tally.so/r/q4Vbq2"
				target="_blank"
				rel="noopener noreferrer"
				class="text-xs text-gray-500 hover:underline dark:text-gray-400"
			>
				Send Feedback
			</a>

			<!-- GitHub link -->
			<div class="flex items-center gap-2">
				<FooterIcon
					href="https://github.com/telecasterer/ukspcal"
					ariaLabel="GitHub repository"
					target="_blank"
					rel="noopener noreferrer"
					class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
				>
					<svg
						viewBox="0 0 98 96"
						fill="currentColor"
						xmlns="http://www.w3.org/2000/svg"
						class="w-4 h-4"
					>
						<path
							d="M48.9 0C21.9 0 0 22.1 0 49.2c0 21.2 13.5 38.9 31.7 45.5 2.6 1 5.1-.8 5.1-3.4v-7.7c-1.3.6-3.1 1-4.6 1-6.3 0-10-3.4-12.7-9.9-1.1-2.6-2.2-4.1-4.4-4.4-1.1-.1-1.5-.6-1.5-1.1 0-1.1 1.9-2 3.8-2 2.8 0 5.2 1.7 7.7 5.3 1.9 2.8 3.9 4 6.3 4 2.4 0 3.9-.9 6.1-3.1 1.6-1.6 2.9-3 4-4-12.6-1.5-21.5-10.6-21.5-22.4 0-4.8 1.7-9.9 4.6-13.4-1.2-3.2-1.1-9.9.4-12.6 3.8-.5 9 1.5 12.1 4.3 3.6-1.1 7.5-1.7 12.2-1.7 4.7 0 8.5.6 12 1.7 3-2.7 8.2-4.8 12-4.3 1.4 2.6 1.6 9.3.4 12.6 3.1 3.6 4.7 8.5 4.7 13.4 0 11.8-8.9 20.7-21.7 22.3 3.3 2.1 5.5 6.7 5.5 11.9v10c0 2.9 2.4 4.5 5.3 3.4C84.4 87.9 98 70.6 98 49.2 98 22.1 76 0 48.9 0z"
						/>
					</svg>
				</FooterIcon>

				<a
					href="https://github.com/telecasterer/ukspcal"
					target="_blank"
					rel="noopener noreferrer"
					class="text-xs text-gray-500 hover:underline dark:text-gray-400"
				>
					View on GitHub
				</a>
			</div>
		</div>
	</div>
</Footer>
