import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

const AdminConsole: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Console</h1>
          <p className="text-gray-600">Welcome, {user?.name}</p>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8 overflow-x-auto">
            <Link to="/admin" className="px-3 py-4 text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">
              Dashboard
            </Link>
            <Link to="/admin/kb" className="px-3 py-4 text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">
              KB Management
            </Link>
            <Link to="/admin/org" className="px-3 py-4 text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">
              Organization
            </Link>
            <Link to="/admin/users" className="px-3 py-4 text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">
              Users
            </Link>
            <Link to="/admin/alerts" className="px-3 py-4 text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">
              Alerts
            </Link>
            <Link to="/admin/incidents" className="px-3 py-4 text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">
              Incidents
            </Link>
            <Link to="/admin/drills" className="px-3 py-4 text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">
              Drills
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/kb" element={<KBManagement />} />
          <Route path="/org" element={<OrgManagement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/alerts" element={<AlertManagement />} />
          <Route path="/incidents" element={<IncidentManagement />} />
          <Route path="/drills" element={<DrillManagement />} />
        </Routes>
      </main>
    </div>
  );
};

const AdminDashboard: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
      <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
    </div>
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-gray-500 text-sm font-medium">Active Alerts</h3>
      <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
    </div>
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-gray-500 text-sm font-medium">KB Guides</h3>
      <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
    </div>
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-gray-500 text-sm font-medium">Recent Incidents</h3>
      <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
    </div>
  </div>
);

const KBManagement: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold mb-4">Knowledge Base Management</h2>
    <p className="text-gray-600">KB management page coming soon</p>
  </div>
);

const OrgManagement: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold mb-4">Organization Management</h2>
    <p className="text-gray-600">Organization management page coming soon</p>
  </div>
);

const UserManagement: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold mb-4">User Management</h2>
    <p className="text-gray-600">User management page coming soon</p>
  </div>
);

const AlertManagement: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold mb-4">Alert Management</h2>
    <p className="text-gray-600">Alert management page coming soon</p>
  </div>
);

const IncidentManagement: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold mb-4">Incident Management</h2>
    <p className="text-gray-600">Incident management page coming soon</p>
  </div>
);

const DrillManagement: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-2xl font-bold mb-4">Drill Management</h2>
    <p className="text-gray-600">Drill management page coming soon</p>
  </div>
);

export default AdminConsole;
