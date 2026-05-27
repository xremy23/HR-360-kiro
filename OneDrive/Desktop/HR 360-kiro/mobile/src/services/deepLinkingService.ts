/**
 * Deep Linking Service
 * Handles navigation from push notifications and deep links
 */

import * as Linking from 'expo-linking';
import { NavigationContainerRef } from '@react-navigation/native';

export interface DeepLinkConfig {
  prefix: string[];
  config: {
    screens: Record<string, string>;
  };
}

export class DeepLinkingService {
  private navigationRef: NavigationContainerRef<any> | null = null;

  /**
   * Initialize deep linking with navigation reference
   */
  public initialize(navigationRef: NavigationContainerRef<any>): void {
    this.navigationRef = navigationRef;
    this.setupDeepLinkListener();
  }

  /**
   * Get deep linking configuration
   */
  public getDeepLinkConfig(): DeepLinkConfig {
    const prefix = Linking.createURL('/');
    
    return {
      prefix: [prefix, 'hr360://', 'https://hr360.app/'],
      config: {
        screens: {
          // Auth screens
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
          
          // Main app screens
          Dashboard: 'dashboard',
          Alerts: 'alerts/:id',
          AlertDetail: 'alerts/:id/detail',
          CheckIn: 'checkin/:id',
          CheckInDetail: 'checkin/:id/detail',
          Contacts: 'contacts',
          ContactDetail: 'contacts/:id',
          KnowledgeBase: 'kb',
          KBDetail: 'kb/:id',
          SOS: 'sos',
          SOSDetail: 'sos/:id',
          Incidents: 'incidents/:id',
          IncidentDetail: 'incidents/:id/detail',
          Notifications: 'notifications',
          NotificationDetail: 'notifications/:id',
          Profile: 'profile',
          Settings: 'settings',
          
          // Nested navigation
          'AlertsStack': 'alerts',
          'CheckInStack': 'checkin',
          'ContactsStack': 'contacts',
          'KBStack': 'kb',
          'ProfileStack': 'profile',
        },
      },
    };
  }

  /**
   * Setup deep link listener
   */
  private setupDeepLinkListener(): void {
    const handleDeepLink = ({ url }: { url: string }) => {
      console.log('Deep link received:', url);
      this.handleDeepLink(url);
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle initial URL if app was launched from a deep link
    Linking.getInitialURL().then((url) => {
      if (url != null) {
        console.log('Initial deep link:', url);
        this.handleDeepLink(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }

  /**
   * Handle deep link navigation
   */
  private handleDeepLink(url: string): void {
    if (!this.navigationRef) {
      console.warn('Navigation ref not initialized');
      return;
    }

    const route = this.parseDeepLink(url);
    if (route) {
      this.navigationRef.navigate(route.name, route.params);
    }
  }

  /**
   * Parse deep link URL
   */
  private parseDeepLink(url: string): { name: string; params?: Record<string, any> } | null {
    try {
      // Remove protocol
      let path = url.replace(/^(hr360:\/\/|https:\/\/hr360\.app\/|https:\/\/[^/]+\/)/, '');
      
      // Parse path and query params
      const [pathname, queryString] = path.split('?');
      const segments = pathname.split('/').filter(Boolean);

      if (segments.length === 0) {
        return { name: 'Dashboard' };
      }

      const params: Record<string, any> = {};

      // Parse query string
      if (queryString) {
        const searchParams = new URLSearchParams(queryString);
        searchParams.forEach((value, key) => {
          params[key] = value;
        });
      }

      // Route mapping
      const firstSegment = segments[0];
      const secondSegment = segments[1];

      switch (firstSegment) {
        case 'alerts':
          if (secondSegment) {
            params.id = secondSegment;
            return { name: 'AlertDetail', params };
          }
          return { name: 'Alerts' };

        case 'checkin':
          if (secondSegment) {
            params.id = secondSegment;
            return { name: 'CheckInDetail', params };
          }
          return { name: 'CheckIn' };

        case 'contacts':
          if (secondSegment) {
            params.id = secondSegment;
            return { name: 'ContactDetail', params };
          }
          return { name: 'Contacts' };

        case 'kb':
          if (secondSegment) {
            params.id = secondSegment;
            return { name: 'KBDetail', params };
          }
          return { name: 'KnowledgeBase' };

        case 'sos':
          if (secondSegment) {
            params.id = secondSegment;
            return { name: 'SOSDetail', params };
          }
          return { name: 'SOS' };

        case 'incidents':
          if (secondSegment) {
            params.id = secondSegment;
            return { name: 'IncidentDetail', params };
          }
          return { name: 'Incidents' };

        case 'notifications':
          if (secondSegment) {
            params.id = secondSegment;
            return { name: 'NotificationDetail', params };
          }
          return { name: 'Notifications' };

        case 'profile':
          return { name: 'Profile' };

        case 'settings':
          return { name: 'Settings' };

        case 'dashboard':
          return { name: 'Dashboard' };

        default:
          console.warn('Unknown deep link route:', firstSegment);
          return null;
      }
    } catch (error) {
      console.error('Error parsing deep link:', error);
      return null;
    }
  }

  /**
   * Navigate to screen from notification
   */
  public navigateFromNotification(notification: any): void {
    if (!this.navigationRef) {
      console.warn('Navigation ref not initialized');
      return;
    }

    const { data } = notification;
    if (!data) return;

    const { type, notificationId } = data;

    switch (type) {
      case 'alert':
        this.navigationRef.navigate('AlertDetail', { id: data.alertId || notificationId });
        break;

      case 'incident':
        this.navigationRef.navigate('IncidentDetail', { id: data.incidentId || notificationId });
        break;

      case 'sos':
        this.navigationRef.navigate('SOSDetail', { id: data.sosId || notificationId });
        break;

      case 'checkin':
        this.navigationRef.navigate('CheckInDetail', { id: data.checkInId || notificationId });
        break;

      case 'notification':
        this.navigationRef.navigate('NotificationDetail', { id: notificationId });
        break;

      default:
        console.warn('Unknown notification type:', type);
        this.navigationRef.navigate('Notifications');
    }
  }

  /**
   * Generate deep link URL
   */
  public generateDeepLink(screen: string, params?: Record<string, any>): string {
    const baseUrl = 'hr360://';
    let url = baseUrl;

    switch (screen) {
      case 'AlertDetail':
        url += `alerts/${params?.id}`;
        break;
      case 'IncidentDetail':
        url += `incidents/${params?.id}`;
        break;
      case 'SOSDetail':
        url += `sos/${params?.id}`;
        break;
      case 'CheckInDetail':
        url += `checkin/${params?.id}`;
        break;
      case 'NotificationDetail':
        url += `notifications/${params?.id}`;
        break;
      case 'ContactDetail':
        url += `contacts/${params?.id}`;
        break;
      case 'KBDetail':
        url += `kb/${params?.id}`;
        break;
      default:
        url += screen.toLowerCase();
    }

    // Add query params
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (key !== 'id') {
          queryParams.append(key, String(value));
        }
      });

      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return url;
  }

  /**
   * Handle notification tap
   */
  public handleNotificationTap(notification: any): void {
    console.log('Notification tapped:', notification);
    this.navigateFromNotification(notification);
  }

  /**
   * Get navigation ref
   */
  public getNavigationRef(): NavigationContainerRef<any> | null {
    return this.navigationRef;
  }
}

// Singleton instance
let deepLinkingService: DeepLinkingService;

/**
 * Get or create deep linking service instance
 */
export function getDeepLinkingService(): DeepLinkingService {
  if (!deepLinkingService) {
    deepLinkingService = new DeepLinkingService();
  }
  return deepLinkingService;
}

export default getDeepLinkingService();
