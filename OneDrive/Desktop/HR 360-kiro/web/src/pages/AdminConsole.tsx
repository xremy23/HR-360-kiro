import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { logout } from '../store/slices/authSlice';
import DesktopWebsite from './DesktopWebsite';
import apiService from '../services/apiService';

interface CheckIn {
  id: string;
  userId: string;
  status: 'safe' | 'need-help' | 'sos';
  notes: string;
  timestamp: string;
}

interface IncidentReport {
  id: string;
  title: string;
  type: string;
  description: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

interface PhoneContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  description: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'hr' | 'hr_admin' | 'workplace_admin' | 'safety_admin' | 'employee';
  team?: string;
  phone?: string;
  address?: string;
}

const AdminConsole: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : false;
  });
  const [isOnline] = useState(navigator.onLine);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);

  // Real data states
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [guides, setGuides] = useState<any[]>([]);

  // Apply dark mode on mount and when it changes
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      html.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [darkMode]);

  // Load data on mount
  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Fetch incidents
      try {
        const incidentsResponse = await apiService.getIncidents({ pageSize: 50 });
        if (incidentsResponse.success && incidentsResponse.data) {
          const mappedIncidents: IncidentReport[] = (incidentsResponse.data as any[]).map(incident => ({
            id: incident.id,
            title: incident.title,
            type: incident.type || 'General',
            description: incident.description,
            location: incident.location || 'Unknown',
            severity: incident.severity || 'medium',
            timestamp: incident.createdAt || new Date().toISOString(),
          }));
          setReports(mappedIncidents);
        }
      } catch (err) {
        console.warn('Failed to fetch incidents:', err);
      }

      // Fetch check-ins
      try {
        const checkInsResponse = await apiService.getCheckIns({ pageSize: 50 });
        if (checkInsResponse.success && checkInsResponse.data) {
          const mappedCheckIns: CheckIn[] = (checkInsResponse.data as any[]).map(checkin => ({
            id: checkin.id,
            userId: checkin.userId,
            status: checkin.status || 'safe',
            notes: checkin.notes || '',
            timestamp: checkin.createdAt || new Date().toISOString(),
          }));
          setCheckIns(mappedCheckIns);
        }
      } catch (err) {
        console.warn('Failed to fetch check-ins:', err);
      }

      // Fetch organization users
      try {
        const usersResponse = await apiService.getOrganizationUsers({ pageSize: 50 });
        if (usersResponse.success && usersResponse.data) {
          const mappedUsers: User[] = (usersResponse.data as any[]).map(u => ({
            id: u.id,
            name: `${u.firstName} ${u.lastName}`,
            email: u.email,
            role: u.role || 'employee',
            team: u.team,
            phone: u.phone,
            address: u.address,
          }));
          setUsers(mappedUsers);
        }
      } catch (err) {
        console.warn('Failed to fetch organization users:', err);
      }

      // Fetch KB guides - with explicit includeArchived param
      try {
        const guidesResponse = await apiService.get('/kb/guides', { isPublished: true });
        if (guidesResponse.success && guidesResponse.data) {
          const guidesList = Array.isArray(guidesResponse.data) ? guidesResponse.data : [];
          console.log('Loaded KB guides:', guidesList);
          setGuides(guidesList);
        }
      } catch (err) {
        console.warn('Failed to fetch KB guides:', err);
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
      // Fall back to empty arrays, data will still show
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  // Poll for guide updates every 15 seconds (reduced from 5 to avoid rate limiting)
  useEffect(() => {
    const interval = setInterval(() => {
      const reloadGuides = async () => {
        try {
          const guidesResponse = await apiService.get('/kb/guides', { isPublished: true });
          if (guidesResponse.success && guidesResponse.data) {
            const guidesList = Array.isArray(guidesResponse.data) ? guidesResponse.data : [];
            setGuides(guidesList);
          }
        } catch (err) {
          // Silently fail - this is a background poll
          console.debug('Guide sync skipped (rate limited or offline)');
        }
      };
      reloadGuides();
    }, 15000); // Reload every 15 seconds to avoid rate limiting

    return () => clearInterval(interval);
  }, []);

  const handleToggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    const html = document.documentElement;
    if (newDarkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  const handleSignOut = () => {
    dispatch(logout());
  };

  const handleAddReport = (
    title: string,
    type: string,
    description: string,
    location: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ) => {
    // Call API to create incident
    apiService.createIncident({
      title,
      description,
      severity,
      location,
    }).then(response => {
      if (response.success && response.data) {
        const newReport: IncidentReport = {
          id: response.data.id,
          title,
          type,
          description,
          location,
          severity,
          timestamp: new Date().toISOString(),
        };
        setReports([newReport, ...reports]);
      }
    }).catch(error => {
      console.error('Failed to create incident:', error);
      // Still add locally for offline support
      const newReport: IncidentReport = {
        id: `r${Date.now()}`,
        title,
        type,
        description,
        location,
        severity,
        timestamp: new Date().toISOString(),
      };
      setReports([newReport, ...reports]);
    });
  };

  // Build mock data for display
  const mockContacts: PhoneContact[] = [
    {
      id: 'contact1',
      name: 'National Emergency Hotline',
      phone: '911',
      email: 'emergency@pnp.gov.ph',
      role: 'Emergency',
      description: 'Primary emergency response',
    },
    {
      id: 'contact2',
      name: 'Pasig City Hall',
      phone: '+63 2 645-7896',
      email: 'info@pasigcity.gov.ph',
      role: 'Government',
      description: 'City emergency operations',
    },
    {
      id: 'contact3',
      name: 'Philippine Red Cross',
      phone: '+63 2 554-2034',
      email: 'metromm@redcross.org.ph',
      role: 'Emergency',
      description: 'Medical aid and disaster relief',
    },
  ];

  const currentUser: User = {
    id: user?.id || 'admin-user',
    name: user?.name || 'Admin',
    email: user?.email || 'admin@corporate.com',
    role: (user?.role as any) || 'admin',
    team: 'Administration',
  };

  const [teamHeads, setTeamHeads] = useState<Record<string, string>>({
    'Product Infrastructure Core': users.find(u => u.email?.includes('maria'))?.name || 'Team Member',
    'Engineering Operations': users.find(u => u.email?.includes('paolo'))?.name || 'Team Member',
    'Security Team': currentUser.name,
  });

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      setLoading(true);
      const response = await apiService.put(`/users/${updatedUser.id}`, {
        firstName: updatedUser.name?.split(' ')[0],
        lastName: updatedUser.name?.split(' ').slice(1).join(' '),
        phone: updatedUser.phone,
        position: updatedUser.position,
        departmentId: (updatedUser as any).departmentId,
        teamId: (updatedUser as any).teamId,
        address: (updatedUser as any).address,
        personalEmergencyContact: (updatedUser as any).personalEmergencyContact,
      });
      
      if (response.success) {
        // Update local users state
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
        console.log('User updated successfully:', updatedUser);
      }
    } catch (error: any) {
      console.error('Failed to update user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeamHeads = (newTeamHeads: Record<string, string>) => {
    setTeamHeads(newTeamHeads);
  };

  if (!isInitialized || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Loading IT Admin Console...</h2>
          <p>Fetching incident data and team members</p>
          <p style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
            (This may take a moment on first load)
          </p>
        </div>
      </div>
    );
  }

  // Check if user is authorized to access IT admin console
  if (!user || !['super_admin', 'admin', 'hr_admin'].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route
        path="/*"
        element={
          <DesktopWebsite
            guides={guides}
            users={users.length > 0 ? users : [currentUser]}
            contacts={mockContacts}
            checkIns={checkIns}
            reports={reports}
            pagasaReports={[]}
            phivolcsReports={[]}
            currentUser={currentUser}
            darkMode={darkMode}
            onToggleDarkMode={handleToggleDarkMode}
            onSwitchUser={() => {}}
            onAddReport={handleAddReport}
            onUpdateUser={handleUpdateUser}
            isOnline={isOnline}
            onSignOut={handleSignOut}
            teamHeads={teamHeads}
            onUpdateTeamHeads={handleUpdateTeamHeads}
          />
        }
      />
    </Routes>
  );
};

export default AdminConsole;
