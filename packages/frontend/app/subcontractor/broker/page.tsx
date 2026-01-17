'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';

type BrokerType = 'GLOBAL' | 'PER_POLICY';

interface BrokerInfo {
  brokerType: BrokerType;
  // Global broker
  brokerName?: string;
  brokerEmail?: string;
  brokerPhone?: string;
  brokerCompany?: string;
  // Per-policy brokers
  brokerGlName?: string;
  brokerGlEmail?: string;
  brokerGlPhone?: string;
  brokerAutoName?: string;
  brokerAutoEmail?: string;
  brokerAutoPhone?: string;
  brokerUmbrellaName?: string;
  brokerUmbrellaEmail?: string;
  brokerUmbrellaPhone?: string;
  brokerWcName?: string;
  brokerWcEmail?: string;
  brokerWcPhone?: string;
}

export default function SubcontractorBrokerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [brokerType, setBrokerType] = useState<BrokerType>('GLOBAL');
  const [brokerInfo, setBrokerInfo] = useState<BrokerInfo>({
    brokerType: 'GLOBAL',
  });

  useEffect(() => {
    fetchBrokerInfo();
  }, []);

  const fetchBrokerInfo = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to fetch existing broker info
      // const response = await apiClient.get('/api/subcontractor/broker');
      // setBrokerInfo(response.data);
      // setBrokerType(response.data.brokerType || 'GLOBAL');
    } catch (error) {
      console.error('Failed to fetch broker info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // TODO: Implement API call to save broker info
      // const response = await apiClient.post('/api/subcontractor/broker', {
      //   ...brokerInfo,
      //   brokerType,
      // });
      
      alert('Broker information saved successfully! Your broker(s) will receive account credentials via email.');
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to save broker info:', error);
      alert('Failed to save broker information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateBrokerInfo = (field: string, value: string) => {
    setBrokerInfo({ ...brokerInfo, [field]: value });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Broker Information</h1>
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

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Insurance Broker Information</h2>
              <p className="text-gray-600">
                Provide your insurance broker information. Your broker will be automatically notified and will upload COI documents on your behalf.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Broker Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Broker Type <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="brokerType"
                      value="GLOBAL"
                      checked={brokerType === 'GLOBAL'}
                      onChange={(e) => setBrokerType(e.target.value as BrokerType)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="ml-3">
                      <span className="block text-sm font-medium text-gray-900">
                        Single Broker for All Policies
                      </span>
                      <span className="block text-sm text-gray-500">
                        One broker handles all your insurance policies (GL, Auto, Umbrella, WC)
                      </span>
                    </div>
                  </label>
                  <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="brokerType"
                      value="PER_POLICY"
                      checked={brokerType === 'PER_POLICY'}
                      onChange={(e) => setBrokerType(e.target.value as BrokerType)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="ml-3">
                      <span className="block text-sm font-medium text-gray-900">
                        Different Brokers per Policy
                      </span>
                      <span className="block text-sm text-gray-500">
                        Each insurance policy has a different broker
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Global Broker Form */}
              {brokerType === 'GLOBAL' && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Broker Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Broker Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={brokerInfo.brokerName || ''}
                        onChange={(e) => updateBrokerInfo('brokerName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={brokerInfo.brokerCompany || ''}
                        onChange={(e) => updateBrokerInfo('brokerCompany', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="ABC Insurance Brokers"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={brokerInfo.brokerEmail || ''}
                        onChange={(e) => updateBrokerInfo('brokerEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="broker@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={brokerInfo.brokerPhone || ''}
                        onChange={(e) => updateBrokerInfo('brokerPhone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Per-Policy Broker Form */}
              {brokerType === 'PER_POLICY' && (
                <div className="border-t pt-6 space-y-6">
                  {/* General Liability Broker */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">General Liability (GL) Broker</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={brokerInfo.brokerGlName || ''}
                          onChange={(e) => updateBrokerInfo('brokerGlName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={brokerInfo.brokerGlEmail || ''}
                          onChange={(e) => updateBrokerInfo('brokerGlEmail', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={brokerInfo.brokerGlPhone || ''}
                          onChange={(e) => updateBrokerInfo('brokerGlPhone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Auto Liability Broker */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Auto Liability Broker</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={brokerInfo.brokerAutoName || ''}
                          onChange={(e) => updateBrokerInfo('brokerAutoName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={brokerInfo.brokerAutoEmail || ''}
                          onChange={(e) => updateBrokerInfo('brokerAutoEmail', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={brokerInfo.brokerAutoPhone || ''}
                          onChange={(e) => updateBrokerInfo('brokerAutoPhone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Umbrella Broker */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Umbrella Policy Broker</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={brokerInfo.brokerUmbrellaName || ''}
                          onChange={(e) => updateBrokerInfo('brokerUmbrellaName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={brokerInfo.brokerUmbrellaEmail || ''}
                          onChange={(e) => updateBrokerInfo('brokerUmbrellaEmail', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={brokerInfo.brokerUmbrellaPhone || ''}
                          onChange={(e) => updateBrokerInfo('brokerUmbrellaPhone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Workers Compensation Broker */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Workers Compensation (WC) Broker</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={brokerInfo.brokerWcName || ''}
                          onChange={(e) => updateBrokerInfo('brokerWcName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={brokerInfo.brokerWcEmail || ''}
                          onChange={(e) => updateBrokerInfo('brokerWcEmail', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={brokerInfo.brokerWcPhone || ''}
                          onChange={(e) => updateBrokerInfo('brokerWcPhone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      📧 Your broker(s) will automatically receive email notifications with login credentials and instructions to upload COI documents on your behalf.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Broker Information'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
