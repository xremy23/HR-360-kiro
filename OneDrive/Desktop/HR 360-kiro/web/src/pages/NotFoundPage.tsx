import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="text-2xl text-gray-600 mt-4">Page not found</p>
        <p className="text-gray-500 mt-2">The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
