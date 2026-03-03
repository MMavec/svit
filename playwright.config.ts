import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'tests',
	testMatch: '**/*.e2e.ts',
	fullyParallel: true,
	retries: 1,
	timeout: 30_000,
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry'
	},
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		reuseExistingServer: !process.env.CI
	}
});
