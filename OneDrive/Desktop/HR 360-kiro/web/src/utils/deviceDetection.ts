/**
 * Device detection utilities
 */

export const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const mobilePatterns = [
    /android/,
    /webos/,
    /iphone/,
    /ipad/,
    /ipod/,
    /blackberry/,
    /iemobile/,
    /opera mini/,
    /mobile/,
  ];
  
  return mobilePatterns.some(pattern => pattern.test(userAgent));
};

export const isTablet = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  return /ipad|android(?!.*mobile)/.test(userAgent);
};

export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (isTablet()) return 'tablet';
  if (isMobileDevice()) return 'mobile';
  return 'desktop';
};

export const canAccessAdminConsole = (userRole: string, deviceType: 'mobile' | 'tablet' | 'desktop'): boolean => {
  // Admins and HR can only access console on desktop
  if (['admin', 'hr'].includes(userRole)) {
    return deviceType === 'desktop';
  }
  // Employees and managers can access on any device
  return true;
};
