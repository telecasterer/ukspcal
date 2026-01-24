// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	const __BUILD_INFO__: {
		version: string;
		commit: string;
		commitCount: number;
		commitDate: string;
		buildTime: string;
		dirty: boolean;
	};

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
