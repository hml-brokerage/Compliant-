'use client';

import Link from 'next/link';
import { useAuth } from '../lib/auth/AuthContext';

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-24">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">Compliant Platform</h1>
        <p className="text-xl text-gray-600 mb-8">
          Professional contractor and insurance management
        </p>
        <div className="flex gap-4 justify-center mb-8">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Get Started
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Dashboard
          </Link>
        </div>
        
        {!loading && isAuthenticated && (
          <div className="mt-12 pt-12 border-t border-gray-300">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">Admin Tools</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/admin/programs"
                className="px-4 py-3 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition font-medium"
              >
                Programs
              </Link>
              <Link
                href="/admin/contractors"
                className="px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-medium"
              >
                Contractors
              </Link>
              <Link
                href="/admin/projects"
                className="px-4 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition font-medium"
              >
                Projects
              </Link>
              <Link
                href="/gc/dashboard"
                className="px-4 py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition font-medium"
              >
                GC Portal
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
