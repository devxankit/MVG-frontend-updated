import React, { useState, useEffect } from 'react';
import { adminWalletAPI } from '../../api/walletAPI';
import { formatINR as formatCurrency } from '../../utils/formatCurrency';
import { toast } from 'react-toastify';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaUsers, FaDollarSign, FaChartLine, FaWallet, FaUser, FaBuilding, FaSync, FaPhone, FaEnvelope, FaCalendarAlt, FaHistory, FaArrowUp, FaArrowDown, FaEye } from 'react-icons/fa';

const AdminSellerEarnings = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    fetchSellerEarnings();
  }, [currentPage]);

  const fetchSellerEarnings = async () => {
    try {
      setLoading(true);
      const response = await adminWalletAPI.getSellerEarnings(currentPage, 10);
      console.log('Seller earnings response:', response.data);
      setWallets(response.data.data.wallets);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching seller earnings:', error);
      toast.error('Failed to fetch seller earnings data');
    } finally {
      setLoading(false);
    }
  };

  const filteredWallets = wallets.filter(wallet => 
    wallet.seller?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.seller?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (isApproved) => {
    return (
      <Badge className={isApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
        {isApproved ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  const handleViewDetails = async (wallet) => {
    setSelectedWallet(wallet);
    setShowDetailsModal(true);
    setLoadingTransactions(true);
    
    try {
      // Fetch transaction history for this seller
      const response = await adminWalletAPI.getSellerTransactions(wallet.seller._id);
      setWalletTransactions(response.data.data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transaction history');
      setWalletTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const totalEarnings = wallets.reduce((sum, wallet) => sum + (wallet.totalEarnings || 0), 0);
  const totalWithdrawals = wallets.reduce((sum, wallet) => sum + (wallet.totalWithdrawn || 0), 0);
  const totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);

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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Seller Earnings Report</h2>
          <p className="text-gray-600 text-sm sm:text-base">Monitor seller earnings and wallet balances</p>
        </div>
        
        {/* Search and Refresh - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search sellers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>
          <Button
            onClick={fetchSellerEarnings}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200 focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
          >
            <FaSync className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards - Mobile Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Sellers</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{wallets.length}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-blue-50">
                <FaUsers className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{formatCurrency(totalEarnings)}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-green-50">
                <FaDollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Withdrawals</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">{formatCurrency(totalWithdrawals)}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-yellow-50">
                <FaChartLine className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Balance</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">{formatCurrency(totalBalance)}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-purple-50">
                <FaWallet className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seller Earnings Grid - Mobile Responsive */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Seller Earnings ({filteredWallets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            {filteredWallets.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaUsers className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Seller Data Found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'No sellers match your search criteria.' : 'No seller earnings data available.'}
                </p>
                {searchTerm && (
                  <Button
                    onClick={() => setSearchTerm('')}
                    variant="outline"
                    className="bg-white hover:bg-gray-50"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <AnimatePresence>
                  {filteredWallets.map((wallet, index) => (
                  <motion.div
                    key={wallet._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className="group"
                  >
                    <Card className={`h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 ${
                      wallet.seller.isApproved ? 'border-l-green-500' : 'border-l-red-500'
                    }`}>
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col h-full">
                          {/* Seller Info */}
                          <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <FaBuilding className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                                {wallet.seller?.businessName || 'N/A'}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {wallet.seller?.email || 'N/A'}
                              </p>
                            </div>
                            <div>
                              {getStatusBadge(wallet.seller?.isApproved)}
                            </div>
                          </div>

                          {/* Financial Stats */}
                          <div className="space-y-3 mb-4">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <FaDollarSign className="w-4 h-4 text-green-600 mr-2" />
                                <span className="text-xs text-gray-600">Total Earnings</span>
                              </div>
                              <span className="font-semibold text-green-600 text-sm sm:text-base">
                                {formatCurrency(wallet.totalEarnings || 0)}
                              </span>
                            </div>

                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <FaChartLine className="w-4 h-4 text-yellow-600 mr-2" />
                                <span className="text-xs text-gray-600">Withdrawals</span>
                              </div>
                              <span className="font-semibold text-yellow-600 text-sm sm:text-base">
                                {formatCurrency(wallet.totalWithdrawn || 0)}
                              </span>
                            </div>

                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <FaWallet className="w-4 h-4 text-purple-600 mr-2" />
                                <span className="text-xs text-gray-600">Current Balance</span>
                              </div>
                              <span className="font-semibold text-purple-600 text-sm sm:text-base">
                                {formatCurrency(wallet.balance || 0)}
                              </span>
                            </div>
                          </div>

                          {/* Simple Action Buttons */}
                          <div className="flex justify-center gap-2 mt-auto">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDetails(wallet)}
                                  className="
                                    bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 font-medium px-3 py-2 rounded-md
                                    border border-blue-200 hover:border-blue-300 transition-colors duration-200
                                    focus:ring-2 focus:ring-blue-300 focus:ring-offset-2
                                  "
                                >
                                  <FaEye className="w-4 h-4 mr-2" />
                                  View Details
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View seller details and transaction history</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </nav>
        </div>
      )}

      {/* Seller Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaBuilding className="w-5 h-5 text-blue-600" />
              Seller Details & Transaction History
            </DialogTitle>
          </DialogHeader>
          
          {selectedWallet && (
            <div className="space-y-6">
              {/* Seller Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FaUser className="w-5 h-5 mr-2 text-blue-600" />
                  Seller Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Business Name</label>
                    <p className="text-sm text-gray-900">{selectedWallet.seller?.businessName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Email</label>
                    <p className="text-sm text-gray-900">{selectedWallet.seller?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-sm text-gray-900">{selectedWallet.seller?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedWallet.seller?.isApproved)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Wallet Summary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FaWallet className="w-5 h-5 mr-2 text-blue-600" />
                  Wallet Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedWallet.totalEarnings || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Earnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(selectedWallet.totalWithdrawn || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Withdrawn</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(selectedWallet.balance || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Current Balance</div>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FaHistory className="w-5 h-5 mr-2 text-blue-600" />
                    Transaction History
                  </h3>
                </div>
                
                <div className="p-4">
                  {loadingTransactions ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading transactions...</span>
                    </div>
                  ) : walletTransactions.length === 0 ? (
                    <div className="text-center py-8">
                      <FaHistory className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No transactions found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {walletTransactions.map((transaction, index) => (
                        <div
                          key={transaction._id || index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              transaction.type === 'credit' 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-red-100 text-red-600'
                            }`}>
                              {transaction.type === 'credit' ? (
                                <FaArrowUp className="w-4 h-4" />
                              ) : (
                                <FaArrowDown className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{transaction.description}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(transaction.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${
                              transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Balance: {formatCurrency(transaction.balance)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSellerEarnings;
