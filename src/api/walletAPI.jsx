import axios from './axiosConfig.jsx';

// Seller wallet API calls
export const sellerWalletAPI = {
  // Get seller wallet details
  getWallet: () => axios.get('/wallet'),
  
  // Get transaction history
  getTransactions: (page = 1, limit = 10) => 
    axios.get(`/wallet/transactions?page=${page}&limit=${limit}`),
  // Get seller withdrawal history
  getWithdrawals: (page = 1, limit = 10) =>
    axios.get(`/wallet/withdrawals?page=${page}&limit=${limit}`),
  
  // Create withdrawal request
  createWithdrawal: (data) => axios.post('/wallet/withdraw', data)
};

// Admin wallet API calls
export const adminWalletAPI = {
  // Get admin wallet overview
  getOverview: () => axios.get('/wallet/admin/overview'),
  
  // Get seller earnings report
  getSellerEarnings: (page = 1, limit = 10) => 
    axios.get(`/wallet/admin/sellers?page=${page}&limit=${limit}`),
  
  // Get withdrawal requests
  getWithdrawals: (page = 1, limit = 10, status = '') => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    return axios.get(`/wallet/admin/withdrawals?${params}`);
  },
  
  // Approve withdrawal request
  approveWithdrawal: (id, notes = '') => 
    axios.put(`/wallet/admin/withdrawals/${id}/approve`, { notes }),
  
  // Reject withdrawal request
  rejectWithdrawal: (id, reason) => 
    axios.put(`/wallet/admin/withdrawals/${id}/reject`, { reason }),
  
  // Mark withdrawal as processed
  processWithdrawal: (id, transactionId) => 
    axios.put(`/wallet/admin/withdrawals/${id}/process`, { transactionId })
};
