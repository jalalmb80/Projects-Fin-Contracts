import React, { useState } from 'react';
import { useContracts } from '../hooks/useContracts';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { Client } from '../types';

type ClientFormData = Omit<Client, 'id'>;

const EMPTY_FORM: ClientFormData = {
  name_ar: '',
  entity_type: 'شركة',
  license_authority: '',
  license_no: '',
  representative_name: '',
  representative_title: '',
  national_id: '',
  address: '',
  city: '',
  postal_code: '',
  phone: '',
  email: '',
};

export default function CMSClientsPage() {
  const { clients, contracts, addClient, updateClient, deleteClient } = useContracts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(EMPTY_FORM);

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingId(client.id);
      setFormData({
        name_ar: client.name_ar || '',
        entity_type: client.entity_type || 'شركة',
        license_authority: client.license_authority || '',
        license_no: client.license_no || '',
        representative_name: client.representative_name || '',
        representative_title: client.representative_title || '',
        national_id: client.national_id || '',
        address: client.address || '',
        city: client.city || '',
        postal_code: client.postal_code || '',
        phone: client.phone || '',
        email: client.email || '',
      });
    } else {
      setEditingId(null);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateClient(editingId, formData);
      } else {
        await addClient(formData);
      }
      setIsModalOpen(false);
      showFeedback('success', editingId ? 'تم تحديث العميل بنجاح' : 'تم إضافة العميل بنجاح');
    } catch (error) {
      console.error('Error saving client:', error);
      showFeedback('error', 'حدث خطأ أثناء حفظ بيانات العميل');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await deleteClient(id);
        showFeedback('success', 'تم حذف العميل بنجاح');
      } catch (error) {
        console.error('Error deleting client:', error);
        showFeedback('error', 'حدث خطأ أثناء حذف العميل');
      }
    }
  };

  const getActiveContractsCount = (clientId: string) => {
    return contracts.filter(c => c.client_id === clientId && c.status === 'نشط').length;
  };

  const inp = 'w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none';

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-slate-800">العملاء (Clients)</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          <span>إضافة عميل (Add Client)</span>
        </button>
      </div>

      {feedback && (
        <div className={`px-4 py-2 rounded-lg text-sm mb-4 ${
          feedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {feedback.msg}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-medium">الاسم (Name)</th>
              <th className="px-6 py-4 font-medium">النوع (Type)</th>
              <th className="px-6 py-4 font-medium">المندوب (Representative)</th>
              <th className="px-6 py-4 font-medium">البريد الإلكتروني (Email)</th>
              <th className="px-6 py-4 font-medium">الهاتف (Phone)</th>
              <th className="px-6 py-4 font-medium">عقود نشطة</th>
              <th className="px-6 py-4 font-medium text-left">إجراءات (Actions)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map(client => (
              <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{client.name_ar}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{client.entity_type}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{client.representative_name || '-'}</td>
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
                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                  لا يوجد عملاء (No clients found)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden mx-4">
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

                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium text-slate-700">الاسم بالعربية (Name AR) *</label>
                  <input type="text" required value={formData.name_ar}
                    onChange={e => setFormData({ ...formData, name_ar: e.target.value })} className={inp} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">نوع الجهة (Entity Type) *</label>
                  <select required value={formData.entity_type}
                    onChange={e => setFormData({ ...formData, entity_type: e.target.value as Client['entity_type'] })}
                    className={inp}>
                    <option value="شركة">شركة (Company)</option>
                    <option value="جمعية">جمعية (Association)</option>
                    <option value="جهة حكومية">جهة حكومية (Government)</option>
                    <option value="فرد">فرد (Individual)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">جهة الترخيص (License Authority)</label>
                  <input type="text" value={formData.license_authority}
                    onChange={e => setFormData({ ...formData, license_authority: e.target.value })} className={inp} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">رقم الترخيص (License No)</label>
                  <input type="text" value={formData.license_no}
                    onChange={e => setFormData({ ...formData, license_no: e.target.value })} className={inp} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">اسم الممثل (Representative Name)</label>
                  <input type="text" value={formData.representative_name}
                    onChange={e => setFormData({ ...formData, representative_name: e.target.value })} className={inp} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">صفة الممثل (Representative Title)</label>
                  <input type="text" value={formData.representative_title}
                    onChange={e => setFormData({ ...formData, representative_title: e.target.value })} className={inp} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">رقم الهوية الوطنية (National ID)</label>
                  <input type="text" value={formData.national_id}
                    onChange={e => setFormData({ ...formData, national_id: e.target.value })} className={inp} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">البريد الإلكتروني (Email)</label>
                  <input type="email" value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })} className={inp} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">رقم الهاتف (Phone)</label>
                  <input type="text" value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })} className={inp} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">المدينة (City)</label>
                  <input type="text" value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })} className={inp} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">الرمز البريدي (Postal Code)</label>
                  <input type="text" value={formData.postal_code}
                    onChange={e => setFormData({ ...formData, postal_code: e.target.value })} className={inp} />
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium text-slate-700">العنوان (Address)</label>
                  <input type="text" value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })} className={inp} />
                </div>

              </div>
              <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
                  إلغاء (Cancel)
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors">
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
