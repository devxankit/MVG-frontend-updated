import axiosInstance from './axiosConfig.jsx';

const orderAPI = {
  // Create new order
  createOrder: (orderData) => {
    return axiosInstance.post('/orders', orderData);
  },

  // Razorpay - get public key
  getRazorpayKey: () => {
    return axiosInstance.get('/orders/payments/razorpay/key');
  },

  // Razorpay - create payment order
  createRazorpayOrder: (payload) => {
    return axiosInstance.post('/orders/payments/razorpay/order', payload);
  },

  // Razorpay - verify signature
  verifyRazorpayPayment: (payload) => {
    return axiosInstance.post('/orders/payments/razorpay/verify', payload);
  },

  // Razorpay - capture and attach to orders
  captureRazorpayPayment: (payload) => {
    return axiosInstance.post('/orders/payments/razorpay/capture', payload);
  },

  // Get user orders
  getOrders: (params = {}) => {
    return axiosInstance.get('/orders', { params });
  },

  // Get order by ID
  getOrderById: (id) => {
    return axiosInstance.get(`/orders/${id}`);
  },

  // Update order status
  updateOrderStatus: (id, status) => {
    return axiosInstance.put(`/orders/${id}/status`, { status });
  },

  // Cancel order
  cancelOrder: (id, reason) => {
    return axiosInstance.put(`/orders/${id}/cancel`, { reason });
  },

  // Get cart
  getCart: () => {
    return axiosInstance.get('/users/cart');
  },

  // Add to cart
  addToCart: (productData) => {
    return axiosInstance.post('/users/cart', productData);
  },

  // Remove from cart
  removeFromCart: (productId) => {
    return axiosInstance.delete(`/users/cart/${productId}`);
  },

  // Update cart item quantity
  updateCartQuantity: (productId, quantity) => {
    return axiosInstance.put(`/users/cart/${productId}`, { quantity });
  },

  // Get wishlist
  getWishlist: () => {
    return axiosInstance.get('/users/wishlist');
  },

  // Add to wishlist
  addToWishlist: (productId) => {
    return axiosInstance.post(`/users/wishlist/${productId}`);
  },

  // Remove from wishlist
  removeFromWishlist: (productId) => {
    return axiosInstance.delete(`/users/wishlist/${productId}`);
  },
};

export default orderAPI; 