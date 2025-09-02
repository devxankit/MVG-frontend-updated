import React, { useState, useEffect } from 'react';
import { FaEye, FaSearch, FaDownload, FaShoppingCart, FaUser, FaCalendarAlt, FaCreditCard, FaMapMarkerAlt, FaDollarSign } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { formatINR } from '../../utils/formatCurrency';
import axiosInstance from '../../api/axiosConfig';
import { toast } from 'react-toastify';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderModal, setOrderModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/orders');
      setOrders(res.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setOrderModal(true);
  };

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

  const filteredOrders = orders.filter(order =>
    order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderStatus?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getOrderStats = () => {
    const total = orders.length;
    const completed = orders.filter(o => o.orderStatus === 'Completed').length;
    const processing = orders.filter(o => o.orderStatus === 'Processing').length;
    const cancelled = orders.filter(o => o.orderStatus === 'Cancelled').length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || o.total || 0), 0);

    return { total, completed, processing, cancelled, totalRevenue };
  };

  const stats = getOrderStats();

  if (loading) {
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
          <p className="text-gray-600 text-sm sm:text-base">Monitor and manage all customer orders</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="text-xs sm:text-sm">
            <FaDownload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Export Orders
          </Button>
          <Button onClick={fetchOrders} className="text-xs sm:text-sm">
            Refresh
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
                <p className="text-xs sm:text-sm font-medium text-gray-600">Completed</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.completed}</p>
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
                <p className="text-xs sm:text-sm font-medium text-gray-600">Processing</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.processing}</p>
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

      {/* Search - Mobile Responsive */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search orders by order number, customer name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Cards - Responsive Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">All Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <AnimatePresence>
                {filteredOrders.map((order, index) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className="group"
                  >
                    <Card className={`h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 ${
                      order.orderStatus === 'Completed' ? 'border-l-green-500' : 
                      order.orderStatus === 'Processing' ? 'border-l-blue-500' : 
                      order.orderStatus === 'Cancelled' ? 'border-l-red-500' : 'border-l-yellow-500'
                    }`}>
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={order.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'Customer')}&background=3b82f6&color=fff`} />
                              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                                {order.user?.firstName?.charAt(0)?.toUpperCase() || 'C'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                                #{order.orderNumber || order._id.slice(-8)}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-500 truncate">
                                {order.user?.firstName} {order.user?.lastName}
                              </p>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(order.orderStatus)} text-xs`}>
                            {order.orderStatus}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <FaUser className="w-3 h-3 mr-2 text-gray-400" />
                            <span className="truncate">{order.user?.email}</span>
                          </div>
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <FaShoppingCart className="w-3 h-3 mr-2 text-gray-400" />
                            <span>{order.orderItems?.length || 0} item(s)</span>
                          </div>
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <FaDollarSign className="w-3 h-3 mr-2 text-gray-400" />
                            <span className="font-semibold text-green-600">
                              {formatINR(order.totalPrice || order.total)}
                            </span>
                          </div>
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <FaCalendarAlt className="w-3 h-3 mr-2 text-gray-400" />
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                          {order.paymentMethod && (
                            <div className="flex items-center text-xs sm:text-sm text-gray-600">
                              <FaCreditCard className="w-3 h-3 mr-2 text-gray-400" />
                              <span>{order.paymentMethod}</span>
                            </div>
                          )}
                        </div>

                        {/* Order Items Preview */}
                        {order.orderItems && order.orderItems.length > 0 && (
                          <div className="mb-4 p-2 bg-gray-50 rounded text-xs">
                            <div className="font-medium text-gray-700 mb-1">Items:</div>
                            <div className="space-y-1">
                              {order.orderItems.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="text-gray-600 truncate">
                                  {item.product?.name || item.name} (x{item.quantity})
                                </div>
                              ))}
                              {order.orderItems.length > 2 && (
                                <div className="text-gray-500">
                                  +{order.orderItems.length - 2} more items
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewOrder(order)}
                                className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600"
                              >
                                <FaEye className="w-3 h-3 mr-1" />
                                View Details
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Order Details</p>
                            </TooltipContent>
                          </Tooltip>
                          <div className="text-xs text-gray-400 ml-2">
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Dialog open={orderModal} onOpenChange={setOrderModal}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Order Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Order #:</span> {selectedOrder.orderNumber || selectedOrder._id}</div>
                    <div><span className="font-medium">Date:</span> {new Date(selectedOrder.createdAt).toLocaleString()}</div>
                    <div><span className="font-medium">Status:</span> 
                      <Badge className={`ml-2 ${getStatusColor(selectedOrder.orderStatus)}`}>
                        {selectedOrder.orderStatus}
                      </Badge>
                    </div>
                    <div><span className="font-medium">Payment Method:</span> {selectedOrder.paymentMethod}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedOrder.user?.firstName} {selectedOrder.user?.lastName}</div>
                    <div><span className="font-medium">Email:</span> {selectedOrder.user?.email}</div>
                    <div><span className="font-medium">Phone:</span> {selectedOrder.user?.phone || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Shipping Address</h4>
                <div className="text-sm text-gray-600">
                  {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}, {selectedOrder.shippingAddress?.zipCode}, {selectedOrder.shippingAddress?.country}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Order Items</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Image</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Name</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Price</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Qty</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.orderItems?.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-2 px-2">
                            <img 
                              src={item.product?.images?.[0]?.url || item.image || '/product-images/default.webp'} 
                              alt={item.product?.name || item.name} 
                              className="w-12 h-12 object-cover rounded border"
                            />
                          </td>
                          <td className="py-2 px-2 font-medium">{item.product?.name || item.name}</td>
                          <td className="py-2 px-2">{formatINR(item.price)}</td>
                          <td className="py-2 px-2">{item.quantity}</td>
                          <td className="py-2 px-2 font-medium">{formatINR(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total */}
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  Total: {formatINR(selectedOrder.totalPrice || selectedOrder.total)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
