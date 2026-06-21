import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
        <p className="text-2xl text-gray-600 dark:text-neutral-400 mt-4">Page not found</p>
        <p className="text-gray-500 dark:text-neutral-500 mt-2">The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-6 inline-block bg-blue-600 dark:bg-blue-700 text-white px-6 py-3 rounded hover:bg-blue-700 dark:hover:bg-blue-600">
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
