import React, { useState } from 'react';
import { useContracts } from '../hooks/useContracts';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

export default function CMSClientsPage() {
  const { clients, contracts, addClient, updateClient, deleteClient } = useContracts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    taxId: '',
    contactPerson: ''
  });

  const handleOpenModal = (client?: any) => {
    if (client) {
      setEditingId(client.id);
      setFormData({
        name: client.name || '',
        nameAr: client.nameAr || client.name_ar || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        taxId: client.taxId || '',
        contactPerson: client.contactPerson || client.representative_name || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '', nameAr: '', email: '', phone: '', address: '', city: '', taxId: '', contactPerson: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateClient(editingId, formData as any);
      } else {
        await addClient({
          ...formData,
          createdAt: new Date().toISOString()
        } as any);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Failed to save client');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await deleteClient(id);
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Failed to delete client');
      }
    }
  };

  const getActiveContractsCount = (clientId: string) => {
    return contracts.filter(c => c.client_id === clientId && c.status === 'نشط').length;
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">العملاء (Clients)</h1>
        <button 
          onClick={() => handleOpenModal()} 
          className="flex items-center space-x-2 space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          <span>إضافة عميل (Add Client)</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-medium">الاسم (Name)</th>
              <th className="px-6 py-4 font-medium">جهة الاتصال (Contact)</th>
              <th className="px-6 py-4 font-medium">البريد الإلكتروني (Email)</th>
              <th className="px-6 py-4 font-medium">الهاتف (Phone)</th>
              <th className="px-6 py-4 font-medium">عقود نشطة (Active Contracts)</th>
              <th className="px-6 py-4 font-medium text-left">إجراءات (Actions)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map(client => (
              <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">
                  {(client as any).nameAr || client.name_ar || (client as any).name}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{(client as any).contactPerson || client.representative_name || '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{client.email || '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{client.phone || '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{getActiveContractsCount(client.id)}</td>
                <td className="px-6 py-4 text-left space-x-3 space-x-reverse">
                  <button onClick={() => handleOpenModal(client)} className="text-emerald-600 hover:text-emerald-700">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(client.id)} className="text-red-500 hover:text-red-600">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  لا يوجد عملاء (No clients found)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? 'تعديل عميل (Edit Client)' : 'إضافة عميل جديد (Add New Client)'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">الاسم بالعربية (Name AR)</label>
                  <input
                    type="text"
                    required
                    value={formData.nameAr}
                    onChange={e => setFormData({...formData, nameAr: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">الاسم بالإنجليزية (Name EN)</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">جهة الاتصال (Contact Person)</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={e => setFormData({...formData, contactPerson: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">البريد الإلكتروني (Email)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">رقم الهاتف (Phone)</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">الرقم الضريبي (Tax ID)</label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={e => setFormData({...formData, taxId: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium text-slate-700">العنوان (Address)</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  إلغاء (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                  حفظ (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
