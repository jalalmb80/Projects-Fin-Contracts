import React, { useState } from 'react';
import { Client } from '../types';

import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { useLang, t } from '../context/LanguageContext';

export default function ClientsList({ clients, setClients }: { clients: Client[], setClients: any }) {
  const { lang } = useLang();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name_ar: '',
    type: 'شركة',
    cr_number: '',
    tax_number: '',
    address: '',
    representative_name: '',
    representative_title: '',
    email: '',
    phone: ''
  });

  const handleAddClient = () => {
    if (!newClient.name_ar) return;
    
    const clientToAdd: Client = {
      ...(newClient as Client),
      id: Date.now().toString(),
    };
    
    setClients([clientToAdd, ...clients]);
    setNewClient({
      name_ar: '',
      type: 'شركة',
      cr_number: '',
      tax_number: '',
      address: '',
      representative_name: '',
      representative_title: '',
      email: '',
      phone: ''
    });
    setIsModalOpen(false);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">{t('العملاء', 'Clients', lang)}</h1>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus size={18} />
          <span>{t('إضافة عميل', 'Add Client', lang)}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-medium">{t('اسم الجهة', 'Entity Name', lang)}</th>
              <th className="px-6 py-4 font-medium">{t('نوع الجهة', 'Entity Type', lang)}</th>
              <th className="px-6 py-4 font-medium">{t('رقم السجل', 'License No.', lang)}</th>
              <th className="px-6 py-4 font-medium">{t('الممثل', 'Representative', lang)}</th>
              <th className="px-6 py-4 font-medium">{t('البريد الإلكتروني', 'Email', lang)}</th>
              <th className="px-6 py-4 font-medium text-left">{t('إجراءات', 'Actions', lang)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map(client => (
              <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{client.name_ar}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{client.entity_type}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{client.license_no}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{client.representative_name}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{client.email}</td>
                <td className="px-6 py-4 text-left space-x-3 space-x-reverse">
                  <button className="text-emerald-600 hover:text-emerald-700">
                    <Edit2 size={18} />
                  </button>
                  <button className="text-red-500 hover:text-red-600">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">{t('إضافة عميل جديد', 'Add New Client', lang)}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{t('اسم الجهة', 'Entity Name', lang)}</label>
                <input 
                  type="text" 
                  value={newClient.name_ar}
                  onChange={e => setNewClient({...newClient, name_ar: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{t('نوع الجهة', 'Entity Type', lang)}</label>
                <select 
                  value={newClient.type}
                  onChange={e => setNewClient({...newClient, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="شركة">شركة</option>
                  <option value="مؤسسة">مؤسسة</option>
                  <option value="جهة حكومية">جهة حكومية</option>
                  <option value="جمعية">جمعية</option>
                  <option value="فرد">فرد</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{t('رقم السجل التجاري', 'CR Number', lang)}</label>
                <input 
                  type="text" 
                  value={newClient.cr_number}
                  onChange={e => setNewClient({...newClient, cr_number: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{t('الرقم الضريبي', 'Tax Number', lang)}</label>
                <input 
                  type="text" 
                  value={newClient.tax_number}
                  onChange={e => setNewClient({...newClient, tax_number: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{t('اسم الممثل', 'Representative Name', lang)}</label>
                <input 
                  type="text" 
                  value={newClient.representative_name}
                  onChange={e => setNewClient({...newClient, representative_name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{t('صفة الممثل', 'Representative Title', lang)}</label>
                <input 
                  type="text" 
                  value={newClient.representative_title}
                  onChange={e => setNewClient({...newClient, representative_title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 space-x-reverse">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium">
                {t('إلغاء', 'Cancel', lang)}
              </button>
              <button onClick={handleAddClient} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">
                {t('حفظ', 'Save', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
