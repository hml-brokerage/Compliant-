'use client';

import { User } from '@compliant/shared';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { FilterBar } from '../../../components';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

interface DashboardItem {
  id: string;
  name: string;
  type: 'gc' | 'project' | 'coi' | 'compliance';
  status: string;
  date: string;
  description: string;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Mock data for dashboard items - would come from API in real implementation
  const mockItems: DashboardItem[] = [
    {
      id: '1',
      name: 'ABC Construction',
      type: 'gc',
      status: 'active',
      date: '2026-01-15',
      description: 'General Contractor with 5 active projects'
    },
    {
      id: '2',
      name: 'Downtown Office Build',
      type: 'project',
      status: 'active',
      date: '2026-01-10',
      description: 'Commercial construction project'
    },
    {
      id: '3',
      name: 'Smith Electrical COI',
      type: 'coi',
      status: 'pending',
      date: '2026-01-18',
      description: 'COI awaiting review for approval'
    },
    {
      id: '4',
      name: 'Johnson Plumbing',
      type: 'compliance',
      status: 'expiring',
      date: '2026-01-25',
      description: 'Insurance expiring in 7 days'
    },
    {
      id: '5',
      name: 'Riverside Mall Project',
      type: 'project',
      status: 'active',
      date: '2026-01-12',
      description: 'Retail construction project'
    },
    {
      id: '6',
      name: 'XYZ Contractors',
      type: 'gc',
      status: 'active',
      date: '2026-01-08',
      description: 'General Contractor with 3 active projects'
    },
  ];

  const filteredItems = mockItems.filter((item) => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch = searchTerm === '' ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filterOptions = [
    { value: 'all', label: 'All Items', count: mockItems.length },
    { value: 'gc', label: 'General Contractors', count: mockItems.filter(i => i.type === 'gc').length },
    { value: 'project', label: 'Projects', count: mockItems.filter(i => i.type === 'project').length },
    { value: 'coi', label: 'COI Reviews', count: mockItems.filter(i => i.type === 'coi').length },
    { value: 'compliance', label: 'Compliance', count: mockItems.filter(i => i.type === 'compliance').length },
  ];

  const getTypeIcon = (type: string) => {
    const icons = {
      gc: '🏢',
      project: '🏗️',
      coi: '📄',
      compliance: '⚠️',
    };
    return icons[type as keyof typeof icons] || '📋';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-orange-100 text-orange-800',
      expiring: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Compliant Platform</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-white px-2 py-1 bg-gray-700 rounded">
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
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h2>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  As an admin, you manage General Contractors (GCs), create projects, and review/approve COI documents submitted by brokers.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">General Contractors</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">12</p>
              <p className="text-sm text-gray-500 mt-1">Active GCs</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Active Projects</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">8</p>
              <p className="text-sm text-gray-500 mt-1">Ongoing jobs</p>
            </div>
            <button
              onClick={() => router.push('/admin/coi-reviews')}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer text-left"
            >
              <h3 className="text-lg font-semibold text-gray-700">Pending COI Reviews</h3>
              <p className="text-3xl font-bold text-orange-600 mt-2">5</p>
              <p className="text-sm text-gray-500 mt-1">Awaiting approval</p>
              <p className="text-xs text-blue-600 mt-2 hover:underline">Click to view all →</p>
            </button>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700">Compliance Rate</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">87%</p>
              <p className="text-sm text-gray-500 mt-1">Overall</p>
            </div>
          </div>

          {/* Filter Bar for Recent Activity */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h3>
            <FilterBar
              options={filterOptions}
              selectedValue={filter}
              onFilterChange={setFilter}
              searchEnabled={true}
              searchPlaceholder="Search items..."
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </div>

          {/* Recent Activity List */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6">
              <div className="space-y-4">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No items found matching your filters</p>
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{getTypeIcon(item.type)}</span>
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(item.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/admin/programs"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
              >
                <h4 className="font-semibold text-gray-900">Programs</h4>
                <p className="text-sm text-gray-600 mt-1">Create and manage insurance programs</p>
              </Link>
              <Link
                href="/admin/general-contractors"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
              >
                <h4 className="font-semibold text-gray-900">General Contractors</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Add and manage General Contractors (GCs)
                </p>
              </Link>
              <Link
                href="/admin/projects"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
              >
                <h4 className="font-semibold text-gray-900">Projects</h4>
                <p className="text-sm text-gray-600 mt-1">Create and manage construction projects</p>
              </Link>
              <Link
                href="/admin/coi-reviews"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
              >
                <h4 className="font-semibold text-gray-900">COI Reviews</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Review and approve insurance documents submitted by brokers
                </p>
              </Link>
              <Link
                href="/admin/reports"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
              >
                <h4 className="font-semibold text-gray-900">Reports</h4>
                <p className="text-sm text-gray-600 mt-1">Generate compliance and activity reports</p>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
