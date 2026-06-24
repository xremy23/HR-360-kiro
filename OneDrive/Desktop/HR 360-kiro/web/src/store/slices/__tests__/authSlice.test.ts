import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We have to test `getInitialState` which is not exported, but it's called
// when the file is evaluated. We can isolate it by using dynamic import
// or by re-evaluating the module. Vitest `vi.resetModules()` works.
describe('authSlice initial state', () => {
  let consoleSpy: any;

  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should return default state and log error when parsing malformed JSON in localStorage', async () => {
    // Set invalid JSON in localStorage
    localStorage.setItem('token', 'some-token');
    localStorage.setItem('user', '{ invalid_json');
    localStorage.setItem('isGuest', 'false');

    // Dynamically import the slice so that `getInitialState()` runs with the mocked localStorage
    const { default: authReducer } = await import('../authSlice');

    // Call the reducer to get the initial state
    const state = authReducer(undefined, { type: '@@INIT' });

    // It should fall back to the default/guest state
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isGuest).toBe(true);
    expect(state.hasOrganization).toBe(false);
    expect(state.accessMode).toBe('guest');

    // Ensure console.error was called with the expected message
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to restore auth state:',
      expect.any(SyntaxError)
    );
  });
});
