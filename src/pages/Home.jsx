import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper';
import 'swiper/css';
import 'swiper/css/pagination';

import AOS from 'aos';
import 'aos/dist/aos.css';


import { 
  FaArrowRight, 
  FaStar, 
  FaShoppingCart, 
  FaHeart,
  FaTruck,
  FaShieldAlt,
  FaHeadset,
  FaCreditCard
} from 'react-icons/fa';
import { fetchFeaturedProducts, fetchProducts } from '../redux/slices/productSlice';
import { addToCartAsync } from '../redux/slices/cartSlice';
import { formatINR } from '../utils/formatCurrency';
import productAPI from '../api/productAPI';
import CategoriesGrid from '../components/common/CategoriesGrid';
import HeroCarousel from '../components/common/HeroCarousel';
import EventBanner from '../components/common/EventBanner';
import ProductCard from '../components/common/ProductCard';
import { fetchWishlist, addToWishlist, removeFromWishlist } from '../redux/slices/wishlistSlice';
import FoodCardsLayout from '../components/common/FoodCardsLayout ';
import DeliveryBanner from '../components/common/DeliveryBanner';

const Home = () => {
  const dispatch = useDispatch();
  const { featuredProducts, loading, products } = useSelector((state) => state.products);
  const [categories, setCategories] = useState([]);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const store = useStore();

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
    // Use the new API with seller information
    productAPI.getListedProducts().then(res => {
      // Update the products in the store
      dispatch({ type: 'products/fetchProducts/fulfilled', payload: res.data });
    }).catch(() => {
      dispatch({ type: 'products/fetchProducts/rejected', payload: 'Failed to fetch products' });
    });
    productAPI.getCategories().then(res => setCategories(res.data)).catch(() => setCategories([]));
  }, [dispatch]);

  // Fetch wishlist on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, isAuthenticated]);

  // Save cart to localStorage on every change (optional, for parity with ProductList)
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      localStorage.setItem('cart', JSON.stringify(state.cart));
    });
    return unsubscribe;
  }, []);

  // Wishlist logic
  const isInWishlist = (productId) => wishlistItems.some((item) => String(item._id) === String(productId));
  const handleWishlist = (product) => {
    if (!isAuthenticated) {
      alert('Please login to use wishlist!');
      return;
    }
    if (isInWishlist(product._id)) {
      dispatch(removeFromWishlist(product._id));
    } else {
      dispatch(addToWishlist(product._id));
    }
  };

  const handleAddToCart = (product) => {
    dispatch(addToCartAsync({ product, quantity: 1 }));
  };

  const features = [
    {
      icon: <FaTruck className="text-3xl" />,
      title: 'Free Shipping',
      description: 'Free shipping on orders over ₹500'
    },
    {
      icon: <FaShieldAlt className="text-3xl" />,
      title: 'Secure Payment',
      description: '100% secure payment processing'
    },
    {
      icon: <FaHeadset className="text-3xl" />,
      title: '24/7 Support',
      description: 'Round the clock customer support'
    },
    {
      icon: <FaCreditCard className="text-3xl" />,
      title: 'Easy Returns',
      description: '30-day money back guarantee'
    }
  ];

  // Helper to slugify product name
  const slugify = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  // Helper to get image for product
  const getProductImage = (name) => `/product-images/${slugify(name)}.jpg`;

  // Filter only main categories (no parentCategory)
  const mainCategories = categories.filter(cat => !cat.parentCategory).slice(0, 6);

 

  // Fetch discover and recommended products from backend
  const [discoverProducts, setDiscoverProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  useEffect(() => {
    productAPI.getDiscoverProducts().then(res => setDiscoverProducts(res.data)).catch(() => setDiscoverProducts([]));
    productAPI.getRecommendedProducts().then(res => setRecommendedProducts(res.data)).catch(() => setRecommendedProducts([]));
  }, []);

  // Helper function to prepare product data for ProductCard
  const prepareProductForCard = (listing) => {
    return {
      ...listing.product,
      seller: listing.seller,
      sellerPrice: listing.sellerPrice,
      sellerProductId: listing._id
    };
  };

  // Fetch listed products for homepage
  const [listedProducts, setListedProducts] = useState([]);
  useEffect(() => {
    productAPI.getListedProducts().then(res => {
      setListedProducts(res.data);
    }).catch(() => setListedProducts([]));
  }, []);


  useEffect(() => {
    AOS.init({
      duration: 800, // animation duration in ms
      once: true,    // only animate once
    });
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroCarousel />


      {/* Categories Section */}
      <section className="py-16" data-aos="fade-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-aos="fade-up">
          <div className="flex justify-between items-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl font-bold text-center w-full md:w-auto" data-aos="fade-up">Shop by Category</h2>
            <Link
              to="/categories"
              className="hidden md:flex items-center text-primary-600 hover:text-primary-700 font-semibold ml-4"
              style={{ whiteSpace: 'nowrap' }}
            >
              View All Categories <FaArrowRight className="ml-2" />
            </Link>
          </div>
          <CategoriesGrid categories={mainCategories} circular />
          <div className="flex justify-center mt-8 md:hidden" data-aos="fade-up">
            <Link
              to="/categories"
              className="flex items-center text-green-600 hover:text-green-700 font-semibold text-lg"
            >
              View All Categories <FaArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

        {/* Features Section */}
      <section className="py-0 bg-gray-50" data-aos="fade-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Grid Layout */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-8" >
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="text-primary-600 mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Mobile Carousel Layout */}
          <div className="md:hidden "  >
            <Swiper 
              modules={[Pagination]}
              spaceBetween={12}
              slidesPerView={1}
              centeredSlides={true}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              loop={true}
              className="features-swiper"
            >
              {features.map((feature, index) => (
                <SwiperSlide key={index} >
                  <div className="text-center bg-white rounded-xl p-2 shadow-lg border border-gray-200 mx-2">
                    <div className="text-primary-600 mb-3 flex justify-center">
                      <div className="text-2xl">
                        {feature.icon}
                      </div>
                    </div>
                    <h3 className="text-base font-bold mb-2 text-gray-800">{feature.title}</h3>
                    <p className="text-gray-600 text-xs leading-relaxed">{feature.description}</p>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50" data-aos="fade-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-aos="fade-up">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold" data-aos="fade-up">Featured Products</h2>
            <Link
              to="/products"
              className="text-primary-600 hover:text-primary-700 font-semibold flex items-center"
            >
              View All
              <FaArrowRight className="ml-2" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center" data-aos="fade-up">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 justify-items-center">
              {(Array.isArray(featuredProducts) ? featuredProducts : []).slice(0, 12).map((listing) => (
                <ProductCard
                  key={listing._id}
                  product={prepareProductForCard(listing)}
                  isInWishlist={isInWishlist}
                  handleWishlist={handleWishlist}
                  handleAddToCart={() => handleAddToCart(prepareProductForCard(listing))}
                  showWishlist={true}
                  showAddToCart={true}
                  showRating={true}
                  showPrice={true}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Event Banner Section */}
      <EventBanner data-aos="fade-up" />

      {/* Discover More Products Section */}
      <section className="py-16" data-aos="fade-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-aos="fade-up">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold" data-aos="fade-up">Discover More Products</h2>
            <Link
              to="/products"
              className="text-primary-600 hover:text-primary-700 font-semibold flex items-center"
            >
              View All Products
              <FaArrowRight className="ml-2" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 justify-items-center">
            {discoverProducts.slice(0, 12).map((listing) => (
              <ProductCard
                key={listing._id}
                product={prepareProductForCard(listing)}
                isInWishlist={isInWishlist}
                handleWishlist={handleWishlist}
                handleAddToCart={() => handleAddToCart(prepareProductForCard(listing))}
                showWishlist={true}
                showAddToCart={true}
                showRating={true}
                showPrice={true}
              />
            ))}
          </div>
        </div>
      </section>

   <FoodCardsLayout data-aos="fade-up"/>
  
   

      {/* Products You Might Like Section */}
      <section className="py-16" data-aos="fade-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-aos="fade-up">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold" data-aos="fade-up">Products You Might Like</h2>
            <Link
              to="/products"
              className="text-primary-600 hover:text-primary-700 font-semibold flex items-center"
            >
              View All Products
              <FaArrowRight className="ml-2" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedProducts.slice(0, 8).map((listing) => (
              <ProductCard
                key={listing._id}
                product={prepareProductForCard(listing)}
                isInWishlist={isInWishlist}
                handleWishlist={handleWishlist}
                handleAddToCart={() => handleAddToCart(prepareProductForCard(listing))}
                showWishlist={true}
                showAddToCart={true}
                showRating={true}
                showPrice={true}
              />
            ))}
          </div>
        </div>
      </section>

      <DeliveryBanner data-aos="fade-up"/>    

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white" data-aos="fade-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center" data-aos="fade-up">
          <h2 className="text-3xl font-bold mb-4" data-aos="fade-up" >Ready to Start Selling?</h2>
          <p className="text-xl mb-8 text-primary-100" data-aos="fade-up" >
            Join thousands of vendors and start your e-commerce journey today.
          </p>
          <Link
            to="/login"
            className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
            data-aos="fade-up"
          >
            Become a Vendor
            <FaArrowRight className="ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home; 