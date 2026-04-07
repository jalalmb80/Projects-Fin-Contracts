import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/ui/Toast';
import { 
  Product, 
  Currency, 
  TaxProfile 
} from '../types';
import { KpiCard } from '../components/ui/KpiCard';
import { DataTable, Column } from '../components/ui/DataTable';
import { SlideOver } from '../components/ui/SlideOver';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';

export default function ProductsPage() {
  const { products, addProduct, updateProduct, softDeleteProduct, loading, budgetCategories } = useApp();
  const { addToast } = useToast();

  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [productToDeactivate, setProductToDeactivate] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    description: '',
    categoryId: '',
    defaultPrices: { [Currency.USD]: 0, [Currency.SAR]: 0 },
    defaultTaxCode: TaxProfile.Standard,
    unitLabel: '',
    active: true
  });

  // Stats
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.categoryId || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  // Handlers
  const handleOpenSlideOver = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        sku: '',
        description: '',
        categoryId: '',
        defaultPrices: { [Currency.USD]: 0, [Currency.SAR]: 0 },
        defaultTaxCode: TaxProfile.Standard,
        unitLabel: '',
        active: true
      });
    }
    setIsSlideOverOpen(true);
  };

  const handleCloseSlideOver = () => {
    setIsSlideOverOpen(false);
    setEditingProduct(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'priceUSD') {
      setFormData(prev => ({
        ...prev,
        defaultPrices: { ...prev.defaultPrices!, [Currency.USD]: parseFloat(value) || 0 }
      }));
    } else if (name === 'priceSAR') {
      setFormData(prev => ({
        ...prev,
        defaultPrices: { ...prev.defaultPrices!, [Currency.SAR]: parseFloat(value) || 0 }
      }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      addToast('error', 'Product name is required');
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        addToast('success', 'Product updated successfully');
      } else {
        await addProduct(formData as Omit<Product, 'id' | 'createdAt'>);
        addToast('success', 'Product added successfully');
      }
      handleCloseSlideOver();
    } catch (error) {
      console.error(error);
      addToast('error', 'Failed to save product');
    }
  };

  const handleToggleActive = (product: Product) => {
    if (product.active) {
      setProductToDeactivate(product);
      setIsDeactivateDialogOpen(true);
    } else {
      // Activate immediately
      updateProduct(product.id, { active: true })
        .then(() => addToast('success', 'Product activated'))
        .catch(() => addToast('error', 'Failed to activate product'));
    }
  };

  const handleConfirmDeactivate = async () => {
    if (productToDeactivate) {
      try {
        await softDeleteProduct(productToDeactivate.id);
        addToast('success', 'Product deactivated');
      } catch (error) {
        console.error(error);
        addToast('error', 'Failed to deactivate product');
      } finally {
        setIsDeactivateDialogOpen(false);
        setProductToDeactivate(null);
      }
    }
  };

  // Columns
  const columns: Column<Product>[] = [
    { header: 'Name', key: 'name', render: (p) => (
      <div>
        <div className="font-medium text-gray-900">{p.name}</div>
        {p.description && <div className="text-xs text-gray-500 truncate max-w-xs">{p.description}</div>}
      </div>
    )},
    { header: 'SKU', key: 'sku', render: (p) => p.sku || '—' },
    { header: 'Category', key: 'categoryId', render: (p) => p.categoryId || '—' },
    { header: 'Default Price (USD)', key: 'defaultPrices', render: (p) => `$${p.defaultPrices?.[Currency.USD]?.toFixed(2) || '0.00'}` },
    { header: 'Default Price (SAR)', key: 'defaultPrices', render: (p) => `SAR ${p.defaultPrices?.[Currency.SAR]?.toFixed(2) || '0.00'}` },
    { header: 'Tax Code', key: 'defaultTaxCode', render: (p) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        p.defaultTaxCode === TaxProfile.Standard ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
      }`}>
        {p.defaultTaxCode === TaxProfile.Standard ? 'Standard 15%' : 'Export 0%'}
      </span>
    )},
    { header: 'Status', key: 'active', render: (p) => (
      <StatusBadge status={p.active ? 'Active' : 'Inactive'} />
    )},
    { header: 'Actions', key: 'id', align: 'right', render: (p) => (
      <div className="flex justify-end space-x-2">
        <button 
          onClick={(e) => { e.stopPropagation(); handleOpenSlideOver(p); }}
          className="text-indigo-600 hover:text-indigo-900"
        >
          <Edit2 size={18} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleToggleActive(p); }}
          className={`${p.active ? 'text-green-600 hover:text-green-900' : 'text-gray-400 hover:text-gray-600'}`}
          title={p.active ? 'Deactivate' : 'Activate'}
        >
          {p.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
        </button>
      </div>
    )}
  ];

  if (loading.products) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
        <button
          onClick={() => handleOpenSlideOver()}
          className="btn-primary"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <KpiCard
          title="Total Products"
          value={stats.total}
          icon={Package}
        />
        <KpiCard
          title="Active Products"
          value={stats.active}
          icon={CheckCircle}
        />
        <KpiCard
          title="Inactive Products"
          value={stats.inactive}
          icon={XCircle}
        />
      </div>

      {/* Content */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative rounded-md shadow-sm max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="form-input pl-10"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <EmptyState
            title="No Products Found"
            description={searchTerm ? "Try adjusting your search terms." : "Get started by adding a new product."}
            icon={Package}
            action={
              !searchTerm ? (
                <button
                  onClick={() => handleOpenSlideOver()}
                  className="btn-primary"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Add Product
                </button>
              ) : undefined
            }
          />
        ) : (
          <DataTable
            data={filteredProducts}
            columns={columns}
            keyField="id"
            onRowClick={handleOpenSlideOver}
          />
        )}
      </div>

      {/* SlideOver Form */}
      <SlideOver
        isOpen={isSlideOverOpen}
        onClose={handleCloseSlideOver}
        title={editingProduct ? "Edit Product" : "Add Product"}
      >
        <div className="space-y-6">
          <div>
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name || ''}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">SKU</label>
            <input
              type="text"
              name="sku"
              value={formData.sku || ''}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Category</label>
            <select
              name="categoryId"
              value={formData.categoryId || ''}
              onChange={handleChange}
              className="form-input"
            >
              <option value="">— None —</option>
              {budgetCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description || ''}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Default Price (USD)</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="priceUSD"
                  min="0"
                  step="0.01"
                  value={formData.defaultPrices?.[Currency.USD] || 0}
                  onChange={handleChange}
                  className="form-input pl-7"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Default Price (SAR)</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">SAR</span>
                </div>
                <input
                  type="number"
                  name="priceSAR"
                  min="0"
                  step="0.01"
                  value={formData.defaultPrices?.[Currency.SAR] || 0}
                  onChange={handleChange}
                  className="form-input pl-12"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">Tax Code</label>
            <select
              name="defaultTaxCode"
              value={formData.defaultTaxCode || TaxProfile.Standard}
              onChange={handleChange}
              className="form-input"
            >
              <option value={TaxProfile.Standard}>Standard (15%)</option>
              <option value={TaxProfile.Export}>Export (0%)</option>
            </select>
          </div>

          <div>
            <label className="form-label">Unit Label</label>
            <input
              type="text"
              name="unitLabel"
              value={formData.unitLabel || ''}
              onChange={handleChange}
              placeholder="e.g. seat, month, hour"
              className="form-input"
            />
          </div>

          <div className="flex items-center">
            <input
              id="active"
              name="active"
              type="checkbox"
              checked={formData.active}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
              Active
            </label>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              className="btn-primary w-full justify-center"
            >
              {editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </div>
      </SlideOver>

      {/* Deactivate Dialog */}
      <ConfirmDialog
        isOpen={isDeactivateDialogOpen}
        onClose={() => setIsDeactivateDialogOpen(false)}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Product"
        message={`Are you sure you want to deactivate "${productToDeactivate?.name}"? This will prevent it from being selected in new documents.`}
      />
    </div>
  );
}
