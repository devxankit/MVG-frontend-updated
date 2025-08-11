import React, { useState, useEffect } from 'react';
import { adminWalletAPI } from '../../api/walletAPI';
import { formatINR as formatCurrency } from '../../utils/formatCurrency';

const AdminWalletOverview = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const response = await adminWalletAPI.getOverview();
      setOverview(response.data.data);
    } catch (error) {
      console.error('Error fetching overview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!overview) {
    return <div className="text-center text-gray-500">Failed to load overview</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Wallet Overview</h2>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sellers</p>
              <p className="text-2xl font-bold text-gray-900">{overview.totalSellers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Withdrawals</p>
              <p className="text-2xl font-bold text-gray-900">{overview.totalWithdrawals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Withdrawals</p>
              <p className="text-2xl font-bold text-gray-900">{overview.pendingWithdrawals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Processed Withdrawals</p>
              <p className="text-2xl font-bold text-gray-900">{overview.processedWithdrawals}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Amount Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Withdrawal Amount</h3>
          <p className="text-3xl font-bold text-blue-600">
            {formatCurrency(overview.totalWithdrawalAmount)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Pending Amount</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {formatCurrency(overview.pendingAmount)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Approved Amount</h3>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(overview.approvedAmount)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Processed Amount</h3>
          <p className="text-3xl font-bold text-purple-600">
            {formatCurrency(overview.processedAmount)}
          </p>
        </div>
      </div>

      {/* Platform Earnings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Platform Earnings (Commission)</h3>
          <p className="text-3xl font-bold text-emerald-600">{formatCurrency(overview.platformEarnings || 0)}</p>
          <p className="text-sm text-gray-500 mt-1">Gross Sales: {formatCurrency(overview.grossSales || 0)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Platform Earnings</h3>
          <div className="w-full h-56">
            <Sparkline data={(overview.monthly || []).map(m => m.commission)} labels={(overview.monthly || []).map(m => `${m._id.m}/${m._id.y}`)} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => window.location.href = '/admin/wallet/withdrawals'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Manage Withdrawals
          </button>
          <button
            onClick={() => window.location.href = '/admin/wallet/sellers'}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            View Seller Earnings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminWalletOverview;

// Simple sparkline using inline SVG (no heavy deps)
const Sparkline = ({ data = [], labels = [] }) => {
  if (!data.length) return <div className="text-gray-400">No data</div>;
  const width = 600;
  const height = 180;
  const padding = 24;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const xStep = (width - padding * 2) / Math.max(data.length - 1, 1);
  const yScale = v => {
    if (max === min) return height / 2;
    return padding + (height - padding * 2) * (1 - (v - min) / (max - min));
  };
  const points = data.map((v, i) => `${padding + i * xStep},${yScale(v)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <polyline fill="none" stroke="#10B981" strokeWidth="3" points={points} />
      {data.map((v, i) => (
        <circle key={i} cx={padding + i * xStep} cy={yScale(v)} r="3" fill="#10B981" />
      ))}
      {/* X labels */}
      {labels.map((l, i) => (
        <text key={i} x={padding + i * xStep} y={height - 4} fontSize="10" textAnchor="middle" fill="#6B7280">{l}</text>
      ))}
    </svg>
  );
};
