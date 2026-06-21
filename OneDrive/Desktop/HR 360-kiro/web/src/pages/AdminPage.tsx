import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import MobileHome from './MobileHome';

/**
 * AdminPage - Mobile view for admin/HR users
 * On mobile, admins see the same employee app as everyone else
 * The admin console is only available on desktop
 */
const AdminPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Verify user is admin/hr
  if (!user || !['admin', 'hr'].includes(user.role)) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-stone-50 dark:bg-neutral-950 p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Access Denied</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <MobileHome />;
};

export default AdminPage;
