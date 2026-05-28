/**
 * Device Redirect Component
 * Redirects desktop users to the web console
 * Redirects mobile users to the mobile app
 */

import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { colors } from './styles/designSystem';

interface DeviceRedirectProps {
  children: React.ReactNode;
}

export const DeviceRedirect: React.FC<DeviceRedirectProps> = ({ children }) => {
  useEffect(() => {
    // Check if running in web environment
    if (typeof window !== 'undefined') {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      const isTablet = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
      const currentHost = window.location.hostname;

      // If on mobile domain and accessing from desktop, redirect to web app
      if (!isMobile && !isTablet && currentHost.includes('mobile')) {
        const webUrl = window.location.href.replace(/mobile/, 'web');
        window.location.href = webUrl;
      }
    }
  }, []);

  return <>{children}</>;
};

export default DeviceRedirect;
