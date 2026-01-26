import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { execSync } from 'child_process';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
const isVitest = Boolean(process.env.VITEST);

function safeExec(command: string): string | undefined {
	try {
		return execSync(command, { encoding: 'utf8' }).trim();
	} catch {
		return undefined;
	}
}

function parseEpochToIso(value: string | undefined): string | undefined {
	if (!value) return undefined;
	const trimmed = value.trim();
	if (!trimmed) return undefined;
	const n = Number(trimmed);
	if (!Number.isFinite(n)) return undefined;
	// Heuristic: Vercel/Git providers typically use seconds; tolerate ms.
	const ms = n < 10_000_000_000 ? n * 1000 : n;
	const d = new Date(ms);
	return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function getBuildInfo() {
	const buildTime = new Date().toISOString();

	// Prefer CI-provided metadata (Vercel/GitHub) because some build environments
	// do not include a full .git directory.
	const vercelSha = process.env.VERCEL_GIT_COMMIT_SHA;
	const githubSha = process.env.GITHUB_SHA;
	const envSha = (vercelSha ?? githubSha)?.trim();
	const envCommit = envSha ? envSha.slice(0, 7) : undefined;

	const commit =
		envCommit ?? safeExec('git rev-parse --short HEAD') ?? 'unknown';

	const commitCountRaw = safeExec('git rev-list --count HEAD');
	const commitCount = commitCountRaw ? Number(commitCountRaw) : 0;

	// Vercel sometimes provides a commit timestamp even when .git history isn't present.
	const vercelCommitTimestamp = process.env.VERCEL_GIT_COMMIT_TIMESTAMP;
	const githubCommitTimestamp = process.env.GITHUB_COMMIT_TIMESTAMP;
	const envCommitDate =
		parseEpochToIso(vercelCommitTimestamp) ?? parseEpochToIso(githubCommitTimestamp);

	const commitDate =
		envCommitDate ?? safeExec('git show -s --format=%cI HEAD') ?? 'unknown';

	const isCI = Boolean(process.env.VERCEL) || Boolean(process.env.CI);
	const dirty = !isCI && (safeExec('git status --porcelain') ?? '').length > 0;

	const baseVersion =
		commitCount > 0 && commit !== 'unknown' ? `${commitCount}-${commit}` : commit;

	return {
		version: `${baseVersion}${dirty ? '-dirty' : ''}`,
		commit,
		commitCount,
		commitDate,
		buildTime,
		dirty
	} as const;
}

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			devOptions: {
				enabled: true,
				suppressWarnings: true
			},
			manifestFilename: 'manifest.webmanifest',
			includeAssets: ['robots.txt', 'favicon.svg'],
			manifest: {
				name: 'UK State Pension Calendar',
				short_name: 'UKSPCal',
				description: 'UK State Pension payment calendar generator',
				start_url: '/',
				scope: '/',
				display: 'standalone',
				background_color: '#ffffff',
				theme_color: '#2563eb',
				icons: [
					{
						src: '/favicon.svg',
						sizes: 'any',
						type: 'image/svg+xml',
						purpose: 'any'
					},
					{
						src: '/favicon.svg',
						sizes: 'any',
						type: 'image/svg+xml',
						purpose: 'maskable'
					}
				]
			}
		})
	],
	define: {
		__BUILD_INFO__: JSON.stringify(getBuildInfo())
	},
	resolve: isVitest
		? {
			// In Vitest we need the client runtime so @testing-library/svelte can mount components.
			// This makes `import 'svelte'` resolve to the browser export (index-client.js).
			conditions: ['browser']
		}
		: undefined,
	test: {
			environment: 'jsdom',
			include: ['tests/**/*.{test,spec}.{js,ts}', 'src/**/*.{test,spec}.{js,ts}'],
			setupFiles: ['tests/setup.ts']
	}
});
