import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCartAsync, fetchCart } from '../redux/slices/cartSlice';
import { addToWishlist } from '../redux/slices/wishlistSlice';
import { FaStar, FaShoppingCart, FaHeart, FaShare, FaTruck, FaShieldAlt, FaUndo } from 'react-icons/fa';
import { formatINR } from '../utils/formatCurrency';
import productAPI from '../api/productAPI';
import ProductDetail from '../components/common/ProductDetail';
import { toast } from 'react-toastify';
import { setLoading } from '../redux/slices/authSlice';

const ProductDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const navigate = useNavigate();

  // Fetch product with seller information
  useEffect(() => {
    setLoading(true);
    productAPI.getProductWithSellerInfo(id)
      .then(res => {
        setProduct(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleQuantityChange = (newQuantity) => {
    const maxStock = product?.sellerStock !== undefined ? product.sellerStock : (product?.stock || 1);
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = (product, quantity) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!product || !product._id) return;
    
    // Check if product has seller information
    if (!product.seller || !product.sellerProductId) {
      alert('This product is not available for purchase. Please contact the seller.');
      return;
    }
    
    dispatch(addToCartAsync({ 
      product: product._id, 
      seller: product.seller._id,
      sellerProduct: product.sellerProductId,
      quantity 
    }));
    dispatch(fetchCart());
  };

  const handleWishlist = (product) => {
    if (!isAuthenticated) {
      dispatch(setLoading(false));
      toast.info('Please login to use wishlist!');
      navigate('/login');
      return;
    }
    if (!product || !product._id) return;
    dispatch(addToWishlist(product._id));
  };

  const handleShare = (product) => {
    navigator.clipboard.writeText(window.location.href);
    alert('Product link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Product not found</h2>
          <Link to="/products" className="text-green-600 hover:text-green-800">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ProductDetail
      product={product}
      onAddToCart={handleAddToCart}
      onWishlist={handleWishlist}
      onShare={handleShare}
    />
  );
};

export default ProductDetailPage; 