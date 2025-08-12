import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import * as Accordion from '@radix-ui/react-accordion';
import * as Tooltip from '@radix-ui/react-tooltip';
import { HeartIcon, Share2Icon, ChatBubbleIcon, StarFilledIcon, CheckCircledIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import { formatINR } from '../../utils/formatCurrency';
import productAPI from '../../api/productAPI';
import VariantSelector from './VariantSelector';
import RelatedProducts from './RelatedProducts';

const ProductDetail = ({ product, onAddToCart, onWishlist, onShare }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [currentVariantData, setCurrentVariantData] = useState({
    price: product?.price || 0,
    comparePrice: product?.comparePrice || 0,
    stock: product?.stock || 0,
    images: product?.images || []
  });
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [editingReview, setEditingReview] = useState(false);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(0);
  const user = useSelector(state => state.auth.user);
  const navigate = useNavigate();

  const handleQuantityChange = (newQuantity) => {
    const maxStock = currentVariantData.stock || product.stock || 1;
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      setQuantity(newQuantity);
    }
  };

  const handleVariantChange = (newSelectedVariants) => {
    setSelectedVariants(newSelectedVariants);
    
    // Find the selected variant option to update current data
    if (product.variants && product.variants.length > 0) {
      let selectedOption = null;
      for (const variant of product.variants) {
        const selectedValue = newSelectedVariants[variant.name];
        if (selectedValue) {
          const option = variant.options.find(opt => opt.value === selectedValue);
          if (option) {
            selectedOption = option;
            break;
          }
        }
      }

      if (selectedOption) {
        setCurrentVariantData({
          price: selectedOption.price,
          comparePrice: selectedOption.comparePrice || 0,
          stock: selectedOption.stock,
          images: selectedOption.images && selectedOption.images.length > 0 
            ? selectedOption.images 
            : product.images || []
        });
        setSelectedImage(0);
      } else {
        setCurrentVariantData({
          price: product.price,
          comparePrice: product.comparePrice || 0,
          stock: product.stock,
          images: product.images || []
        });
      }
    }
  };

  useEffect(() => {
    if (product && product._id) {
      productAPI.getReviews(product._id)
        .then(res => setReviews(res.data))
        .catch(() => setReviews([]));
    }
  }, [product]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewLoading(true);
    setReviewError('');
    setReviewSuccess('');
    try {
      await productAPI.addReview(product._id, { rating: reviewRating, comment: reviewText });
      setReviewSuccess('Review submitted!');
      setReviewText('');
      setReviewRating(0);
      // Refresh reviews
      const res = await productAPI.getReviews(product._id);
      setReviews(res.data);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 py-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Gallery + Info tabs */}
        <div className="col-span-12 md:col-span-7">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Thumbnails */}
            <div className="order-2 md:order-1 flex md:flex-col gap-2">
              {currentVariantData.images && currentVariantData.images.map((img, idx) => {
                const isActive = selectedImage === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border ${isActive ? 'border-green-600 shadow-sm' : 'border-gray-200'} hover:border-green-500`}
                  >
                    <img src={img.url} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
            {/* Main image */}
            <div className="order-1 md:order-2 flex-1">
              <div className="bg-white border rounded-xl p-2">
                <img
                  src={currentVariantData.images && currentVariantData.images[selectedImage] ? currentVariantData.images[selectedImage].url : '/product-images/default.webp'}
                  alt={product.name}
                  className="w-full h-[420px] object-contain"
                />
              </div>
            </div>
          </div>

          {/* Product Details Tabs (Features / Specs / Reviews) */}
          <Tabs.Root className="mt-6" defaultValue="features">
            <Tabs.List className="flex gap-2 border-b">
              <Tabs.Trigger value="features" className="px-4 py-2 text-sm font-medium data-[state=active]:text-green-700 data-[state=active]:border-b-2 data-[state=active]:border-green-600">Features</Tabs.Trigger>
              <Tabs.Trigger value="specs" className="px-4 py-2 text-sm font-medium data-[state=active]:text-green-700 data-[state=active]:border-b-2 data-[state=active]:border-green-600">Specifications</Tabs.Trigger>
              <Tabs.Trigger value="reviews" className="px-4 py-2 text-sm font-medium data-[state=active]:text-green-700 data-[state=active]:border-b-2 data-[state=active]:border-green-600">Reviews</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="features" className="pt-4">
              {Array.isArray(product.features) && product.features.length > 0 ? (
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-700"><CheckCircledIcon className="text-green-600 mr-2" />{feature}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-500">No features provided.</div>
              )}
            </Tabs.Content>

            <Tabs.Content value="specs" className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.isArray(currentVariantData.specifications) && currentVariantData.specifications.length > 0 ? (
                  currentVariantData.specifications.map((spec, idx) => (
                    <div key={spec._id || idx} className="flex justify-between border-b pb-2">
                      <span className="font-medium text-gray-800">{spec.key}</span>
                      <span className="text-gray-600">{spec.value}</span>
                    </div>
                  ))
                ) : Array.isArray(product.specifications) && product.specifications.length > 0 ? (
                  product.specifications.map((spec, idx) => (
                    <div key={spec._id || idx} className="flex justify-between border-b pb-2">
                      <span className="font-medium text-gray-800">{spec.key}</span>
                      <span className="text-gray-600">{spec.value}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">No specifications provided.</div>
                )}
              </div>
            </Tabs.Content>

            <Tabs.Content value="reviews" className="pt-4">
              {reviews.length === 0 && <div className="text-gray-500">No reviews yet.</div>}
              <ul className="space-y-4 mb-6">
                {reviews.map((review, idx) => {
                  if (!review || typeof review !== 'object' || Array.isArray(review)) return null;
                  const safeName = (typeof review.name === 'string' || typeof review.name === 'number') ? review.name : JSON.stringify(review.name ?? '');
                  const safeComment = (typeof review.comment === 'string' || typeof review.comment === 'number') ? review.comment : JSON.stringify(review.comment ?? '');
                  const safeRating = (typeof review.rating === 'number') ? review.rating : Number(review.rating) || 0;
                  const isUserReview = user && ((typeof review.user === 'object' ? review.user.toString() : review.user) === user._id.toString());
                  return (
                    <li key={review._id || idx} className="border-b pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-700">{safeName}</span>
                        <span className="flex text-yellow-500">
                          {[...Array(5)].map((_, i) => (
                            <StarFilledIcon key={i} className={i < safeRating ? '' : 'text-gray-300'} />
                          ))}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}</span>
                        {isUserReview && !editingReview && (
                          <>
                            <button className="ml-2 text-green-600 text-xs underline" onClick={() => { setEditingReview(true); setEditText(safeComment); setEditRating(safeRating); }}>Edit</button>
                            <button className="ml-2 text-red-600 text-xs underline" onClick={async () => {
                              if (window.confirm('Delete your review?')) {
                                await productAPI.deleteReview(product._id);
                                const res = await productAPI.getReviews(product._id);
                                setReviews(res.data);
                              }
                            }}>Delete</button>
                          </>
                        )}
                      </div>
                      {isUserReview && editingReview ? (
                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          await productAPI.updateReview(product._id, { rating: editRating, comment: editText });
                          setEditingReview(false);
                          setEditText('');
                          setEditRating(0);
                          const res = await productAPI.getReviews(product._id);
                          setReviews(res.data);
                        }} className="mt-2">
                          <div className="flex gap-1 mb-2">
                            {[1,2,3,4,5].map(star => (
                              <button type="button" key={star} onClick={() => setEditRating(star)} className={star <= editRating ? 'text-yellow-500' : 'text-gray-300'}>
                                <StarFilledIcon />
                              </button>
                            ))}
                          </div>
                          <textarea className="w-full border rounded p-2 mb-2" rows={3} value={editText} onChange={e => setEditText(e.target.value)} required />
                          <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded mr-2">Save</button>
                          <button type="button" className="bg-gray-200 text-gray-700 px-3 py-1 rounded" onClick={() => setEditingReview(false)}>Cancel</button>
                        </form>
                      ) : (
                        <div className="text-gray-700">{safeComment}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
              {user && !reviews.some(r => (typeof r.user === 'object' ? r.user.toString() : r.user) === user._id.toString()) && (
                <form onSubmit={handleReviewSubmit} className="bg-gray-50 p-4 rounded-lg mb-4 border">
                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">Your Rating</label>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(star => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className={star <= reviewRating ? 'text-yellow-500' : 'text-gray-300'}
                        >
                          <StarFilledIcon />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">Your Review</label>
                    <textarea
                      className="w-full border rounded p-2"
                      rows={3}
                      value={reviewText}
                      onChange={e => setReviewText(e.target.value)}
                      required
                    />
                  </div>
                  {reviewError && <div className="text-red-600 text-sm mb-2">{reviewError}</div>}
                  {reviewSuccess && <div className="text-green-600 text-sm mb-2">{reviewSuccess}</div>}
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    disabled={reviewLoading || !reviewRating || !reviewText}
                  >
                    {reviewLoading ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
              {!user && <div className="text-gray-500">Login to write a review.</div>}
            </Tabs.Content>
          </Tabs.Root>
        </div>

        {/* Right: Product Info */}
        <div className="col-span-12 md:col-span-5 md:sticky md:top-24 h-fit">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{product.name}</h1>
            {product.brand && (
              <div className="text-sm text-gray-500">Brand: <span className="font-medium text-gray-700">{product.brand}</span></div>
            )}

            <div className="flex items-center gap-2">
              <div className="flex text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <StarFilledIcon key={i} className={i < Math.floor(product.rating || 0) ? '' : 'text-gray-300'} />
                ))}
              </div>
              <span className="text-gray-600 text-sm">{product.rating || 0} ({product.numReviews || 0} reviews)</span>
            </div>

            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-green-600">{formatINR(currentVariantData.price)}</span>
              {currentVariantData.comparePrice > currentVariantData.price && (
                <span className="text-lg text-gray-500 line-through">{formatINR(currentVariantData.comparePrice)}</span>
              )}
              {currentVariantData.comparePrice > currentVariantData.price && (
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold">{Math.round(((currentVariantData.comparePrice - currentVariantData.price) / currentVariantData.comparePrice) * 100)}% OFF</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {currentVariantData.stock > 0 ? (
                <span className="px-2 py-0.5 rounded-full border border-green-300 text-green-700 text-xs">In Stock ({currentVariantData.stock} available)</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full border border-red-300 text-red-700 text-xs">Out of Stock</span>
              )}
              {product.unit && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">Unit: {product.unit}</span>}
              {product.origin && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">Origin: {product.origin}</span>}
            </div>

            {/* Variant Selector */}
            <VariantSelector
              product={product}
              selectedVariants={selectedVariants}
              onVariantChange={handleVariantChange}
            />

            {/* Quantity */}
            <div className="flex items-center gap-3">
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <div className="inline-flex items-center border rounded-lg">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="p-2 text-gray-600 disabled:text-gray-300"
                >
                  −
                </button>
                <span className="px-4 py-2 min-w-[40px] text-center">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= currentVariantData.stock}
                  className="p-2 text-gray-600 disabled:text-gray-300"
                >
                  +
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => { console.log('Add to Cart button clicked', { onAddToCart, product, quantity, selectedVariants }); onAddToCart && onAddToCart(product, quantity, selectedVariants); }}
                disabled={currentVariantData.stock <= 0}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Add to Basket</span>
              </button>
              <button
                onClick={() => onWishlist && onWishlist(product)}
                className="flex-1 border border-green-600 text-green-700 py-3 rounded-lg hover:bg-green-50 flex items-center justify-center gap-2"
              >
                <HeartIcon /> Save for later
              </button>
              <Tooltip.Provider delayDuration={200}>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button onClick={() => onShare && onShare(product)} className="px-4 py-3 border rounded-lg text-gray-600 hover:bg-gray-50"><Share2Icon /></button>
                  </Tooltip.Trigger>
                  <Tooltip.Content className="bg-gray-900 text-white text-xs rounded px-2 py-1">Share product link</Tooltip.Content>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>


            {/* Service perks */}
            <div className="bg-gray-50 rounded-lg p-4 flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2 text-gray-700"><ChevronDownIcon className="text-green-600 rotate-90" /> 10 days Replacement</div>
              <div className="flex items-center gap-2 text-gray-700"><ChevronDownIcon className="text-green-600 rotate-90" /> Free Delivery</div>
              <div className="flex items-center gap-2 text-gray-700"><ChevronDownIcon className="text-green-600 rotate-90" /> 100% Quality Assured</div>
            </div>
          </div>
        </div>
      </div>
      {/* Related products */}
      <RelatedProducts currentProduct={product} />
    </div>
  );
};

export default ProductDetail; 