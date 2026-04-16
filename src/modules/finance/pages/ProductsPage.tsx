import React, { useState, useMemo } from 'react';
import { Package, Plus, Search, Edit2, CheckCircle, XCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLang, t } from '../context/LanguageContext';
import { useToast } from '../components/ui/Toast';
import { Product, Currency, TaxProfile } from '../types';
import { KpiCard } from '../components/ui/KpiCard';
import { DataTable, Column } from '../components/ui/DataTable';
import { SlideOver } from '../components/ui/SlideOver';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';

export default function ProductsPage() {
  const { products, addProduct, updateProduct, softDeleteProduct, loading, budgetCategories } = useApp();
  const { addToast } = useToast();
  const { lang } = useLang();

  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [productToDeactivate, setProductToDeactivate] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', sku: '', description: '', categoryId: '',
    defaultPrices: { [Currency.USD]: 0, [Currency.SAR]: 0 },
    defaultTaxCode: TaxProfile.Standard, unitLabel: '', active: true,
  });

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.active).length;
    return { total, active, inactive: total - active };
  }, [products]);

  const filteredProducts = useMemo(() =>
    products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
    ), [products, searchTerm]);

  const handleOpenSlideOver = (product?: Product) => {
    if (product) { setEditingProduct(product); setFormData(product); }
    else {
      setEditingProduct(null);
      setFormData({ name: '', sku: '', description: '', categoryId: '', defaultPrices: { [Currency.USD]: 0, [Currency.SAR]: 0 }, defaultTaxCode: TaxProfile.Standard, unitLabel: '', active: true });
    }
    setIsSlideOverOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name === 'priceUSD') setFormData(p => ({ ...p, defaultPrices: { ...p.defaultPrices!, [Currency.USD]: parseFloat(value) || 0 } }));
    else if (name === 'priceSAR') setFormData(p => ({ ...p, defaultPrices: { ...p.defaultPrices!, [Currency.SAR]: parseFloat(value) || 0 } }));
    else if (type === 'checkbox') setFormData(p => ({ ...p, [name]: (e.target as HTMLInputElement).checked }));
    else setFormData(p => ({ ...p, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name) { addToast('error', t('اسم المنتج مطلوب', 'Product name is required', lang)); return; }
    try {
      if (editingProduct) { await updateProduct(editingProduct.id, formData); addToast('success', t('تم تحديث المنتج', 'Product updated', lang)); }
      else { await addProduct(formData as Omit<Product, 'id' | 'createdAt'>); addToast('success', t('تم إضافة المنتج', 'Product added', lang)); }
      setIsSlideOverOpen(false); setEditingProduct(null);
    } catch { addToast('error', t('فشل الحفظ', 'Failed to save', lang)); }
  };

  const handleToggleActive = (product: Product) => {
    if (product.active) { setProductToDeactivate(product); setIsDeactivateDialogOpen(true); }
    else updateProduct(product.id, { active: true }).then(() => addToast('success', t('تم تفعيل المنتج', 'Product activated', lang))).catch(() => addToast('error', t('فشل', 'Failed', lang)));
  };

  const handleConfirmDeactivate = async () => {
    if (!productToDeactivate) return;
    try { await softDeleteProduct(productToDeactivate.id); addToast('success', t('تم تعطيل المنتج', 'Product deactivated', lang)); }
    catch { addToast('error', t('فشل التعطيل', 'Failed to deactivate', lang)); }
    finally { setIsDeactivateDialogOpen(false); setProductToDeactivate(null); }
  };

  const columns: Column<Product>[] = [
    { header: t('المنتج', 'Product', lang), key: 'name', render: p => (
      <div><div className="font-medium text-gray-900">{p.name}</div>{p.description&&<div className="text-xs text-gray-500 truncate max-w-xs">{p.description}</div>}</div>
    )},
    { header: 'SKU', key: 'sku', render: p => p.sku || '—' },
    { header: t('الفئة', 'Category', lang), key: 'categoryId', render: p => p.categoryId || '—' },
    { header: t('سعر USD', 'Price USD', lang), key: 'defaultPrices', render: p => `$${p.defaultPrices?.[Currency.USD]?.toFixed(2) || '0.00'}` },
    { header: t('سعر SAR', 'Price SAR', lang), key: 'defaultPrices', render: p => `SAR ${p.defaultPrices?.[Currency.SAR]?.toFixed(2) || '0.00'}` },
    { header: t('ضريبة', 'Tax', lang), key: 'defaultTaxCode', render: p => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.defaultTaxCode === TaxProfile.Standard ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
        {p.defaultTaxCode === TaxProfile.Standard ? t('قياسي 15%', 'Standard 15%', lang) : t('تصدير 0%', 'Export 0%', lang)}
      </span>
    )},
    { header: t('الحالة', 'Status', lang), key: 'active', render: p => <StatusBadge status={p.active ? 'Active' : 'Inactive'} /> },
    { header: t('إجراءات', 'Actions', lang), key: 'id', align: 'right', render: p => (
      <div className="flex justify-end space-x-2">
        <button onClick={e => { e.stopPropagation(); handleOpenSlideOver(p); }} className="text-indigo-600 hover:text-indigo-900"><Edit2 size={18} /></button>
        <button onClick={e => { e.stopPropagation(); handleToggleActive(p); }} className={p.active ? 'text-green-600 hover:text-green-900' : 'text-gray-400 hover:text-gray-600'}>
          {p.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
        </button>
      </div>
    )},
  ];

  if (loading.products) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('كتالوج المنتجات', 'Product Catalog', lang)}</h1>
        <button onClick={() => handleOpenSlideOver()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <Plus className="-ml-1 mr-2 h-5 w-5" /> {t('إضافة منتج', 'Add Product', lang)}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <KpiCard title={t('إجمالي المنتجات', 'Total Products', lang)} value={stats.total}   icon={Package} />
        <KpiCard title={t('المنتجات النشطة',  'Active Products',   lang)} value={stats.active}  icon={CheckCircle} />
        <KpiCard title={t('المنتجات المعطلة', 'Inactive Products', lang)} value={stats.inactive} icon={XCircle} />
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative rounded-md shadow-sm max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
            <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder={t('بحث المنتجات...', 'Search products...', lang)}
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        {filteredProducts.length === 0 ? (
          <EmptyState
            title={t('لا توجد منتجات', 'No Products Found', lang)}
            description={searchTerm ? t('جرب تعديل البحث', 'Try adjusting your search.', lang) : t('أضف منتجاً للبدء.', 'Get started by adding a new product.', lang)}
            icon={Package}
            action={!searchTerm ? (
              <button onClick={() => handleOpenSlideOver()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                <Plus className="-ml-1 mr-2 h-5 w-5" /> {t('إضافة منتج', 'Add Product', lang)}
              </button>
            ) : undefined}
          />
        ) : (
          <DataTable data={filteredProducts} columns={columns} keyField="id" onRowClick={handleOpenSlideOver} />
        )}
      </div>

      <SlideOver isOpen={isSlideOverOpen} onClose={() => { setIsSlideOverOpen(false); setEditingProduct(null); }}
        title={editingProduct ? t('تعديل منتج', 'Edit Product', lang) : t('إضافة منتج', 'Add Product', lang)}>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('اسم المنتج *', 'Product Name *', lang)}</label>
            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
            <input type="text" name="sku" value={formData.sku || ''} onChange={handleChange} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('الفئة', 'Category', lang)}</label>
            <select name="categoryId" value={formData.categoryId || ''} onChange={handleChange} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none">
              <option value="">— {t('لا شيء', 'None', lang)} —</option>
              {budgetCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('الوصف', 'Description', lang)}</label>
            <textarea name="description" rows={3} value={formData.description || ''} onChange={handleChange} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('سعر USD', 'Price (USD)', lang)}</label>
              <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 text-sm">$</span></div>
                <input type="number" name="priceUSD" min="0" step="0.01" value={formData.defaultPrices?.[Currency.USD] || 0} onChange={handleChange} className="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('سعر SAR', 'Price (SAR)', lang)}</label>
              <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 text-sm">ر.س</span></div>
                <input type="number" name="priceSAR" min="0" step="0.01" value={formData.defaultPrices?.[Currency.SAR] || 0} onChange={handleChange} className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" /></div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('كود الضريبة', 'Tax Code', lang)}</label>
            <select name="defaultTaxCode" value={formData.defaultTaxCode || TaxProfile.Standard} onChange={handleChange} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none">
              <option value={TaxProfile.Standard}>{t('قياسي (15%)', 'Standard (15%)', lang)}</option>
              <option value={TaxProfile.Export}>{t('تصدير (0%)', 'Export (0%)', lang)}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('وحدة القياس', 'Unit Label', lang)}</label>
            <input type="text" name="unitLabel" value={formData.unitLabel || ''} onChange={handleChange} placeholder={t('مثال: مقعد، شهر، ساعة', 'e.g. seat, month, hour', lang)} className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="flex items-center">
            <input id="active" name="active" type="checkbox" checked={formData.active} onChange={handleChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
            <label htmlFor="active" className="ml-2 block text-sm text-gray-900">{t('نشط', 'Active', lang)}</label>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <button onClick={handleSave}
              className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50">
              {editingProduct ? t('تحديث المنتج', 'Update Product', lang) : t('إنشاء منتج', 'Create Product', lang)}
            </button>
          </div>
        </div>
      </SlideOver>

      <ConfirmDialog
        isOpen={isDeactivateDialogOpen}
        onClose={() => setIsDeactivateDialogOpen(false)}
        onConfirm={handleConfirmDeactivate}
        title={t('تعطيل المنتج', 'Deactivate Product', lang)}
        message={t(`هل تريد تعطيل «${productToDeactivate?.name}»؟`, `Deactivate "${productToDeactivate?.name}"?`, lang)}
      />
    </div>
  );
}
