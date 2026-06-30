import axios from 'axios';
import { weatherService } from '../weatherService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WeatherService - getWeatherAlerts', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    mockedAxios.get.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return empty array when API key is not configured', async () => {
    // Override isConfigured for this test
    jest.spyOn(weatherService, 'isConfigured').mockReturnValue(false);

    const alerts = await weatherService.getWeatherAlerts();

    expect(alerts).toEqual([]);
    expect(mockedAxios.get).not.toHaveBeenCalled();

    jest.restoreAllMocks();
  });

  it('should fetch and return alerts when API is configured', async () => {
    jest.spyOn(weatherService, 'isConfigured').mockReturnValue(true);

    const mockAlerts = [
      {
        id: 'alert-1',
        type: 'typhoon',
        severity: 'high',
        description: 'Typhoon approaching',
        affectedAreas: ['Manila'],
        issuedAt: new Date(),
        validUntil: new Date(),
      },
    ];

    mockedAxios.get.mockResolvedValueOnce({ data: mockAlerts });

    const alerts = await weatherService.getWeatherAlerts();

    expect(alerts).toEqual(mockAlerts);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/alerts'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.any(String),
        }),
      })
    );

    jest.restoreAllMocks();
  });

  it('should handle API errors gracefully and return empty array', async () => {
    jest.spyOn(weatherService, 'isConfigured').mockReturnValue(true);

    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

    const alerts = await weatherService.getWeatherAlerts();

    expect(alerts).toEqual([]);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);

    jest.restoreAllMocks();
  });
});
