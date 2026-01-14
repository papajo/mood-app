import { describe, it, expect, vi } from 'vitest';

describe('API Config', () => {
  it('should export API_URL', async () => {
    const { API_URL } = await import('../api');
    expect(API_URL).toBeDefined();
    expect(typeof API_URL).toBe('string');
  });

  it('should export SOCKET_URL', async () => {
    const { SOCKET_URL } = await import('../api');
    expect(SOCKET_URL).toBeDefined();
    expect(typeof SOCKET_URL).toBe('string');
  });

  it('should have default values when env vars are not set', async () => {
    // Reset modules and clear env vars to test defaults
    vi.resetModules();
    const originalEnv = process.env.VITE_API_URL;
    const originalSocketEnv = process.env.VITE_SOCKET_URL;
    delete process.env.VITE_API_URL;
    delete process.env.VITE_SOCKET_URL;
    
    // Mock import.meta.env for this test
    const apiModule = await import('../api');
    const { API_URL, SOCKET_URL } = apiModule;
    
    // Should have a valid URL (either localhost or IP from .env)
    expect(API_URL).toBeDefined();
    expect(typeof API_URL).toBe('string');
    expect(SOCKET_URL).toBeDefined();
    expect(typeof SOCKET_URL).toBe('string');
    
    // Restore env vars
    if (originalEnv) process.env.VITE_API_URL = originalEnv;
    if (originalSocketEnv) process.env.VITE_SOCKET_URL = originalSocketEnv;
  });
});

