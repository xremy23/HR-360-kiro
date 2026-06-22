import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isMobileDevice,
  isTablet,
  getDeviceType,
  canAccessAdminConsole,
} from './deviceDetection';

describe('deviceDetection', () => {
  let originalNavigator: any;
  let originalInnerWidth: number;

  beforeEach(() => {
    originalNavigator = global.navigator;
    originalInnerWidth = global.window?.innerWidth;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalNavigator) {
      vi.stubGlobal('navigator', originalNavigator);
    }
    if (global.window && originalInnerWidth !== undefined) {
      global.window.innerWidth = originalInnerWidth;
    }
  });

  const setNavigatorUserAgent = (userAgent: string | undefined) => {
    if (userAgent === undefined) {
      vi.stubGlobal('navigator', undefined);
    } else {
      vi.stubGlobal('navigator', { userAgent });
    }
  };

  const setWindowInnerWidth = (width: number | undefined) => {
    if (width === undefined) {
      vi.stubGlobal('window', undefined);
    } else {
      vi.stubGlobal('window', { innerWidth: width });
    }
  };

  describe('isMobileDevice', () => {
    it('should return false if navigator is undefined', () => {
      setNavigatorUserAgent(undefined);
      expect(isMobileDevice()).toBe(false);
    });

    it('should return true for iPhone user agent', () => {
      setNavigatorUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1');
      expect(isMobileDevice()).toBe(true);
    });

    it('should return true for Android user agent', () => {
      setNavigatorUserAgent('Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36');
      expect(isMobileDevice()).toBe(true);
    });

    it('should return false for Desktop user agent', () => {
      setNavigatorUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.79 Safari/537.36');
      expect(isMobileDevice()).toBe(false);
    });
  });

  describe('isTablet', () => {
    it('should return false if navigator is undefined', () => {
      setNavigatorUserAgent(undefined);
      expect(isTablet()).toBe(false);
    });

    it('should return true for iPad user agent', () => {
      setNavigatorUserAgent('Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) Version/11.0 Mobile/15A5341f Safari/604.1');
      expect(isTablet()).toBe(true);
    });

    it('should return true for Android tablet user agent (contains android but not mobile)', () => {
      setNavigatorUserAgent('Mozilla/5.0 (Linux; Android 10; SM-T865) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Safari/537.36');
      expect(isTablet()).toBe(true);
    });

    it('should return false for Android mobile user agent (contains both android and mobile)', () => {
      setNavigatorUserAgent('Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36');
      expect(isTablet()).toBe(false);
    });

    it('should return false for Desktop user agent', () => {
      setNavigatorUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36');
      expect(isTablet()).toBe(false);
    });
  });

  describe('getDeviceType', () => {
    it('should return "desktop" when window width is 1024 or above', () => {
      setWindowInnerWidth(1024);
      expect(getDeviceType()).toBe('desktop');

      setWindowInnerWidth(1920);
      expect(getDeviceType()).toBe('desktop');
    });

    it('should return "tablet" when window width is between 768 and 1023', () => {
      setWindowInnerWidth(768);
      expect(getDeviceType()).toBe('tablet');

      setWindowInnerWidth(1023);
      expect(getDeviceType()).toBe('tablet');
    });

    it('should return "mobile" when window width is below 768', () => {
      setWindowInnerWidth(767);
      expect(getDeviceType()).toBe('mobile');

      setWindowInnerWidth(320);
      expect(getDeviceType()).toBe('mobile');
    });

    it('should return "mobile" when window is undefined', () => {
      setWindowInnerWidth(undefined);
      expect(getDeviceType()).toBe('mobile');
    });
  });

  describe('canAccessAdminConsole', () => {
    it('should allow admin on desktop', () => {
      expect(canAccessAdminConsole('admin', 'desktop')).toBe(true);
    });

    it('should deny admin on mobile or tablet', () => {
      expect(canAccessAdminConsole('admin', 'mobile')).toBe(false);
      expect(canAccessAdminConsole('admin', 'tablet')).toBe(false);
    });

    it('should allow hr on desktop', () => {
      expect(canAccessAdminConsole('hr', 'desktop')).toBe(true);
    });

    it('should deny hr on mobile or tablet', () => {
      expect(canAccessAdminConsole('hr', 'mobile')).toBe(false);
      expect(canAccessAdminConsole('hr', 'tablet')).toBe(false);
    });

    it('should allow employee on any device', () => {
      expect(canAccessAdminConsole('employee', 'desktop')).toBe(true);
      expect(canAccessAdminConsole('employee', 'tablet')).toBe(true);
      expect(canAccessAdminConsole('employee', 'mobile')).toBe(true);
    });

    it('should allow manager on any device', () => {
      expect(canAccessAdminConsole('manager', 'desktop')).toBe(true);
      expect(canAccessAdminConsole('manager', 'tablet')).toBe(true);
      expect(canAccessAdminConsole('manager', 'mobile')).toBe(true);
    });
  });
});
