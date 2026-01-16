'use client';

import { User } from '@compliant/shared';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SubcontractorDashboardProps {
  user: User;
  onLogout: () => void;
}

interface DashboardStats {
  activeProjects: number;
  insuranceStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING' | 'EXPIRED';
  pendingItems: number;
  projects: Array<{
    id: string;
    name: string;
    gcName: string;
    status: string;
  }>;
}

export default function SubcontractorDashboard({ user, onLogout }: SubcontractorDashboardProps) {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    insuranceStatus: 'PENDING',
    pendingItems: 0,
    projects: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // TODO: Implement API call to fetch dashboard data
      // const response = await apiClient.get('/api/subcontractor/dashboard');
      // setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const getComplianceAlertColor = () => {
    switch (stats.insuranceStatus) {
      case 'COMPLIANT': return 'green';
      case 'NON_COMPLIANT': return 'red';
      case 'EXPIRED': return 'red';
      default: return 'yellow';
    }
  };

  const getComplianceIcon = () => {
    switch (stats.insuranceStatus) {
      case 'COMPLIANT': return '✓';
      case 'NON_COMPLIANT': return '✗';
      case 'EXPIRED': return '⚠';
      default: return '⏳';
    }
  };

  const getComplianceText = () => {
    switch (stats.insuranceStatus) {
      case 'COMPLIANT': return 'Compliant';
      case 'NON_COMPLIANT': return 'Non-Compliant';
      case 'EXPIRED': return 'Expired';
      default: return 'Pending';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Subcontractor Portal</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-white px-2 py-1 bg-purple-600 rounded">
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
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Subcontractor Dashboard</h2>
          
          {/* Compliance Alert */}
          {stats.insuranceStatus === 'NON_COMPLIANT' || stats.insuranceStatus === 'EXPIRED' ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Insurance Compliance Required
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    Your insurance documents are {stats.insuranceStatus.toLowerCase()}. Please contact your broker or upload updated documents immediately.
                    📧 Email notifications have been sent to you, your GC, and your broker.
                  </p>
                </div>
              </div>
            </div>
          ) : stats.insuranceStatus === 'COMPLIANT' ? (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Insurance Compliant ✓
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    All insurance documents are up to date and verified. 📧 Confirmation sent to you, your GC, and your broker.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    As a subcontractor, you provide your insurance broker information. Your broker will upload COI documents on your behalf.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Active Projects</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.activeProjects}</p>
              <p className="text-sm text-gray-500 mt-1">Assigned to you</p>
            </div>
            <div className={`bg-white rounded-lg shadow p-6 border-l-4 border-${getComplianceAlertColor()}-500`}>
              <h3 className="text-lg font-semibold text-gray-700">Compliance Status</h3>
              <p className={`text-3xl font-bold text-${getComplianceAlertColor()}-600 mt-2`}>
                {getComplianceIcon()} {getComplianceText()}
              </p>
              <p className="text-sm text-gray-500 mt-1">Insurance status</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Pending Items</h3>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingItems}</p>
              <p className="text-sm text-gray-500 mt-1">Needs attention</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/subcontractor/projects')}
                className="block p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow transition text-left"
              >
                <h4 className="font-semibold text-gray-900">My Projects</h4>
                <p className="text-sm text-gray-600 mt-1">
                  View all assigned projects and GCs
                </p>
              </button>
              <button
                onClick={() => router.push('/subcontractor/broker')}
                className="block p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow transition text-left"
              >
                <h4 className="font-semibold text-gray-900">Broker Information</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Add or update your insurance broker details
                </p>
              </button>
              <button
                onClick={() => router.push('/subcontractor/compliance')}
                className="block p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow transition text-left"
              >
                <h4 className="font-semibold text-gray-900">Compliance Status</h4>
                <p className="text-sm text-gray-600 mt-1">
                  View detailed compliance information
                </p>
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="block p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow transition text-left"
              >
                <h4 className="font-semibold text-gray-900">Profile & Settings</h4>
                <p className="text-sm text-gray-600 mt-1">Update your personal information</p>
              </button>
            </div>
          </div>

          {/* Recent Projects */}
          {stats.projects.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Projects</h3>
              <div className="space-y-4">
                {stats.projects.map((project) => (
                  <div key={project.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{project.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">GC: {project.gcName}</p>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {project.status}
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
