# Web Console Implementation Guide

**Status:** Foundation ready, pages need implementation  
**Date:** May 27, 2026  
**Estimated Effort:** 2-3 weeks (1-2 developers)

---

## 📊 Current Status

### ✅ Completed
- AppRouter with authentication and role-based routing
- LoginPage with email/password authentication
- Dashboard with real-time WebSocket integration
- AdminConsole with navigation structure
- EmployeeApp with routing
- Design system integration
- WebSocket service
- IndexedDB service
- PWA service

### ⏳ Needs Implementation
- 8 admin pages (currently showing "coming soon")
- API service integration
- Redux store slices
- Data tables with CRUD operations
- Forms with validation
- Real-time updates
- Error handling
- Loading states

---

## 🏗️ Architecture Overview

### Routing Structure
```
/login                          - LoginPage
/                               - EmployeeApp
  /                             - MobileHome
  /checkin                      - MobileCheckIn
  /alerts                       - MobileAlerts
  /kb                           - MobileKB
  /contacts                     - MobileContacts (TODO)
  /settings                     - MobileSettings

/admin                          - AdminConsole
  /                             - Dashboard
  /kb                           - KBManagement
  /org                          - OrgManagement
  /users                        - UserManagement
  /alerts                       - AlertManagement
  /incidents                    - IncidentManagement
  /teams                        - TeamManagement (TODO)
  /reports                      - Reports (TODO)
```

### Component Structure
```
web/src/
├── pages/
│   ├── LoginPage.tsx           ✅ Done
│   ├── Dashboard.tsx           ✅ Done
│   ├── AdminConsole.tsx        🟡 Partial
│   ├── EmployeeApp.tsx         🟡 Partial
│   ├── KBManagement.tsx        ⏳ TODO
│   ├── UserManagement.tsx      ⏳ TODO
│   ├── AlertManagement.tsx     ⏳ TODO
│   ├── IncidentManagement.tsx  ⏳ TODO
│   ├── OrgManagement.tsx       ⏳ TODO
│   ├── TeamManagement.tsx      ⏳ TODO
│   ├── Reports.tsx             ⏳ TODO
│   └── MobileHome.tsx          ⏳ TODO
├── components/
│   ├── ConsoleLayout.tsx       ⏳ TODO
│   ├── DataTable.tsx           ⏳ TODO
│   ├── Form.tsx                ⏳ TODO
│   ├── Modal.tsx               ⏳ TODO
│   ├── Sidebar.tsx             ⏳ TODO
│   └── ...
├── services/
│   ├── apiService.ts           ⏳ TODO
│   ├── websocketService.ts     ✅ Done
│   └── ...
└── store/
    ├── slices/
    │   ├── authSlice.ts        ✅ Done
    │   ├── usersSlice.ts       ⏳ TODO
    │   ├── kbSlice.ts          ⏳ TODO
    │   ├── alertsSlice.ts      ⏳ TODO
    │   └── ...
    └── store.ts                ✅ Done
```

---

## 📋 Implementation Plan

### Phase 1: Core Components (3-4 days)

#### 1. API Service (`web/src/services/apiService.ts`)
```typescript
// Create API client with:
- Base URL configuration
- Request/response interceptors
- Token management
- Error handling
- Retry logic

// Methods for:
- Users (get, create, update, delete, list)
- KB Guides (get, create, update, delete, list)
- Alerts (get, create, broadcast, delete)
- Incidents (get, create, update, delete)
- Organizations (get, update)
- Teams (get, create, update, delete)
- Check-ins (get, list by team)
- Reports (get analytics)
```

#### 2. Redux Slices
```typescript
// usersSlice.ts
- users: User[]
- selectedUser: User | null
- loading: boolean
- error: string | null
- actions: fetchUsers, createUser, updateUser, deleteUser

// kbSlice.ts
- guides: Guide[]
- selectedGuide: Guide | null
- loading: boolean
- error: string | null
- actions: fetchGuides, createGuide, updateGuide, deleteGuide

// alertsSlice.ts
- alerts: Alert[]
- selectedAlert: Alert | null
- loading: boolean
- error: string | null
- actions: fetchAlerts, createAlert, broadcastAlert, deleteAlert

// incidentsSlice.ts
- incidents: Incident[]
- selectedIncident: Incident | null
- loading: boolean
- error: string | null
- actions: fetchIncidents, createIncident, updateIncident

// teamsSlice.ts
- teams: Team[]
- selectedTeam: Team | null
- loading: boolean
- error: string | null
- actions: fetchTeams, createTeam, updateTeam, deleteTeam
```

#### 3. Reusable Components
```typescript
// ConsoleLayout.tsx
- Sidebar navigation
- Header with user menu
- Main content area
- Responsive design

// DataTable.tsx
- Sortable columns
- Filtering
- Pagination
- Row selection
- Actions (edit, delete)

// Form.tsx
- Input fields
- Validation
- Error messages
- Submit button
- Cancel button

// Modal.tsx
- Header
- Body
- Footer
- Close button
- Backdrop

// Sidebar.tsx
- Navigation links
- Active state
- Collapsible menu
- User profile
```

---

### Phase 2: Admin Pages (5-7 days)

#### 1. Dashboard (Already started)
**File:** `web/src/pages/Dashboard.tsx`

**Features:**
- ✅ Real-time stats (active incidents, check-ins, SOS, response rate)
- ✅ Active incidents list
- ✅ Recent alerts
- ✅ Live activity feed
- ✅ Check-in summary
- ✅ WebSocket integration
- ✅ Live status indicator

**Remaining:**
- [ ] Fetch initial data from API
- [ ] Add charts/graphs
- [ ] Add export functionality

---

#### 2. KB Management
**File:** `web/src/pages/KBManagement.tsx`

**Features:**
- [ ] List all KB guides
- [ ] Search and filter guides
- [ ] Create new guide
- [ ] Edit guide
- [ ] Delete guide
- [ ] View guide versions
- [ ] Publish/unpublish guide
- [ ] Bulk operations

**Components:**
- DataTable with guides
- Create/Edit form
- Version history modal
- Confirmation dialog

**API Endpoints:**
- GET /kb/guides
- POST /kb/guides
- PUT /kb/guides/:id
- DELETE /kb/guides/:id
- GET /kb/guides/:id/versions

---

#### 3. User Management
**File:** `web/src/pages/UserManagement.tsx`

**Features:**
- [ ] List all users
- [ ] Search and filter users
- [ ] Create new user
- [ ] Edit user (name, email, role, team, department)
- [ ] Delete user
- [ ] Bulk operations
- [ ] Export users
- [ ] Assign to teams/departments

**Components:**
- DataTable with users
- Create/Edit form
- Bulk action toolbar
- Export dialog

**API Endpoints:**
- GET /users (admin)
- POST /users (admin)
- PUT /users/:id (admin)
- DELETE /users/:id (admin)
- GET /org/users (admin)

---

#### 4. Team Management
**File:** `web/src/pages/TeamManagement.tsx`

**Features:**
- [ ] List all teams
- [ ] Create new team
- [ ] Edit team
- [ ] Delete team
- [ ] Assign users to teams
- [ ] View team members
- [ ] Team reports

**Components:**
- DataTable with teams
- Create/Edit form
- Member assignment modal
- Team details modal

**API Endpoints:**
- GET /org/teams
- POST /org/teams (admin)
- PUT /org/teams/:id (admin)
- DELETE /org/teams/:id (admin)

---

#### 5. Alert Management
**File:** `web/src/pages/AlertManagement.tsx`

**Features:**
- [ ] List all alerts
- [ ] Create new alert
- [ ] Select recipients (teams, users)
- [ ] Set severity level
- [ ] Broadcast alert
- [ ] View alert history
- [ ] Delete alert
- [ ] Track delivery status

**Components:**
- DataTable with alerts
- Create alert form
- Recipient selector
- Delivery status modal

**API Endpoints:**
- GET /alerts
- POST /alerts/broadcast (admin)
- DELETE /alerts/:id (admin)
- GET /alerts/:id/notifications

---

#### 6. Incident Management
**File:** `web/src/pages/IncidentManagement.tsx`

**Features:**
- [ ] List all incidents
- [ ] Create new incident
- [ ] Edit incident
- [ ] View incident details
- [ ] Check-in summary for incident
- [ ] Incident timeline
- [ ] Close incident
- [ ] Generate incident report

**Components:**
- DataTable with incidents
- Create/Edit form
- Incident details modal
- Check-in summary
- Timeline view

**API Endpoints:**
- GET /incidents
- POST /incidents (admin)
- PUT /incidents/:id (admin)
- GET /incidents/:id
- GET /incidents/:id/summary

---

#### 7. Organization Management
**File:** `web/src/pages/OrgManagement.tsx`

**Features:**
- [ ] View organization details
- [ ] Edit organization info
- [ ] Manage organization settings
- [ ] View organization statistics
- [ ] Manage email domain
- [ ] Manage invite codes

**Components:**
- Organization info form
- Settings panel
- Statistics cards

**API Endpoints:**
- GET /org
- PUT /org (admin)

---

#### 8. Reports
**File:** `web/src/pages/Reports.tsx`

**Features:**
- [ ] Check-in reports
- [ ] SOS escalation reports
- [ ] Incident reports
- [ ] User activity reports
- [ ] Date range filtering
- [ ] Export to CSV/PDF
- [ ] Charts and graphs

**Components:**
- Report selector
- Date range picker
- Charts (Recharts)
- Export button
- Data table

**API Endpoints:**
- GET /check-ins/team/:teamId
- GET /sos/escalations (admin)
- GET /incidents/:id/summary

---

### Phase 3: Employee Pages (2-3 days)

#### 1. MobileHome
**File:** `web/src/pages/MobileHome.tsx`

**Features:**
- [ ] Dashboard for employees
- [ ] Quick check-in buttons
- [ ] Recent alerts
- [ ] Recent check-ins
- [ ] Quick links

---

#### 2. MobileCheckIn
**File:** `web/src/pages/MobileCheckIn.tsx`

**Features:**
- [ ] Status selection (Safe, Need Help, SOS)
- [ ] Notes input
- [ ] Location input
- [ ] Submit check-in

---

#### 3. MobileAlerts
**File:** `web/src/pages/MobileAlerts.tsx`

**Features:**
- [ ] List alerts
- [ ] Filter by read status
- [ ] View alert details
- [ ] Mark as read

---

#### 4. MobileKB
**File:** `web/src/pages/MobileKB.tsx`

**Features:**
- [ ] Search guides
- [ ] Filter by category
- [ ] View guide details
- [ ] Acknowledge guide

---

#### 5. MobileContacts
**File:** `web/src/pages/MobileContacts.tsx`

**Features:**
- [ ] List contacts
- [ ] Add contact
- [ ] Edit contact
- [ ] Delete contact
- [ ] Call contact

---

#### 6. MobileSettings
**File:** `web/src/pages/MobileSettings.tsx`

**Features:**
- [ ] User profile
- [ ] Preferences
- [ ] Notifications
- [ ] Logout

---

## 🛠️ Implementation Steps

### Week 1: Core Setup

**Day 1-2: API Service & Redux**
```bash
# Create API service
touch web/src/services/apiService.ts

# Create Redux slices
touch web/src/store/slices/usersSlice.ts
touch web/src/store/slices/kbSlice.ts
touch web/src/store/slices/alertsSlice.ts
touch web/src/store/slices/incidentsSlice.ts
touch web/src/store/slices/teamsSlice.ts

# Update store
# web/src/store/store.ts
```

**Day 3-4: Reusable Components**
```bash
# Create components
touch web/src/components/ConsoleLayout.tsx
touch web/src/components/DataTable.tsx
touch web/src/components/Form.tsx
touch web/src/components/Modal.tsx
touch web/src/components/Sidebar.tsx
touch web/src/components/Header.tsx
touch web/src/components/Button.tsx
touch web/src/components/Input.tsx
touch web/src/components/Select.tsx
```

**Day 5: Update AdminConsole**
```bash
# Update AdminConsole.tsx to use ConsoleLayout
# Update routing to use new pages
```

---

### Week 2: Admin Pages

**Day 1: KB Management**
```bash
# Create KBManagement.tsx
# Implement list, create, edit, delete
# Add search and filter
```

**Day 2: User Management**
```bash
# Create UserManagement.tsx
# Implement list, create, edit, delete
# Add bulk operations
```

**Day 3: Alert Management**
```bash
# Create AlertManagement.tsx
# Implement list, create, broadcast
# Add recipient selection
```

**Day 4: Incident Management**
```bash
# Create IncidentManagement.tsx
# Implement list, create, view details
# Add check-in summary
```

**Day 5: Organization & Team Management**
```bash
# Create OrgManagement.tsx
# Create TeamManagement.tsx
# Implement settings and team management
```

---

### Week 3: Employee Pages & Reports

**Day 1-2: Employee Pages**
```bash
# Create MobileHome.tsx
# Create MobileCheckIn.tsx
# Create MobileAlerts.tsx
# Create MobileKB.tsx
# Create MobileContacts.tsx
# Create MobileSettings.tsx
```

**Day 3-4: Reports**
```bash
# Create Reports.tsx
# Implement check-in reports
# Implement SOS reports
# Implement incident reports
# Add charts and export
```

**Day 5: Testing & Polish**
```bash
# Test all pages
# Fix bugs
# Optimize performance
# Add error handling
```

---

## 📝 Code Templates

### API Service Template
```typescript
// web/src/services/apiService.ts
import axios, { AxiosInstance } from 'axios';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors
    this.api.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        throw error;
      }
    );
  }

  // Users
  async getUsers() {
    return this.api.get('/users');
  }

  async createUser(data: any) {
    return this.api.post('/users', data);
  }

  async updateUser(id: string, data: any) {
    return this.api.put(`/users/${id}`, data);
  }

  async deleteUser(id: string) {
    return this.api.delete(`/users/${id}`);
  }

  // Add more methods...
}

export default new ApiService();
```

### Redux Slice Template
```typescript
// web/src/store/slices/usersSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../services/apiService';

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async () => {
    return await apiService.getUsers();
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (data: any) => {
    return await apiService.createUser(data);
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    selectedUser: null,
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default usersSlice.reducer;
```

### DataTable Component Template
```typescript
// web/src/components/DataTable.tsx
import React from 'react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  pagination?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  loading,
  onEdit,
  onDelete,
  pagination,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100 border-b">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-2 text-left">
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && <th className="px-4 py-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-4 py-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(row)}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(row)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
```

---

## 🎯 Success Criteria

### Week 1
- [ ] API service fully implemented
- [ ] Redux slices created
- [ ] Reusable components built
- [ ] AdminConsole updated with layout

### Week 2
- [ ] All 5 admin pages implemented
- [ ] CRUD operations working
- [ ] Real-time updates working
- [ ] Error handling in place

### Week 3
- [ ] All 6 employee pages implemented
- [ ] Reports page with charts
- [ ] All pages tested
- [ ] Performance optimized

---

## 📊 Checklist

### API Service
- [ ] Base URL configuration
- [ ] Request interceptors
- [ ] Response interceptors
- [ ] Error handling
- [ ] Token management
- [ ] All CRUD methods

### Redux
- [ ] Auth slice
- [ ] Users slice
- [ ] KB slice
- [ ] Alerts slice
- [ ] Incidents slice
- [ ] Teams slice
- [ ] Store configuration

### Components
- [ ] ConsoleLayout
- [ ] DataTable
- [ ] Form
- [ ] Modal
- [ ] Sidebar
- [ ] Header
- [ ] Button
- [ ] Input
- [ ] Select

### Pages
- [ ] Dashboard ✅
- [ ] KBManagement
- [ ] UserManagement
- [ ] AlertManagement
- [ ] IncidentManagement
- [ ] OrgManagement
- [ ] TeamManagement
- [ ] Reports
- [ ] MobileHome
- [ ] MobileCheckIn
- [ ] MobileAlerts
- [ ] MobileKB
- [ ] MobileContacts
- [ ] MobileSettings

---

## 🚀 Ready to Start?

Begin with **Week 1: Core Setup**

1. Create API service
2. Create Redux slices
3. Create reusable components
4. Update AdminConsole

Then move to **Week 2: Admin Pages** and **Week 3: Employee Pages**.

Good luck! 💪

