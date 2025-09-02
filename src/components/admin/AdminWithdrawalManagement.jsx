import React, { useState, useEffect } from 'react';
import { adminWalletAPI } from '../../api/walletAPI';
import { formatINR as formatCurrency } from '../../utils/formatCurrency';
import { toast } from 'react-toastify';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Textarea } from '../ui/Textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaEye, FaCheck, FaTimes, FaSpinner, FaUser, FaCalendarAlt } from 'react-icons/fa';

const AdminWithdrawalManagement = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionData, setActionData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchWithdrawals();
  }, [currentPage, statusFilter]);

  const fetchWithdrawals = async () => {
    try {
      const response = await adminWalletAPI.getWithdrawals(currentPage, 10, statusFilter);
      setWithdrawals(response.data.data.withdrawals);
      setTotalPages(response.data.data.pagination.totalPages);
      setSelectedIds([]);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Failed to fetch withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (withdrawal, type) => {
    setSelectedWithdrawal(withdrawal);
    setActionType(type);
    setActionData({});
    setShowActionModal(true);
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (actionType === 'approve') {
        await adminWalletAPI.approveWithdrawal(selectedWithdrawal._id, actionData.notes || '');
        toast.success('Withdrawal request approved successfully');
      } else if (actionType === 'reject') {
        await adminWalletAPI.rejectWithdrawal(selectedWithdrawal._id, actionData.reason);
        toast.success('Withdrawal request rejected successfully');
      } else if (actionType === 'process') {
        await adminWalletAPI.processWithdrawal(selectedWithdrawal._id, actionData.transactionId);
        toast.success('Withdrawal marked as processed successfully');
      }

      setShowActionModal(false);
      fetchWithdrawals();
    } catch (error) {
      console.error('Error processing action:', error);
      toast.error(error.response?.data?.message || 'Failed to process action');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      processed: { color: 'bg-blue-100 text-blue-800', label: 'Processed' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getActionButtons = (withdrawal) => {
    if (withdrawal.status === 'pending') {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => handleAction(withdrawal, 'approve')}
            className="
              bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-2 rounded-md
              transition-colors duration-200 focus:ring-2 focus:ring-green-300 focus:ring-offset-2
            "
          >
            <FaCheck className="w-4 h-4 mr-2" />
            Approve
          </Button>
          <Button
            size="sm"
            onClick={() => handleAction(withdrawal, 'reject')}
            className="
              bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-2 rounded-md
              transition-colors duration-200 focus:ring-2 focus:ring-red-300 focus:ring-offset-2
            "
          >
            <FaTimes className="w-4 h-4 mr-2" />
            Reject
          </Button>
        </div>
      );
    } else if (withdrawal.status === 'approved') {
      return (
        <Button
          size="sm"
          onClick={() => handleAction(withdrawal, 'process')}
          className="
            bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-2 rounded-md
            transition-colors duration-200 focus:ring-2 focus:ring-blue-300 focus:ring-offset-2
          "
        >
          <FaCheck className="w-4 h-4 mr-2" />
          Mark Processed
        </Button>
      );
    }
    return null;
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal =>
    withdrawal.seller?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    withdrawal.seller?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    withdrawal._id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Withdrawal Management</h2>
          <p className="text-gray-600 text-sm sm:text-base">Manage seller withdrawal requests</p>
        </div>
      </div>

      {/* Stats Cards - Mobile Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{withdrawals.length}</p>
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
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                  {withdrawals.filter(w => w.status === 'pending').length}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-yellow-50">
                <FaSpinner className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
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
                  {withdrawals.filter(w => w.status === 'approved').length}
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
                <p className="text-xs sm:text-sm font-medium text-gray-600">Processed</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">
                  {withdrawals.filter(w => w.status === 'processed').length}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-blue-50">
                <FaCheck className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search - Mobile Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by seller name, email, or withdrawal ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm sm:text-base"
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="processed">Processed</option>
            </select>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawals Grid - Mobile Responsive */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Withdrawal Requests ({filteredWithdrawals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <AnimatePresence>
                {filteredWithdrawals.map((withdrawal, index) => (
                  <motion.div
                    key={withdrawal._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className="group"
                  >
                    <Card className={`h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 ${
                      withdrawal.status === 'approved' ? 'border-l-green-500' :
                      withdrawal.status === 'rejected' ? 'border-l-red-500' :
                      withdrawal.status === 'processed' ? 'border-l-blue-500' : 'border-l-yellow-500'
                    }`}>
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col h-full">
                          {/* Seller Info */}
                          <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <FaUser className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                                {withdrawal.seller?.businessName || 'N/A'}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {withdrawal.seller?.email || 'N/A'}
                              </p>
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="text-center mb-4">
                            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                              {formatCurrency(withdrawal.amount)}
                            </p>
                            <p className="text-xs text-gray-500">Withdrawal Amount</p>
                          </div>

                          {/* Status and Date */}
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              {getStatusBadge(withdrawal.status)}
                            </div>
                            <div className="text-right">
                              <div className="flex items-center text-xs text-gray-500">
                                <FaCalendarAlt className="w-3 h-3 mr-1" />
                                {new Date(withdrawal.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-center gap-2 mt-auto">
                            {getActionButtons(withdrawal)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Action Modal */}
      <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve Withdrawal'}
              {actionType === 'reject' && 'Reject Withdrawal'}
              {actionType === 'process' && 'Mark as Processed'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleActionSubmit} className="space-y-4">
            {actionType === 'approve' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <Textarea
                  value={actionData.notes || ''}
                  onChange={(e) => setActionData({ ...actionData, notes: e.target.value })}
                  rows={3}
                  placeholder="Add any notes about this approval..."
                />
              </div>
            )}
            {actionType === 'reject' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
                <Textarea
                  value={actionData.reason || ''}
                  onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                  rows={3}
                  placeholder="Please provide a reason for rejection..."
                  required
                />
              </div>
            )}
            {actionType === 'process' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID *</label>
                <Input
                  value={actionData.transactionId || ''}
                  onChange={(e) => setActionData({ ...actionData, transactionId: e.target.value })}
                  placeholder="Enter the transaction ID..."
                  required
                />
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowActionModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className={
                  actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }
              >
                {submitting ? 'Processing...' : 
                 actionType === 'approve' ? 'Approve' :
                 actionType === 'reject' ? 'Reject' : 'Mark Processed'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawalManagement;
