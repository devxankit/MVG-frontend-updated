import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaStar, FaCompass, FaThumbsUp, FaBox, FaTag, FaDollarSign, FaWarehouse, FaEye, FaUser, FaCalendarAlt, FaImage } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import LoadMore from '../ui/LoadMore';
import { motion, AnimatePresence } from 'framer-motion';
import { formatINR } from '../../utils/formatCurrency';
import productAPI from '../../api/productAPI';
import axiosInstance from '../../api/axiosConfig';
import { toast } from 'react-toastify';

const AdminProducts = () => {
  const [activeTab, setActiveTab] = useState('admin-products');
  const [adminProducts, setAdminProducts] = useState([]);
  const [sellerListings, setSellerListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addProductForm, setAddProductForm] = useState({});
  const [addProductError, setAddProductError] = useState('');
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [editProductForm, setEditProductForm] = useState({});
  const [editProductError, setEditProductError] = useState('');
  const [editImageUploadProgress, setEditImageUploadProgress] = useState(0);
  const [editImagePreviews, setEditImagePreviews] = useState([]);
  
  // LoadMore state
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    fetchAllProducts();
  }, []);

  // Optional: Refresh data when switching tabs (uncomment if needed)
  // useEffect(() => {
  //   fetchProducts();
  // }, [activeTab]);

  // LoadMore doesn't need reset logic as it automatically handles new data

  useEffect(() => {
    setLoadingCategories(true);
    productAPI.getCategories()
      .then(res => setCategories(res.data || []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    setAddProductForm({ ...addProductForm, imageFiles: files });
    
    // Create image previews
    const previews = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });
    
    Promise.all(previews).then(setImagePreviews);
  };

  const removeImage = (index) => {
    const newFiles = addProductForm.imageFiles?.filter((_, i) => i !== index) || [];
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setAddProductForm({ ...addProductForm, imageFiles: newFiles });
    setImagePreviews(newPreviews);
  };

  const handleEditImageChange = (e) => {
    const files = Array.from(e.target.files);
    setEditProductForm({ ...editProductForm, imageFiles: files });
    
    // Create previews
    const newPreviews = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target.result);
        if (newPreviews.length === files.length) {
          setEditImagePreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeEditImage = (index) => {
    const newFiles = editImagePreviews.filter((_, i) => i !== index);
    setEditProductForm({ ...editProductForm, imageFiles: newFiles });
    setEditImagePreviews(newFiles);
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setViewDetailsOpen(true);
  };

  const handleEditProduct = (product) => {
    console.log('Editing product:', product); // Debug log
    console.log('Product images:', product.images); // Debug log
    console.log('Product description:', product.description); // Debug log
    console.log('Product productDescription:', product.productDescription); // Debug log
    
    setSelectedProduct(product);
    setEditProductForm({
      name: product.name || '',
      description: product.description || '',
      productDescription: product.productDescription || '',
      price: product.price || '',
      comparePrice: product.comparePrice || product.originalPrice || '',
      stock: product.stock || '',
      brand: product.brand || '',
      sku: product.sku || '',
      unit: product.unit || 'KG',
      category: product.category?._id || '',
      subCategory: product.subCategory?._id || '',
      features: product.features || '',
      tags: product.tags || '',
      images: product.images || []
    });
    setEditProductError('');
    setEditProductOpen(true);
  };

  // LoadMore handles loading automatically

  const fetchProducts = async () => {
    setLoading(true);
    try {
      if (activeTab === 'admin-products') {
        const res = await productAPI.getAdminProducts();
        setAdminProducts(res.data || []);
      } else {
        const res = await productAPI.adminGetAllSellerListings();
        setSellerListings(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    setLoading(true);
    try {
      // Load both admin products and seller listings
      const [adminRes, sellerRes] = await Promise.all([
        productAPI.getAdminProducts(),
        productAPI.adminGetAllSellerListings()
      ]);
      
      setAdminProducts(adminRes.data || []);
      setSellerListings(sellerRes.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchAllProducts();
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditProductError('');
    
    // Validation (same as add product form)
    if (!editProductForm.name?.trim()) return setEditProductError('Product name is required');
    if (!editProductForm.description?.trim()) return setEditProductError('Short description is required');
    if (!editProductForm.productDescription?.trim()) return setEditProductError('Detailed description is required');
    if (!editProductForm.price || isNaN(Number(editProductForm.price)) || Number(editProductForm.price) <= 0) return setEditProductError('Valid price is required');
    if (editProductForm.comparePrice && isNaN(Number(editProductForm.comparePrice))) return setEditProductError('Compare price must be a number');
    if (!editProductForm.stock || isNaN(Number(editProductForm.stock)) || Number(editProductForm.stock) < 0) return setEditProductError('Valid stock quantity is required');
    if (!editProductForm.brand?.trim()) return setEditProductError('Brand is required');
    if (!editProductForm.sku?.trim()) return setEditProductError('SKU is required');
    if (!editProductForm.category || String(editProductForm.category).length !== 24) return setEditProductError('Main category is required');
    if (!editProductForm.subCategory || String(editProductForm.subCategory).length !== 24) return setEditProductError('Subcategory is required');

    setActionLoading('editProduct');
    setEditImageUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('name', editProductForm.name);
      formData.append('description', editProductForm.description);
      formData.append('productDescription', editProductForm.productDescription);
      formData.append('price', String(Number(editProductForm.price)));
      if (editProductForm.comparePrice) formData.append('comparePrice', String(Number(editProductForm.comparePrice)));
      formData.append('stock', String(Number(editProductForm.stock)));
      formData.append('brand', editProductForm.brand);
      formData.append('sku', editProductForm.sku);
      formData.append('unit', editProductForm.unit || 'KG');
      formData.append('category', editProductForm.category);
      formData.append('subCategory', editProductForm.subCategory);
      if (editProductForm.features) formData.append('features', editProductForm.features);
      if (editProductForm.tags) formData.append('tags', editProductForm.tags);

      // Handle image uploads if new images are selected
      if (editProductForm.imageFiles && editProductForm.imageFiles.length > 0) {
        editProductForm.imageFiles.forEach(file => {
          formData.append('images', file);
        });
      }

      // Debug: Log form data contents
      console.log('Form data entries:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      console.log('Product ID:', selectedProduct._id); // Debug log
      
      const res = await productAPI.editProduct(selectedProduct._id, formData);
      console.log('Update response:', res.data); // Debug log
      
      // Update the product in the state
      setAdminProducts(prev => prev.map(p => 
        p._id === selectedProduct._id ? res.data.product || res.data : p
      ));
      
      toast.success('Product updated successfully');
      setEditProductOpen(false);
      setEditProductForm({});
      setSelectedProduct(null);
      setEditImageUploadProgress(0);
      setEditImagePreviews([]);
    } catch (error) {
      console.error('Error updating product:', error);
      setEditProductError(error.response?.data?.message || 'Failed to update product');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFeatureProduct = async (item, isFeatured) => {
    setActionLoading(item._id + 'feature');
    try {
      let res;
      if (activeTab === 'seller-listings') {
        if (isFeatured) {
          res = await productAPI.unfeatureSellerProduct(item._id);
        } else {
          res = await productAPI.featureSellerProduct(item._id);
        }
        setSellerListings(sellerListings.map(l => l._id === item._id ? res.data : l));
      } else {
        if (isFeatured) {
          res = await productAPI.unfeatureProduct(item._id);
        } else {
          res = await productAPI.featureProduct(item._id);
        }
        setAdminProducts(adminProducts.map(p => p._id === item._id ? res.data.product || res.data : p));
      }
      toast.success(isFeatured ? 'Product unfeatured' : 'Product featured');
    } catch (error) {
      toast.error('Failed to update product feature status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDiscoverProduct = async (item, isDiscover) => {
    setActionLoading(item._id + 'discover');
    try {
      let res;
      if (activeTab === 'seller-listings') {
        if (isDiscover) {
          res = await productAPI.undiscoverSellerProduct(item._id);
        } else {
          res = await productAPI.discoverSellerProduct(item._id);
        }
        setSellerListings(sellerListings.map(l => l._id === item._id ? res.data : l));
      } else {
        if (isDiscover) {
          res = await productAPI.unsetDiscoverProduct(item._id);
        } else {
          res = await productAPI.setDiscoverProduct(item._id);
        }
        setAdminProducts(adminProducts.map(p => p._id === item._id ? res.data.product || res.data : p));
      }
      toast.success(isDiscover ? 'Product undiscovered' : 'Product discovered');
    } catch (error) {
      toast.error('Failed to update product discover status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRecommendProduct = async (item, isRecommended) => {
    setActionLoading(item._id + 'recommend');
    try {
      let res;
      if (activeTab === 'seller-listings') {
        if (isRecommended) {
          res = await productAPI.unrecommendSellerProduct(item._id);
        } else {
          res = await productAPI.recommendSellerProduct(item._id);
        }
        setSellerListings(sellerListings.map(l => l._id === item._id ? res.data : l));
      } else {
        if (isRecommended) {
          res = await productAPI.unsetRecommendedProduct(item._id);
        } else {
          res = await productAPI.setRecommendedProduct(item._id);
        }
        setAdminProducts(adminProducts.map(p => p._id === item._id ? res.data.product || res.data : p));
      }
      toast.success(isRecommended ? 'Product unrecommended' : 'Product recommended');
    } catch (error) {
      toast.error('Failed to update product recommend status');
    } finally {
      setActionLoading(null);
    }
  };

  const getSellerDisplay = seller => seller?.businessName || seller?.email || seller?._id || 'N/A';

  const filteredAdminProducts = adminProducts.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSellerListings = sellerListings.filter(listing =>
    listing.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getSellerDisplay(listing.seller).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // LoadMore will handle the items display automatically

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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Product Management</h2>
          <p className="text-gray-600 text-sm sm:text-base">Manage admin products and seller listings</p>
        </div>
        <Button 
          onClick={() => setAddProductOpen(true)} 
          className="
            bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md
            transition-colors duration-200 focus:ring-2 focus:ring-blue-300 focus:ring-offset-2
            text-sm sm:text-base
          "
        >
          <FaPlus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards - Mobile Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Admin Products</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{adminProducts.length}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-blue-50">
                <FaPlus className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Seller Listings</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{sellerListings.length}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-green-50">
                <FaEdit className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Featured Products</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                  {adminProducts.filter(p => p.isFeatured).length + sellerListings.filter(l => l.isFeatured).length}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-yellow-50">
                <FaStar className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active Sellers</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">
                  {new Set(sellerListings.map(l => l.seller?._id || l.seller)).size}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-purple-50">
                <FaThumbsUp className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
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
              placeholder="Search products by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clean Tabs - Mobile Responsive */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Simple Tab Navigation */}
            <div className="bg-gray-50 p-1">
              <TabsList className="grid w-full grid-cols-2 h-auto bg-transparent p-1 rounded-lg border-0">
                <TabsTrigger
                  value="admin-products"
                  className="
                    flex items-center justify-center gap-2 p-3 sm:p-4 rounded-md transition-all duration-200
                    data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-blue-200
                    hover:bg-white/70
                  "
                >
                  <div className="flex items-center gap-2">
                    <div className={`
                      p-1.5 rounded-md transition-colors duration-200
                      ${activeTab === 'admin-products' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-500'
                      }
                    `}>
                      <FaBox className="w-4 h-4" />
                    </div>
                    <div className="text-center">
                      <div className={`
                        font-semibold text-sm transition-colors duration-200
                        ${activeTab === 'admin-products' ? 'text-blue-700' : 'text-gray-700'}
                      `}>
                        Admin Products
                      </div>
                      <div className={`
                        text-xs transition-colors duration-200
                        ${activeTab === 'admin-products' ? 'text-blue-500' : 'text-gray-500'}
                      `}>
                        {adminProducts.length} products
                      </div>
                    </div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger
                  value="seller-listings"
                  className="
                    flex items-center justify-center gap-2 p-3 sm:p-4 rounded-md transition-all duration-200
                    data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-green-200
                    hover:bg-white/70
                  "
                >
                  <div className="flex items-center gap-2">
                    <div className={`
                      p-1.5 rounded-md transition-colors duration-200
                      ${activeTab === 'seller-listings' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-500'
                      }
                    `}>
                      <FaTag className="w-4 h-4" />
                    </div>
                    <div className="text-center">
                      <div className={`
                        font-semibold text-sm transition-colors duration-200
                        ${activeTab === 'seller-listings' ? 'text-green-700' : 'text-gray-700'}
                      `}>
                        Seller Listings
                      </div>
                      <div className={`
                        text-xs transition-colors duration-200
                        ${activeTab === 'seller-listings' ? 'text-green-500' : 'text-gray-500'}
                      `}>
                        {sellerListings.length} listings
                      </div>
                    </div>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4 sm:p-6">
              <TabsContent value="admin-products" className="space-y-4 mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Admin Product Templates ({filteredAdminProducts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <LoadMore 
                  items={filteredAdminProducts} 
                  itemsPerPage={itemsPerPage}
                  autoLoad={false}
                  className="space-y-6"
                >
                  {(displayedItems) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      <AnimatePresence>
                        {displayedItems.map((product, index) => (
                      <motion.div
                        key={product._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className="group"
                      >
                        <Card className="h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 border-l-blue-500">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  <img 
                                    src={product.images?.[0]?.url || '/product-images/default.webp'} 
                                    alt={product.name} 
                                    className="w-16 h-16 object-cover rounded-lg border shadow-sm"
                                  />
                                  {product.isFeatured && (
                                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-white rounded-full p-1">
                                      <FaStar className="w-3 h-3" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                                    {product.name}
                                  </h3>
                                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                                    {product.brand || 'No Brand'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col space-y-1">
                                {product.isFeatured && (
                                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                    Featured
                                  </Badge>
                                )}
                                {product.isDiscover && (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                                    Discover
                                  </Badge>
                                )}
                                {product.isRecommended && (
                                  <Badge className="bg-green-100 text-green-800 text-xs">
                                    Recommended
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex items-center text-xs sm:text-sm text-gray-600">
                                <FaTag className="w-3 h-3 mr-2 text-gray-400" />
                                <span className="truncate">
                                  {product.category?.name}
                                  {product.subCategory?.name && ` → ${product.subCategory.name}`}
                                </span>
                              </div>
                              <div className="flex items-center text-xs sm:text-sm text-gray-600">
                                <FaDollarSign className="w-3 h-3 mr-2 text-gray-400" />
                                <span className="font-semibold text-green-600">
                                  {product.price ? formatINR(product.price) : 'Price N/A'}
                                </span>
                              </div>
                              <div className="flex items-center text-xs sm:text-sm text-gray-600">
                                <FaWarehouse className="w-3 h-3 mr-2 text-gray-400" />
                                <span>Stock: {product.stock || '0'}</span>
                              </div>
                              {product.sku && (
                                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                                  <FaBox className="w-3 h-3 mr-2 text-gray-400" />
                                  <span>SKU: {product.sku}</span>
                                </div>
                              )}
                            </div>

                            <div className="pt-3 border-t border-gray-100">
                              {/* Action Buttons - Row 1 */}
                              <div className="flex items-center gap-2 mb-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleFeatureProduct(product, product.isFeatured)}
                                      disabled={actionLoading === product._id + 'feature'}
                                      className={`
                                        h-8 w-8 p-0 rounded-lg transition-all duration-200
                                        ${product.isFeatured ? 'bg-yellow-50 text-yellow-600 shadow-sm' : 'bg-gray-50 hover:bg-yellow-50 hover:text-yellow-600 hover:shadow-sm'}
                                        focus:ring-2 focus:ring-yellow-300 focus:ring-offset-1
                                        disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                                      `}
                                    >
                                      <FaStar className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{product.isFeatured ? 'Unfeature' : 'Feature'} Product</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDiscoverProduct(product, product.isDiscover)}
                                      disabled={actionLoading === product._id + 'discover'}
                                      className={`
                                        h-8 w-8 p-0 rounded-lg transition-all duration-200
                                        ${product.isDiscover ? 'bg-blue-50 text-blue-600 shadow-sm' : 'bg-gray-50 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm'}
                                        focus:ring-2 focus:ring-blue-300 focus:ring-offset-1
                                        disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                                      `}
                                    >
                                      <FaCompass className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{product.isDiscover ? 'Remove from' : 'Add to'} Discover</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRecommendProduct(product, product.isRecommended)}
                                      disabled={actionLoading === product._id + 'recommend'}
                                      className={`
                                        h-8 w-8 p-0 rounded-lg transition-all duration-200
                                        ${product.isRecommended ? 'bg-green-50 text-green-600 shadow-sm' : 'bg-gray-50 hover:bg-green-50 hover:text-green-600 hover:shadow-sm'}
                                        focus:ring-2 focus:ring-green-300 focus:ring-offset-1
                                        disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                                      `}
                                    >
                                      <FaThumbsUp className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{product.isRecommended ? 'Unrecommend' : 'Recommend'} Product</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              
                              {/* Action Buttons - Row 2 */}
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditProduct(product)}
                                        className="
                                          h-8 w-8 p-0 rounded-lg bg-gray-50 hover:bg-yellow-50 hover:text-yellow-600 hover:shadow-sm
                                          transition-all duration-200 focus:ring-2 focus:ring-yellow-300 focus:ring-offset-1
                                        "
                                      >
                                        <FaEdit className="w-3 h-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit Product</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewDetails(product)}
                                        className="
                                          h-8 w-8 p-0 rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm
                                          transition-all duration-200 focus:ring-2 focus:ring-blue-300 focus:ring-offset-1
                                        "
                                      >
                                        <FaEye className="w-3 h-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View Details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={async () => {
                                          if (!window.confirm('Delete this product?')) return;
                                          setActionLoading(product._id + 'delete');
                                          try {
                                            await productAPI.deleteProduct(product._id);
                                            setAdminProducts((prev) => prev.filter(p => p._id !== product._id));
                                            toast.success('Product deleted');
                                          } finally {
                                            setActionLoading(null);
                                          }
                                        }}
                                        disabled={actionLoading === product._id + 'delete'}
                                        className="
                                          h-8 w-8 p-0 rounded-lg bg-gray-50 hover:bg-red-50 hover:text-red-600 hover:shadow-sm
                                          transition-all duration-200 focus:ring-2 focus:ring-red-300 focus:ring-offset-1
                                          disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                                        "
                                      >
                                        <FaTrash className="w-3 h-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Delete Product</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md font-mono">
                                  ID: {product._id.slice(-6)}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </LoadMore>
              </TooltipProvider>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seller-listings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Seller Listings ({filteredSellerListings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <LoadMore 
                  items={filteredSellerListings} 
                  itemsPerPage={itemsPerPage}
                  autoLoad={false}
                  className="space-y-6"
                >
                  {(displayedItems) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      <AnimatePresence>
                        {displayedItems.map((listing, index) => (
                      <motion.div
                        key={listing._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className="group"
                      >
                        <Card className="h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 border-l-green-500">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  <img 
                                    src={listing.product?.images?.[0]?.url || '/product-images/default.webp'} 
                                    alt={listing.product?.name} 
                                    className="w-16 h-16 object-cover rounded-lg border shadow-sm"
                                  />
                                  {listing.isFeatured && (
                                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-white rounded-full p-1">
                                      <FaStar className="w-3 h-3" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                                    {listing.product?.name}
                                  </h3>
                                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                                    Seller: {getSellerDisplay(listing.seller)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col space-y-1">
                                <Badge className={listing.isListed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                  {listing.isListed ? 'Active' : 'Unlisted'}
                                </Badge>
                                {listing.isFeatured && (
                                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                    Featured
                                  </Badge>
                                )}
                                {listing.isDiscover && (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                                    Discover
                                  </Badge>
                                )}
                                {listing.isRecommended && (
                                  <Badge className="bg-green-100 text-green-800 text-xs">
                                    Recommended
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex items-center text-xs sm:text-sm text-gray-600">
                                <FaDollarSign className="w-3 h-3 mr-2 text-gray-400" />
                                <span className="font-semibold text-green-600">
                                  Seller: {formatINR(listing.sellerPrice)}
                                </span>
                              </div>
                              <div className="flex items-center text-xs sm:text-sm text-gray-600">
                                <FaDollarSign className="w-3 h-3 mr-2 text-gray-400" />
                                <span>Default: {listing.product?.price ? formatINR(listing.product.price) : 'N/A'}</span>
                              </div>
                              <div className="flex items-center text-xs sm:text-sm text-gray-600">
                                <FaBox className="w-3 h-3 mr-2 text-gray-400" />
                                <span>SKU: {listing.product?.sku || 'N/A'}</span>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-gray-100">
                              {/* Action Buttons - Row 1 */}
                              <div className="flex items-center gap-2 mb-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleFeatureProduct(listing, listing.isFeatured)}
                                      disabled={actionLoading === listing._id + 'feature'}
                                      className={`
                                        h-8 w-8 p-0 rounded-lg transition-all duration-200
                                        ${listing.isFeatured ? 'bg-yellow-50 text-yellow-600 shadow-sm' : 'bg-gray-50 hover:bg-yellow-50 hover:text-yellow-600 hover:shadow-sm'}
                                        focus:ring-2 focus:ring-yellow-300 focus:ring-offset-1
                                        disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                                      `}
                                    >
                                      <FaStar className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{listing.isFeatured ? 'Unfeature' : 'Feature'} Listing</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDiscoverProduct(listing, listing.isDiscover)}
                                      disabled={actionLoading === listing._id + 'discover'}
                                      className={`
                                        h-8 w-8 p-0 rounded-lg transition-all duration-200
                                        ${listing.isDiscover ? 'bg-blue-50 text-blue-600 shadow-sm' : 'bg-gray-50 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm'}
                                        focus:ring-2 focus:ring-blue-300 focus:ring-offset-1
                                        disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                                      `}
                                    >
                                      <FaCompass className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{listing.isDiscover ? 'Remove from' : 'Add to'} Discover</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRecommendProduct(listing, listing.isRecommended)}
                                      disabled={actionLoading === listing._id + 'recommend'}
                                      className={`
                                        h-8 w-8 p-0 rounded-lg transition-all duration-200
                                        ${listing.isRecommended ? 'bg-green-50 text-green-600 shadow-sm' : 'bg-gray-50 hover:bg-green-50 hover:text-green-600 hover:shadow-sm'}
                                        focus:ring-2 focus:ring-green-300 focus:ring-offset-1
                                        disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                                      `}
                                    >
                                      <FaThumbsUp className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{listing.isRecommended ? 'Unrecommend' : 'Recommend'} Listing</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              
                              {/* Action Buttons - Row 2 */}
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewDetails(listing)}
                                        className="
                                          h-8 w-8 p-0 rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm
                                          transition-all duration-200 focus:ring-2 focus:ring-blue-300 focus:ring-offset-1
                                        "
                                      >
                                        <FaEye className="w-3 h-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View Details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md font-mono">
                                  ID: {listing._id.slice(-6)}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </LoadMore>
              </TooltipProvider>
            </CardContent>
          </Card>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Product Modal */}
      <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>

          {addProductError && (
            <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm mb-2">
              {addProductError}
            </div>
          )}

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setAddProductError('');
              // validation
              if (!addProductForm.name?.trim()) return setAddProductError('Product name is required');
              if (!addProductForm.description?.trim()) return setAddProductError('Short description is required');
              if (!addProductForm.productDescription?.trim()) return setAddProductError('Detailed description is required');
              if (!addProductForm.price || isNaN(Number(addProductForm.price)) || Number(addProductForm.price) <= 0) return setAddProductError('Valid price is required');
              if (addProductForm.comparePrice && isNaN(Number(addProductForm.comparePrice))) return setAddProductError('Compare price must be a number');
              if (!addProductForm.stock || isNaN(Number(addProductForm.stock)) || Number(addProductForm.stock) < 0) return setAddProductError('Valid stock quantity is required');
              if (!addProductForm.brand?.trim()) return setAddProductError('Brand is required');
              if (!addProductForm.sku?.trim()) return setAddProductError('SKU is required');
              if (!addProductForm.category || String(addProductForm.category).length !== 24) return setAddProductError('Main category is required');
              if (!addProductForm.subCategory || String(addProductForm.subCategory).length !== 24) return setAddProductError('Subcategory is required');

              setActionLoading('addProduct');
              setImageUploadProgress(0);
              try {
                const formData = new FormData();
                formData.append('name', addProductForm.name);
                formData.append('description', addProductForm.description);
                formData.append('productDescription', addProductForm.productDescription);
                formData.append('price', String(Number(addProductForm.price)));
                if (addProductForm.comparePrice) formData.append('comparePrice', String(Number(addProductForm.comparePrice)));
                formData.append('stock', String(Number(addProductForm.stock)));
                formData.append('brand', addProductForm.brand);
                formData.append('sku', addProductForm.sku);
                formData.append('unit', addProductForm.unit || 'KG');
                formData.append('category', addProductForm.category);
                formData.append('subCategory', addProductForm.subCategory);
                if (addProductForm.features) formData.append('features', addProductForm.features);
                if (addProductForm.tags) formData.append('tags', addProductForm.tags);
                if (addProductForm.imageFiles && addProductForm.imageFiles.length > 0) {
                  addProductForm.imageFiles.forEach((file) => formData.append('images', file));
                }
                const res = await axiosInstance.post('/admin/create-product', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' },
                  onUploadProgress: (evt) => {
                    const percent = Math.round((evt.loaded * 100) / (evt.total || 1));
                    setImageUploadProgress(percent);
                  },
                });
                toast.success('Product created successfully');
                setAdminProducts((prev) => [...prev, res.data.product || res.data]);
                setAddProductOpen(false);
                setAddProductForm({});
                setImageUploadProgress(0);
                setImagePreviews([]);
              } catch (err) {
                setAddProductError(err?.response?.data?.message || 'Failed to create product');
              } finally {
                setActionLoading(null);
              }
            }}
            className="space-y-6"
          >
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <Input value={addProductForm.name || ''} onChange={(e) => setAddProductForm({ ...addProductForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                  <Input value={addProductForm.brand || ''} onChange={(e) => setAddProductForm({ ...addProductForm, brand: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                  <Input value={addProductForm.sku || ''} onChange={(e) => setAddProductForm({ ...addProductForm, sku: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Description *</label>
                  <Input value={addProductForm.description || ''} onChange={(e) => setAddProductForm({ ...addProductForm, description: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Detailed Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description *</label>
              <Textarea rows={4} value={addProductForm.productDescription || ''} onChange={(e) => setAddProductForm({ ...addProductForm, productDescription: e.target.value })} />
            </div>

            {/* Pricing & Stock */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing & Stock</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                  <Input type="number" step="0.01" min="0" value={addProductForm.price || ''} onChange={(e) => setAddProductForm({ ...addProductForm, price: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compare Price (₹)</label>
                  <Input type="number" step="0.01" min="0" value={addProductForm.comparePrice || ''} onChange={(e) => setAddProductForm({ ...addProductForm, comparePrice: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                  <Input type="number" min="0" value={addProductForm.stock || ''} onChange={(e) => setAddProductForm({ ...addProductForm, stock: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                  <Select value={addProductForm.unit || 'KG'} onValueChange={(v) => setAddProductForm({ ...addProductForm, unit: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KG">KG (Kilogram)</SelectItem>
                      <SelectItem value="Liter">Liter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Main Category *</label>
                  <Select value={addProductForm.category || ''} onValueChange={(v) => setAddProductForm({ ...addProductForm, category: v, subCategory: '' })}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingCategories ? 'Loading...' : 'Select main category'} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => !c.parentCategory).map(c => (
                        <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory *</label>
                  <Select value={addProductForm.subCategory || ''} onValueChange={(v) => setAddProductForm({ ...addProductForm, subCategory: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder={!addProductForm.category ? 'Select main category first' : 'Select subcategory'} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c.parentCategory === addProductForm.category).map(sc => (
                        <SelectItem key={sc._id} value={sc._id}>{sc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Features & Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features (comma-separated)</label>
                <Input value={addProductForm.features || ''} onChange={(e) => setAddProductForm({ ...addProductForm, features: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                <Input value={addProductForm.tags || ''} onChange={(e) => setAddProductForm({ ...addProductForm, tags: e.target.value })} />
              </div>
            </div>

            {/* Images */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Images</h3>
              <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center">
                <input type="file" multiple accept="image/*" id="add-product-images" className="hidden" onChange={handleImageChange} />
                <label htmlFor="add-product-images" className="cursor-pointer text-blue-600">Click to upload images</label>
                {Array.isArray(addProductForm.imageFiles) && addProductForm.imageFiles.length > 0 && (
                  <div className="mt-3 text-sm text-gray-600">{addProductForm.imageFiles.length} file(s) selected</div>
                )}
                {actionLoading === 'addProduct' && (
                  <div className="mt-3 text-xs text-gray-500">Uploading... {imageUploadProgress}%</div>
                )}
              </div>
              
              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Image Previews:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={preview} 
                          alt={`Preview ${index + 1}`} 
                          className="w-full h-24 object-cover rounded-lg border shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setAddProductOpen(false);
                setImagePreviews([]);
              }}>Cancel</Button>
              <Button type="submit" disabled={actionLoading === 'addProduct'}>{actionLoading === 'addProduct' ? 'Saving...' : 'Create Product'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={editProductOpen} onOpenChange={setEditProductOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>

          {editProductError && (
            <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm mb-2">
              {editProductError}
            </div>
          )}

          <form onSubmit={handleEditSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <Input value={editProductForm.name || ''} onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                  <Input value={editProductForm.brand || ''} onChange={(e) => setEditProductForm({ ...editProductForm, brand: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                  <Input value={editProductForm.sku || ''} onChange={(e) => setEditProductForm({ ...editProductForm, sku: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Description *</label>
                  <Input value={editProductForm.description || ''} onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Detailed Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description *</label>
              {/* Debug log */}
              {console.log('Edit form productDescription value:', editProductForm.productDescription)}
              <Textarea rows={4} value={editProductForm.productDescription || ''} onChange={(e) => setEditProductForm({ ...editProductForm, productDescription: e.target.value })} />
            </div>

            {/* Pricing & Stock */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing & Stock</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                  <Input type="number" step="0.01" min="0" value={editProductForm.price || ''} onChange={(e) => setEditProductForm({ ...editProductForm, price: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compare Price (₹)</label>
                  <Input type="number" step="0.01" min="0" value={editProductForm.comparePrice || ''} onChange={(e) => setEditProductForm({ ...editProductForm, comparePrice: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                  <Input type="number" min="0" value={editProductForm.stock || ''} onChange={(e) => setEditProductForm({ ...editProductForm, stock: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                  <Select value={editProductForm.unit || 'KG'} onValueChange={(v) => setEditProductForm({ ...editProductForm, unit: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KG">KG (Kilogram)</SelectItem>
                      <SelectItem value="Liter">Liter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Main Category *</label>
                  <Select value={editProductForm.category || ''} onValueChange={(v) => setEditProductForm({ ...editProductForm, category: v, subCategory: '' })}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingCategories ? 'Loading...' : 'Select main category'} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => !c.parentCategory).map(c => (
                        <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory *</label>
                  <Select value={editProductForm.subCategory || ''} onValueChange={(v) => setEditProductForm({ ...editProductForm, subCategory: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder={!editProductForm.category ? 'Select main category first' : 'Select subcategory'} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c.parentCategory === editProductForm.category).map(sc => (
                        <SelectItem key={sc._id} value={sc._id}>{sc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Features & Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features (comma-separated)</label>
                <Input value={editProductForm.features || ''} onChange={(e) => setEditProductForm({ ...editProductForm, features: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                <Input value={editProductForm.tags || ''} onChange={(e) => setEditProductForm({ ...editProductForm, tags: e.target.value })} />
              </div>
            </div>

            {/* Images */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Images</h3>
              <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center">
                <input type="file" multiple accept="image/*" id="edit-product-images" className="hidden" onChange={handleEditImageChange} />
                <label htmlFor="edit-product-images" className="cursor-pointer text-blue-600">Click to upload new images</label>
                {Array.isArray(editProductForm.imageFiles) && editProductForm.imageFiles.length > 0 && (
                  <div className="mt-3 text-sm text-gray-600">{editProductForm.imageFiles.length} file(s) selected</div>
                )}
                {actionLoading === 'editProduct' && (
                  <div className="mt-3 text-xs text-gray-500">Uploading... {editImageUploadProgress}%</div>
                )}
              </div>
              
              {/* Current Images */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images:</h4>
                {/* Debug info */}
                {console.log('Edit form images:', editProductForm.images)}
                {editProductForm.images && editProductForm.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {editProductForm.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={image?.url || image || '/product-images/default.webp'} 
                          alt={`Current ${index + 1}`} 
                          className="w-full h-24 object-cover rounded-lg border shadow-sm"
                          onError={(e) => {
                            e.target.src = '/product-images/default.webp';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <FaImage className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No images currently uploaded</p>
                  </div>
                )}
              </div>
              
              {/* New Image Previews */}
              {editImagePreviews.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">New Image Previews:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {editImagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={preview} 
                          alt={`Preview ${index + 1}`} 
                          className="w-full h-24 object-cover rounded-lg border shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeEditImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setEditProductOpen(false);
                setEditProductForm({});
                setEditProductError('');
                setEditImageUploadProgress(0);
                setEditImagePreviews([]);
              }}>Cancel</Button>
              <Button type="submit" disabled={actionLoading === 'editProduct'}>
                {actionLoading === 'editProduct' ? 'Updating...' : 'Update Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Product Details Modal */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaEye className="w-5 h-5 text-blue-600" />
              Product Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-6">
              {/* Product Header */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-shrink-0">
                  {(() => {
                    // Handle both admin products and seller listings
                    const images = selectedProduct.product?.images || selectedProduct.images;
                    const productName = selectedProduct.product?.name || selectedProduct.name;
                    
                    if (images && images[0]) {
                      return (
                        <img 
                          src={images[0].url || images[0]} 
                          alt={productName}
                          className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-lg border shadow-sm"
                        />
                      );
                    } else {
                      return (
                        <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FaImage className="w-8 h-8 text-gray-400" />
                        </div>
                      );
                    }
                  })()}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    {selectedProduct.product?.name || selectedProduct.name}
                  </h2>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedProduct.isFeatured && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <FaStar className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    {selectedProduct.isDiscover && (
                      <Badge className="bg-blue-100 text-blue-800">
                        <FaCompass className="w-3 h-3 mr-1" />
                        Discover
                      </Badge>
                    )}
                    {selectedProduct.isRecommended && (
                      <Badge className="bg-green-100 text-green-800">
                        <FaThumbsUp className="w-3 h-3 mr-1" />
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {selectedProduct.product?.description || selectedProduct.description}
                  </p>
                </div>
              </div>

              {/* Product Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FaBox className="w-4 h-4 text-blue-600" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product ID:</span>
                      <span className="font-mono text-sm">{selectedProduct.product?._id || selectedProduct._id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Brand:</span>
                      <span className="font-medium">{selectedProduct.product?.brand || selectedProduct.brand || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{selectedProduct.product?.category?.name || selectedProduct.category?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stock:</span>
                      <span className="font-medium">{selectedProduct.product?.stock || selectedProduct.stock || 0} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className={(selectedProduct.product?.isApproved || selectedProduct.isApproved) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {(selectedProduct.product?.isApproved || selectedProduct.isApproved) ? 'Approved' : 'Pending'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FaDollarSign className="w-4 h-4 text-green-600" />
                      Pricing Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-bold text-lg text-green-600">
                        {formatINR(selectedProduct.product?.price || selectedProduct.price)}
                      </span>
                    </div>
                    {(selectedProduct.product?.originalPrice || selectedProduct.originalPrice) && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Original Price:</span>
                        <span className="text-gray-500 line-through">
                          {formatINR(selectedProduct.product?.originalPrice || selectedProduct.originalPrice)}
                        </span>
                      </div>
                    )}
                    {(selectedProduct.product?.discount || selectedProduct.discount) && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium text-red-600">
                          {selectedProduct.product?.discount || selectedProduct.discount}%
                        </span>
                      </div>
                    )}
                    {selectedProduct.sellerPrice && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Seller Price:</span>
                        <span className="font-medium text-blue-600">
                          {formatINR(selectedProduct.sellerPrice)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Seller Information (for seller listings) */}
              {selectedProduct.seller && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FaUser className="w-4 h-4 text-purple-600" />
                      Seller Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Business Name:</span>
                      <span className="font-medium">{selectedProduct.seller.businessName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedProduct.seller.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{selectedProduct.seller.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className={selectedProduct.seller.isApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {selectedProduct.seller.isApproved ? 'Approved' : 'Pending'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Additional Images */}
              {(() => {
                const images = selectedProduct.product?.images || selectedProduct.images;
                const productName = selectedProduct.product?.name || selectedProduct.name;
                
                return images && images.length > 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FaImage className="w-4 h-4 text-indigo-600" />
                        Additional Images
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {images.slice(1).map((image, index) => (
                          <img 
                            key={index}
                            src={image.url || image} 
                            alt={`${productName} ${index + 2}`}
                            className="w-full h-24 object-cover rounded-md border shadow-sm hover:shadow-md transition-shadow"
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Timestamps */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FaCalendarAlt className="w-4 h-4 text-gray-600" />
                    Timestamps
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">
                      {new Date(selectedProduct.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium">
                      {new Date(selectedProduct.updatedAt).toLocaleString()}
                    </span>
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

export default AdminProducts;
