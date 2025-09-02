import React, { useState, useEffect } from 'react';
import { FaTags } from 'react-icons/fa';
import { formatINR } from '../../utils/formatCurrency';
import sellerAPI from '../../api/sellerAPI';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { motion } from 'framer-motion';

const SellerCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({ 
    code: '', 
    discount: '', 
    expiry: '', 
    usageLimit: '' 
  });
  const [couponStatus, setCouponStatus] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    sellerAPI.getCoupons().then(res => setCoupons(res.data)).catch(() => setCoupons([]));
  }, []);

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
      setShowModal(false);
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

  const getCouponStats = () => {
    const total = coupons.length;
    const active = coupons.filter(c => c.isActive).length;
    const inactive = coupons.filter(c => !c.isActive).length;
    const totalUsed = coupons.reduce((sum, c) => sum + (c.usedBy?.length || 0), 0);

    return { total, active, inactive, totalUsed };
  };

  const stats = getCouponStats();

  return (
    <div className="space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Coupon Management</h2>
          <p className="text-gray-600 text-sm sm:text-base">Create and manage discount coupons for your customers</p>
        </div>
        <Button 
          onClick={() => setShowModal(true)} 
          className="text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <FaTags className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
          Create New Coupon
        </Button>
      </div>

      {/* Stats Cards - Mobile Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Coupons</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-blue-50">
                <FaTags className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-green-50">
                <FaTags className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-gray-50">
                <FaTags className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Used</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">{stats.totalUsed}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-purple-50">
                <FaTags className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Coupon Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Coupon</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Code</label>
              <Input
                type="text"
                name="code"
                value={couponForm.code}
                onChange={handleCouponInput}
                required
                placeholder="COUPON2024"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Discount (₹ or %)</label>
              <Input
                type="number"
                name="discount"
                value={couponForm.discount}
                onChange={handleCouponInput}
                required
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expiry</label>
              <Input
                type="date"
                name="expiry"
                value={couponForm.expiry}
                onChange={handleCouponInput}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Usage Limit</label>
              <Input
                type="number"
                name="usageLimit"
                value={couponForm.usageLimit}
                onChange={handleCouponInput}
                placeholder="1"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-4">
              <Button type="submit">Create Coupon</Button>
            </div>
          </form>
          {couponStatus && (
            <div className={`mt-4 text-sm ${
              couponStatus.includes('created') ? 'text-green-600' : 'text-red-600'
            }`}>
              {couponStatus}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coupons List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Your Coupons ({coupons.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">No coupons found</div>
              <div className="text-sm text-gray-500">Create your first coupon to get started</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {coupons.map((coupon, index) => (
                <motion.div
                  key={coupon._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  className="group"
                >
                  <Card className={`h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 ${
                    coupon.isActive ? 'border-l-green-500' : 'border-l-gray-500'
                  }`}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-mono font-semibold text-blue-600 text-sm sm:text-base">
                            {coupon.code}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {coupon.expiry ? new Date(coupon.expiry).toLocaleDateString() : 'No expiry'}
                          </p>
                        </div>
                        <Badge className={coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Discount:</span>
                          <span className="font-semibold text-gray-900">{coupon.discount}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Usage Limit:</span>
                          <span className="font-semibold text-gray-900">{coupon.usageLimit || '∞'}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Used By:</span>
                          <span className="font-semibold text-gray-900">{coupon.usedBy?.length || 0}</span>
                        </div>
                      </div>

                      {coupon.isActive && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivateCoupon(coupon._id)}
                            className="w-full text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            Deactivate
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Coupon Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Coupon</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Coupon Code</label>
              <Input
                type="text"
                name="code"
                value={couponForm.code}
                onChange={handleCouponInput}
                required
                placeholder="COUPON2024"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Discount Amount</label>
              <Input
                type="number"
                name="discount"
                value={couponForm.discount}
                onChange={handleCouponInput}
                required
                placeholder="100"
              />
              <p className="text-xs text-gray-500 mt-1">Enter amount in ₹ or percentage</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Expiry Date</label>
              <Input
                type="date"
                name="expiry"
                value={couponForm.expiry}
                onChange={handleCouponInput}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Usage Limit</label>
              <Input
                type="number"
                name="usageLimit"
                value={couponForm.usageLimit}
                onChange={handleCouponInput}
                placeholder="1"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited usage</p>
            </div>
            
            {couponStatus && (
              <div className={`text-sm ${
                couponStatus.includes('created') ? 'text-green-600' : 'text-red-600'
              }`}>
                {couponStatus}
              </div>
            )}
            
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Create Coupon
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerCoupons;
