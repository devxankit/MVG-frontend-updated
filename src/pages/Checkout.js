import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaLock, FaCreditCard, FaPaypal, FaApplePay, FaGooglePay, FaMoneyBillWave } from 'react-icons/fa';
import { formatINR } from '../utils/formatCurrency';
import { useSelector, useDispatch } from 'react-redux';
import { createOrder } from '../redux/slices/orderSlice';
import { fetchCart, clearCart } from '../redux/slices/cartSlice';
import { toast } from 'react-toastify';
import orderAPI from '../api/orderAPI';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Puducherry', 'Chandigarh', 'Andaman and Nicobar Islands', 'Lakshadweep', 'Dadra and Nagar Haveli and Daman and Diu'
];

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: cartItems, total, loading: cartLoading } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const { loading: orderLoading } = useSelector((state) => state.orders);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
    country: 'India',
  });
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [coupon, setCoupon] = useState('');
  const [couponStatus, setCouponStatus] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    setCardData(prev => ({ ...prev, [name]: value }));
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate cart
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Check for products without seller information
    const productsWithoutSellerInfo = cartItems.filter(item => !item.seller || !item.sellerProduct);
    if (productsWithoutSellerInfo.length > 0) {
      const productNames = productsWithoutSellerInfo.map(item => item.product?.name || 'Unknown Product').join(', ');
      toast.error(`Some products in your cart are not available for purchase: ${productNames}. Please remove them to continue.`);
      return;
    }

    // Validate form data
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || 
        !formData.address || !formData.city || !formData.state || !formData.pincode) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate payment method
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    // Validate card data for credit card payments
    if (paymentMethod === 'credit-card') {
      if (!cardData.cardholderName || !cardData.cardNumber || !cardData.expiryDate || !cardData.cvv) {
        toast.error('Please fill in all card details');
        return;
      }
    }

    // Debug cart items
    console.log('Cart items:', cartItems);
    console.log('Cart total:', total);
    
    // Debug seller information
    cartItems.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, {
        productName: item.product?.name,
        productId: item.product?._id,
        seller: item.seller,
        sellerId: item.seller?._id,
        sellerProduct: item.sellerProduct,
        quantity: item.quantity
      });
    });
    
    const orderData = {
      shippingAddress: {
        type: 'home',
        street: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.pincode,
        country: formData.country,
        phone: formData.phone,
        firstName: formData.firstName,
        lastName: formData.lastName,
      },
      items: cartItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        seller: typeof item.seller === 'object' ? item.seller._id : item.seller,
        sellerProduct: typeof item.sellerProduct === 'object' ? item.sellerProduct._id : item.sellerProduct,
      })),
      paymentMethod: paymentMethod === 'cod' ? 'cod' : paymentMethod,
      cardData: paymentMethod === 'credit-card' ? cardData : undefined,
      coupon: appliedCoupon,
      discount,
      total: total - discount,
    };

    console.log('Submitting order with data:', orderData);

    try {
      if (paymentMethod === 'razorpay') {
        // 1) Create orders in backend (pending payment)
        const createRes = await orderAPI.createOrder(orderData);
        const created = createRes.data?.orders || [];
        if (!created.length) {
          toast.error('Failed to create order');
          return;
        }
        const orderIds = created.map(o => o._id);

        // 2) Init Razorpay
        const keyRes = await orderAPI.getRazorpayKey();
        const key = keyRes.data?.key;
        if (!key) {
          toast.error('Payment configuration error');
          return;
        }
        const amountPaise = Math.round((total - discount) * 100);
        const rpOrderRes = await orderAPI.createRazorpayOrder({ amount: amountPaise, currency: 'INR', notes: { orderCount: orderIds.length } });
        const rpOrder = rpOrderRes.data?.order;
        if (!rpOrder?.id) {
          toast.error('Failed to initialize payment');
          return;
        }

        const loaded = await loadRazorpayScript();
        if (!loaded) {
          toast.error('Failed to load payment gateway');
          return;
        }

        const options = {
          key,
          amount: rpOrder.amount,
          currency: rpOrder.currency,
          name: 'MVG Store',
          description: 'Order Payment',
          order_id: rpOrder.id,
          prefill: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            contact: formData.phone,
          },
          notes: { orderIds: orderIds.join(',') },
          theme: { color: '#16a34a' },
          handler: async function (response) {
            try {
              const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;
              // Verify signature
              await orderAPI.verifyRazorpayPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
              // Capture and mark orders paid
              const captureRes = await orderAPI.captureRazorpayPayment({ orderIds, razorpay_order_id, razorpay_payment_id, razorpay_signature });
              if (captureRes.data?.success) {
                dispatch(clearCart());
                toast.success('Payment successful! Order confirmed.');
                navigate('/profile');
              } else {
                toast.error('Payment capture failed');
              }
            } catch (err) {
              console.error('Payment verification/capture error:', err);
              toast.error(err.response?.data?.message || 'Payment verification failed');
            }
          },
          modal: {
            ondismiss: function () {
              toast.info('Payment cancelled');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return; // Do not proceed to default create-order flow
      }

      // Default flow for non-Razorpay methods
      const result = await dispatch(createOrder(orderData));
      if (result.meta.requestStatus === 'fulfilled') {
        dispatch(clearCart());
        toast.success('Order placed successfully!');
        navigate('/profile');
      } else if (result.meta.requestStatus === 'rejected') {
        toast.error(result.payload || 'Failed to place order');
      }
    } catch (err) {
      console.error('Order creation error:', err);
      toast.error('Failed to place order. Please try again.');
    }
  };

  // Dummy coupon logic (replace with real API if needed)
  const handleApplyCoupon = async () => {
    setCouponStatus('');
    setDiscount(0);
    setAppliedCoupon(null);
    if (!coupon) return;
    // Simulate coupon
    if (coupon === 'INDIA10') {
      setDiscount(0.1 * total);
      setAppliedCoupon(coupon);
      setCouponStatus('Coupon applied!');
    } else {
      setCouponStatus('Invalid coupon');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link to="/cart" className="text-green-600 hover:text-green-800">
            ← Back to Cart
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Checkout</h1>
        <p className="text-gray-600 mt-2">Complete your purchase securely</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Shipping Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Shipping Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <select name="state" value={formData.state} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                  <input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} required pattern="[1-9][0-9]{5}" maxLength={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input type="text" name="country" value={formData.country} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100" />
                </div>
              </div>
            </div>
            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Method</h2>
              <div className="space-y-4">
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === 'razorpay'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input type="radio" name="paymentMethod" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={e => setPaymentMethod(e.target.value)} className="mr-3" />
                  <span className="font-medium">Razorpay (UPI / Cards / Netbanking)</span>
                </label>
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="paymentMethod" value="credit-card" checked={paymentMethod === 'credit-card'} onChange={e => setPaymentMethod(e.target.value)} className="mr-3" />
                  <FaCreditCard className="text-green-600 mr-3" />
                  <span className="font-medium">Credit Card</span>
                </label>
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="paymentMethod" value="paypal" checked={paymentMethod === 'paypal'} onChange={e => setPaymentMethod(e.target.value)} className="mr-3" />
                  <FaPaypal className="text-green-600 mr-3" />
                  <span className="font-medium">PayPal</span>
                </label>
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="paymentMethod" value="apple-pay" checked={paymentMethod === 'apple-pay'} onChange={e => setPaymentMethod(e.target.value)} className="mr-3" />
                  <FaApplePay className="text-green-600 mr-3" />
                  <span className="font-medium">Apple Pay</span>
                </label>
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="paymentMethod" value="google-pay" checked={paymentMethod === 'google-pay'} onChange={e => setPaymentMethod(e.target.value)} className="mr-3" />
                  <FaGooglePay className="text-green-600 mr-3" />
                  <span className="font-medium">Google Pay</span>
                </label>
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === 'cod' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={e => setPaymentMethod(e.target.value)} className="mr-3" />
                  <FaMoneyBillWave className="text-green-600 mr-3" />
                  <div>
                    <span className="font-medium">Cash on Delivery</span>
                    <p className="text-sm text-gray-600 mt-1">Pay when you receive your order</p>
                  </div>
                </label>
              </div>
              {/* Credit Card Form */}
              {paymentMethod === 'credit-card' && (
                <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                      <input type="text" name="cardholderName" value={cardData.cardholderName} onChange={handleCardInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                      <input type="text" name="cardNumber" value={cardData.cardNumber} onChange={handleCardInputChange} placeholder="1234 5678 9012 3456" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                      <input type="text" name="expiryDate" value={cardData.expiryDate} onChange={handleCardInputChange} placeholder="MM/YY" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                      <input type="text" name="cvv" value={cardData.cvv} onChange={handleCardInputChange} placeholder="123" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                  </div>
                </div>
              )}
              
              {/* COD Notice */}
              {paymentMethod === 'cod' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <FaMoneyBillWave className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Cash on Delivery</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>• Pay with cash when your order is delivered</p>
                        <p>• No additional charges for COD</p>
                        <p>• Please have exact change ready</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Place Order Button */}
            <button 
              type="submit" 
              disabled={cartLoading || orderLoading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {cartLoading || orderLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <FaLock />
                  {paymentMethod === 'cod' ? 'Place Order (Cash on Delivery)' : 'Place Order'}
                </>
              )}
            </button>
          </form>
        </div>
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
            {/* Coupon Code Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
              <div className="flex gap-2">
                <input type="text" value={coupon} onChange={e => setCoupon(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter coupon code" />
                <button type="button" onClick={handleApplyCoupon} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Apply</button>
              </div>
              {couponStatus && <div className={`mt-1 text-sm ${discount ? 'text-green-600' : 'text-red-600'}`}>{couponStatus}</div>}
            </div>
            {/* Items */}
            <div className="space-y-3 mb-6">
              {cartItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{item.product.name}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-medium">{formatINR((item?.sellerProduct?.sellerPrice ?? item.product.price) * item.quantity)}</span>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="border-t pt-4 space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatINR(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">Free</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">{formatINR(0)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-green-600">Coupon Discount</span>
                  <span className="font-medium text-green-600">- {formatINR(discount)}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-lg font-bold text-blue-600">{formatINR(total - discount)}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p className="mb-2">✓ Secure checkout with SSL encryption</p>
              <p className="mb-2">✓ 7-day return policy</p>
              <p>✓ Free shipping on all orders</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 