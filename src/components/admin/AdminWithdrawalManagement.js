import React, { useState, useEffect } from 'react';
import { adminWalletAPI } from '../../api/walletAPI';
import { formatINR as formatCurrency } from '../../utils/formatCurrency';
import { toast } from 'react-toastify';

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
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getActionButtons = (withdrawal) => {
    if (withdrawal.status === 'pending') {
      return (
        <div className="flex flex-col gap-2 items-stretch">
          <button
            onClick={() => handleAction(withdrawal, 'approve')}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 w-full"
          >
            Approve
          </button>
          <button
            onClick={() => handleAction(withdrawal, 'reject')}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 w-full"
          >
            Reject
          </button>
        </div>
      );
    } else if (withdrawal.status === 'approved') {
      return (
        <button
          onClick={() => handleAction(withdrawal, 'process')}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 w-full"
        >
          Mark Processed
        </button>
      );
    }
    return null;
  };

  const renderPaymentDetails = (w) => {
    const d = w.bankDetails || {};
    if (w.paymentMethod === 'bank_transfer') {
      return (
        <div className="text-xs text-gray-700">
          <div><span className="font-semibold">A/C:</span> {d.accountNumber || '-'}</div>
          <div><span className="font-semibold">IFSC:</span> {d.ifscCode || '-'}</div>
          <div><span className="font-semibold">Name:</span> {d.accountHolderName || '-'}</div>
          {d.bankName && <div><span className="font-semibold">Bank:</span> {d.bankName}</div>}
        </div>
      );
    }
    if (w.paymentMethod === 'upi') {
      return <div className="text-xs text-gray-700"><span className="font-semibold">UPI:</span> {d.upiId || '-'}</div>;
    }
    // paytm/phonepe
    return <div className="text-xs text-gray-700"><span className="font-semibold">Wallet:</span> {d.walletNumber || '-'}</div>;
  };

  const copyField = async (label, value) => {
    try {
      if (!value) return;
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Copy failed');
    }
  };

  const exportCSV = () => {
    const headers = ['Seller','Email','Amount','Method','Status','Created At','Account Number','IFSC','Holder Name','Bank Name','UPI','Wallet Number'];
    const rows = withdrawals.map(w => [
      w.seller?.businessName || '',
      w.seller?.email || '',
      w.amount,
      w.paymentMethod,
      w.status,
      new Date(w.createdAt).toISOString(),
      w.bankDetails?.accountNumber || '',
      w.bankDetails?.ifscCode || '',
      w.bankDetails?.accountHolderName || '',
      w.bankDetails?.bankName || '',
      w.bankDetails?.upiId || '',
      w.bankDetails?.walletNumber || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'\"')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `withdrawals_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(withdrawals.map(w => w._id));
    else setSelectedIds([]);
  };
  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const bulkApprove = async () => {
    const targets = withdrawals.filter(w => selectedIds.includes(w._id) && w.status === 'pending');
    if (targets.length === 0) return toast.info('Select pending requests to approve');
    setSubmitting(true);
    try {
      for (const w of targets) {
        await adminWalletAPI.approveWithdrawal(w._id, 'Bulk approve');
      }
      toast.success('Approved selected');
      fetchWithdrawals();
    } catch (e) {
      toast.error('Bulk approve failed');
    } finally {
      setSubmitting(false);
    }
  };

  const bulkReject = async () => {
    const targets = withdrawals.filter(w => selectedIds.includes(w._id) && w.status === 'pending');
    if (targets.length === 0) return toast.info('Select pending requests to reject');
    setSubmitting(true);
    try {
      for (const w of targets) {
        await adminWalletAPI.rejectWithdrawal(w._id, 'Bulk reject');
      }
      toast.success('Rejected selected');
      fetchWithdrawals();
    } catch (e) {
      toast.error('Bulk reject failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Withdrawal Management</h2>
        
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="processed">Processed</option>
        </select>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="px-3 py-2 border rounded text-sm hover:bg-gray-50">Export CSV</button>
          <button onClick={bulkApprove} disabled={submitting} className="px-3 py-2 bg-green-600 text-white rounded text-sm disabled:opacity-60">Bulk Approve</button>
          <button onClick={bulkReject} disabled={submitting} className="px-3 py-2 bg-red-600 text-white rounded text-sm disabled:opacity-60">Bulk Reject</button>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white rounded-lg shadow-md">
          <table className="w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 w-10"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.length>0 && selectedIds.length===withdrawals.length} /></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Seller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                  Payment Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No withdrawals found
                  </td>
                </tr>
              ) : (
                withdrawals.map((withdrawal) => (
                  <tr key={withdrawal._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 align-top"><input type="checkbox" checked={selectedIds.includes(withdrawal._id)} onChange={() => toggleSelect(withdrawal._id)} /></td>
                    <td className="px-6 py-4 align-top">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {withdrawal.seller.businessName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {withdrawal.seller.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(withdrawal.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="text-sm text-gray-900 capitalize">
                        {withdrawal.paymentMethod.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-start gap-3 whitespace-normal break-words">
                        {renderPaymentDetails(withdrawal)}
                        <div className="flex flex-col gap-1">
                          {withdrawal.paymentMethod==='bank_transfer' && (
                            <>
                              <button className="text-xs underline" onClick={()=>copyField('Account number', withdrawal.bankDetails?.accountNumber)}>Copy A/C</button>
                              <button className="text-xs underline" onClick={()=>copyField('IFSC', withdrawal.bankDetails?.ifscCode)}>Copy IFSC</button>
                            </>
                          )}
                          {withdrawal.paymentMethod==='upi' && (
                            <button className="text-xs underline" onClick={()=>copyField('UPI', withdrawal.bankDetails?.upiId)}>Copy UPI</button>
                          )}
                          {(withdrawal.paymentMethod==='paytm' || withdrawal.paymentMethod==='phonepe') && (
                            <button className="text-xs underline" onClick={()=>copyField('Wallet number', withdrawal.bankDetails?.walletNumber)}>Copy Wallet</button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      {getStatusBadge(withdrawal.status)}
                    </td>
                    <td className="px-6 py-4 align-top text-sm text-gray-900">
                      {new Date(withdrawal.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 align-top text-sm font-medium">
                      <div className="flex flex-wrap gap-2">
                        {getActionButtons(withdrawal)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 border rounded-md text-sm font-medium ${
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">
              {actionType === 'approve' && 'Approve Withdrawal'}
              {actionType === 'reject' && 'Reject Withdrawal'}
              {actionType === 'process' && 'Mark as Processed'}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Seller:</strong> {selectedWithdrawal.seller.businessName}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Amount:</strong> {formatCurrency(selectedWithdrawal.amount)}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Payment Method:</strong> {selectedWithdrawal.paymentMethod.replace('_', ' ')}
              </p>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              {actionType === 'approve' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={actionData.notes || ''}
                    onChange={(e) => setActionData({ ...actionData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
              )}

              {actionType === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rejection Reason *
                  </label>
                  <textarea
                    name="reason"
                    value={actionData.reason || ''}
                    onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    required
                  />
                </div>
              )}

              {actionType === 'process' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction ID *
                  </label>
                  <input
                    type="text"
                    name="transactionId"
                    value={actionData.transactionId || ''}
                    onChange={(e) => setActionData({ ...actionData, transactionId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter payment transaction ID"
                    required
                  />
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 px-4 py-2 text-white rounded-md disabled:bg-gray-400 ${
                    actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                    actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {submitting ? 'Processing...' : 
                    actionType === 'approve' ? 'Approve' :
                    actionType === 'reject' ? 'Reject' :
                    'Process'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWithdrawalManagement;
