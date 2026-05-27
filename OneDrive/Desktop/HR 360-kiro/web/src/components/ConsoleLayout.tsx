/**
 * Console Layout Component
 * Main layout for admin/HR console with navigation
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';

interface ConsoleLayoutProps {
  children: React.ReactNode;
}

const ConsoleLayout: React.FC<ConsoleLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { label: 'Dashboard', path: '/console/dashboard', icon: '📊' },
    { label: 'Incidents', path: '/console/incidents', icon: '🚨' },
    { label: 'Alerts', path: '/console/alerts', icon: '📢' },
    { label: 'Check-Ins', path: '/console/checkins', icon: '✓' },
    { label: 'Users', path: '/console/users', icon: '👥' },
    { label: 'Settings', path: '/console/settings', icon: '⚙️' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.neutral[50] }}>
      {/* Sidebar */}
      <div
        style={{
          width: sidebarOpen ? '280px' : '80px',
          backgroundColor: colors.primary.black,
          color: colors.primary.white,
          padding: spacing.lg,
          transition: 'width 200ms ease-in-out',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: shadows.lg,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            marginBottom: spacing.xxl,
            cursor: 'pointer',
          }}
          onClick={() => navigate('/console/dashboard')}
        >
          <div
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: colors.primary.teal,
            }}
          >
            360
          </div>
          {sidebarOpen && (
            <div>
              <p
                style={{
                  fontSize: typography.fontSize.h5.size,
                  fontWeight: typography.fontSize.h5.weight,
                  margin: 0,
                }}
              >
                Crisis
              </p>
              <p
                style={{
                  fontSize: typography.fontSize.caption.size,
                  color: colors.neutral[400],
                  margin: 0,
                }}
              >
                Management
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                width: '100%',
                padding: `${spacing.md} ${spacing.lg}`,
                backgroundColor: isActive(item.path) ? colors.primary.teal : 'transparent',
                color: colors.primary.white,
                border: 'none',
                borderRadius: borderRadius.md,
                marginBottom: spacing.md,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.md,
                fontSize: typography.fontSize.body2.size,
                fontWeight: typography.fontSize.body2.weight,
                transition: 'all 200ms ease-in-out',
              }}
              onMouseOver={(e) => {
                if (!isActive(item.path)) {
                  (e.target as HTMLButtonElement).style.backgroundColor = colors.neutral[800];
                }
              }}
              onMouseOut={(e) => {
                if (!isActive(item.path)) {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            width: '100%',
            padding: spacing.md,
            backgroundColor: colors.neutral[800],
            color: colors.primary.white,
            border: 'none',
            borderRadius: borderRadius.md,
            cursor: 'pointer',
            fontSize: '20px',
            transition: 'all 200ms ease-in-out',
          }}
          onMouseOver={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = colors.neutral[700];
          }}
          onMouseOut={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = colors.neutral[800];
          }}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <div
          style={{
            backgroundColor: colors.primary.white,
            borderBottom: `1px solid ${colors.neutral[200]}`,
            padding: `${spacing.lg} ${spacing.xl}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: shadows.sm,
          }}
        >
          <div>
            <p
              style={{
                fontSize: typography.fontSize.body2.size,
                color: colors.neutral[600],
                margin: 0,
              }}
            >
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
            <button
              style={{
                padding: `${spacing.sm} ${spacing.md}`,
                backgroundColor: colors.neutral[100],
                border: 'none',
                borderRadius: borderRadius.md,
                cursor: 'pointer',
                fontSize: '20px',
              }}
            >
              🔔
            </button>
            <button
              style={{
                padding: `${spacing.sm} ${spacing.md}`,
                backgroundColor: colors.neutral[100],
                border: 'none',
                borderRadius: borderRadius.md,
                cursor: 'pointer',
                fontSize: '20px',
              }}
            >
              👤
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ConsoleLayout;
