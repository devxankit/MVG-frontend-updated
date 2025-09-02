import React, { useState, useEffect, useMemo } from 'react';
import { FaUsers, FaDollarSign, FaChartLine, FaStore, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { formatINR } from '../../utils/formatCurrency';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import axiosInstance from '../../api/axiosConfig';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';

const AdminOverview = ({ stats }) => {
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, vendorsRes] = await Promise.all([
        axiosInstance.get('/admin/orders'),
        axiosInstance.get('/admin/vendors')
      ]);
      setOrders(ordersRes.data || []);
      setVendors(vendorsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Charts Data
  const recentMonths = useMemo(() => {
    const res = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      res.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString(undefined, { month: 'short' }),
      });
    }
    return res;
  }, []);

  const revenueByMonth = useMemo(() => {
    const buckets = recentMonths.reduce((acc, m) => ({ ...acc, [m.key]: 0 }), {});
    (orders || []).forEach((o) => {
      const created = new Date(o.createdAt);
      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
      if (key in buckets) {
        const total = typeof o.totalPrice === 'number' ? o.totalPrice : (o.total || 0);
        buckets[key] += total;
      }
    });
    return recentMonths.map((m) => buckets[m.key]);
  }, [orders, recentMonths]);

  const ordersByStatus = useMemo(() => {
    const map = {};
    (orders || []).forEach((o) => {
      const st = (o.orderStatus || o.status || 'pending').toLowerCase();
      map[st] = (map[st] || 0) + 1;
    });
    return Object.entries(map).map(([label, value], id) => ({ id, label, value }));
  }, [orders]);

  const topCategories = useMemo(() => {
    const count = new Map();
    (orders || []).forEach((o) => {
      (o.orderItems || []).forEach((it) => {
        const cat = it.product?.category?.name || it.product?.category || 'Other';
        count.set(cat, (count.get(cat) || 0) + (Number(it.quantity) || 0));
      });
    });
    const list = [...count.entries()].map(([name, qty]) => ({ name, qty }));
    list.sort((a, b) => b.qty - a.qty);
    const top = list.slice(0, 5);
    return { labels: top.map((t) => t.name), data: top.map((t) => t.qty) };
  }, [orders]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers?.toLocaleString() || '0',
      icon: FaUsers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Total Vendors',
      value: stats.totalVendors?.toLocaleString() || '0',
      icon: FaStore,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: '+8%',
      trendUp: true
    },
    {
      title: 'Total Sales',
      value: formatINR(stats.totalSales || 0),
      icon: FaDollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: '+15%',
      trendUp: true
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders?.toLocaleString() || '0',
      icon: FaChartLine,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: '+5%',
      trendUp: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards - Mobile Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className={`text-lg sm:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <div className="flex items-center mt-1">
                      {stat.trendUp ? (
                        <FaArrowUp className="w-3 h-3 text-green-500 mr-1" />
                      ) : (
                        <FaArrowDown className="w-3 h-3 text-red-500 mr-1" />
                      )}
                      <span className="text-xs text-gray-500">{stat.trend}</span>
                    </div>
                  </div>
                  <div className={`p-2 sm:p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section - Mobile Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-80">
              <LineChart
                xAxis={[{ data: recentMonths.map(m => m.label), scaleType: 'band' }]}
                series={[
                  {
                    data: revenueByMonth,
                    label: 'Revenue',
                    color: '#10B981'
                  }
                ]}
                height={300}
              />
            </div>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-80">
              <BarChart
                xAxis={[{ data: ordersByStatus.map(o => o.label), scaleType: 'band' }]}
                series={[
                  {
                    data: ordersByStatus.map(o => o.value),
                    label: 'Orders',
                    color: '#3B82F6'
                  }
                ]}
                height={300}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders - Mobile Responsive */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 text-xs sm:text-sm">Order #</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 text-xs sm:text-sm">Customer</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 text-xs sm:text-sm">Amount</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 text-xs sm:text-sm">Status</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 text-xs sm:text-sm hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => (
                  <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 sm:px-4">
                      <span className="font-medium text-gray-900 text-xs sm:text-sm">{order.orderNumber}</span>
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <div>
                        <div className="font-medium text-gray-900 text-xs sm:text-sm">
                          {order.user?.firstName} {order.user?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{order.user?.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-4 font-medium text-gray-800 text-xs sm:text-sm">
                      {formatINR(order.totalPrice || order.total || 0)}
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <Badge className={getStatusColor(order.orderStatus || order.status)}>
                        {order.orderStatus || order.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-gray-600 text-xs sm:text-sm hidden sm:table-cell">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Categories - Mobile Responsive */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Top Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 sm:h-80">
            <BarChart
              xAxis={[{ data: topCategories.labels, scaleType: 'band' }]}
              series={[
                {
                  data: topCategories.data,
                  label: 'Products Sold',
                  color: '#8B5CF6'
                }
              ]}
              height={300}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;
