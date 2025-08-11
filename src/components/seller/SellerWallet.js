import React, { useState, useEffect, useMemo } from 'react';
import { sellerWalletAPI } from '../../api/walletAPI';
import { formatINR as formatCurrency } from '../../utils/formatCurrency';
import { toast } from 'react-toastify';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  MenuItem,
  Button,
  Box,
  Typography
} from '@mui/material';
import { Tabs, Tab } from '@mui/material';

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
          <Grid item xs={12} md={6}>
            <TextField
              label="Account Number"
              name="bankDetails.accountNumber"
              value={withdrawalForm.bankDetails.accountNumber}
              onChange={handleInputChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="IFSC Code"
              name="bankDetails.ifscCode"
              value={withdrawalForm.bankDetails.ifscCode}
              onChange={handleInputChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Account Holder Name"
              name="bankDetails.accountHolderName"
              value={withdrawalForm.bankDetails.accountHolderName}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Bank Name"
              name="bankDetails.bankName"
              value={withdrawalForm.bankDetails.bankName}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Branch (Optional)"
              name="bankDetails.branch"
              value={withdrawalForm.bankDetails.branch}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
        </>
      );
    }
    if (pm === 'upi') {
      return (
        <Grid item xs={12}>
          <TextField
            label="UPI ID"
            name="bankDetails.upiId"
            value={withdrawalForm.bankDetails.upiId}
            onChange={handleInputChange}
            fullWidth
            required
            placeholder="name@bank"
          />
        </Grid>
      );
    }
    // paytm / phonepe
    return (
      <Grid item xs={12}>
        <TextField
          label="Wallet / Mobile Number"
          name="bankDetails.walletNumber"
          value={withdrawalForm.bankDetails.walletNumber}
          onChange={handleInputChange}
          fullWidth
          required
        />
      </Grid>
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
      {/* Wallet Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Wallet Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-600">Available Balance</h3>
            <p className="text-2xl font-bold text-blue-800">
              {formatCurrency(wallet?.balance || 0)}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-600">Total Earnings</h3>
            <p className="text-2xl font-bold text-green-800">
              {formatCurrency(wallet?.totalEarnings || 0)}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-orange-600">Total Withdrawn</h3>
            <p className="text-2xl font-bold text-orange-800">
              {formatCurrency(wallet?.totalWithdrawn || 0)}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-600">Pending Withdrawals</h3>
            <p className="text-2xl font-bold text-yellow-800">
              {formatCurrency(wallet?.pendingWithdrawals || 0)}
            </p>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            onClick={() => setShowWithdrawalForm(true)}
            disabled={!wallet?.balance || wallet.balance < 100}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Request Withdrawal
          </button>
        </div>
      </div>

      {/* Withdrawal Form Modal */}
      {showWithdrawalForm && (
        <Dialog open onClose={() => setShowWithdrawalForm(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Withdrawal Request</DialogTitle>
          <form onSubmit={handleWithdrawalSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    type="number"
                    label="Amount (₹)"
                    name="amount"
                    value={withdrawalForm.amount}
                    onChange={handleInputChange}
                    inputProps={{ min: 100, max: wallet?.balance || 0 }}
                    fullWidth
                    required
                    helperText={`Min: ₹100, Max: ${formatCurrency(wallet?.balance || 0)}`}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    label="Payment Method"
                    name="paymentMethod"
                    value={withdrawalForm.paymentMethod}
                    onChange={handleInputChange}
                    fullWidth
                  >
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="upi">UPI</MenuItem>
                    <MenuItem value="paytm">Paytm</MenuItem>
                    <MenuItem value="phonepe">PhonePe</MenuItem>
                  </TextField>
                </Grid>

                {methodFields}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowWithdrawalForm(false)} variant="outlined">Cancel</Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      )}

      {/* History Switcher */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <Tabs value={historyTab} onChange={(e, v) => setHistoryTab(v)} textColor="primary" indicatorColor="primary">
            <Tab label="Transactions" value="transactions" />
            <Tab label="Withdrawals" value="withdrawals" />
          </Tabs>
        </div>

        {historyTab === 'transactions' ? (
          <>
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No transactions found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(transaction.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${transaction.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                            {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{transaction.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(transaction.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {txTotalPages > 1 && (
              <div className="flex justify-center mt-6">
                <nav className="flex space-x-2">
                  <button onClick={() => setTxPage(prev => Math.max(prev - 1, 1))} disabled={txPage === 1} className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed">Previous</button>
                  {Array.from({ length: txTotalPages }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => setTxPage(page)} className={`px-3 py-2 border rounded-md text-sm font-medium ${txPage === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{page}</button>
                  ))}
                  <button onClick={() => setTxPage(prev => Math.min(prev + 1, txTotalPages))} disabled={txPage === txTotalPages} className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed">Next</button>
                </nav>
              </div>
            )}
          </>
        ) : (
          <>
            {withdrawals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No withdrawal requests found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {withdrawals.map(w => (
                      <tr key={w._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(w.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(w.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{w.paymentMethod}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${w.status === 'processed' ? 'bg-green-100 text-green-800' : w.status === 'approved' ? 'bg-blue-100 text-blue-800' : w.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{w.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {wdTotalPages > 1 && (
              <div className="flex justify-center mt-6">
                <nav className="flex space-x-2">
                  <button onClick={() => setWdPage(prev => Math.max(prev - 1, 1))} disabled={wdPage === 1} className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed">Previous</button>
                  {Array.from({ length: wdTotalPages }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => setWdPage(page)} className={`px-3 py-2 border rounded-md text-sm font-medium ${wdPage === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{page}</button>
                  ))}
                  <button onClick={() => setWdPage(prev => Math.min(prev + 1, wdTotalPages))} disabled={wdPage === wdTotalPages} className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed">Next</button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SellerWallet;
