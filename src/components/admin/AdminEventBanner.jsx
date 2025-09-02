import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaImage } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import productAPI from '../../api/productAPI';
import { toast } from 'react-toastify';

const AdminEventBanner = () => {
  const [eventBanner, setEventBanner] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', description: '', endDate: '', product: '' });
  const [actionLoading, setActionLoading] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bannerRes, productsRes] = await Promise.all([
        productAPI.getEventBanner(),
        productAPI.getProducts()
      ]);
      setEventBanner(bannerRes.data);
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = () => {
    if (eventBanner) {
      setEventForm({
        title: eventBanner.title || '',
        description: eventBanner.description || '',
        endDate: eventBanner.endDate ? eventBanner.endDate.slice(0, 16) : '',
        product: eventBanner.product?._id || ''
      });
    } else {
      setEventForm({ title: '', description: '', endDate: '', product: '' });
    }
    setFormError('');
    setFormOpen(true);
  };

  const handleEventFormChange = (e) => {
    const { name, value } = e.target;
    setEventForm(prev => ({ ...prev, [name]: value }));
    setFormError(''); // Clear error when user types
  };

  const handleEventFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!eventForm.title?.trim()) {
      setFormError('Event title is required');
      return;
    }
    if (!eventForm.description?.trim()) {
      setFormError('Event description is required');
      return;
    }
    if (!eventForm.endDate) {
      setFormError('End date is required');
      return;
    }
    if (!eventForm.product) {
      setFormError('Please select a featured product');
      return;
    }

    // Check if end date is in the future
    const endDate = new Date(eventForm.endDate);
    const now = new Date();
    if (endDate <= now) {
      setFormError('End date must be in the future');
      return;
    }

    setActionLoading('submit');
    setFormError('');
    
    try {
      // Create or update event banner
      const bannerRes = await productAPI.createOrUpdateEventBanner({
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        endDate: eventForm.endDate,
        product: eventForm.product
      });

      // Set the product as event product
      await productAPI.setEventProduct(eventForm.product);

      toast.success('Event banner updated successfully');
      setFormOpen(false);
      fetchData();
    } catch (error) {
      console.error('Event banner save error:', error);
      setFormError(error.response?.data?.message || 'Failed to save event banner');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteEventBanner = async () => {
    if (!window.confirm('Are you sure you want to delete the event banner?')) return;
    setActionLoading('delete');
    try {
      await productAPI.deleteEventBanner();
      setEventBanner(null);
      toast.success('Event banner deleted successfully');
    } catch (error) {
      toast.error('Failed to delete event banner');
    } finally {
      setActionLoading(null);
    }
  };

  const getBannerStatus = () => {
    if (!eventBanner) return { status: 'No Banner', color: 'bg-gray-100 text-gray-800' };
    
    const now = new Date();
    const endDate = new Date(eventBanner.endDate);
    
    if (endDate < now) {
      return { status: 'Expired', color: 'bg-red-100 text-red-800' };
    } else {
      return { status: 'Active', color: 'bg-green-100 text-green-800' };
    }
  };

  const bannerStatus = getBannerStatus();

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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Event Banner Management</h2>
          <p className="text-gray-600 text-sm sm:text-base">Manage promotional event banners and featured products</p>
        </div>
        <Button onClick={handleOpenForm} className="text-xs sm:text-sm">
          <FaPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          {eventBanner ? 'Edit Banner' : 'Create Banner'}
        </Button>
      </div>

      {/* Stats Cards - Mobile Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Current Banner</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{eventBanner ? 'Active' : 'None'}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-blue-50">
                <FaImage className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{products.length}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-green-50">
                <FaImage className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Banner Status</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                  {eventBanner ? (new Date(eventBanner.endDate) > new Date() ? 'Active' : 'Expired') : 'Inactive'}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-yellow-50">
                <FaImage className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Days Remaining</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">
                  {eventBanner ? Math.max(0, Math.ceil((new Date(eventBanner.endDate) - new Date()) / (1000 * 60 * 60 * 24))) : 0}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-purple-50">
                <FaImage className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Banner Display - Mobile Responsive */}
      {eventBanner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Current Event Banner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{eventBanner.title}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1">{eventBanner.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm text-gray-500">End Date</p>
                  <p className="font-medium text-gray-900 text-sm sm:text-base">
                    {new Date(eventBanner.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {eventBanner.product && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base mb-2">Featured Product</h4>
                  <div className="flex items-center space-x-3">
                    {eventBanner.product.image && (
                      <img 
                        src={eventBanner.product.image} 
                        alt={eventBanner.product.name}
                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">{eventBanner.product.name}</p>
                      <p className="text-gray-600 text-xs sm:text-sm">{eventBanner.product.category?.name}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button 
                  onClick={handleOpenForm}
                  className="text-xs sm:text-sm"
                >
                  <FaEdit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Edit Banner
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleDeleteEventBanner}
                  disabled={actionLoading === 'delete'}
                  className="text-xs sm:text-sm"
                >
                  <FaTrash className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Delete Banner
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Banner State */}
      {!eventBanner && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FaImage className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Event Banner</h3>
            <p className="text-gray-600 text-sm mb-4">Create a new event banner to promote featured products</p>
            <Button onClick={handleOpenForm} className="text-xs sm:text-sm">
              <FaPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Create Banner
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Banner Preview */}
      {eventForm.title && (
        <Card>
          <CardHeader>
            <CardTitle>Banner Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{eventForm.title}</h3>
                  <p className="text-blue-100 mb-4">{eventForm.description}</p>
                  {eventForm.endDate && (
                    <p className="text-sm text-blue-200">
                      Ends: {new Date(eventForm.endDate).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex justify-center">
                  {eventForm.product && products.find(p => p._id === eventForm.product)?.images?.[0]?.url && (
                    <img 
                      src={products.find(p => p._id === eventForm.product).images[0].url} 
                      alt="Product preview" 
                      className="w-48 h-32 object-cover rounded-lg shadow-lg"
                    />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Banner Modal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {eventBanner ? 'Edit Event Banner' : 'Create New Event Banner'}
            </DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm mb-4">
              {formError}
            </div>
          )}

          <form onSubmit={handleEventFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                <Input
                  name="title"
                  value={eventForm.title}
                  onChange={handleEventFormChange}
                  placeholder="Enter event title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time *</label>
                <Input
                  type="datetime-local"
                  name="endDate"
                  value={eventForm.endDate}
                  onChange={handleEventFormChange}
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Description *</label>
              <Textarea
                name="description"
                value={eventForm.description}
                onChange={handleEventFormChange}
                placeholder="Enter event description"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Featured Product *</label>
              <Select
                value={eventForm.product}
                onValueChange={(value) => setEventForm({ ...eventForm, product: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product to feature" />
                </SelectTrigger>
                <SelectContent>
                  {products.filter(p => p.isApproved).map(product => (
                    <SelectItem key={product._id} value={product._id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={actionLoading === 'submit'}
              >
                {actionLoading === 'submit' ? 'Saving...' : (eventBanner ? 'Update Banner' : 'Create Banner')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEventBanner;
