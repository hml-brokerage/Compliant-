'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';

interface SubcontractorDocument {
  id: string;
  subcontractorName: string;
  subcontractorCompany: string;
  projects: string[];
  gcNames: string[];
  addresses: string[];
  coiStatus: string;
  firstCOIUploaded: boolean;
  policies: {
    gl: { status: string; expirationDate?: string };
    auto: { status: string; expirationDate?: string };
    umbrella: { status: string; expirationDate?: string };
    wc: { status: string; expirationDate?: string };
  };
}

export default function BrokerDocumentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<SubcontractorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to fetch all subcontractors and documents
      // const response = await apiClient.get('/api/broker/documents');
      // setDocuments(response.data);
      
      // Mock data
      setDocuments([]);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      AWAITING_BROKER_UPLOAD: 'bg-orange-100 text-orange-800',
      AWAITING_BROKER_SIGNATURE: 'bg-blue-100 text-blue-800',
      AWAITING_ADMIN_REVIEW: 'bg-purple-100 text-purple-800',
      EXPIRED: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredDocuments = documents.filter((doc) => {
    if (filter === 'all') return true;
    if (filter === 'pending-upload') return !doc.firstCOIUploaded;
    if (filter === 'pending-signature') return doc.coiStatus === 'AWAITING_BROKER_SIGNATURE';
    if (filter === 'active') return doc.coiStatus === 'ACTIVE';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Manage Documents</h1>
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
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({documents.length})
              </button>
              <button
                onClick={() => setFilter('pending-upload')}
                className={`px-4 py-2 rounded-md transition ${
                  filter === 'pending-upload'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending Upload ({documents.filter((d) => !d.firstCOIUploaded).length})
              </button>
              <button
                onClick={() => setFilter('pending-signature')}
                className={`px-4 py-2 rounded-md transition ${
                  filter === 'pending-signature'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending Signature ({documents.filter((d) => d.coiStatus === 'AWAITING_BROKER_SIGNATURE').length})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-md transition ${
                  filter === 'active'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active ({documents.filter((d) => d.coiStatus === 'ACTIVE').length})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <p className="mt-4 text-gray-600">Loading documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
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
              <h3 className="mt-2 text-lg font-medium text-gray-900">No Documents Found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all'
                  ? 'No subcontractors assigned to you yet.'
                  : 'No documents match the selected filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{doc.subcontractorName}</h3>
                      <p className="text-sm text-gray-600">{doc.subcontractorCompany}</p>
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mt-2 ${getStatusBadge(doc.coiStatus)}`}>
                        {doc.coiStatus}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {!doc.firstCOIUploaded ? (
                        <button
                          onClick={() => router.push('/broker/upload')}
                          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition text-sm"
                        >
                          Upload First COI
                        </button>
                      ) : doc.coiStatus === 'AWAITING_BROKER_SIGNATURE' ? (
                        <button
                          onClick={() => router.push(`/broker/sign/${doc.id}`)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
                        >
                          Sign Renewal
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Projects & GCs</h4>
                      {doc.projects.slice(0, 2).map((project, idx) => (
                        <div key={idx} className="mb-1">
                          <p className="text-sm text-gray-900">{project}</p>
                          {doc.gcNames[idx] && (
                            <p className="text-xs text-gray-500">GC: {doc.gcNames[idx]}</p>
                          )}
                        </div>
                      ))}
                      {doc.projects.length > 2 && (
                        <p className="text-xs text-gray-500 mt-1">+ {doc.projects.length - 2} more</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Addresses</h4>
                      {doc.addresses.slice(0, 2).map((address, idx) => (
                        <p key={idx} className="text-sm text-gray-600">{address}</p>
                      ))}
                      {doc.addresses.length > 2 && (
                        <p className="text-xs text-gray-500 mt-1">+ {doc.addresses.length - 2} more</p>
                      )}
                    </div>
                  </div>

                  {doc.firstCOIUploaded && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Policy Status</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(doc.policies).map(([key, policy]) => {
                          const policyNames: Record<string, string> = {
                            gl: 'GL',
                            auto: 'Auto',
                            umbrella: 'Umbrella',
                            wc: 'WC',
                          };
                          return (
                            <div key={key} className="text-center p-2 bg-gray-50 rounded">
                              <p className="text-xs font-medium text-gray-700">{policyNames[key]}</p>
                              <span className={`inline-block px-2 py-1 text-xs rounded mt-1 ${getStatusBadge(policy.status)}`}>
                                {policy.status}
                              </span>
                              {policy.expirationDate && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Exp: {new Date(policy.expirationDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
