import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import LocationSharingPage from '../LocationSharingPage';
import { locationService } from '../../services/locationService';
import toast from 'react-hot-toast';
import { vi } from 'vitest';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../services/locationService', () => ({
  locationService: {
    requestLocationPermission: vi.fn(),
    getLocationHistory: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('../../components/LocationMap', () => ({
  default: () => <div data-testid="location-map">Location Map</div>,
}));

const mockStore = configureStore([]);

describe('LocationSharingPage', () => {
  let store: any;

  beforeEach(() => {
    vi.clearAllMocks();
    store = mockStore({
      location: {
        isTracking: false,
        currentLocation: null,
        preferences: { shareWithAdmins: false, shareWithTeam: false },
        loading: false,
        error: null,
      },
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles error when requesting location permission fails', async () => {
    const error = new Error('Permission denied by user');
    (locationService.requestLocationPermission as any).mockRejectedValue(error);
    (locationService.getLocationHistory as any).mockResolvedValue([]);

    render(
      <Provider store={store}>
        <MemoryRouter>
          <LocationSharingPage />
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Error requesting location permission:',
        error
      );
    });
  });
});
