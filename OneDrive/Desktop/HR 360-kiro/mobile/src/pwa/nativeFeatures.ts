/**
 * Native Features for PWA
 * Provides Web APIs for biometric auth, location, camera, etc.
 */

// ============ BIOMETRIC AUTHENTICATION ============

export interface BiometricCredential {
  id: string;
  publicKey: ArrayBuffer;
  transports?: AuthenticatorTransport[];
}

/**
 * Register biometric authentication
 */
export async function registerBiometric(
  userId: string,
  userName: string,
  userEmail: string
): Promise<BiometricCredential | null> {
  if (!window.PublicKeyCredential) {
    console.warn('WebAuthn not supported');
    return null;
  }

  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: new Uint8Array(32),
        rp: {
          name: 'HR 360',
          id: window.location.hostname
        },
        user: {
          id: new Uint8Array(Buffer.from(userId)),
          name: userEmail,
          displayName: userName
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Use device biometric
          userVerification: 'preferred',
          residentKey: 'preferred'
        },
        timeout: 60000,
        attestation: 'direct'
      }
    }) as PublicKeyCredential | null;

    if (!credential) {
      console.warn('Biometric registration cancelled');
      return null;
    }

    return {
      id: credential.id,
      publicKey: credential.response.getPublicKey?.() || new ArrayBuffer(0),
      transports: (credential.response as AuthenticatorAttestationResponse).getTransports?.()
    };
  } catch (error) {
    console.error('Biometric registration failed:', error);
    return null;
  }
}

/**
 * Authenticate with biometric
 */
export async function authenticateWithBiometric(
  credentialIds: string[]
): Promise<PublicKeyCredential | null> {
  if (!window.PublicKeyCredential) {
    console.warn('WebAuthn not supported');
    return null;
  }

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(32),
        allowCredentials: credentialIds.map((id) => ({
          id: new Uint8Array(Buffer.from(id, 'base64')),
          type: 'public-key' as const,
          transports: ['internal'] as AuthenticatorTransport[]
        })),
        userVerification: 'preferred',
        timeout: 60000
      }
    }) as PublicKeyCredential | null;

    return assertion;
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    return null;
  }
}

// ============ GEOLOCATION ============

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

/**
 * Get current location
 */
export async function getCurrentLocation(): Promise<LocationCoordinates | null> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Watch location changes
 */
export function watchLocation(
  callback: (location: LocationCoordinates) => void,
  onError?: (error: GeolocationPositionError) => void
): number {
  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined
      });
    },
    onError,
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

/**
 * Stop watching location
 */
export function stopWatchingLocation(watchId: number) {
  navigator.geolocation.clearWatch(watchId);
}

// ============ CAMERA ACCESS ============

export interface CameraStream {
  stream: MediaStream;
  video: HTMLVideoElement;
  stop: () => void;
}

/**
 * Access camera
 */
export async function accessCamera(
  facingMode: 'user' | 'environment' = 'environment'
): Promise<CameraStream | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();

    return {
      stream,
      video,
      stop: () => {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  } catch (error) {
    console.error('Camera access failed:', error);
    return null;
  }
}

/**
 * Capture photo from camera
 */
export async function capturePhoto(video: HTMLVideoElement): Promise<Blob | null> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  } catch (error) {
    console.error('Photo capture failed:', error);
    return null;
  }
}

// ============ QR CODE SCANNING ============

/**
 * Scan QR code from camera
 */
export async function scanQRCode(video: HTMLVideoElement): Promise<string | null> {
  try {
    // Dynamically import QR scanner
    const QrScanner = (await import('qr-scanner')).default;

    return new Promise((resolve, reject) => {
      const scanner = new QrScanner(
        video,
        (result) => {
          scanner.destroy();
          resolve(result.data);
        },
        {
          onDecodeError: (error) => {
            // Ignore decode errors, keep scanning
          },
          highlightScanRegion: true,
          highlightCodeOutline: true
        }
      );

      scanner.start().catch(reject);

      // Auto-stop after 30 seconds
      setTimeout(() => {
        scanner.destroy();
        resolve(null);
      }, 30000);
    });
  } catch (error) {
    console.error('QR code scanning failed:', error);
    return null;
  }
}

// ============ VIBRATION ============

/**
 * Vibrate device
 */
export function vibrate(pattern: number | number[] = 200) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

/**
 * Stop vibration
 */
export function stopVibration() {
  if ('vibrate' in navigator) {
    navigator.vibrate(0);
  }
}

// ============ BATTERY STATUS ============

export interface BatteryStatus {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

/**
 * Get battery status
 */
export async function getBatteryStatus(): Promise<BatteryStatus | null> {
  try {
    const battery = await (navigator as any).getBattery?.();
    if (!battery) return null;

    return {
      level: battery.level,
      charging: battery.charging,
      chargingTime: battery.chargingTime,
      dischargingTime: battery.dischargingTime
    };
  } catch (error) {
    console.warn('Battery API not available:', error);
    return null;
  }
}

// ============ NETWORK STATUS ============

export interface NetworkStatus {
  online: boolean;
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

/**
 * Get network status
 */
export function getNetworkStatus(): NetworkStatus {
  const connection = (navigator as any).connection || (navigator as any).mozConnection;

  return {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 0,
    rtt: connection?.rtt || 0,
    saveData: connection?.saveData || false
  };
}

/**
 * Listen for network changes
 */
export function onNetworkChange(callback: (status: NetworkStatus) => void) {
  window.addEventListener('online', () => callback(getNetworkStatus()));
  window.addEventListener('offline', () => callback(getNetworkStatus()));

  const connection = (navigator as any).connection || (navigator as any).mozConnection;
  if (connection) {
    connection.addEventListener('change', () => callback(getNetworkStatus()));
  }
}

// ============ PERMISSIONS ============

/**
 * Check permission status
 */
export async function checkPermission(
  name: 'camera' | 'geolocation' | 'microphone' | 'notifications'
): Promise<PermissionStatus | null> {
  try {
    const result = await navigator.permissions.query({ name: name as any });
    return result;
  } catch (error) {
    console.warn(`Permission check failed for ${name}:`, error);
    return null;
  }
}

/**
 * Request permission
 */
export async function requestPermission(
  name: 'camera' | 'geolocation' | 'microphone' | 'notifications'
): Promise<boolean> {
  try {
    const status = await checkPermission(name);
    if (status?.state === 'granted') {
      return true;
    }

    if (status?.state === 'denied') {
      return false;
    }

    // For geolocation and camera, the request happens automatically
    // when you call the API
    return true;
  } catch (error) {
    console.error(`Permission request failed for ${name}:`, error);
    return false;
  }
}
