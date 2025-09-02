import React, { useState, useEffect, useMemo } from 'react';
import { FaWallet, FaArrowUp, FaArrowDown, FaCreditCard, FaHistory, FaMoneyBillWave } from 'react-icons/fa';
import { sellerWalletAPI } from '../../api/walletAPI';
import { formatINR as formatCurrency } from '../../utils/formatCurrency';
import { toast } from 'react-toastify';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { motion } from 'framer-motion';


const SellerWallet = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyTab, setHistoryTab] = useState('transactions');
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    bankDetails: {
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branch: '',
      upiId: '',
      walletNumber: ''
    },
    paymentMethod: 'bank_transfer'
  });
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [wdPage, setWdPage] = useState(1);
  const [wdTotalPages, setWdTotalPages] = useState(1);

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    if (historyTab === 'transactions') {
      fetchTransactions();
    }
  }, [historyTab, txPage]);

  useEffect(() => {
    if (historyTab === 'withdrawals') {
      fetchWithdrawals();
    }
  }, [historyTab, wdPage]);

  const fetchWalletData = async () => {
    try {
      const response = await sellerWalletAPI.getWallet();
      setWallet(response.data.data.wallet);
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast.error('Failed to fetch wallet data');
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await sellerWalletAPI.getTransactions(txPage, 10);
      setTransactions(response.data.data.transactions);
      setTxTotalPages(response.data.data.totalPages);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const response = await sellerWalletAPI.getWithdrawals(wdPage, 10);
      const payload = response.data.data || {};
      setWithdrawals(payload.withdrawals || []);
      if (payload.pagination) setWdTotalPages(payload.pagination.totalPages || 1);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  };

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    
    if (withdrawalForm.amount < 100) {
      toast.error('Minimum withdrawal amount is ₹100');
      return;
    }

    if (withdrawalForm.amount > wallet.balance) {
      toast.error('Insufficient balance');
      return;
    }

    setSubmitting(true);
    try {
      await sellerWalletAPI.createWithdrawal(withdrawalForm);
      toast.success('Withdrawal request created successfully');
      setShowWithdrawalForm(false);
      setWithdrawalForm({
        amount: '',
        bankDetails: {
          accountHolderName: '',
          accountNumber: '',
          ifscCode: '',
          bankName: '',
          branch: ''
        },
        paymentMethod: 'bank_transfer'
      });
      fetchWalletData();
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      toast.error(error.response?.data?.message || 'Failed to create withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('bankDetails.')) {
      const field = name.split('.')[1];
      setWithdrawalForm(prev => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [field]: value
        }
      }));
    } else {
      setWithdrawalForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const methodFields = useMemo(() => {
    const pm = withdrawalForm.paymentMethod;
    if (pm === 'bank_transfer') {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="bankDetails.accountNumber"
                value={withdrawalForm.bankDetails.accountNumber}
                onChange={handleInputChange}
                placeholder="Enter account number"
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IFSC Code <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="bankDetails.ifscCode"
                value={withdrawalForm.bankDetails.ifscCode}
                onChange={handleInputChange}
                placeholder="Enter IFSC code"
                className="w-full"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Holder Name
              </label>
              <Input
                type="text"
                name="bankDetails.accountHolderName"
                value={withdrawalForm.bankDetails.accountHolderName}
                onChange={handleInputChange}
                placeholder="Enter account holder name"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name
              </label>
              <Input
                type="text"
                name="bankDetails.bankName"
                value={withdrawalForm.bankDetails.bankName}
                onChange={handleInputChange}
                placeholder="Enter bank name"
                className="w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch (Optional)
            </label>
            <Input
              type="text"
              name="bankDetails.branch"
              value={withdrawalForm.bankDetails.branch}
              onChange={handleInputChange}
              placeholder="Enter branch name"
              className="w-full"
            />
          </div>
        </>
      );
    }
    if (pm === 'upi') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            UPI ID <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            name="bankDetails.upiId"
            value={withdrawalForm.bankDetails.upiId}
            onChange={handleInputChange}
            placeholder="name@bank"
            className="w-full"
            required
          />
        </div>
      );
    }
    // paytm / phonepe
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Wallet / Mobile Number <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          name="bankDetails.walletNumber"
          value={withdrawalForm.bankDetails.walletNumber}
          onChange={handleInputChange}
          placeholder="Enter wallet or mobile number"
          className="w-full"
          required
        />
      </div>
    );
  }, [withdrawalForm.paymentMethod, withdrawalForm.bankDetails, handleInputChange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Wallet Management</h2>
          <p className="text-gray-600 text-sm sm:text-base">Manage your earnings and withdrawal requests</p>
        </div>
        <Button
          onClick={() => setShowWithdrawalForm(true)}
          disabled={!wallet?.balance || wallet.balance < 100}
          className="text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <FaMoneyBillWave className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
          Request Withdrawal
        </Button>
      </div>

      {/* Stats Cards - Mobile Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Available Balance</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">
                  {formatCurrency(wallet?.balance || 0)}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-blue-50">
                <FaWallet className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">
                  {formatCurrency(wallet?.totalEarnings || 0)}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-green-50">
                <FaArrowUp className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Withdrawn</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-600">
                  {formatCurrency(wallet?.totalWithdrawn || 0)}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-orange-50">
                <FaArrowDown className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pending Withdrawals</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                  {formatCurrency(wallet?.pendingWithdrawals || 0)}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-yellow-50">
                <FaCreditCard className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Form Modal */}
      <Dialog open={showWithdrawalForm} onOpenChange={setShowWithdrawalForm}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-gray-900">Request Withdrawal</DialogTitle>
            <p className="text-sm text-gray-600 mt-1">Enter your withdrawal details and payment information</p>
          </DialogHeader>
          
          <form onSubmit={handleWithdrawalSubmit} className="overflow-y-auto max-h-[calc(95vh-200px)]">
            <div className="space-y-6 p-1">
              {/* Amount and Payment Method Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₹</span>
                    <Input
                      type="number"
                      name="amount"
                      value={withdrawalForm.amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="100"
                      max={wallet?.balance || 0}
                      className="pl-8 pr-4 py-3 border border-gray-300 focus:border-blue-500 rounded-lg text-sm"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Min: ₹100, Max: {formatCurrency(wallet?.balance || 0)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="paymentMethod"
                    value={withdrawalForm.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 focus:border-blue-500 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="paytm">Paytm</option>
                    <option value="phonepe">PhonePe</option>
                  </select>
                </div>
              </div>

              {/* Payment Method Specific Fields */}
              <div className="space-y-4">
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">
                    {withdrawalForm.paymentMethod === 'bank_transfer' && 'Bank Account Details'}
                    {withdrawalForm.paymentMethod === 'upi' && 'UPI Details'}
                    {(withdrawalForm.paymentMethod === 'paytm' || withdrawalForm.paymentMethod === 'phonepe') && 'Wallet Details'}
                  </h4>
                  {methodFields}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowWithdrawalForm(false)}
                  disabled={submitting}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !withdrawalForm.amount || withdrawalForm.amount < 100}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </div>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setHistoryTab('transactions')}
                className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                  historyTab === 'transactions'
                    ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FaHistory className="w-4 h-4 mr-2" />
                Transactions
              </button>
              <button
                onClick={() => setHistoryTab('withdrawals')}
                className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                  historyTab === 'withdrawals'
                    ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FaMoneyBillWave className="w-4 h-4 mr-2" />
                Withdrawals
              </button>
            </div>
          </div>

        {historyTab === 'transactions' ? (
          <>
            {transactions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-gray-400 mb-2">No transactions found</div>
                  <div className="text-sm text-gray-500">Your transaction history will appear here</div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Transaction History ({transactions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {transactions.map((transaction, index) => (
                      <motion.div
                        key={transaction._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className="group"
                      >
                        <Card className={`h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 ${
                          transaction.type === 'credit' ? 'border-l-green-500' : 'border-l-red-500'
                        }`}>
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                                  {new Date(transaction.createdAt).toLocaleDateString()}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  {new Date(transaction.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                              <Badge className={transaction.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                              </Badge>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Amount:</span>
                                <span className={`font-semibold text-lg ${
                                  transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Balance:</span>
                                <span className="font-semibold text-gray-900">{formatCurrency(transaction.balance)}</span>
                              </div>
                              
                              <div className="pt-2 border-t border-gray-100">
                                <p className="text-sm text-gray-700">{transaction.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {txTotalPages > 1 && (
              <div className="flex justify-center mt-6">
                <nav className="flex space-x-2">
                  <button 
                    onClick={() => setTxPage(prev => Math.max(prev - 1, 1))} 
                    disabled={txPage === 1} 
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                  >
                    Previous
                  </button>
                  {Array.from({ length: txTotalPages }, (_, i) => i + 1).map(page => (
                    <button 
                      key={page} 
                      onClick={() => setTxPage(page)} 
                      className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all duration-200 ${
                        txPage === page 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button 
                    onClick={() => setTxPage(prev => Math.min(prev + 1, txTotalPages))} 
                    disabled={txPage === txTotalPages} 
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        ) : (
          <>
            {withdrawals.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-gray-400 mb-2">No withdrawal requests found</div>
                  <div className="text-sm text-gray-500">Your withdrawal history will appear here</div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Withdrawal History ({withdrawals.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {withdrawals.map((withdrawal, index) => (
                      <motion.div
                        key={withdrawal._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className="group"
                      >
                        <Card className={`h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 ${
                          withdrawal.status === 'processed' ? 'border-l-green-500' : 
                          withdrawal.status === 'approved' ? 'border-l-blue-500' : 
                          withdrawal.status === 'rejected' ? 'border-l-red-500' : 'border-l-yellow-500'
                        }`}>
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                                  {new Date(withdrawal.createdAt).toLocaleDateString()}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  {new Date(withdrawal.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                              <Badge className={
                                withdrawal.status === 'processed' ? 'bg-green-100 text-green-800' : 
                                withdrawal.status === 'approved' ? 'bg-blue-100 text-blue-800' : 
                                withdrawal.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                              }>
                                {withdrawal.status}
                              </Badge>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Amount:</span>
                                <span className="font-semibold text-lg text-gray-900">{formatCurrency(withdrawal.amount)}</span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Method:</span>
                                <span className="font-semibold text-gray-900 capitalize">{withdrawal.paymentMethod}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {wdTotalPages > 1 && (
              <div className="flex justify-center mt-6">
                <nav className="flex space-x-2">
                  <button 
                    onClick={() => setWdPage(prev => Math.max(prev - 1, 1))} 
                    disabled={wdPage === 1} 
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                  >
                    Previous
                  </button>
                  {Array.from({ length: wdTotalPages }, (_, i) => i + 1).map(page => (
                    <button 
                      key={page} 
                      onClick={() => setWdPage(page)} 
                      className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all duration-200 ${
                        wdPage === page 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button 
                    onClick={() => setWdPage(prev => Math.min(prev + 1, wdTotalPages))} 
                    disabled={wdPage === wdTotalPages} 
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerWallet;
