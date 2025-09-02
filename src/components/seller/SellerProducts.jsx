import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaTimes } from 'react-icons/fa';
import { formatINR } from '../../utils/formatCurrency';
import sellerAPI from '../../api/sellerAPI';
import productAPI from '../../api/productAPI';
import axiosInstance from '../../api/axiosConfig';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import VariantManager from '../common/VariantManager';

const SellerProducts = () => {
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
  const [editModal, setEditModal] = useState({ open: false, product: null });
  const [editProduct, setEditProduct] = useState({});
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [soldCountEdits, setSoldCountEdits] = useState({});
  const [soldCountLoading, setSoldCountLoading] = useState({});
  const [adminProducts, setAdminProducts] = useState([]);
  const [sellerListings, setSellerListings] = useState([]);
  const [listingLoading, setListingLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedMainCat, setSelectedMainCat] = useState('');
  const [selectedSubCat, setSelectedSubCat] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sellerPrice, setSellerPrice] = useState('');
  const [sellerStock, setSellerStock] = useState('');
  const [listingError, setListingError] = useState('');
  const [showListingModal, setShowListingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [editStock, setEditStock] = useState('');

  // Fetch data on mount
  useEffect(() => {
    setLoading(true);
    sellerAPI.getProducts()
      .then(res => setProducts(res.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    productAPI.getAdminProducts().then(res => setAdminProducts(res.data)).catch(() => setAdminProducts([]));
    productAPI.sellerGetListings().then(res => setSellerListings(res.data)).catch(() => setSellerListings([]));
  }, []);

  useEffect(() => {
    productAPI.getCategories().then(res => setCategories(res.data)).catch(() => setCategories([]));
  }, []);

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

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await sellerAPI.deleteProduct(id);
      setProducts(products.filter((p) => p._id !== id));
    } catch {}
  };

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
    try {
      const res = await sellerAPI.editProduct(editModal.product._id, formData);
      setProducts(products.map(p => p._id === editModal.product._id ? res.data : p));
      setEditModal({ open: false, product: null });
    } catch (err) {
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
    if (selectedProductForVariants) {
      try {
        const res = await productAPI.getProductById(selectedProductForVariants._id);
        setSelectedProductForVariants(res.data);
        const productsRes = await sellerAPI.getProducts();
        setProducts(productsRes.data);
      } catch (error) {
        console.error('Failed to refresh product data:', error);
      }
    }
  };

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

  const handleListProduct = async () => {
    setListingLoading(true);
    setListingError('');
    
    // Double-check if product is already listed (client-side validation)
    const isAlreadyListed = sellerListings.some(listing => 
      listing.product && 
      (typeof listing.product === 'object' ? listing.product._id : listing.product) === selectedProduct._id &&
      listing.isListed
    );
    
    if (isAlreadyListed) {
      setListingError('This product is already listed. Please select a different product.');
      setListingLoading(false);
      return;
    }
    
    try {
      await productAPI.sellerListProduct(selectedProduct._id, sellerPrice, sellerStock);
      const res = await productAPI.sellerGetListings();
      setSellerListings(res.data);
      setStep(1);
      setSelectedMainCat('');
      setSelectedSubCat('');
      setSelectedProduct(null);
      setSellerPrice('');
      setSellerStock('');
    } catch (err) {
      setListingError(err.response?.data?.message || 'Failed to list product');
    } finally {
      setListingLoading(false);
    }
  };

  const handleUpdatePrice = async (sellerProductId, newPrice) => {
    setListingLoading(true);
    try {
      await productAPI.sellerUpdatePrice(sellerProductId, newPrice);
      const res = await productAPI.sellerGetListings();
      setSellerListings(res.data);
    } catch {}
    setListingLoading(false);
  };

  const handleUnlist = async (sellerProductId) => {
    setListingLoading(true);
    try {
      await productAPI.sellerUnlistProduct(sellerProductId);
      const res = await productAPI.sellerGetListings();
      setSellerListings(res.data);
    } catch {}
    setListingLoading(false);
  };

  const handleEditListing = (listing) => {
    setEditingListing(listing);
    setEditPrice(listing.sellerPrice.toString());
    setEditStock(listing.sellerStock.toString());
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditStock = (listing) => {
    setEditingStock(listing);
    setEditStock(listing.sellerStock.toString());
    setEditError('');
    setShowStockModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editPrice || editPrice <= 0) {
      setEditError('Please enter a valid price');
      return;
    }
    
    if (!editStock || editStock < 0) {
      setEditError('Please enter a valid stock quantity');
      return;
    }
    
    setEditLoading(true);
    setEditError('');
    try {
      await productAPI.sellerUpdatePrice(editingListing._id, parseFloat(editPrice));
      await productAPI.sellerUpdateStock(editingListing._id, parseFloat(editStock));
      const res = await productAPI.sellerGetListings();
      setSellerListings(res.data);
      setShowEditModal(false);
      setEditingListing(null);
      setEditPrice('');
      setEditStock('');
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update product');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveStockEdit = async () => {
    if (!editStock || editStock < 0) {
      setEditError('Please enter a valid stock quantity');
      return;
    }
    
    setEditLoading(true);
    setEditError('');
    try {
      await productAPI.sellerUpdateStock(editingStock._id, parseFloat(editStock));
      const res = await productAPI.sellerGetListings();
      setSellerListings(res.data);
      setShowStockModal(false);
      setEditingStock(null);
      setEditStock('');
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">My Listings</h3>
        <Button
          onClick={() => { setShowListingModal(true); setStep(1); }}
          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <FaPlus className="w-4 h-4" /> List New Product
        </Button>
      </div>

      {/* Seller's current listings */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-lg sm:text-xl font-bold text-gray-900">Your Current Listings</h4>
            <p className="text-sm text-gray-600 mt-1">Manage your active product listings</p>
          </div>
          <div className="text-sm text-gray-500">
            {sellerListings.filter(l => l.isListed).length} Active
          </div>
        </div>
        {listingLoading && (
          <div className="flex items-center gap-2 text-blue-600 mb-4">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Updating...
          </div>
        )}
        
        {sellerListings.filter(l => l.isListed).length === 0 ? (
          <Card className="border-2 border-dashed border-gray-200">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h5 className="text-lg font-semibold text-gray-900 mb-2">No Active Listings</h5>
              <p className="text-gray-600 mb-4">You haven't listed any products yet</p>
              <Button 
                onClick={() => { setShowListingModal(true); setStep(1); }}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <FaPlus className="w-4 h-4 mr-2" />
                List Your First Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {sellerListings.filter(l => l.isListed).map(listing => {
              const priceDifference = listing.sellerPrice - listing.product.price;
              const isHigher = priceDifference > 0;
              const isLower = priceDifference < 0;
              
              return (
                <Card key={listing._id} className="group hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-300">
                  <CardContent className="p-0">
                                         {/* Header with Image and Actions */}
                     <div className="relative p-4 sm:p-6 pb-0">
                       <div className="flex items-start gap-3 sm:gap-4">
                         <div className="relative">
                           <img 
                             src={listing.product.images && listing.product.images[0] ? listing.product.images[0].url : '/product-images/default.webp'} 
                             alt={listing.product.name} 
                             className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border-2 border-gray-100 shadow-sm" 
                           />
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className="flex items-start justify-between">
                             <div className="flex-1 min-w-0">
                               <h5 className="font-bold text-gray-900 text-base sm:text-lg mb-1 truncate">{listing.product.name}</h5>
                               <p className="text-xs sm:text-sm text-gray-500 mb-2">{listing.product.brand || 'No Brand'}</p>
                             </div>
                             <div className="flex gap-1">
                               <Button 
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => handleEditListing(listing)}
                                 title="Edit Price & Stock"
                                 className="h-9 w-9 p-0 hover:bg-blue-50 hover:text-blue-600"
                               >
                                 <FaEdit className="w-4 h-4" />
                               </Button>
                               <Button 
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => handleUnlist(listing._id)} 
                                 disabled={listingLoading}
                                 title="Unlist Product"
                                 className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600"
                               >
                                 <FaTrash className="w-4 h-4" />
                               </Button>
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>
                    
                    {/* Content Section */}
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                      {/* Price Information Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <div className="text-xs text-gray-500 mb-1">Admin Price</div>
                          <div className="font-semibold text-gray-900 text-sm sm:text-base">
                            {formatINR(listing.product.price)}/{listing.product.unit || 'KG'}
                          </div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <div className="text-xs text-blue-600 mb-1">Your Price</div>
                          <div className="font-bold text-blue-900 text-sm sm:text-base">
                            {formatINR(listing.sellerPrice)}/{listing.unit || listing.product.unit || 'KG'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Stock and Premium Row */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                          <div className="text-xs text-purple-600 mb-1">Your Stock</div>
                          <div className="font-bold text-purple-900 text-sm sm:text-base">
                            {listing.sellerStock || 0} {listing.unit || listing.product.unit || 'KG'}
                          </div>
                        </div>
                        {priceDifference !== 0 && (
                          <div className={`rounded-lg p-3 border ${
                            isHigher 
                              ? 'bg-green-50 border-green-100' 
                              : 'bg-orange-50 border-orange-100'
                          }`}>
                            <div className={`text-xs mb-1 ${isHigher ? 'text-green-600' : 'text-orange-600'}`}>
                              {isHigher ? 'Premium' : 'Discount'}
                            </div>
                            <div className={`font-bold text-sm sm:text-base ${isHigher ? 'text-green-900' : 'text-orange-900'}`}>
                              {isHigher ? '+' : '-'}{formatINR(Math.abs(priceDifference))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-gray-500">Active Listing</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Listed {new Date(listing.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Listing Modal */}
      <Dialog open={showListingModal} onOpenChange={setShowListingModal}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-3 sm:pb-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              <div>
                <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900">List a New Product</DialogTitle>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Add your product to the marketplace</p>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <span className="text-xs sm:text-sm text-gray-500">Step {step} of 4</span>
                <div className="w-16 sm:w-20 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-gray-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(step / 4) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Professional Progress Stepper - Mobile Responsive */}
            <div className="flex items-center justify-between mt-3 sm:mt-4">
              {[1, 2, 3, 4].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs font-medium transition-all duration-200 ${
                    step >= stepNumber 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                  }`}>
                    {stepNumber}
                  </div>
                  <span className={`ml-1 sm:ml-2 text-xs font-medium hidden sm:inline ${
                    step >= stepNumber ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {stepNumber === 1 && 'Category'}
                    {stepNumber === 2 && 'Subcategory'}
                    {stepNumber === 3 && 'Product'}
                    {stepNumber === 4 && 'Pricing'}
                  </span>
                  {stepNumber < 4 && (
                    <div className={`w-3 sm:w-6 h-px mx-2 sm:mx-3 transition-all duration-200 ${
                      step > stepNumber ? 'bg-gray-800' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[calc(95vh-180px)] sm:max-h-[calc(90vh-200px)] px-2 sm:px-1">
          
          {/* Stepper for listing a product */}
          {step === 1 && (
            <div className="py-4 sm:py-6">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">Select Product Category</h3>
                <p className="text-xs sm:text-sm text-gray-600">Choose the main category for your product</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {categories.filter(cat => !cat.parentCategory).map(cat => (
                  <div
                    key={cat._id}
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedMainCat === cat._id ? 'ring-1 ring-gray-400' : ''
                    }`}
                    onClick={() => { setSelectedMainCat(cat._id); setStep(2); }}
                  >
                    <div className={`bg-white rounded-lg p-3 sm:p-4 border transition-all duration-200 ${
                      selectedMainCat === cat._id 
                        ? 'border-gray-400 bg-gray-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                      <div className="flex flex-col items-center text-center">
                        {cat.image && (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 mb-2 sm:mb-3 rounded-lg overflow-hidden border border-gray-200">
                            <img 
                              src={cat.image} 
                              alt={cat.name} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        )}
                        <h4 className={`font-medium text-xs sm:text-sm transition-colors duration-200 ${
                          selectedMainCat === cat._id ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {cat.name}
                        </h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="py-4 sm:py-6">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">Select Subcategory</h3>
                <p className="text-xs sm:text-sm text-gray-600">Choose the specific subcategory for your product</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-3 overflow-y-auto max-h-[300px] sm:max-h-[350px] pr-1 sm:pr-2">
                {categories.filter(cat => cat.parentCategory === selectedMainCat).map(subcat => (
                  <div
                    key={subcat._id}
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedSubCat === subcat._id ? 'ring-1 ring-gray-400' : ''
                    }`}
                    onClick={() => { setSelectedSubCat(subcat._id); setStep(3); }}
                  >
                    <div className={`bg-white rounded-lg p-2 sm:p-3 border transition-all duration-200 ${
                      selectedSubCat === subcat._id 
                        ? 'border-gray-400 bg-gray-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                      <div className="flex flex-col items-center text-center">
                        {subcat.image && (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 mb-1 sm:mb-2 rounded-lg overflow-hidden border border-gray-200">
                            <img 
                              src={subcat.image} 
                              alt={subcat.name} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        )}
                        <h4 className={`font-medium text-xs transition-colors duration-200 ${
                          selectedSubCat === subcat._id ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {subcat.name}
                        </h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-3 sm:mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)} 
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Back to Categories</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-4 sm:py-6">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">Select Product</h3>
                <p className="text-xs sm:text-sm text-gray-600">Choose the specific product you want to list</p>
              </div>
              {(() => {
                const filteredProducts = adminProducts.filter(p => {
                  const categoryId = typeof p.category === 'object' ? p.category._id : p.category;
                  const subCategoryId = typeof p.subCategory === 'object' ? p.subCategory._id : p.subCategory;
                  
                  const categoryMatch = categoryId === selectedMainCat;
                  const subCategoryMatch = subCategoryId === selectedSubCat;
                  
                  // Check if this product is already listed by the seller
                  const isAlreadyListed = sellerListings.some(listing => 
                    listing.product && 
                    (typeof listing.product === 'object' ? listing.product._id : listing.product) === p._id &&
                    listing.isListed
                  );
                  
                  return categoryMatch && subCategoryMatch && !isAlreadyListed;
                });
                
                if (filteredProducts.length === 0) {
                  // Check if there are any products in this category that are already listed
                  const allProductsInCategory = adminProducts.filter(p => {
                    const categoryId = typeof p.category === 'object' ? p.category._id : p.category;
                    const subCategoryId = typeof p.subCategory === 'object' ? p.subCategory._id : p.subCategory;
                    return categoryId === selectedMainCat && subCategoryId === selectedSubCat;
                  });
                  
                  const alreadyListedCount = allProductsInCategory.filter(p => {
                    return sellerListings.some(listing => 
                      listing.product && 
                      (typeof listing.product === 'object' ? listing.product._id : listing.product) === p._id &&
                      listing.isListed
                    );
                  }).length;
                  
                  return (
                    <div className="text-center py-6 sm:py-8">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                        {alreadyListedCount > 0 ? (
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        )}
                      </div>
                      <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-1">
                        {alreadyListedCount > 0 ? 'All Products Already Listed' : 'No Products Available'}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 mb-4">
                        {alreadyListedCount > 0 
                          ? `You have already listed all ${alreadyListedCount} product${alreadyListedCount > 1 ? 's' : ''} in this category.`
                          : 'No products found for this category combination.'
                        }
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => setStep(2)}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="hidden sm:inline">Back to Subcategories</span>
                        <span className="sm:hidden">Back</span>
                      </Button>
                    </div>
                  );
                }
                
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 overflow-y-auto max-h-[300px] sm:max-h-[350px] pr-1 sm:pr-2">
                    {filteredProducts.map(product => {
                      // Check if this product is already listed (should be false since we filtered them out)
                      const isAlreadyListed = sellerListings.some(listing => 
                        listing.product && 
                        (typeof listing.product === 'object' ? listing.product._id : listing.product) === product._id &&
                        listing.isListed
                      );
                      
                      return (
                        <div
                          key={product._id}
                          className={`cursor-pointer transition-all duration-200 ${
                            selectedProduct && selectedProduct._id === product._id ? 'ring-1 ring-gray-400' : ''
                          } ${isAlreadyListed ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => { 
                            if (!isAlreadyListed) {
                              setSelectedProduct(product); 
                              setStep(4); 
                              setSellerPrice(product.price); 
                              setSellerStock(product.stock || 0); 
                            }
                          }}
                        >
                          <div className={`bg-white rounded-lg p-2 sm:p-3 border transition-all duration-200 ${
                            selectedProduct && selectedProduct._id === product._id 
                              ? 'border-gray-400 bg-gray-50' 
                              : isAlreadyListed
                              ? 'border-gray-300 bg-gray-100'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}>
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                <img 
                                  src={product.images && product.images[0] ? product.images[0].url : '/product-images/default.webp'} 
                                  alt={product.name} 
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-medium text-xs sm:text-sm mb-1 transition-colors duration-200 ${
                                  selectedProduct && selectedProduct._id === product._id ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  {product.name}
                                </h4>
                                <p className="text-xs text-gray-600 mb-1">{product.brand || 'No Brand'}</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs sm:text-sm font-semibold text-gray-900">
                                    {formatINR(product.price)}/{product.unit || 'KG'}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {isAlreadyListed && (
                                      <span className="text-xs text-blue-600 bg-blue-100 px-1 sm:px-2 py-0.5 rounded">
                                        Listed
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-500 bg-gray-100 px-1 sm:px-2 py-0.5 rounded">
                                      Admin
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              <div className="flex justify-center mt-3 sm:mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(2)} 
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Back to Subcategories</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </div>
            </div>
          )}

          {step === 4 && selectedProduct && (
            <div className="py-4 sm:py-6">
              <div className="text-center mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">Set Price & Stock</h3>
                <p className="text-xs sm:text-sm text-gray-600">Configure your selling price and available stock</p>
              </div>
              
              <div className="max-w-lg sm:max-w-xl mx-auto px-2 sm:px-0">
                {/* Product Summary */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-200">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                      <img 
                        src={selectedProduct.images && selectedProduct.images[0] ? selectedProduct.images[0].url : '/product-images/default.webp'} 
                        alt={selectedProduct.name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-xs sm:text-sm text-gray-900 mb-1">{selectedProduct.name}</h4>
                      <p className="text-xs text-gray-600 mb-1">{selectedProduct.brand || 'No Brand'}</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Admin Price:</span>
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm">{formatINR(selectedProduct.price)}/{selectedProduct.unit || 'KG'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Pricing Form */}
                <div className="space-y-3 sm:space-y-4">
                  {/* Price Input */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Your Selling Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₹</span>
                      <Input
                        type="number"
                        className="pl-8 pr-4 py-2 sm:py-2 border border-gray-300 focus:border-gray-500 rounded-md text-sm"
                        placeholder="0.00"
                        value={sellerPrice}
                        min="0"
                        step="0.01"
                        onChange={e => setSellerPrice(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Set your competitive market price
                    </p>
                  </div>
                  
                  {/* Stock Input */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Available Stock
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        className="pr-10 sm:pr-12 pl-4 py-2 border border-gray-300 focus:border-gray-500 rounded-md text-sm"
                        placeholder="0"
                        value={sellerStock}
                        min="0"
                        onChange={e => setSellerStock(e.target.value)}
                      />
                      <span className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs bg-gray-100 px-1 sm:px-2 py-1 rounded">
                        {selectedProduct.unit || 'KG'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Quantity available for sale
                    </p>
                  </div>
                  
                  {/* Price Comparison */}
                  {sellerPrice && (
                    <div className="p-2 sm:p-3 rounded-md border">
                      <div className={`text-center text-xs sm:text-sm ${
                        parseFloat(sellerPrice) > selectedProduct.price
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : parseFloat(sellerPrice) < selectedProduct.price
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {parseFloat(sellerPrice) > selectedProduct.price ? (
                          <span className="font-medium">Premium: +{formatINR(parseFloat(sellerPrice) - selectedProduct.price)}</span>
                        ) : parseFloat(sellerPrice) < selectedProduct.price ? (
                          <span className="font-medium">Competitive: -{formatINR(selectedProduct.price - parseFloat(sellerPrice))}</span>
                        ) : (
                          <span className="font-medium">Market Rate</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Error Display */}
                  {listingError && (
                    <div className="p-2 sm:p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
                      <div className="flex items-center space-x-2">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs sm:text-sm font-medium">{listingError}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                    <Button 
                      variant="outline"
                      className="flex-1 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-xs sm:text-sm" 
                      onClick={() => setStep(3)}
                    >
                      <svg className="w-3 h-3 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </Button>
                    <Button 
                      className="flex-1 py-2 bg-gray-800 hover:bg-gray-900 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm" 
                      onClick={async () => { await handleListProduct(); setShowListingModal(false); }} 
                      disabled={listingLoading || !sellerPrice || parseFloat(sellerPrice) <= 0 || !sellerStock || parseFloat(sellerStock) < 0}
                    >
                      {listingLoading ? (
                        <>
                          <svg className="animate-spin w-3 h-3 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="hidden sm:inline">Listing...</span>
                          <span className="sm:hidden">...</span>
                        </>
                      ) : (
                        <>
                          <span className="hidden sm:inline">List Product</span>
                          <span className="sm:hidden">List</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Price Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Product Price & Stock</DialogTitle>
          </DialogHeader>
          
          {editingListing && (
            <div className="space-y-4">
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
                  <span className="font-medium text-gray-900">{formatINR(editingListing.product.price)}/{editingListing.product.unit || 'KG'}</span>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Your Selling Price:</label>
                  <Input
                    type="number"
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
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Your Stock Quantity:</label>
                  <Input
                    type="number"
                    placeholder="Enter your stock quantity"
                    value={editStock}
                    min="0"
                    onChange={(e) => setEditStock(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Set the quantity you have available for sale
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
              
              {editError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {editError}
                </div>
              )}
              
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  disabled={editLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={editLoading || !editPrice || parseFloat(editPrice) <= 0}
                >
                  {editLoading ? 'Updating...' : 'Update Price & Stock'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Stock Modal */}
      <Dialog open={showStockModal} onOpenChange={setShowStockModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock Quantity</DialogTitle>
          </DialogHeader>
          
          {editingStock && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={editingStock.product.images && editingStock.product.images[0] ? editingStock.product.images[0].url : '/product-images/default.webp'} 
                  alt={editingStock.product.name} 
                  className="w-16 h-16 object-contain rounded-lg border" 
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{editingStock.product.name}</h4>
                  <p className="text-sm text-gray-600">{editingStock.product.brand || 'No Brand'}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Current Stock:</span>
                  <span className="font-medium text-gray-900">{editingStock.sellerStock || 0} {editingStock.unit || editingStock.product.unit || 'KG'}</span>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">New Stock Quantity:</label>
                  <Input
                    type="number"
                    placeholder="Enter new stock quantity"
                    value={editStock}
                    min="0"
                    onChange={(e) => setEditStock(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Set the quantity you have available for sale
                  </p>
                </div>
              </div>
              
              {editError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {editError}
                </div>
              )}
              
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowStockModal(false)}
                  disabled={editLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveStockEdit}
                  disabled={editLoading || !editStock || parseFloat(editStock) < 0}
                >
                  {editLoading ? 'Updating...' : 'Update Stock'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Variant Management Modal */}
      <Dialog open={showVariantModal} onOpenChange={setShowVariantModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Variants - {selectedProductForVariants?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedProductForVariants && (
            <VariantManager
              product={selectedProductForVariants}
              onVariantUpdate={handleVariantUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerProducts;
