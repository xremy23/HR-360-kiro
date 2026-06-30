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

  it('should return authenticated state with admin access mode for an admin user with organization', async () => {
    localStorage.setItem('token', 'admin-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', role: 'admin', organizationId: 'org-1' }));

    vi.resetModules();
    const { default: authReducer } = await import('../authSlice');
    const state = authReducer(undefined, { type: '@@INIT' });

    expect(state.isAuthenticated).toBe(true);
    expect(state.isGuest).toBe(false);
    expect(state.hasOrganization).toBe(true);
    expect(state.accessMode).toBe('admin');
    expect(state.token).toBe('admin-token');
    expect(state.user?.id).toBe('1');
    expect(state.guestDeviceId).toBeNull();
  });

  it('should return authenticated state with org access mode for an employee user with organization', async () => {
    localStorage.setItem('token', 'employee-token');
    localStorage.setItem('user', JSON.stringify({ id: '2', role: 'employee', organizationId: 'org-2' }));

    vi.resetModules();
    const { default: authReducer } = await import('../authSlice');
    const state = authReducer(undefined, { type: '@@INIT' });

    expect(state.isAuthenticated).toBe(true);
    expect(state.isGuest).toBe(false);
    expect(state.hasOrganization).toBe(true);
    expect(state.accessMode).toBe('authenticated-with-org');
    expect(state.token).toBe('employee-token');
  });

  it('should return authenticated state without org access mode for an employee without organization', async () => {
    localStorage.setItem('token', 'employee-token-no-org');
    localStorage.setItem('user', JSON.stringify({ id: '3', role: 'employee' }));

    vi.resetModules();
    const { default: authReducer } = await import('../authSlice');
    const state = authReducer(undefined, { type: '@@INIT' });

    expect(state.isAuthenticated).toBe(true);
    expect(state.isGuest).toBe(false);
    expect(state.hasOrganization).toBe(false);
    expect(state.accessMode).toBe('authenticated-no-org');
  });

  it('should return guest state if isGuest is true and guestDeviceId is present', async () => {
    localStorage.setItem('isGuest', 'true');
    localStorage.setItem('guestDeviceId', 'guest-device-123');

    vi.resetModules();
    const { default: authReducer } = await import('../authSlice');
    const state = authReducer(undefined, { type: '@@INIT' });

    expect(state.isAuthenticated).toBe(false);
    expect(state.isGuest).toBe(true);
    expect(state.hasOrganization).toBe(false);
    expect(state.accessMode).toBe('guest');
    expect(state.guestDeviceId).toBe('guest-device-123');
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('should return default guest state with a generated device id if localStorage is empty', async () => {
    // localStorage is already cleared in beforeEach
    vi.resetModules();
    const { default: authReducer } = await import('../authSlice');
    const state = authReducer(undefined, { type: '@@INIT' });

    expect(state.isAuthenticated).toBe(false);
    expect(state.isGuest).toBe(true);
    expect(state.hasOrganization).toBe(false);
    expect(state.accessMode).toBe('guest');
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    // A guestDeviceId should have been generated
    expect(typeof state.guestDeviceId).toBe('string');
    expect(state.guestDeviceId?.length).toBeGreaterThan(0);
  });
});
