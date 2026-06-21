/**
 * LocationMap Component
 * Displays user and employee locations on a map
 * Uses Google Maps or fallback to simple coordinate display
 */

import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { setShowMap, setMapCenter, setZoomLevel, setError, setLoading } from '../store/slices/locationSlice';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/designSystem';
import { useDarkMode } from '../hooks/useDarkMode';

interface MapMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'user' | 'contact' | 'checkpoint';
  status?: 'safe' | 'need-help' | 'sos';
}

const LocationMap: React.FC<{ markers?: MapMarker[] }> = ({ markers = [] }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { showMap, mapCenter, zoomLevel, currentLocation } = useSelector(
    (state: RootState) => state.location
  );
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [googleMap, setGoogleMap] = useState<any>(null);
  const isDarkMode = useDarkMode();

  // Initialize map
  useEffect(() => {
    if (showMap && mapContainerRef.current && !mapLoaded) {
      initializeMap();
    }
  }, [showMap, mapLoaded]);

  const initializeMap = () => {
    try {
      // Check if Google Maps is available
      if (window.google?.maps) {
        const mapOptions = {
          center: mapCenter || { lat: 40.7128, lng: -74.006 }, // NYC default
          zoom: zoomLevel,
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
          streetViewControl: false,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        };

        const map = new window.google.maps.Map(mapContainerRef.current, mapOptions);
        setGoogleMap(map);

        // Add current location marker
        if (currentLocation) {
          addMarker(map, {
            id: 'current',
            name: 'Your Location',
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            type: 'user',
          });
        }

        // Add other markers
        markers.forEach(marker => addMarker(map, marker));

        // Listen for map changes
        map.addListener('zoom_changed', () => {
          dispatch(setZoomLevel(map.getZoom()));
        });

        map.addListener('center_changed', () => {
          const center = map.getCenter();
          dispatch(setMapCenter({ lat: center.lat(), lng: center.lng() }));
        });

        setMapLoaded(true);
      } else {
        console.warn('Google Maps API not loaded');
        // Fallback to simple display
        setMapLoaded(true);
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      dispatch(setError('Failed to load map'));
    }
  };

  const addMarker = (map: any, marker: MapMarker) => {
    if (!window.google?.maps) return;

    const markerIcon = getMarkerIcon(marker.type, marker.status);

    const gmMarker = new window.google.maps.Marker({
      position: { lat: marker.latitude, lng: marker.longitude },
      map: map,
      title: marker.name,
      icon: markerIcon,
    });

    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <strong>${marker.name}</strong>
          <br/>
          ${marker.status ? `Status: ${marker.status}` : ''}
          <br/>
          <small>${marker.latitude.toFixed(4)}, ${marker.longitude.toFixed(4)}</small>
        </div>
      `,
    });

    gmMarker.addListener('click', () => {
      infoWindow.open(map, gmMarker);
    });
  };

  const getMarkerIcon = (type: string, status?: string): string => {
    if (type === 'user') {
      return 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
    } else if (type === 'contact') {
      if (status === 'sos') return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
      if (status === 'need-help') return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
      return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
    } else if (type === 'checkpoint') {
      return 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png';
    }
    return 'http://maps.google.com/mapfiles/ms/icons/gray-dot.png';
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  if (!showMap) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 998,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={() => dispatch(setShowMap(false))}
    >
      <div
        style={{
          backgroundColor: isDarkMode ? '#18181B' : colors.white,
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
          maxWidth: '900px',
          width: '95%',
          height: '90vh',
          boxShadow: shadows.lg,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: spacing.lg,
            borderBottom: `1px solid ${isDarkMode ? '#27272A' : colors.borderLight}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, color: isDarkMode ? '#FAFAFA' : colors.text, fontSize: typography.sizes.lg }}>
            📍 Location Map
          </h2>
          <button
            onClick={() => dispatch(setShowMap(false))}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: isDarkMode ? '#A1A1AA' : colors.textSecondary,
            }}
          >
            ✕
          </button>
        </div>

        {/* Map Container */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {mapLoaded && window.google?.maps ? (
            <div
              ref={mapContainerRef}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: colors.textSecondary,
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: spacing.md }}>🗺️</div>
                <p>Loading map...</p>
                <p style={{ fontSize: typography.sizes.sm, color: colors.textTertiary }}>
                  Make sure Google Maps API is configured
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div
          style={{
            padding: spacing.md,
            borderTop: `1px solid ${isDarkMode ? '#27272A' : colors.borderLight}`,
            backgroundColor: isDarkMode ? '#27272A' : colors.greyLight,
            color: isDarkMode ? '#FAFAFA' : colors.text,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: spacing.md,
            fontSize: typography.sizes.sm,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#4285F4',
              }}
            />
            <span>Your Location</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#00AA00',
              }}
            />
            <span>Safe</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#FFAA00',
              }}
            />
            <span>Need Help</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#FF0000',
              }}
            />
            <span>SOS</span>
          </div>
        </div>

        {/* Marker List (if Google Maps not available or as reference) */}
        {markers.length > 0 && (
          <div
            style={{
              maxHeight: '200px',
              overflowY: 'auto',
              padding: spacing.md,
              backgroundColor: isDarkMode ? '#18181B' : colors.white,
              borderTop: `1px solid ${isDarkMode ? '#27272A' : colors.borderLight}`,
              color: isDarkMode ? '#FAFAFA' : colors.text,
            }}
          >
            <h3 style={{ margin: `0 0 ${spacing.sm} 0`, fontSize: typography.sizes.sm }}>
              People ({markers.length})
            </h3>
            <div style={{ display: 'grid', gap: spacing.sm }}>
              {markers.map(marker => {
                const distance = currentLocation
                  ? calculateDistance(
                      currentLocation.latitude,
                      currentLocation.longitude,
                      marker.latitude,
                      marker.longitude
                    )
                  : null;

                return (
                  <div
                    key={marker.id}
                    style={{
                      padding: spacing.sm,
                      backgroundColor: isDarkMode ? '#27272A' : colors.greyLight,
                      borderRadius: borderRadius.sm,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      color: isDarkMode ? '#FAFAFA' : colors.text,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: typography.sizes.sm }}>
                        {marker.name}
                      </div>
                      <div style={{ fontSize: typography.sizes.xs, color: isDarkMode ? '#A1A1AA' : colors.textSecondary }}>
                        {marker.status && `Status: ${marker.status}`}
                      </div>
                    </div>
                    {distance !== null && (
                      <div style={{ fontSize: typography.sizes.sm, color: isDarkMode ? '#A1A1AA' : colors.textSecondary }}>
                        {distance.toFixed(1)} km away
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default LocationMap;
