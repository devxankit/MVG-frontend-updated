import React, { useMemo } from 'react';
import { FaDollarSign, FaBox, FaUsers, FaChartLine } from 'react-icons/fa';
import { formatINR } from '../../utils/formatCurrency';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';

const SellerOverview = ({ stats, orders, products }) => {
  // Charts Data (Seller Overview)
  const lastSixMonths = useMemo(() => {
    const result = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString(undefined, { month: 'short' }),
        year: d.getFullYear(),
        month: d.getMonth(),
      });
    }
    return result;
  }, []);

  const revenueSeries = useMemo(() => {
    const buckets = lastSixMonths.reduce((acc, m) => ({ ...acc, [m.key]: 0 }), {});
    (orders || []).forEach((o) => {
      const created = new Date(o.createdAt);
      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
      if (key in buckets) {
        const total = typeof o.totalPrice === 'number' ? o.totalPrice : (o.total || 0);
        buckets[key] += total;
      }
    });
    return lastSixMonths.map((m) => buckets[m.key]);
  }, [orders, lastSixMonths]);

  const orderStatusData = useMemo(() => {
    const count = {};
    (orders || []).forEach((o) => {
      const st = (o.orderStatus || o.status || 'pending').toLowerCase();
      count[st] = (count[st] || 0) + 1;
    });
    const entries = Object.entries(count);
    return entries.map(([label, value], id) => ({ id, value, label }));
  }, [orders]);

  const topProductsData = useMemo(() => {
    // Prefer product.soldCount; fallback to order aggregation
    const soldMap = new Map();
    (products || []).forEach((p) => {
      const sold = typeof p.soldCount === 'number' ? p.soldCount : 0;
      soldMap.set(p.name, sold);
    });
    if ([...soldMap.values()].every((v) => v === 0)) {
      (orders || []).forEach((o) => {
        (o.orderItems || []).forEach((it) => {
          const name = it.product?.name || it.name || 'Item';
          const qty = Number(it.quantity) || 0;
          soldMap.set(name, (soldMap.get(name) || 0) + qty);
        });
      });
    }
    const list = [...soldMap.entries()].map(([name, qty]) => ({ name, qty }));
    list.sort((a, b) => b.qty - a.qty);
    const top = list.slice(0, 5);
    return {
      labels: top.map((t) => t.name),
      data: top.map((t) => t.qty),
    };
  }, [products, orders]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'confirmed':
        return 'text-blue-600 bg-blue-100';
      case 'processing':
        return 'text-purple-600 bg-purple-100';
      case 'shipped':
        return 'text-indigo-600 bg-indigo-100';
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'refunded':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <FaDollarSign className="text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatINR(stats.totalSales || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <FaBox className="text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalOrders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <FaChartLine className="text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Products</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalProducts || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                <FaUsers className="text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Customers</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalCustomers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend (Last 6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <LineChart
                height={260}
                series={[{ data: revenueSeries, label: 'Revenue' }]}
                xAxis={[{ scaleType: 'point', data: lastSixMonths.map((m) => m.label) }]}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full flex justify-center">
              <PieChart
                height={260}
                series={[{
                  data: orderStatusData,
                  valueFormatter: (item) => `${item.value}`,
                  innerRadius: 40,
                }]}
                slotProps={{ legend: { hidden: false } }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products by Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <BarChart
              height={300}
              xAxis={[{ scaleType: 'band', data: topProductsData.labels }]}
              series={[{ data: topProductsData.data, label: 'Units Sold' }]}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(orders || []).slice(0, 3).map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">#{order.orderNumber || String(order._id).slice(-8)}</p>
                    <p className="text-sm text-gray-600">{order.user?.firstName} {order.user?.lastName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{formatINR(order.totalPrice || order.total || 0)}</p>
                    <Badge className={getStatusColor(order.orderStatus)}>
                      {order.orderStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(products || []).slice(0, 3).map((product) => (
                <div key={product._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <img
                      src={product.images?.[0]?.url || '/product-images/default.webp'}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-800">{product.name}</p>
                      <p className="text-sm text-gray-600">Sold: {product.soldCount || 0}</p>
                    </div>
                  </div>
                  <span className="font-bold text-blue-600">{formatINR(product.price)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerOverview;
