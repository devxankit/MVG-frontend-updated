import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Header from './components/common/Header.jsx';
import Footer from './components/common/Footer.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ProductList from './pages/ProductList.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Profile from './pages/Profile.jsx';
import SellerDashboard from './pages/SellerDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';

import { getCurrentUser } from './redux/slices/authSlice.jsx';
import Wishlist from './pages/Wishlist.jsx';
import { fetchCart } from './redux/slices/cartSlice.jsx';
import Categories from './pages/Categories.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Toast from './components/common/Toast.jsx';
import ScrollToTop from './components/common/ScrollToTop.jsx';

function App() {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const location = useLocation();
  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');

  // Check if current route is admin or seller route
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isSellerRoute = location.pathname.startsWith('/seller');

  // Example product names for dynamic messages
  const productNames = [
    'Fresh Milk',
    'Fresh Bread',
    'Fresh Vegetables',
    'Fresh Fruits',
    
    
  ];

  // Example city names
  const cities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'
  ];

  // Toast message templates
  const toastTemplates = [
    () => `${Math.floor(Math.random()*20)+5} people bought "${productNames[Math.floor(Math.random()*productNames.length)]}" in the last hour!`,
    () => `Someone from ${cities[Math.floor(Math.random()*cities.length)]} just added "${productNames[Math.floor(Math.random()*productNames.length)]}" to their cart!`,
    () => `Flash Sale: 20% off on "${productNames[Math.floor(Math.random()*productNames.length)]}" for the next 10 minutes!`,
    () => `${Math.floor(Math.random()*10)+2} users are viewing "${productNames[Math.floor(Math.random()*productNames.length)]}" right now!`,
    () => `Hurry! "${productNames[Math.floor(Math.random()*productNames.length)]}" is selling fast!`,
    () => `"${productNames[Math.floor(Math.random()*productNames.length)]}" was just reviewed by a happy customer!`,
    () => `Limited stock: Only ${Math.floor(Math.random()*5)+1} "${productNames[Math.floor(Math.random()*productNames.length)]}" left!`,
  ];

  React.useEffect(() => {
    let timeoutId;
    function showRandomToast() {
      const randomTemplate = toastTemplates[Math.floor(Math.random()*toastTemplates.length)];
      setToastMessage(randomTemplate());
      setToastVisible(true);
      // Hide after 4s, then show next after 20-30s
      timeoutId = setTimeout(() => {
        setToastVisible(false);
        timeoutId = setTimeout(showRandomToast, 20000 + Math.random()*10000);
      }, 4000);
    }
    // Start the first toast after 3s
    timeoutId = setTimeout(showRandomToast, 3000);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (token && !user) {
      dispatch(getCurrentUser());
    }
    if (token) {
      dispatch(fetchCart());
    }
  }, [dispatch, token, user]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Toast message={toastMessage} visible={toastVisible} onClose={() => setToastVisible(false)} />
      <div className="min-h-screen flex flex-col">
        <ScrollToTop />
        <Header />
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            
            {/* Protected Routes */}
            <Route path="/cart" element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            } />
            <Route path="/checkout" element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            
            {/* Seller Routes */}
            <Route path="/seller/*" element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerDashboard />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/categories" element={<Categories />} />
          </Routes>
        </main>
        {/* Only show footer on non-admin and non-seller routes */}
        {!isAdminRoute && !isSellerRoute && <Footer />}
      </div>
    </>
  );
}

export default App; 