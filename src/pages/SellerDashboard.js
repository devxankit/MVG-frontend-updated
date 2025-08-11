import React, { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaChartLine, FaBox, FaDollarSign, FaUsers, FaCog, FaTimes } from 'react-icons/fa';
import { formatINR } from '../utils/formatCurrency';
import sellerAPI from '../api/sellerAPI';
import axiosInstance from '../api/axiosConfig';
import productAPI from '../api/productAPI';
import { useSelector, useDispatch } from 'react-redux';
import { fetchOrders } from '../redux/slices/orderSlice';
import VariantManager from '../components/common/VariantManager';
import { toast } from 'react-toastify';
import SellerWallet from '../components/seller/SellerWallet';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';

const ORDER_STATUSES = [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
];

// Helper to get full path for a subcategory
const getCategoryPath = (categories, subcatId) => {
  for (const cat of categories) {
    if (cat.subcategories) {
      const found = cat.subcategories.find(sub => sub._id === subcatId);
      if (found) return `${cat.name} > ${found.name}`;
    }
  }
  return '';
};

const CategoryTreeSelector = ({ categories, selected, onSelect }) => {
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState('');
  const toggle = id => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // Filter categories and subcategories by search
  const filteredCategories = categories
    .map(cat => {
      // If main category matches, show all its subcategories
      if (cat.name.toLowerCase().includes(search.toLowerCase())) return cat;
      // Otherwise, filter subcategories
      const filteredSubs = (cat.subcategories || []).filter(sub => sub.name.toLowerCase().includes(search.toLowerCase()));
      if (filteredSubs.length > 0) return { ...cat, subcategories: filteredSubs };
      return null;
    })
    .filter(Boolean);

  return (
    <div>
      <input
        type="text"
        className="w-full mb-2 px-2 py-1 border rounded text-sm"
        placeholder="Search category..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="border rounded p-2 bg-gray-50 max-h-60 overflow-y-auto">
        {filteredCategories.length === 0 && <div className="text-gray-400 text-sm">No categories found.</div>}
        {filteredCategories.map(cat => (
          <div key={cat._id} className="mb-1">
            <div className="flex items-center">
              {cat.subcategories && cat.subcategories.length > 0 && (
                <button type="button" className="mr-1 text-xs text-blue-600" onClick={() => toggle(cat._id)}>
                  {expanded[cat._id] ? '-' : '+'}
                </button>
              )}
              <span className="font-semibold text-gray-800">{cat.name}</span>
            </div>
            {cat.subcategories && cat.subcategories.length > 0 && expanded[cat._id] && (
              <div className="ml-4 mt-1">
                {cat.subcategories.map(subcat => (
                  <div key={subcat._id} className={`flex items-center mb-1 ${selected === subcat._id ? 'bg-blue-100 rounded px-1' : ''}`}>
                    <input
                      type="radio"
                      name="category"
                      value={subcat._id}
                      checked={selected === subcat._id}
                      onChange={() => onSelect(subcat._id)}
                      className="mr-2"
                    />
                    <span className={selected === subcat._id ? 'text-blue-700 font-semibold' : ''}>{subcat.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const SellerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    stock: '',
    brand: '',
    sku: '',
    mainCategory: '',
    subCategory: '',
    features: '',
    specifications: [{ key: '', value: '' }],
    images: [{ url: '' }],
  });
  const [error, setError] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [categories, setCategories] = useState([]);

  const dispatch = useDispatch();
  const { orders, loading: ordersLoading } = useSelector((state) => state.orders);

  // Coupon management state
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({ code: '', discount: '', expiry: '', usageLimit: '' });
  const [couponStatus, setCouponStatus] = useState('');

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [newStatus, setNewStatus] = useState('');

  // Seller stats state
  const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, totalProducts: 0, totalCustomers: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Add state for edit modal and form
  const [editModal, setEditModal] = useState({ open: false, product: null });
  const [editProduct, setEditProduct] = useState({});
  const [editError, setEditError] = useState('');

  // In SellerDashboard component, add state for main category selection
  const [selectedMainCat, setSelectedMainCat] = useState('');

  // Add editLoading state
  const [editLoading, setEditLoading] = useState(false);

  // Add variant management state
  const [selectedProductForVariants, setSelectedProductForVariants] = useState(null);
  const [showVariantModal, setShowVariantModal] = useState(false);

  // Add state for soldCount editing
  const [soldCountEdits, setSoldCountEdits] = useState({});
  const [soldCountLoading, setSoldCountLoading] = useState({});

  // Add state for admin products and seller listings
  const [adminProducts, setAdminProducts] = useState([]);
  const [sellerListings, setSellerListings] = useState([]);
  const [listingLoading, setListingLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedSubCat, setSelectedSubCat] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sellerPrice, setSellerPrice] = useState('');
  const [listingError, setListingError] = useState('');
  const [showListingModal, setShowListingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  
  // Order management state
  const [orderRefreshInterval, setOrderRefreshInterval] = useState(null);

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
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'out-of-stock':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Fetch products on mount
  useEffect(() => {
    setLoading(true);
    sellerAPI.getProducts()
      .then(res => setProducts(res.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  // Fetch admin products and seller listings on mount
  useEffect(() => {
    productAPI.getAdminProducts().then(res => setAdminProducts(res.data)).catch(() => setAdminProducts([]));
    productAPI.sellerGetListings().then(res => setSellerListings(res.data)).catch(() => setSellerListings([]));
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    productAPI.getCategories().then(res => setCategories(res.data)).catch(() => setCategories([]));
  }, []);

  // Fetch coupons on mount
  useEffect(() => {
    sellerAPI.getCoupons().then(res => setCoupons(res.data)).catch(() => setCoupons([]));
  }, []);

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

  // Fetch seller stats on mount
  useEffect(() => {
    setStatsLoading(true);
    sellerAPI.getStats()
      .then(res => setStats(res.data))
      .catch(() => setStats({ totalSales: 0, totalOrders: 0, totalProducts: 0, totalCustomers: 0 }))
      .finally(() => setStatsLoading(false));
  }, []);

  // ----- Charts Data (Seller Overview) -----
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

  // Add product handler
  const handleAddProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('description', newProduct.description);
    formData.append('price', newProduct.price);
    formData.append('comparePrice', newProduct.comparePrice);
    formData.append('stock', newProduct.stock);
    formData.append('brand', newProduct.brand);
    formData.append('sku', newProduct.sku);
    formData.append('category', newProduct.mainCategory);
    formData.append('subCategory', newProduct.subCategory);
    formData.append('features', newProduct.features);
    formData.append('specifications', JSON.stringify(newProduct.specifications.filter(s => s.key && s.value)));
    imageFiles.forEach((file, idx) => {
      formData.append('images', file);
    });
    try {
      const res = await sellerAPI.createProduct(formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProducts([res.data, ...products]);
      setShowModal(false);
      setNewProduct({ name: '', description: '', price: '', comparePrice: '', stock: '', brand: '', sku: '', mainCategory: '', subCategory: '', features: '', specifications: [{ key: '', value: '' }], images: [{ url: '' }] });
      setImageFiles([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product');
    }
  };

  // Delete product handler
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await sellerAPI.deleteProduct(id);
      setProducts(products.filter((p) => p._id !== id));
    } catch {}
  };

  const handleCouponInput = (e) => {
    const { name, value } = e.target;
    setCouponForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setCouponStatus('');
    try {
      const res = await sellerAPI.createCoupon(couponForm);
      setCoupons([res.data, ...coupons]);
      setCouponForm({ code: '', discount: '', expiry: '', usageLimit: '' });
      setCouponStatus('Coupon created!');
    } catch (err) {
      setCouponStatus(err.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleDeactivateCoupon = async (id) => {
    if (!window.confirm('Deactivate this coupon?')) return;
    try {
      await sellerAPI.deactivateCoupon(id);
      setCoupons(coupons.map(c => c._id === id ? { ...c, isActive: false } : c));
    } catch {}
  };

  // Handler to open order modal
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus);
    setShowOrderModal(true);
    setStatusError('');
  };

  // Handler to close order modal
  const handleCloseOrderModal = () => {
    setSelectedOrder(null);
    setShowOrderModal(false);
    setStatusError('');
  };

  // Handler to update order status
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

  // Edit product handler
  const handleEditProduct = (product) => {
    setEditProduct({
      ...product,
      mainCategory: product.category?._id || product.category,
      subCategory: product.subCategory?._id || product.subCategory
    });
    setEditModal({ open: true, product });
    setEditError('');
  };

  const handleEditProductSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting edit form');
    setEditError('');
    setEditLoading(true);
    const formData = new FormData();
    formData.append('name', editProduct.name);
    formData.append('description', editProduct.description);
    formData.append('price', editProduct.price);
    formData.append('comparePrice', editProduct.comparePrice);
    formData.append('stock', editProduct.stock);
    formData.append('brand', editProduct.brand);
    formData.append('sku', editProduct.sku);
    formData.append('category', editProduct.mainCategory);
    formData.append('subCategory', editProduct.subCategory);
    formData.append('features', editProduct.features);
    formData.append('specifications', JSON.stringify(editProduct.specifications.filter(s => s.key && s.value)));
    if (editProduct.imageFile) {
      formData.append('image', editProduct.imageFile);
    } else if (editProduct.images && editProduct.images[0] && editProduct.images[0].url) {
      formData.append('images[0][url]', editProduct.images[0].url);
    }
    // Log all FormData entries for debugging
    for (let pair of formData.entries()) {
      console.log(pair[0]+ ':', pair[1]);
    }
    try {
      const res = await sellerAPI.editProduct(editModal.product._id, formData);
      setProducts(products.map(p => p._id === editModal.product._id ? res.data : p));
      setEditModal({ open: false, product: null });
    } catch (err) {
      console.error('Edit product error:', err.response);
      if (err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors).map(e => e.message).join(' | ');
        setEditError(errorMessages);
      } else {
        setEditError(err.response?.data?.message || 'Failed to update product');
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleManageVariants = (product) => {
    setSelectedProductForVariants(product);
    setShowVariantModal(true);
  };

  const handleVariantUpdate = async () => {
    // Refresh the product data after variant changes
    if (selectedProductForVariants) {
      try {
        const res = await productAPI.getProductById(selectedProductForVariants._id);
        setSelectedProductForVariants(res.data);
        // Also refresh the products list
        const productsRes = await sellerAPI.getProducts();
        setProducts(productsRes.data);
      } catch (error) {
        console.error('Failed to refresh product data:', error);
      }
    }
  };

  // Handler to update soldCount
  const handleSoldCountChange = (productId, value) => {
    setSoldCountEdits((prev) => ({ ...prev, [productId]: value }));
  };
  const handleSoldCountSave = async (productId) => {
    setSoldCountLoading((prev) => ({ ...prev, [productId]: true }));
    try {
      const res = await axiosInstance.put(`/api/seller/products/${productId}/sold-count`, { soldCount: Number(soldCountEdits[productId]) });
      setProducts((prev) => prev.map((p) => p._id === productId ? { ...p, soldCount: res.data.soldCount } : p));
    } catch (err) {
      alert('Failed to update sold count');
    }
    setSoldCountLoading((prev) => ({ ...prev, [productId]: false }));
  };

  // Handler for listing a product
  const handleListProduct = async () => {
    setListingLoading(true);
    setListingError('');
    try {
      await productAPI.sellerListProduct(selectedProduct._id, sellerPrice);
      // Refresh seller listings
      const res = await productAPI.sellerGetListings();
      setSellerListings(res.data);
      setStep(1);
      setSelectedMainCat('');
      setSelectedSubCat('');
      setSelectedProduct(null);
      setSellerPrice('');
    } catch (err) {
      setListingError(err.response?.data?.message || 'Failed to list product');
    } finally {
      setListingLoading(false);
    }
  };

  // Handler for updating price
  const handleUpdatePrice = async (sellerProductId, newPrice) => {
    setListingLoading(true);
    try {
      await productAPI.sellerUpdatePrice(sellerProductId, newPrice);
      const res = await productAPI.sellerGetListings();
      setSellerListings(res.data);
    } catch {}
    setListingLoading(false);
  };

  // Handler for unlisting
  const handleUnlist = async (sellerProductId) => {
    setListingLoading(true);
    try {
      await productAPI.sellerUnlistProduct(sellerProductId);
      const res = await productAPI.sellerGetListings();
      setSellerListings(res.data);
    } catch {}
    setListingLoading(false);
  };

  // Handler for editing listing
  const handleEditListing = (listing) => {
    setEditingListing(listing);
    setEditPrice(listing.sellerPrice.toString());
    setEditError('');
    setShowEditModal(true);
  };

  // Handler for saving edited listing
  const handleSaveEdit = async () => {
    if (!editPrice || editPrice <= 0) {
      setEditError('Please enter a valid price');
      return;
    }
    
    setEditLoading(true);
    setEditError('');
    try {
      await productAPI.sellerUpdatePrice(editingListing._id, parseFloat(editPrice));
      const res = await productAPI.sellerGetListings();
      setSellerListings(res.data);
      setShowEditModal(false);
      setEditingListing(null);
      setEditPrice('');
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update price');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Seller Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your products, orders, and business analytics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FaDollarSign className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatINR(stats.totalSales)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FaBox className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <FaChartLine className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Products</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <FaUsers className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Customers</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalCustomers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 text-sm font-medium ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 text-sm font-medium ${activeTab === 'products' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 text-sm font-medium ${activeTab === 'orders' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`py-4 text-sm font-medium ${activeTab === 'coupons' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              Coupons
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`py-4 text-sm font-medium ${activeTab === 'wallet' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              Wallet
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trend (Last 6 months)</h3>
                  <div className="w-full overflow-x-auto">
                    <LineChart
                      height={260}
                      series={[{ data: revenueSeries, label: 'Revenue' }]}
                      xAxis={[{ scaleType: 'point', data: lastSixMonths.map((m) => m.label) }]}
                    />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Orders by Status</h3>
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
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Products by Sales</h3>
                <div className="w-full overflow-x-auto">
                  <BarChart
                    height={300}
                    xAxis={[{ scaleType: 'band', data: topProductsData.labels }]}
                    series={[{ data: topProductsData.data, label: 'Units Sold' }]}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h3>
                  <div className="space-y-3">
                    {(orders || []).slice(0, 3).map((order) => (
                      <div key={order._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">#{order.orderNumber || String(order._id).slice(-8)}</p>
                          <p className="text-sm text-gray-600">{order.user?.firstName} {order.user?.lastName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">{formatINR(order.totalPrice || order.total || 0)}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>{order.orderStatus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Products</h3>
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
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">My Listings</h3>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  onClick={() => { setShowListingModal(true); setStep(1); }}
                >
                  <FaPlus /> List New Product
                </button>
              </div>
              {/* Listing Modal */}
              {showListingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 transition-opacity duration-300 animate-fadeIn">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl mx-2 relative transition-transform duration-300 animate-slideUp">
                    <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl" onClick={() => setShowListingModal(false)}>&times;</button>
                    <h2 className="text-xl font-bold mb-4">List a New Product</h2>
                    {/* Stepper for listing a product - only render current step */}
                    {step === 1 && (
                      <div className="mb-6">
                        <h4 className="font-semibold mb-2">Step 1: Select Main Category</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {categories.filter(cat => !cat.parentCategory).map(cat => (
                            <button
                              key={cat._id}
                              className={`flex flex-col items-center p-4 rounded border transition-colors duration-200 ${selectedMainCat === cat._id ? 'bg-blue-100 border-blue-600' : 'bg-gray-50 border-gray-200 hover:bg-blue-50'}`}
                              onClick={() => { setSelectedMainCat(cat._id); setStep(2); }}
                            >
                              {cat.image && <img src={cat.image} alt={cat.name} className="w-14 h-14 object-contain rounded-full mb-2 border" />}
                              <span className="font-semibold text-gray-800">{cat.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {step === 2 && (
                      <div className="mb-6">
                        <h4 className="font-semibold mb-2">Step 2: Select Subcategory</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto max-h-[320px]">
                          {categories.filter(cat => cat.parentCategory === selectedMainCat).map(subcat => (
                            <button
                              key={subcat._id}
                              className={`flex flex-col items-center p-4 rounded border transition-colors duration-200 ${selectedSubCat === subcat._id ? 'bg-blue-100 border-blue-600' : 'bg-gray-50 border-gray-200 hover:bg-blue-50'}`}
                              onClick={() => { setSelectedSubCat(subcat._id); setStep(3); }}
                            >
                              {subcat.image && <img src={subcat.image} alt={subcat.name} className="w-12 h-12 object-contain rounded-full mb-2 border" />}
                              <span className="font-semibold text-gray-800">{subcat.name}</span>
                            </button>
                          ))}
                        </div>
                        <button className="mt-4 text-blue-600 underline" onClick={() => setStep(1)}>&larr; Back to Main Categories</button>
                      </div>
                    )}
                    {step === 3 && (
                      <div className="mb-6">
                        <h4 className="font-semibold mb-2">Step 3: Select Product</h4>
                        {(() => {
                          const filteredProducts = adminProducts.filter(p => {
                            // Get category and subcategory IDs, handling both populated objects and direct IDs
                            const categoryId = typeof p.category === 'object' ? p.category._id : p.category;
                            const subCategoryId = typeof p.subCategory === 'object' ? p.subCategory._id : p.subCategory;
                            
                            const categoryMatch = categoryId === selectedMainCat;
                            const subCategoryMatch = subCategoryId === selectedSubCat;
                            
                            return categoryMatch && subCategoryMatch;
                          });
                          
                          if (filteredProducts.length === 0) {
                            return (
                              <div className="text-center py-8">
                                <div className="text-gray-400 mb-2">No products found for this category/subcategory.</div>
                                <div className="text-sm text-gray-500 mb-4">Please contact admin to add products to this category.</div>
                                <button className="text-blue-600 underline" onClick={() => setStep(2)}>&larr; Back to Subcategories</button>
                              </div>
                            );
                          }
                          
                          return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[320px]">
                              {filteredProducts.map(product => (
                            <button
                              key={product._id}
                              className={`flex items-center p-4 rounded border transition-colors duration-200 w-full ${selectedProduct && selectedProduct._id === product._id ? 'bg-blue-100 border-blue-600' : 'bg-gray-50 border-gray-200 hover:bg-blue-50'}`}
                              onClick={() => { setSelectedProduct(product); setStep(4); setSellerPrice(product.price); }}
                            >
                              <img src={product.images && product.images[0] ? product.images[0].url : '/product-images/default.webp'} alt={product.name} className="w-16 h-16 object-contain rounded mr-4 border" />
                              <div className="flex-1 text-left">
                                <div className="font-semibold text-gray-800">{product.name}</div>
                                <div className="text-xs text-gray-500">Default Price: {formatINR(product.price)}</div>
                                <div className="text-xs text-gray-500">Brand: {product.brand}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                          );
                        })()}
                        <button className="mt-4 text-blue-600 underline" onClick={() => setStep(2)}>&larr; Back to Subcategories</button>
                      </div>
                    )}
                    {step === 4 && selectedProduct && (
                      <div className="mb-6 max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
                        <h4 className="font-semibold mb-4 text-lg">Step 4: Set Your Selling Price</h4>
                        
                        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                          <img src={selectedProduct.images && selectedProduct.images[0] ? selectedProduct.images[0].url : '/product-images/default.webp'} alt={selectedProduct.name} className="w-20 h-20 object-contain rounded-lg border" />
                          <div>
                            <div className="font-semibold text-gray-900 text-lg">{selectedProduct.name}</div>
                            <div className="text-sm text-gray-600">{selectedProduct.brand || 'No Brand'}</div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Admin Suggested Price:</span>
                            <span className="font-medium text-gray-900">{formatINR(selectedProduct.price)}</span>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Your Selling Price:</label>
                        <input
                          type="number"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter your competitive price"
                          value={sellerPrice}
                          min="0"
                              step="0.01"
                          onChange={e => setSellerPrice(e.target.value)}
                        />
                            <p className="text-xs text-gray-500">
                              Set your own price to compete with other sellers. You can price higher or lower than the admin price.
                            </p>
                        </div>
                          
                          {sellerPrice && (
                            <div className={`p-3 rounded-lg text-sm font-medium ${
                              parseFloat(sellerPrice) > selectedProduct.price
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : parseFloat(sellerPrice) < selectedProduct.price
                                ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {parseFloat(sellerPrice) > selectedProduct.price ? (
                                <span>Price Premium: +{formatINR(parseFloat(sellerPrice) - selectedProduct.price)}</span>
                              ) : parseFloat(sellerPrice) < selectedProduct.price ? (
                                <span>Price Discount: -{formatINR(selectedProduct.price - parseFloat(sellerPrice))}</span>
                              ) : (
                                <span>Same as Admin Price</span>
                              )}
                      </div>
                    )}
                  </div>
                        
                        {listingError && (
                          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                            {listingError}
                </div>
              )}
                        
                        <div className="flex gap-3 justify-end mt-6">
                          <button 
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" 
                            onClick={() => setStep(3)}
                          >
                            Back
                          </button>
                          <button 
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2" 
                            onClick={async () => { await handleListProduct(); setShowListingModal(false); }} 
                            disabled={listingLoading || !sellerPrice || parseFloat(sellerPrice) <= 0}
                          >
                            {listingLoading ? (
                              <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Listing...
                              </>
                            ) : (
                              'List Product'
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Edit Price Modal */}
              {showEditModal && editingListing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Update Product Price</h3>
                      <button 
                        className="text-gray-400 hover:text-gray-600 text-xl" 
                        onClick={() => setShowEditModal(false)}
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex items-center gap-4 mb-4">
                        <img 
                          src={editingListing.product.images && editingListing.product.images[0] ? editingListing.product.images[0].url : '/product-images/default.webp'} 
                          alt={editingListing.product.name} 
                          className="w-16 h-16 object-contain rounded-lg border" 
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">{editingListing.product.name}</h4>
                          <p className="text-sm text-gray-600">{editingListing.product.brand || 'No Brand'}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Admin Price:</span>
                          <span className="font-medium text-gray-900">{formatINR(editingListing.product.price)}</span>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Your Selling Price:</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your price"
                            value={editPrice}
                            min="0"
                            step="0.01"
                            onChange={(e) => setEditPrice(e.target.value)}
                          />
                          <p className="text-xs text-gray-500">
                            Set your own price to compete with other sellers
                          </p>
                        </div>
                        
                        {editPrice && (
                          <div className={`p-3 rounded-lg text-sm font-medium ${
                            parseFloat(editPrice) > editingListing.product.price
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : parseFloat(editPrice) < editingListing.product.price
                              ? 'bg-orange-50 text-orange-700 border border-orange-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {parseFloat(editPrice) > editingListing.product.price ? (
                              <span>Price Premium: +{formatINR(parseFloat(editPrice) - editingListing.product.price)}</span>
                            ) : parseFloat(editPrice) < editingListing.product.price ? (
                              <span>Price Discount: -{formatINR(editingListing.product.price - parseFloat(editPrice))}</span>
                            ) : (
                              <span>Same as Admin Price</span>
                            )}
                      </div>
                        )}
                    </div>
                </div>
                    
                    {editError && (
                      <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                        {editError}
                      </div>
                    )}
                    
                    <div className="flex gap-3 justify-end">
                      <button
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        onClick={() => setShowEditModal(false)}
                        disabled={editLoading}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        onClick={handleSaveEdit}
                        disabled={editLoading || !editPrice || parseFloat(editPrice) <= 0}
                      >
                        {editLoading ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating...
                          </>
                        ) : (
                          'Update Price'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Seller's current listings */}
              <div className="mt-8">
                <h4 className="font-semibold mb-4">Your Current Listings</h4>
                {listingLoading && <div className="text-blue-600 mb-4">Updating...</div>}
                
                {sellerListings.filter(l => l.isListed).length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <div className="text-gray-400 mb-2">No active listings found</div>
                    <div className="text-sm text-gray-500">Start by listing a product from the admin catalog above</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {sellerListings.filter(l => l.isListed).map(listing => {
                      const priceDifference = listing.sellerPrice - listing.product.price;
                      const isHigher = priceDifference > 0;
                      const isLower = priceDifference < 0;
                      
                      return (
                        <div key={listing._id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-start gap-4">
                            <img 
                              src={listing.product.images && listing.product.images[0] ? listing.product.images[0].url : '/product-images/default.webp'} 
                              alt={listing.product.name} 
                              className="w-20 h-20 object-contain rounded-lg border border-gray-200" 
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h5 className="font-semibold text-gray-900 text-lg mb-1">{listing.product.name}</h5>
                                  <p className="text-sm text-gray-600 mb-2">{listing.product.brand || 'No Brand'}</p>
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors" 
                                    onClick={() => handleEditListing(listing)}
                                    title="Edit Price"
                                  >
                                    <FaEdit className="w-4 h-4" />
                                  </button>
                                  <button 
                                    className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors" 
                                    onClick={() => handleUnlist(listing._id)} 
                                    disabled={listingLoading}
                                    title="Unlist Product"
                                  >
                                    <FaTrash className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                {/* Price Comparison */}
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="text-sm text-gray-600">Admin Price:</div>
                                  <div className="font-medium text-gray-900">{formatINR(listing.product.price)}</div>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <div className="text-sm text-blue-700 font-medium">Your Price:</div>
                                  <div className="font-bold text-blue-900 text-lg">{formatINR(listing.sellerPrice)}</div>
                                </div>
                                
                                {/* Price Difference Indicator */}
                                {priceDifference !== 0 && (
                                  <div className={`flex items-center justify-between p-2 rounded-lg text-sm font-medium ${
                                    isHigher 
                                      ? 'bg-green-50 text-green-700 border border-green-200' 
                                      : 'bg-orange-50 text-orange-700 border border-orange-200'
                                  }`}>
                                    <span>{isHigher ? 'Price Premium:' : 'Price Discount:'}</span>
                                    <span className={isHigher ? 'text-green-800' : 'text-orange-800'}>
                                      {isHigher ? '+' : ''}{formatINR(Math.abs(priceDifference))}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Listing Status */}
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">Listed on:</span>
                                  <span className="text-xs text-gray-600">
                                    {new Date(listing.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Order Management</h3>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Auto-refresh: {orderRefreshInterval ? 'Enabled' : 'Disabled'}
                  </div>
                  <button
                    onClick={() => dispatch(fetchOrders({ seller: true }))}
                    disabled={ordersLoading}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {ordersLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>
              
              {ordersLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 mb-2">No orders found</div>
                  <div className="text-sm text-gray-500">Orders will appear here when customers place them</div>
                </div>
              ) : (
              <div className="overflow-x-auto">
                  <table className="w-full bg-white rounded-lg shadow-sm">
                  <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Order ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Items</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Total</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                      {orders.map((order) => (
                        <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 font-medium text-blue-600">
                            #{order.orderNumber || order._id.slice(-8)}
                        </td>
                        <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">
                                {order.user?.firstName} {order.user?.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{order.user?.email}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            <div className="text-sm">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(order.createdAt).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              {order.orderItems?.slice(0, 2).map(item => 
                                `${item.product?.name || item.name} (x${item.quantity})`
                              ).join(', ')}
                              {order.orderItems?.length > 2 && (
                                <span className="text-gray-500"> +{order.orderItems.length - 2} more</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {formatINR(order.totalPrice || order.total)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                              {order.orderStatus}
                            </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                              <button 
                                className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors" 
                                onClick={() => handleViewOrder(order)}
                                title="View Details"
                              >
                                <FaEye className="w-4 h-4" />
                              </button>
                              <button 
                                className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-50 transition-colors"
                                onClick={() => handleViewOrder(order)}
                                title="Update Status"
                              >
                                <FaEdit className="w-4 h-4" />
                              </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}

              {/* Order Details Modal */}
              {showOrderModal && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl mx-2 relative overflow-y-auto max-h-[90vh]">
                    <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl" onClick={handleCloseOrderModal}>&times;</button>
                    
                    {/* Header */}
                    <div className="border-b border-gray-200 pb-4 mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Details</h2>
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
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.orderStatus)}`}>
                            {selectedOrder.orderStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Customer & Shipping Info */}
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
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
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-3">Shipping Address</h3>
                          <div className="text-sm text-gray-900">
                            {selectedOrder.shippingAddress?.firstName} {selectedOrder.shippingAddress?.lastName}<br />
                            {selectedOrder.shippingAddress?.street || selectedOrder.shippingAddress?.address}<br />
                            {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode || selectedOrder.shippingAddress?.pincode}<br />
                            {selectedOrder.shippingAddress?.country}
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-3">Payment Information</h3>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600">Method:</span>
                              <span className="ml-2 text-gray-900 capitalize">{selectedOrder.paymentMethod}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Status:</span>
                              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                selectedOrder.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {selectedOrder.paymentStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Items & Status Update */}
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-3">Update Order Status</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                              <span className={`px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(selectedOrder.orderStatus)}`}>
                                {selectedOrder.orderStatus}
                              </span>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                        <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={newStatus}
                          onChange={e => setNewStatus(e.target.value)}
                          disabled={statusUpdating}
                        >
                                <option value="">Select new status</option>
                          {ORDER_STATUSES.map(status => (
                                  <option key={status} value={status} disabled={status === selectedOrder.orderStatus}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </option>
                          ))}
                        </select>
                            </div>
                        <button
                              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                          onClick={handleStatusUpdate}
                              disabled={statusUpdating || !newStatus || newStatus === selectedOrder.orderStatus}
                            >
                              {statusUpdating ? (
                                <>
                                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Updating...
                                </>
                              ) : (
                                'Update Status'
                              )}
                        </button>
                            {statusError && (
                              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                                {statusError}
                      </div>
                            )}
                    </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Wallet Tab */}
          {activeTab === 'wallet' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Wallet & Earnings</h2>
              <SellerWallet />
            </div>
          )}

          {/* Coupons Tab */}
          {activeTab === 'coupons' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Coupon Management</h2>
              <form onSubmit={handleCreateCoupon} className="mb-6 flex flex-col md:flex-row gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-1">Code</label>
                  <input type="text" name="code" value={couponForm.code} onChange={handleCouponInput} required className="px-3 py-2 border rounded w-full" placeholder="COUPON2024" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Discount (₹ or %)</label>
                  <input type="number" name="discount" value={couponForm.discount} onChange={handleCouponInput} required className="px-3 py-2 border rounded w-full" placeholder="100" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expiry</label>
                  <input type="date" name="expiry" value={couponForm.expiry} onChange={handleCouponInput} required className="px-3 py-2 border rounded w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Usage Limit</label>
                  <input type="number" name="usageLimit" value={couponForm.usageLimit} onChange={handleCouponInput} className="px-3 py-2 border rounded w-full" placeholder="1" />
                </div>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Create</button>
              </form>
              {couponStatus && <div className={`mb-4 text-sm ${couponStatus.includes('created') ? 'text-green-600' : 'text-red-600'}`}>{couponStatus}</div>}
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border rounded">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border-b">Code</th>
                      <th className="py-2 px-4 border-b">Discount</th>
                      <th className="py-2 px-4 border-b">Expiry</th>
                      <th className="py-2 px-4 border-b">Usage Limit</th>
                      <th className="py-2 px-4 border-b">Used By</th>
                      <th className="py-2 px-4 border-b">Status</th>
                      <th className="py-2 px-4 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map(coupon => (
                      <tr key={coupon._id}>
                        <td className="py-2 px-4 border-b font-mono">{coupon.code}</td>
                        <td className="py-2 px-4 border-b">{coupon.discount}</td>
                        <td className="py-2 px-4 border-b">{coupon.expiry ? new Date(coupon.expiry).toLocaleDateString() : ''}</td>
                        <td className="py-2 px-4 border-b">{coupon.usageLimit || '∞'}</td>
                        <td className="py-2 px-4 border-b">{coupon.usedBy?.length || 0}</td>
                        <td className="py-2 px-4 border-b">
                          {coupon.isActive ? <span className="text-green-600">Active</span> : <span className="text-gray-400">Inactive</span>}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {coupon.isActive && (
                            <button onClick={() => handleDeactivateCoupon(coupon._id)} className="text-red-600 underline text-xs">Deactivate</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Product Modal */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 w-full max-w-lg mx-2 sm:mx-0 relative overflow-y-auto max-h-[90vh]">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setEditModal({ open: false, product: null })}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Edit Product</h2>
            {editError && <div className="text-red-500 mb-2">{editError}</div>}
            <form onSubmit={handleEditProductSubmit} encType="multipart/form-data" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" className="form-input" placeholder="Product Name" value={editProduct.name || ''} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} required />
                <input type="text" className="form-input" placeholder="Brand" value={editProduct.brand || ''} onChange={e => setEditProduct({ ...editProduct, brand: e.target.value })} required />
                <input type="text" className="form-input" placeholder="SKU" value={editProduct.sku || ''} onChange={e => setEditProduct({ ...editProduct, sku: e.target.value })} required />
                <div className="sm:col-span-2">
                  <label className="block text-gray-700 font-medium mb-1">Select Main Category</label>
                  <select
                    className="form-input w-full mb-2"
                    value={editProduct.mainCategory || ''}
                    onChange={e => setEditProduct({ ...editProduct, mainCategory: e.target.value, subCategory: '' })}
                    required
                  >
                    <option value="">-- Select Main Category --</option>
                    {categories.filter(cat => !cat.parentCategory).map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                  {/* Subcategory selection as cards/pills */}
                  {editProduct.mainCategory && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {categories.filter(cat => cat.parentCategory === editProduct.mainCategory).map(subcat => (
                        <button
                          type="button"
                          key={subcat._id}
                          className={`px-3 py-2 rounded border transition-colors ${editProduct.subCategory === subcat._id ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-100'}`}
                          onClick={() => setEditProduct({ ...editProduct, subCategory: subcat._id })}
                        >
                          {subcat.name}
                        </button>
                      ))}
                      {categories.filter(cat => cat.parentCategory === editProduct.mainCategory).length === 0 && <span className="text-gray-400">No subcategories found.</span>}
                    </div>
                  )}
                </div>
              </div>
              <input type="number" className="form-input" placeholder="Price" value={editProduct.price || ''} onChange={e => setEditProduct({ ...editProduct, price: e.target.value })} required min="0" />
              <input type="number" className="form-input" placeholder="Original Price (MRP)" value={editProduct.comparePrice || ''} onChange={e => setEditProduct({ ...editProduct, comparePrice: e.target.value })} min="0" />
              <input type="number" className="form-input" placeholder="Stock" value={editProduct.stock || ''} onChange={e => setEditProduct({ ...editProduct, stock: e.target.value })} required min="0" />
              <textarea className="form-input" placeholder="Description" value={editProduct.description || ''} onChange={e => setEditProduct({ ...editProduct, description: e.target.value })} required />
              <input type="text" className="form-input" placeholder="Key Features (comma separated)" value={editProduct.features || ''} onChange={e => setEditProduct({ ...editProduct, features: e.target.value })} />
              <div>
                {editProduct.specifications && editProduct.specifications.map((spec, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2 mb-2">
                    <input type="text" className="form-input flex-1" placeholder="Spec Name" value={spec.key} onChange={e => {
                      const specs = [...editProduct.specifications];
                      specs[idx].key = e.target.value;
                      setEditProduct({ ...editProduct, specifications: specs });
                    }} />
                    <input type="text" className="form-input flex-1" placeholder="Spec Value" value={spec.value} onChange={e => {
                      const specs = [...editProduct.specifications];
                      specs[idx].value = e.target.value;
                      setEditProduct({ ...editProduct, specifications: specs });
                    }} />
                    <button type="button" onClick={() => {
                      const specs = editProduct.specifications.filter((_, i) => i !== idx);
                      setEditProduct({ ...editProduct, specifications: specs });
                    }} className="text-red-500">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => setEditProduct({ ...editProduct, specifications: [...(editProduct.specifications || []), { key: '', value: '' }] })} className="text-blue-600 mb-2">+ Add Specification</button>
              </div>
              <input type="file" accept="image/*" onChange={e => setEditProduct({ ...editProduct, imageFile: e.target.files[0] })} />
              <button type="submit" className="btn-primary w-full" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save Changes'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Variant Management Modal */}
      {showVariantModal && selectedProductForVariants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Manage Variants - {selectedProductForVariants.name}</h2>
              <button
                onClick={() => {
                  setShowVariantModal(false);
                  setSelectedProductForVariants(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>
            
            <VariantManager
              product={selectedProductForVariants}
              onVariantUpdate={handleVariantUpdate}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard; 