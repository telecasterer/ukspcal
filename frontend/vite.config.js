import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { execSync } from 'child_process';

function getBuildInfo() {
	try {
		const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
		const commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();
		const commitDate = execSync('git show -s --format=%cI HEAD', { encoding: 'utf8' }).trim();
		const dirty = execSync('git status --porcelain', { encoding: 'utf8' }).trim().length > 0;
		const buildTime = new Date().toISOString();

		return {
			version: `${commitCount}-${commit}${dirty ? '-dirty' : ''}`,
			commit,
			commitCount: Number(commitCount),
			commitDate,
			buildTime,
			dirty
		};
	} catch {
		const buildTime = new Date().toISOString();
		return {
			version: 'unknown',
			commit: 'unknown',
			commitCount: 0,
			commitDate: 'unknown',
			buildTime,
			dirty: false
		};
	}
}

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		__BUILD_INFO__: JSON.stringify(getBuildInfo())
	}
});
