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
  // Check window width as primary indicator
  const width = typeof window !== 'undefined' ? window.innerWidth : 0;
  
  // Desktop: 1024px and above
  if (width >= 1024) return 'desktop';
  
  // Tablet: 768px to 1023px
  if (width >= 768) return 'tablet';
  
  // Mobile: below 768px
  return 'mobile';
};

export const canAccessAdminConsole = (userRole: string, deviceType: 'mobile' | 'tablet' | 'desktop'): boolean => {
  // Admins and HR can only access console on desktop
  if (['admin', 'hr'].includes(userRole)) {
    return deviceType === 'desktop';
  }
  // Employees and managers can access on any device
  return true;
};
