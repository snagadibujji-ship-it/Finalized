'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowUpRight, ShoppingBag, Users } from 'lucide-react';

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token') || 'mock_admin_token';
        const res = await axios.get('http://localhost:4000/api/admin/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data.analytics);
      } catch (error) {
        console.error('Failed to fetch analytics', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading || !stats) {
    return <div className="p-8 text-center text-gray-500">Loading metrics...</div>;
  }

  // Convert Phase 2 Paise standard to UI Rupees
  const totalRevenueRupees = (stats.totalRevenuePaise / 100).toFixed(2);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Platform Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">₹{totalRevenueRupees}</p>
          </div>
          <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
            <ArrowUpRight size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Orders Today</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrdersToday}</p>
          </div>
          <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
            <ShoppingBag size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Active Top Vendors</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.topVendors?.length || 0}</p>
          </div>
          <div className="h-12 w-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
            <Users size={24} />
          </div>
        </div>

      </div>

      {/* Top Vendors Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Top Performing Vendors</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">GMV (Sales)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stats.topVendors.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No data available</td></tr>
            ) : (
              stats.topVendors.map((vendor: any, idx: number) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vendor.shopName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vendor.orderCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                    ₹{(vendor.totalSalesPaise / 100).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
