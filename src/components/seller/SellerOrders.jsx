import React, { useState, useEffect } from 'react';
import { FaEye, FaEdit, FaUser, FaShoppingCart, FaDollarSign } from 'react-icons/fa';
import { formatINR } from '../../utils/formatCurrency';
import { useSelector, useDispatch } from 'react-redux';
import { fetchOrders } from '../../redux/slices/orderSlice';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import axiosInstance from '../../api/axiosConfig';

const ORDER_STATUSES = [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
];

const SellerOrders = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [orderRefreshInterval, setOrderRefreshInterval] = useState(null);

  const dispatch = useDispatch();
  const { orders, loading: ordersLoading } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrders({ seller: true }));
    
    // Set up auto-refresh for orders every 30 seconds
    const interval = setInterval(() => {
      dispatch(fetchOrders({ seller: true }));
    }, 30000);
    
    setOrderRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [dispatch]);

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

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus);
    setShowOrderModal(true);
    setStatusError('');
  };

  const handleCloseOrderModal = () => {
    setSelectedOrder(null);
    setShowOrderModal(false);
    setStatusError('');
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;
    setStatusUpdating(true);
    setStatusError('');
    try {
      const res = await axiosInstance.put(`/orders/${selectedOrder._id}/status`, { status: newStatus });
      
      // Update local state
      setSelectedOrder({ ...selectedOrder, orderStatus: res.data.orderStatus });
      
      // Update the order in the Redux store
      const updatedOrders = orders.map(order => 
        order._id === selectedOrder._id ? { ...order, orderStatus: res.data.orderStatus } : order
      );
      
      // Update Redux state
      dispatch({ type: 'orders/fetchOrders/fulfilled', payload: { orders: updatedOrders } });
      
      // Show success message
      toast.success('Order status updated successfully!');
      
      // Refresh orders to ensure data consistency
      dispatch(fetchOrders({ seller: true }));
    } catch (err) {
      setStatusError(err.response?.data?.message || 'Failed to update status');
      toast.error('Failed to update order status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const getOrderStats = () => {
    const total = orders.length;
    const pending = orders.filter(o => o.orderStatus === 'pending').length;
    const confirmed = orders.filter(o => o.orderStatus === 'confirmed').length;
    const delivered = orders.filter(o => o.orderStatus === 'delivered').length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || o.total || 0), 0);

    return { total, pending, confirmed, delivered, totalRevenue };
  };

  const stats = getOrderStats();

  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Order Management</h2>
          <p className="text-gray-600 text-sm sm:text-base">Monitor and manage your customer orders</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="text-xs sm:text-sm text-gray-600">
            Auto-refresh: {orderRefreshInterval ? 'Enabled' : 'Disabled'}
          </div>
          <Button
            onClick={() => dispatch(fetchOrders({ seller: true }))}
            disabled={ordersLoading}
            className="text-xs sm:text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {ordersLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Stats Cards - Mobile Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-blue-50">
                <FaEye className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-yellow-50">
                <FaEye className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Confirmed</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-green-50">
                <FaEye className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">{formatINR(stats.totalRevenue)}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-purple-50">
                <FaEye className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-400 mb-2">No orders found</div>
            <div className="text-sm text-gray-500">Orders will appear here when customers place them</div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">All Orders ({orders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {orders.map((order, index) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  className="group"
                >
                  <Card className={`h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 ${
                    order.orderStatus === 'delivered' ? 'border-l-green-500' : 
                    order.orderStatus === 'confirmed' ? 'border-l-blue-500' : 
                    order.orderStatus === 'cancelled' ? 'border-l-red-500' : 'border-l-yellow-500'
                  }`}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                            #{order.orderNumber || order._id.slice(-8)}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(order.orderStatus)}>
                          {order.orderStatus}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-gray-100">
                            <FaUser className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {order.user?.firstName} {order.user?.lastName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{order.user?.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-gray-100">
                            <FaShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm text-gray-600">
                              {order.orderItems?.length || 0} item(s)
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {order.orderItems?.slice(0, 1).map(item => 
                                `${item.product?.name || item.name}`
                              ).join(', ')}
                              {order.orderItems?.length > 1 && ' +more'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-gray-100">
                            <FaDollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {formatINR(order.totalPrice || order.total)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <Button
                          onClick={() => handleViewOrder(order)}
                          className="w-full text-xs sm:text-sm"
                          size="sm"
                        >
                          <FaEye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Details Modal */}
      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Header */}
              <div className="border-b border-gray-200 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-mono ml-2 text-gray-900">#{selectedOrder.orderNumber || selectedOrder._id.slice(-8)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <span className="ml-2 text-gray-900">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <Badge className={`ml-2 ${getStatusColor(selectedOrder.orderStatus)}`}>
                      {selectedOrder.orderStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer & Shipping Info */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Name:</span>
                          <span className="ml-2 text-gray-900">
                            {selectedOrder.user?.firstName} {selectedOrder.user?.lastName}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Email:</span>
                          <span className="ml-2 text-gray-900">{selectedOrder.user?.email}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Phone:</span>
                          <span className="ml-2 text-gray-900">{selectedOrder.shippingAddress?.phone || 'Not provided'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Shipping Address</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-900">
                        {selectedOrder.shippingAddress?.firstName} {selectedOrder.shippingAddress?.lastName}<br />
                        {selectedOrder.shippingAddress?.street || selectedOrder.shippingAddress?.address}<br />
                        {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode || selectedOrder.shippingAddress?.pincode}<br />
                        {selectedOrder.shippingAddress?.country}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Method:</span>
                          <span className="ml-2 text-gray-900 capitalize">{selectedOrder.paymentMethod}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <Badge className={`ml-2 ${
                            selectedOrder.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedOrder.paymentStatus}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Items & Status Update */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-900">Update Order Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(selectedOrder.orderStatus)}>
                              {selectedOrder.orderStatus}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(selectedOrder.updatedAt || selectedOrder.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            disabled={statusUpdating}
                            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            <option value="">Select new status</option>
                            {ORDER_STATUSES.map(status => (
                              <option 
                                key={status} 
                                value={status} 
                                disabled={status === selectedOrder.orderStatus}
                                className={status === selectedOrder.orderStatus ? 'text-gray-400' : ''}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                {status === selectedOrder.orderStatus ? ' (Current)' : ''}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            Choose the new status for this order
                          </p>
                        </div>
                        
                        <Button
                          className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          onClick={handleStatusUpdate}
                          disabled={statusUpdating || !newStatus || newStatus === selectedOrder.orderStatus}
                        >
                          {statusUpdating ? (
                            <div className="flex items-center justify-center">
                              <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Updating...
                            </div>
                          ) : (
                            'Update Status'
                          )}
                        </Button>
                        
                        {statusError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {statusError}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Product</th>
                          <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Price</th>
                          <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Quantity</th>
                          <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.orderItems?.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <img 
                                  src={item.product?.images?.[0]?.url || item.image || '/product-images/default.webp'} 
                                  alt={item.product?.name || item.name} 
                                  className="w-12 h-12 object-cover rounded-lg border" 
                                />
                                <div>
                                  <div className="font-medium text-gray-900">{item.product?.name || item.name}</div>
                                  <div className="text-sm text-gray-500">SKU: {item.sku || 'N/A'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-gray-900">{formatINR(item.price)}</td>
                            <td className="py-4 px-4 text-gray-900">{item.quantity}</td>
                            <td className="py-4 px-4 font-medium text-gray-900">{formatINR(item.price * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Order Summary */}
                  <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center text-lg font-semibold text-gray-900">
                      <span>Total Amount:</span>
                      <span>{formatINR(selectedOrder.totalPrice || selectedOrder.total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerOrders;
