import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import * as Tabs from '@radix-ui/react-tabs';
import * as Dialog from '@radix-ui/react-dialog';
import * as Progress from '@radix-ui/react-progress';
import { 
  FaArrowLeft, 
  FaTruck, 
  FaCreditCard, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaEnvelope,
  FaDownload,
  FaRedo,
  FaTimes,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaBox,
  FaShippingFast,
  FaHome,
  FaCalendarAlt,
  FaReceipt,
  FaQuestionCircle
} from 'react-icons/fa';
import { formatINR } from '../utils/formatCurrency';
import orderAPI from '../api/orderAPI';
import { toast } from 'react-toastify';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [reorderLoading, setReorderLoading] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await orderAPI.getOrderById(orderId);
        setOrder(response.data);
      } catch (err) {
        setError('Failed to fetch order details');
        toast.error('Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      processing: 'bg-purple-100 text-purple-800 border-purple-200',
      shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      refunded: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPaymentStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getShippingStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      shipped: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getOrderProgress = (status) => {
    const progressMap = {
      pending: 20,
      confirmed: 40,
      processing: 60,
      shipped: 80,
      delivered: 100,
      cancelled: 0,
      refunded: 0
    };
    return progressMap[status] || 0;
  };

  const getTimelineSteps = (order) => {
    const steps = [
      {
        id: 'order-placed',
        title: 'Order Placed',
        description: 'Your order has been placed successfully',
        date: order?.createdAt,
        completed: true,
        icon: FaCheckCircle
      },
      {
        id: 'confirmed',
        title: 'Order Confirmed',
        description: 'Your order has been confirmed by the seller',
        date: order?.orderStatus === 'confirmed' ? order?.updatedAt : null,
        completed: ['confirmed', 'processing', 'shipped', 'delivered'].includes(order?.orderStatus),
        icon: FaCheckCircle
      },
      {
        id: 'processing',
        title: 'Processing',
        description: 'Your order is being prepared for shipment',
        date: order?.orderStatus === 'processing' ? order?.updatedAt : null,
        completed: ['processing', 'shipped', 'delivered'].includes(order?.orderStatus),
        icon: FaBox
      },
      {
        id: 'shipped',
        title: 'Shipped',
        description: 'Your order has been shipped and is on its way',
        date: order?.orderStatus === 'shipped' ? order?.updatedAt : null,
        completed: ['shipped', 'delivered'].includes(order?.orderStatus),
        icon: FaShippingFast
      },
      {
        id: 'delivered',
        title: 'Delivered',
        description: 'Your order has been delivered successfully',
        date: order?.deliveredAt || (order?.orderStatus === 'delivered' ? order?.updatedAt : null),
        completed: order?.orderStatus === 'delivered',
        icon: FaHome
      }
    ];

    if (order?.orderStatus === 'cancelled') {
      steps.push({
        id: 'cancelled',
        title: 'Cancelled',
        description: order?.cancellationReason || 'Order has been cancelled',
        date: order?.cancelledAt || order?.updatedAt,
        completed: true,
        icon: FaTimes
      });
    }

    return steps;
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    try {
      setCancelLoading(true);
      await orderAPI.cancelOrder(orderId, cancelReason);
      setOrder(prev => ({ ...prev, orderStatus: 'cancelled', cancellationReason: cancelReason }));
      setShowCancelDialog(false);
      setCancelReason('');
      toast.success('Order cancelled successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReorder = async () => {
    try {
      setReorderLoading(true);
      // Add items to cart
      for (const item of order.orderItems) {
        await orderAPI.addToCart({
          productId: item.product._id,
          quantity: item.quantity,
          selectedVariants: item.selectedVariants
        });
      }
      toast.success('Items added to cart successfully');
      navigate('/cart');
    } catch (err) {
      toast.error('Failed to reorder items');
    } finally {
      setReorderLoading(false);
    }
  };

  const canCancelOrder = () => {
    return ['pending', 'confirmed', 'processing'].includes(order?.orderStatus);
  };

  const canReorder = () => {
    return order?.orderStatus === 'delivered' || order?.orderStatus === 'cancelled';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The order you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/profile')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  const timelineSteps = getTimelineSteps(order);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/profile')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
                <p className="text-gray-600">Order #{order.orderNumber}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {canCancelOrder() && (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Cancel Order
                </button>
              )}
              {canReorder() && (
                <button
                  onClick={handleReorder}
                  disabled={reorderLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                >
                  <FaRedo className="h-4 w-4" />
                  <span>{reorderLoading ? 'Adding...' : 'Reorder'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Status Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Order Status</h2>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.orderStatus)}`}>
                {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
              </span>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Order Progress</span>
              <span>{getOrderProgress(order.orderStatus)}%</span>
            </div>
            <Progress.Root className="relative overflow-hidden bg-gray-200 rounded-full w-full h-2">
              <Progress.Indicator
                className="w-full h-full bg-blue-600 transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${100 - getOrderProgress(order.orderStatus)}%)` }}
              />
            </Progress.Root>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{formatINR(order.totalPrice)}</div>
              <div className="text-sm text-gray-600">Total Amount</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{order.orderItems.length}</div>
              <div className="text-sm text-gray-600">Items</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {order.trackingNumber ? 'Yes' : 'No'}
              </div>
              <div className="text-sm text-gray-600">Tracking Available</div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs.Root defaultValue="overview" className="space-y-6">
          <Tabs.List className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <Tabs.Trigger
              value="overview"
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-md transition-all"
            >
              Overview
            </Tabs.Trigger>
            <Tabs.Trigger
              value="tracking"
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-md transition-all"
            >
              Tracking
            </Tabs.Trigger>
            <Tabs.Trigger
              value="payment"
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-md transition-all"
            >
              Payment
            </Tabs.Trigger>
            <Tabs.Trigger
              value="items"
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-md transition-all"
            >
              Items
            </Tabs.Trigger>
          </Tabs.List>

          {/* Overview Tab */}
          <Tabs.Content value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaReceipt className="h-5 w-5 mr-2 text-blue-600" />
                  Order Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-medium">{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getShippingStatusColor(order.shippingStatus)}`}>
                      {order.shippingStatus.charAt(0).toUpperCase() + order.shippingStatus.slice(1)}
                    </span>
                  </div>
                  {order.trackingNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tracking Number:</span>
                      <span className="font-medium font-mono">{order.trackingNumber}</span>
                    </div>
                  )}
                  {order.estimatedDelivery && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated Delivery:</span>
                      <span className="font-medium">{new Date(order.estimatedDelivery).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaMapMarkerAlt className="h-5 w-5 mr-2 text-blue-600" />
                  Shipping Address
                </h3>
                <div className="space-y-2">
                  <p className="font-medium">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  <p className="text-gray-600">{order.shippingAddress.street}</p>
                  <p className="text-gray-600">
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </p>
                  <p className="text-gray-600">{order.shippingAddress.country}</p>
                  {order.shippingAddress.phone && (
                    <p className="text-gray-600 flex items-center">
                      <FaPhone className="h-4 w-4 mr-2" />
                      {order.shippingAddress.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Tabs.Content>

          {/* Tracking Tab */}
          <Tabs.Content value="tracking" className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <FaTruck className="h-5 w-5 mr-2 text-blue-600" />
                Order Tracking
              </h3>
              
              <div className="space-y-6">
                {timelineSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isLast = index === timelineSteps.length - 1;
                  
                  return (
                    <div key={step.id} className="relative flex items-start">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          step.completed 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-medium ${
                            step.completed ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {step.title}
                          </h4>
                          {step.date && (
                            <span className="text-xs text-gray-500">
                              {new Date(step.date).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${
                          step.completed ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {step.description}
                        </p>
                      </div>
                      {!isLast && (
                        <div className={`absolute left-5 top-10 w-0.5 h-6 ${
                          step.completed ? 'bg-blue-600' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {order.trackingUrl && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Track Your Package</h4>
                      <p className="text-sm text-blue-700">Click the link below to track your package with the carrier</p>
                    </div>
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Track Package
                    </a>
                  </div>
                </div>
              )}
            </div>
          </Tabs.Content>

          {/* Payment Tab */}
          <Tabs.Content value="payment" className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <FaCreditCard className="h-5 w-5 mr-2 text-blue-600" />
                Payment Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Payment Details</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium capitalize">{order.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </span>
                    </div>
                    {order.paymentResult?.id && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transaction ID:</span>
                        <span className="font-medium font-mono text-sm">{order.paymentResult.id}</span>
                      </div>
                    )}
                    {order.paymentResult?.email_address && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Email:</span>
                        <span className="font-medium">{order.paymentResult.email_address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Order Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items Price:</span>
                      <span className="font-medium">{formatINR(order.itemsPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-medium">{formatINR(order.shippingPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium">{formatINR(order.taxPrice)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span className="font-medium">-{formatINR(order.discount)}</span>
                      </div>
                    )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total:</span>
                        <span>{formatINR(order.totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {order.paymentStatus === 'paid' && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <FaCheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium">Payment Successful</span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    Your payment has been processed successfully. You will receive a confirmation email shortly.
                  </p>
                </div>
              )}
            </div>
          </Tabs.Content>

          {/* Items Tab */}
          <Tabs.Content value="items" className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Items</h3>
              
              <div className="space-y-4">
                {order.orderItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <img
                      src={item.image || '/product-images/default.webp'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      {item.selectedVariants && (
                        <div className="text-sm text-gray-600 mt-1">
                          {item.selectedVariants.size && (
                            <span className="mr-4">Size: {item.selectedVariants.size}</span>
                          )}
                          {item.selectedVariants.color && (
                            <span>Color: {item.selectedVariants.color}</span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-600">Quantity: {item.quantity}</span>
                        <span className="font-medium">{formatINR(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>

      {/* Cancel Order Dialog */}
      <Dialog.Root open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              Cancel Order
            </Dialog.Title>
            <Dialog.Description className="text-gray-600 mb-4">
              Please provide a reason for cancelling this order. This action cannot be undone.
            </Dialog.Description>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Cancellation
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please explain why you want to cancel this order..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCancelDialog(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelLoading || !cancelReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {cancelLoading ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default OrderDetails;
