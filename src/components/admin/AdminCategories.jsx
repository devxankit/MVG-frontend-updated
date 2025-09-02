import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaImage, FaFolder, FaFolderOpen } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Textarea } from '../ui/Textarea';
import { Input } from '../ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import productAPI from '../../api/productAPI';
import { toast } from 'react-toastify';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMainCat, setSelectedMainCat] = useState('');
  const [activeTab, setActiveTab] = useState('main');
  const [categoryModal, setCategoryModal] = useState({ open: false, category: null });
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '', image: null });
  const [actionLoading, setActionLoading] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getCategories();
      setCategories(res.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCategoryModal = (category = null) => {
    setCategoryForm(category ? { ...category, image: null } : { name: '', slug: '', description: '', image: null });
    setImagePreview(category?.image || null);
    setCategoryModal({ open: true, category });
  };

  const handleCategoryFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      const file = files[0];
      setCategoryForm((prev) => ({ ...prev, image: file }));
      
      // Create image preview
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
    } else {
      setCategoryForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCategoryFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!categoryForm.name?.trim()) {
      toast.error('Category name is required');
      return;
    }
    if (!categoryForm.slug?.trim()) {
      toast.error('Category slug is required');
      return;
    }
    
    setActionLoading('submit');
    try {
      const formData = new FormData();
      formData.append('name', categoryForm.name.trim());
      formData.append('slug', categoryForm.slug.trim());
      formData.append('description', categoryForm.description?.trim() || '');
      if (categoryForm.parentCategory) formData.append('parentCategory', categoryForm.parentCategory);
      if (categoryForm.image) formData.append('image', categoryForm.image);

      if (categoryModal.category && categoryModal.category._id) {
        await productAPI.updateCategory(categoryModal.category._id, formData);
        toast.success('Category updated successfully');
      } else {
        await productAPI.createCategory(formData);
        toast.success('Category created successfully');
      }
      
      fetchCategories();
      setCategoryModal({ open: false, category: null });
      setCategoryForm({ name: '', slug: '', description: '', image: null });
      setImagePreview(null);
    } catch (error) {
      console.error('Category save error:', error);
      toast.error(error.response?.data?.message || 'Failed to save category');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    setActionLoading(categoryId + 'delete');
    try {
      await productAPI.deleteCategory(categoryId);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete category');
    } finally {
      setActionLoading(null);
    }
  };

  const mainCategories = categories.filter(cat => !cat.parentCategory);
  const subCategories = categories.filter(cat => cat.parentCategory);

  const filteredMainCategories = mainCategories.filter(cat =>
    cat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubCategories = subCategories.filter(cat => {
    const matchesSearch = cat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cat.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesParent = !selectedMainCat || cat.parentCategory === selectedMainCat;
    return matchesSearch && matchesParent;
  });

  // Reusable Category Card Component
  const CategoryCard = ({ category, index, isSubCategory = false }) => (
    <motion.div
      key={category._id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className="group"
    >
      <Card className={`h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-l-4 ${
        isSubCategory ? 'border-l-green-500' : 'border-l-blue-500'
      }`}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col h-full">
            {/* Category Image */}
            <div className="flex justify-center mb-4">
              {category.image ? (
                <img 
                  src={category.image} 
                  alt={category.name} 
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-full border-2 border-gray-200 shadow-sm" 
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  {isSubCategory ? (
                    <FaFolderOpen className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                  ) : (
                    <FaFolder className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                  )}
                </div>
              )}
            </div>

            {/* Category Info */}
            <div className="flex-1 text-center mb-4">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">
                {category.name}
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                {category.productCount || 0} products
              </p>
              <p className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                {category.slug}
              </p>
              {isSubCategory && category.parentCategory && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  {mainCategories.find(cat => cat._id === category.parentCategory)?.name}
                </Badge>
              )}
            </div>

            {/* Simple Action Buttons */}
            <div className="flex justify-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenCategoryModal(category)}
                    className="
                      h-8 w-8 p-0 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700
                      transition-colors duration-200 focus:ring-2 focus:ring-blue-300 focus:ring-offset-1
                    "
                  >
                    <FaEdit className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Category</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCategory(category._id)}
                    disabled={actionLoading === category._id + 'delete'}
                    className="
                      h-8 w-8 p-0 rounded-md bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700
                      transition-colors duration-200 focus:ring-2 focus:ring-red-300 focus:ring-offset-1
                      disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                    "
                  >
                    <FaTrash className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Category</p>
                </TooltipContent>
              </Tooltip>

              {!isSubCategory && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenCategoryModal({ parentCategory: category._id })}
                      className="
                        h-8 w-8 p-0 rounded-md bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700
                        transition-colors duration-200 focus:ring-2 focus:ring-green-300 focus:ring-offset-1
                      "
                    >
                      <FaPlus className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add Subcategory</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Category Management</h2>
          <p className="text-gray-600 text-sm sm:text-base">Manage product categories and subcategories</p>
        </div>
        <Button 
          onClick={() => handleOpenCategoryModal()} 
          className="
            bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md
            transition-colors duration-200 focus:ring-2 focus:ring-blue-300 focus:ring-offset-2
            text-sm sm:text-base
          "
        >
          <FaPlus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Stats Cards - Mobile Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Categories</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{categories.length}</p>
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
                <p className="text-xs sm:text-sm font-medium text-gray-600">Main Categories</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">
                  {categories.filter(cat => !cat.parentCategory).length}
                </p>
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
                <p className="text-xs sm:text-sm font-medium text-gray-600">Subcategories</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                  {categories.filter(cat => cat.parentCategory).length}
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
                <p className="text-xs sm:text-sm font-medium text-gray-600">With Images</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">
                  {categories.filter(cat => cat.image).length}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-purple-50">
                <FaImage className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter - Mobile Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search categories by name or slug..."
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
              value={selectedMainCat}
              onChange={(e) => setSelectedMainCat(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            >
              <option value="">All Parent Categories</option>
              {mainCategories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </CardContent>
        </Card>
      </div>

            {/* Clean Categories Tabs - Mobile Responsive */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Simple Tab Navigation */}
            <div className="bg-gray-50 p-1">
              <TabsList className="grid w-full grid-cols-2 h-auto bg-transparent p-1 rounded-lg border-0">
                <TabsTrigger
                  value="main"
                  className="
                    flex items-center justify-center gap-2 p-3 sm:p-4 rounded-md transition-all duration-200
                    data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-blue-200
                    hover:bg-white/70
                  "
                >
                  <div className="flex items-center gap-2">
                    <div className={`
                      p-1.5 rounded-md transition-colors duration-200
                      ${activeTab === 'main' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-500'
                      }
                    `}>
                      <FaFolder className="w-4 h-4" />
                    </div>
                    <div className="text-center">
                      <div className={`
                        font-semibold text-sm transition-colors duration-200
                        ${activeTab === 'main' ? 'text-blue-700' : 'text-gray-700'}
                      `}>
                        Main Categories
                      </div>
                      <div className={`
                        text-xs transition-colors duration-200
                        ${activeTab === 'main' ? 'text-blue-500' : 'text-gray-500'}
                      `}>
                        {filteredMainCategories.length} categories
                      </div>
                    </div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger
                  value="sub"
                  className="
                    flex items-center justify-center gap-2 p-3 sm:p-4 rounded-md transition-all duration-200
                    data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-green-200
                    hover:bg-white/70
                  "
                >
                  <div className="flex items-center gap-2">
                    <div className={`
                      p-1.5 rounded-md transition-colors duration-200
                      ${activeTab === 'sub' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-500'
                      }
                    `}>
                      <FaFolderOpen className="w-4 h-4" />
                    </div>
                    <div className="text-center">
                      <div className={`
                        font-semibold text-sm transition-colors duration-200
                        ${activeTab === 'sub' ? 'text-green-700' : 'text-gray-700'}
                      `}>
                        Subcategories
                      </div>
                      <div className={`
                        text-xs transition-colors duration-200
                        ${activeTab === 'sub' ? 'text-green-500' : 'text-gray-500'}
                      `}>
                        {filteredSubCategories.length} categories
                      </div>
                    </div>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4 sm:p-6">
              <TabsContent value="main" className="space-y-4 mt-0">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Main Categories ({filteredMainCategories.length})
                  </h3>
                                          <Button 
                    onClick={() => handleOpenCategoryModal()} 
                    size="sm"
                    className="
                      bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-2 rounded-md
                      transition-colors duration-200 focus:ring-2 focus:ring-blue-300 focus:ring-offset-2
                    "
                  >
                    <FaPlus className="w-4 h-4 mr-2" />
                    Add Main Category
                  </Button>
                </div>
                <TooltipProvider>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    <AnimatePresence>
                      {filteredMainCategories.map((category, index) => (
                        <CategoryCard 
                          key={category._id}
                          category={category} 
                          index={index} 
                          isSubCategory={false}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </TooltipProvider>
              </TabsContent>

              <TabsContent value="sub" className="space-y-4 mt-0">
                                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Subcategories ({filteredSubCategories.length})
                  </h3>
                  <Button 
                    onClick={() => handleOpenCategoryModal({ parentCategory: selectedMainCat || mainCategories[0]?._id })} 
                    size="sm"
                    className="
                      bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-2 rounded-md
                      transition-colors duration-200 focus:ring-2 focus:ring-green-300 focus:ring-offset-2
                      disabled:bg-gray-400 disabled:cursor-not-allowed
                    "
                    disabled={!mainCategories.length}
                  >
                    <FaPlus className="w-4 h-4 mr-2" />
                    Add Subcategory
                  </Button>
                </div>
                {mainCategories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FaFolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No main categories found. Create a main category first to add subcategories.</p>
                  </div>
                ) : (
                  <TooltipProvider>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      <AnimatePresence>
                        {filteredSubCategories.map((category, index) => (
                          <CategoryCard 
                            key={category._id}
                            category={category} 
                            index={index} 
                            isSubCategory={true}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </TooltipProvider>
                )}
              </TabsContent>
          </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Category Modal */}
      <Dialog open={categoryModal.open} onOpenChange={(open) => setCategoryModal({ open, category: null })}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {categoryModal.category && categoryModal.category._id ? 'Edit Category' : 
               categoryModal.category && categoryModal.category.parentCategory ? 'Add Subcategory' : 'Add Main Category'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCategoryFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <Input
                name="name"
                value={categoryForm.name}
                onChange={handleCategoryFormChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
              <Input
                name="slug"
                value={categoryForm.slug}
                onChange={handleCategoryFormChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <Textarea
                name="description"
                value={categoryForm.description}
                onChange={handleCategoryFormChange}
                rows={3}
              />
            </div>
            {!categoryModal.category?.parentCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                <Select
                  value={categoryForm.parentCategory || 'none'}
                  onValueChange={(value) => setCategoryForm({ ...categoryForm, parentCategory: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Main Category)</SelectItem>
                    {mainCategories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
              <Input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleCategoryFormChange}
              />
              {/* Image Preview */}
              {imagePreview && (
                <div className="mt-3">
                  <div className="relative inline-block">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-24 h-24 object-cover rounded-lg border shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setCategoryForm(prev => ({ ...prev, image: null }));
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Click × to remove image</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCategoryModal({ open: false, category: null });
                  setImagePreview(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={actionLoading === 'submit'}
              >
                {actionLoading === 'submit' ? 'Saving...' : 'Save Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategories;
