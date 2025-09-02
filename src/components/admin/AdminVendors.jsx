import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaEye, FaSearch, FaStore, FaEnvelope, FaPhone, FaCalendarAlt, FaBuilding } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Textarea } from '../ui/Textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import LoadMore from '../ui/LoadMore';
import { motion, AnimatePresence } from 'framer-motion';
import sellerAPI from '../../api/sellerAPI';
import { toast } from 'react-toastify';

const AdminVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectModal, setRejectModal] = useState({ open: false, vendor: null, reason: '' });
  const [actionLoading, setActionLoading] = useState(null);
  
  // LoadMore state
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await sellerAPI.getAllSellers();
      setVendors(res.data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleVendorAction = async (vendorId, action, reason = '') => {
    setActionLoading(vendorId + action);
    try {
      if (action === 'approve') {
        await sellerAPI.approveSeller(vendorId);
        toast.success('Vendor approved successfully');
      } else if (action === 'reject') {
        await sellerAPI.rejectSeller(vendorId, reason);
        toast.success('Vendor rejected successfully');
      }
      fetchVendors(); // Refresh the list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process vendor action');
    } finally {
      setActionLoading(null);
      setRejectModal({ open: false, vendor: null, reason: '' });
    }
  };

  const getStatusColor = (vendor) => {
    if (vendor.isApproved) return 'bg-green-100 text-green-800';
    if (vendor.rejectionReason) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (vendor) => {
    if (vendor.isApproved) return 'Approved';
    if (vendor.rejectionReason) return 'Rejected';
    return 'Pending';
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.userId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.userId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Vendor Management</h2>
          <p className="text-gray-600 text-sm sm:text-base">Manage vendor applications and approvals</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="text-xs sm:text-sm">
            Export Data
          </Button>
          <Button className="text-xs sm:text-sm">
            <FaEye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            View Analytics
          </Button>
        </div>
      </div>

      {/* Stats Cards - Mobile Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Vendors</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{vendors.length}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-blue-50">
                <FaEye className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Approved</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">
                  {vendors.filter(v => v.isApproved).length}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-green-50">
                <FaCheck className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                  {vendors.filter(v => !v.isApproved && !v.rejectionReason).length}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-yellow-50">
                <FaEye className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">
                  {vendors.filter(v => v.rejectionReason).length}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-red-50">
                <FaTimes className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
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
              placeholder="Search vendors by business name, email, or owner name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vendors Cards - Responsive Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Vendor Applications ({filteredVendors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <LoadMore 
              items={filteredVendors} 
              itemsPerPage={itemsPerPage}
              autoLoad={false}
              className="space-y-6"
            >
              {(displayedItems) => (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <AnimatePresence>
                    {displayedItems.map((vendor, index) => (
                  <motion.div
                    key={vendor._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className="group"
                  >
                    <Card className={`h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 ${
                      vendor.isApproved ? 'border-l-green-500' : 
                      vendor.rejectionReason ? 'border-l-red-500' : 'border-l-yellow-500'
                    }`}>
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={vendor.businessLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.businessName || vendor.shopName || 'Business')}&background=10b981&color=fff`} />
                              <AvatarFallback className="bg-green-100 text-green-600 font-semibold">
                                <FaStore className="w-5 h-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                                {vendor.businessName || vendor.shopName || 'N/A'}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-500 truncate">
                                {vendor.businessInfo?.businessType || 'Business'}
                              </p>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(vendor)} text-xs`}>
                            {getStatusText(vendor)}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <FaBuilding className="w-3 h-3 mr-2 text-gray-400" />
                            <span className="truncate">
                              {vendor.userId?.firstName} {vendor.userId?.lastName}
                            </span>
                          </div>
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <FaEnvelope className="w-3 h-3 mr-2 text-gray-400" />
                            <span className="truncate">{vendor.email}</span>
                          </div>
                          {vendor.phone && (
                            <div className="flex items-center text-xs sm:text-sm text-gray-600">
                              <FaPhone className="w-3 h-3 mr-2 text-gray-400" />
                              <span>{vendor.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <FaCalendarAlt className="w-3 h-3 mr-2 text-gray-400" />
                            <span>Applied {vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : 'Unknown'}</span>
                          </div>
                        </div>

                        {vendor.rejectionReason && (
                          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            <strong>Rejection Reason:</strong> {vendor.rejectionReason}
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                          {!vendor.isApproved && !vendor.rejectionReason ? (
                            <div className="flex space-x-2 w-full">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    onClick={() => handleVendorAction(vendor._id, 'approve')}
                                    disabled={actionLoading === vendor._id + 'approve'}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    {actionLoading === vendor._id + 'approve' ? (
                                      'Approving...'
                                    ) : (
                                      <>
                                        <FaCheck className="w-3 h-3 mr-1" />
                                        Approve
                                      </>
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Approve Vendor</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setRejectModal({ open: true, vendor, reason: '' })}
                                    disabled={actionLoading === vendor._id + 'reject'}
                                    className="flex-1"
                                  >
                                    <FaTimes className="w-3 h-3 mr-1" />
                                    Reject
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Reject Vendor</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          ) : (
                            <div className="w-full text-center">
                              <div className={`text-sm font-medium ${
                                vendor.isApproved ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {vendor.isApproved ? '✓ Approved' : '✗ Rejected'}
                              </div>
                            </div>
                          )}
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

      {/* Reject Modal */}
      <Dialog open={rejectModal.open} onOpenChange={(open) => setRejectModal({ open, vendor: null, reason: '' })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Vendor Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rejection Reason
              </label>
              <Textarea
                placeholder="Please provide a reason for rejection..."
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                rows={4}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectModal({ open: false, vendor: null, reason: '' })}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleVendorAction(rejectModal.vendor._id, 'reject', rejectModal.reason)}
                disabled={!rejectModal.reason.trim() || actionLoading === rejectModal.vendor?._id + 'reject'}
              >
                {actionLoading === rejectModal.vendor?._id + 'reject' ? 'Rejecting...' : 'Reject Vendor'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVendors;
