import React, { useState, useEffect } from 'react';
import { FaUsers, FaBox, FaDollarSign, FaChartLine, FaStore, FaSignOutAlt, FaHome, FaShoppingCart, FaTags, FaImage, FaWallet, FaChevronDown, FaBars, FaTimes } from 'react-icons/fa';
import { formatINR } from '../utils/formatCurrency';
import axiosInstance from '../api/axiosConfig';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

// Import admin components
import AdminOverview from '../components/admin/AdminOverview';
import AdminUsers from '../components/admin/AdminUsers';
import AdminVendors from '../components/admin/AdminVendors';
import AdminProducts from '../components/admin/AdminProducts';
import AdminOrders from '../components/admin/AdminOrders';
import AdminCategories from '../components/admin/AdminCategories';
import AdminEventBanner from '../components/admin/AdminEventBanner';
import AdminWallet from '../components/admin/AdminWallet';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalSales: 0,
    totalOrders: 0,
    totalVendors: 0,
    pendingVendors: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen) {
        const dropdown = document.querySelector('.admin-dropdown');
        if (dropdown && !dropdown.contains(event.target)) {
          setDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const fetchStats = async () => {
    try {
      const res = await axiosInstance.get('/admin/analytics');
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        totalUsers: 0,
        totalProducts: 0,
        totalSales: 0,
        totalOrders: 0,
        totalVendors: 0,
        pendingVendors: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: FaHome },
    { id: 'users', label: 'Users', icon: FaUsers },
    { id: 'vendors', label: 'Vendors', icon: FaStore },
    { id: 'products', label: 'Products', icon: FaBox },
    { id: 'orders', label: 'Orders', icon: FaShoppingCart },
    { id: 'categories', label: 'Categories', icon: FaTags },
    { id: 'eventBanner', label: 'Event Banner', icon: FaImage },
    { id: 'wallet', label: 'Wallet', icon: FaWallet },
  ];

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setDropdownOpen(false);
    setSidebarOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="admin-dashboard-container min-h-screen bg-gray-50 flex">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.div
          initial={false}
          animate={{
            x: sidebarOpen ? 0 : '-100%',
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "admin-sidebar fixed lg:fixed lg:translate-x-0 z-50",
            "w-64 h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] bg-white shadow-lg",
            "flex flex-col no-scrollbar",
            "lg:left-0 lg:top-16"
          )}
        >
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500 mt-1">Dashboard</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <FaTimes className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  onClick={() => handleTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group",
                    activeTab === item.id
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="outline"
              className="w-full bg-white hover:bg-gray-50 transition-all duration-200"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="admin-main-content flex-1 flex flex-col min-w-0 lg:ml-64">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-4 py-4 lg:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <FaBars className="w-5 h-5" />
                </Button>
                
                {/* Title */}
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <h2 className="text-lg lg:text-xl font-semibold text-gray-900 capitalize">
                    {navigationItems.find(item => item.id === activeTab)?.label}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1 hidden lg:block">
                    Manage your e-commerce platform
                  </p>
                </motion.div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex space-x-3 lg:space-x-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                  className="text-center hidden sm:block"
                >
                  <div className="text-lg lg:text-xl font-bold text-blue-600">
                    {stats.totalUsers?.toLocaleString() || '0'}
                  </div>
                  <div className="text-xs text-gray-500">Users</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.2 }}
                  className="text-center hidden md:block"
                >
                  <div className="text-lg lg:text-xl font-bold text-green-600">
                    {formatINR(stats.totalSales || 0)}
                  </div>
                  <div className="text-xs text-gray-500">Sales</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.2 }}
                  className="text-center"
                >
                  <div className="text-lg lg:text-xl font-bold text-purple-600">
                    {stats.totalOrders?.toLocaleString() || '0'}
                  </div>
                  <div className="text-xs text-gray-500">Orders</div>
                </motion.div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  {activeTab === 'overview' && <AdminOverview stats={stats} />}
                  {activeTab === 'users' && <AdminUsers />}
                  {activeTab === 'vendors' && <AdminVendors />}
                  {activeTab === 'products' && <AdminProducts />}
                  {activeTab === 'orders' && <AdminOrders />}
                  {activeTab === 'categories' && <AdminCategories />}
                  {activeTab === 'eventBanner' && <AdminEventBanner />}
                  {activeTab === 'wallet' && <AdminWallet />}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AdminDashboard; 