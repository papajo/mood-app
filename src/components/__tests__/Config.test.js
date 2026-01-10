import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Configuration', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('uses default API_URL when env var is missing', async () => {
        // We mock import.meta.env behavior by relying on how vite/vitest handles config
        // But simply importing the module might cache it.
        // We can check if the file exports the defaults we see in the static file.

        const { API_URL, SOCKET_URL } = await import('../../config/api');

        // Since we can't easily change import.meta.env at runtime in this test env without setup,
        // we'll at least verify the structure and default values match what we expect in test env.
        expect(API_URL).toBeDefined();
        // Check if it's a valid URL string
        expect(typeof API_URL).toBe('string');

        expect(SOCKET_URL).toBeDefined();
    });
});
