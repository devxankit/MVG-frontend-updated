import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaUser, FaEnvelope, FaCalendarAlt, FaShieldAlt } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import LoadMore from '../ui/LoadMore';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../../api/axiosConfig';
import { toast } from 'react-toastify';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editModal, setEditModal] = useState({ open: false, user: null });
  const [editForm, setEditForm] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  
  // LoadMore state
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/users');
      setUsers(res.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditForm({ ...user });
    setEditModal({ open: true, user });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(editModal.user._id + 'edit');
    try {
      const res = await axiosInstance.put(`/admin/users/${editModal.user._id}`, editForm);
      setUsers(users.map(u => u._id === editModal.user._id ? res.data : u));
      setEditModal({ open: false, user: null });
      toast.success('User updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setActionLoading(userId + 'delete');
    try {
      await axiosInstance.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u._id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'seller':
        return 'bg-blue-100 text-blue-800';
      case 'customer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 text-sm sm:text-base">Manage platform users and their roles</p>
        </div>
      </div>

      {/* Stats Cards - Mobile Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-blue-50">
                <FaEdit className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Customers</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">
                  {users.filter(user => user.role === 'customer').length}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-green-50">
                <FaEdit className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Sellers</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                  {users.filter(user => user.role === 'seller').length}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-yellow-50">
                <FaEdit className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">
                  {users.filter(user => user.status === 'active').length}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-purple-50">
                <FaEdit className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
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
              placeholder="Search users by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Cards - Responsive Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <LoadMore 
              items={filteredUsers} 
              itemsPerPage={itemsPerPage}
              autoLoad={false}
              className="space-y-6"
            >
              {(displayedItems) => (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  <AnimatePresence>
                    {displayedItems.map((user, index) => (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className="group"
                  >
                    <Card className="h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 border-l-blue-500">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=3b82f6&color=fff`} />
                              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                                {user.name || 'Unknown User'}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-500 truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-1">
                            <Badge className={`${getRoleColor(user.role)} text-xs`}>
                              {user.role}
                            </Badge>
                            <Badge className={`${getStatusColor(user.status)} text-xs`}>
                              {user.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <FaEnvelope className="w-3 h-3 mr-2 text-gray-400" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <FaCalendarAlt className="w-3 h-3 mr-2 text-gray-400" />
                            <span>Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center text-xs sm:text-sm text-gray-600">
                              <FaUser className="w-3 h-3 mr-2 text-gray-400" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                          <div className="flex space-x-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                  disabled={actionLoading === user._id + 'edit'}
                                  className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <FaEdit className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit User</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user._id)}
                                  disabled={actionLoading === user._id + 'delete'}
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                >
                                  <FaTrash className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete User</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="text-xs text-gray-400">
                            ID: {user._id.slice(-6)}
                          </div>
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

      {/* Edit User Modal */}
      <Dialog open={editModal.open} onOpenChange={(open) => setEditModal({ open, user: null })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <Input
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <Select
                value={editForm.role || ''}
                onValueChange={(value) => setEditForm({ ...editForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Select
                value={editForm.status || ''}
                onValueChange={(value) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModal({ open: false, user: null })}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={actionLoading === editModal.user?._id + 'edit'}
              >
                {actionLoading === editModal.user?._id + 'edit' ? 'Updating...' : 'Update User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
