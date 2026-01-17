'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';

interface Project {
  id: string;
  name: string;
  description?: string;
  address?: string;
  gcName: string;
  gcEmail?: string;
  gcPhone?: string;
  status: string;
  startDate: string;
  endDate?: string;
  role?: string;
  complianceStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING' | 'EXPIRED';
}

export default function SubcontractorProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to fetch assigned projects
      // const response = await apiClient.get('/api/subcontractor/projects');
      // setProjects(response.data);
      
      // Mock data for demo
      setProjects([]);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      PLANNING: 'bg-blue-100 text-blue-800',
      ON_HOLD: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getComplianceBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      COMPLIANT: 'bg-green-100 text-green-800',
      NON_COMPLIANT: 'bg-red-100 text-red-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      EXPIRED: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredProjects = projects.filter((project) => {
    if (filter === 'all') return true;
    if (filter === 'active') return project.status === 'ACTIVE';
    if (filter === 'non-compliant') return project.complianceStatus === 'NON_COMPLIANT' || project.complianceStatus === 'EXPIRED';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md transition ${
                  filter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Projects ({projects.length})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-md transition ${
                  filter === 'active'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active ({projects.filter((p) => p.status === 'ACTIVE').length})
              </button>
              <button
                onClick={() => setFilter('non-compliant')}
                className={`px-4 py-2 rounded-md transition ${
                  filter === 'non-compliant'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Non-Compliant (
                {
                  projects.filter(
                    (p) => p.complianceStatus === 'NON_COMPLIANT' || p.complianceStatus === 'EXPIRED'
                  ).length
                }
                )
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No Projects Found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all'
                  ? 'You have not been assigned to any projects yet.'
                  : 'No projects match the selected filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <div key={project.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{project.name}</h3>
                        {project.description && (
                          <p className="text-gray-600 mb-2">{project.description}</p>
                        )}
                        {project.address && (
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            {project.address}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(project.status)}`}>
                          {project.status}
                        </span>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getComplianceBadge(project.complianceStatus)}`}>
                          {project.complianceStatus}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">General Contractor</h4>
                        <p className="text-sm text-gray-900">{project.gcName}</p>
                        {project.gcEmail && (
                          <p className="text-sm text-gray-500">{project.gcEmail}</p>
                        )}
                        {project.gcPhone && (
                          <p className="text-sm text-gray-500">{project.gcPhone}</p>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Project Timeline</h4>
                        <p className="text-sm text-gray-900">
                          Start: {new Date(project.startDate).toLocaleDateString()}
                        </p>
                        {project.endDate && (
                          <p className="text-sm text-gray-900">
                            End: {new Date(project.endDate).toLocaleDateString()}
                          </p>
                        )}
                        {project.role && (
                          <p className="text-sm text-gray-500 mt-1">Role: {project.role}</p>
                        )}
                      </div>
                    </div>

                    {(project.complianceStatus === 'NON_COMPLIANT' || project.complianceStatus === 'EXPIRED') && (
                      <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-700">
                              ⚠️ Action required: Your insurance documents are {project.complianceStatus.toLowerCase()} for this project. 
                              Please update your broker information or contact your broker to upload current COI documents.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
