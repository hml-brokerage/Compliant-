'use client';

import { User } from '@compliant/shared';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface BrokerDashboardProps {
  user: User;
  onLogout: () => void;
}

interface DashboardStats {
  totalSubcontractors: number;
  pendingUploads: number;
  expiringSoon: number;
  pendingSignatures: number;
  recentSubcontractors: Array<{
    id: string;
    name: string;
    company: string;
    projects: string[];
    gcNames: string[];
    status: string;
  }>;
}

export default function BrokerDashboard({ user, onLogout }: BrokerDashboardProps) {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalSubcontractors: 0,
    pendingUploads: 0,
    expiringSoon: 0,
    pendingSignatures: 0,
    recentSubcontractors: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // TODO: Implement API call to fetch dashboard data
      // const response = await apiClient.get('/api/broker/dashboard');
      // setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Broker Portal</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-white px-2 py-1 bg-emerald-600 rounded">
                {user?.role}
              </span>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Broker Dashboard</h2>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  As a broker, you upload COI documents and policies for your assigned subcontractors. For <strong>first-time uploads</strong>, you provide all policies. 
                  For <strong>renewals</strong>, the system generates COI and you sign it digitally.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">My Subcontractors</h3>
              <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.totalSubcontractors}</p>
              <p className="text-sm text-gray-500 mt-1">Assigned to you</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Pending Uploads</h3>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.pendingUploads}</p>
              <p className="text-sm text-gray-500 mt-1">First-time COI needed</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Pending Signatures</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.pendingSignatures}</p>
              <p className="text-sm text-gray-500 mt-1">Renewals to sign</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Expiring Soon</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.expiringSoon}</p>
              <p className="text-sm text-gray-500 mt-1">Within 30 days</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/broker/upload')}
                className="block p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:shadow transition text-left"
              >
                <h4 className="font-semibold text-gray-900">📄 Upload First-Time COI</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Upload all policies for new subcontractors
                </p>
              </button>
              <button
                onClick={() => router.push('/broker/documents')}
                className="block p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:shadow transition text-left"
              >
                <h4 className="font-semibold text-gray-900">✍️ Sign Renewal COI</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Sign system-generated renewal certificates
                </p>
              </button>
              <button
                onClick={() => router.push('/broker/documents')}
                className="block p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:shadow transition text-left"
              >
                <h4 className="font-semibold text-gray-900">📋 Manage Documents</h4>
                <p className="text-sm text-gray-600 mt-1">View all subcontractors, projects, GCs, and documents</p>
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="block p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:shadow transition text-left"
              >
                <h4 className="font-semibold text-gray-900">🔔 Expiring Policies</h4>
                <p className="text-sm text-gray-600 mt-1">Track and renew expiring insurance policies</p>
              </button>
            </div>
          </div>

          {/* Recent Subcontractors */}
          {stats.recentSubcontractors.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Subcontractors</h3>
              <div className="space-y-4">
                {stats.recentSubcontractors.map((sub) => (
                  <div key={sub.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{sub.name}</h4>
                        <p className="text-sm text-gray-600">{sub.company}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {sub.projects.slice(0, 2).map((project, idx) => (
                            <span key={idx} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {project}
                            </span>
                          ))}
                          {sub.gcNames.length > 0 && (
                            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                              GC: {sub.gcNames[0]}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {sub.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
