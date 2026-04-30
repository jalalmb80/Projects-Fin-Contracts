import React, { useState } from 'react';
import { useCMSContext } from '../context/CMSContext';
import { Plus, Edit2, Trash2, X, AlertCircle, Users } from 'lucide-react';
import { Client } from '../types';
import { useLang, t } from '../context/LanguageContext';

type ClientFormData = Omit<Client, 'id'>;

const EMPTY_FORM: ClientFormData = {
  name_ar: '', entity_type: '\u0634\u0631\u0643\u0629', license_authority: '', license_no: '',
  representative_name: '', representative_title: '', national_id: '',
  address: '', city: '', postal_code: '', phone: '', email: '',
};

export default function CMSClientsPage() {
  const { clients, contracts, addClient, updateClient, deleteClient } = useCMSContext();
  const { lang } = useLang();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const showFeedback = (type: 'success' | 'error', msg: string) => { setFeedback({ type, msg }); setTimeout(() => setFeedback(null), 4000); };

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingId(client.id);
      setFormData({ name_ar: client.name_ar||'', entity_type: client.entity_type||'\u0634\u0631\u0643\u0629', license_authority: client.license_authority||'', license_no: client.license_no||'', representative_name: client.representative_name||'', representative_title: client.representative_title||'', national_id: client.national_id||'', address: client.address||'', city: client.city||'', postal_code: client.postal_code||'', phone: client.phone||'', email: client.email||'' });
    } else { setEditingId(null); setFormData(EMPTY_FORM); }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) await updateClient(editingId, formData);
      else await addClient(formData);
      setIsModalOpen(false);
      showFeedback('success', editingId ? t('\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0639\u0645\u064a\u0644','Client updated',lang) : t('\u062a\u0645\u062a \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0639\u0645\u064a\u0644','Client added',lang));
    } catch { showFeedback('error', t('\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u062d\u0641\u0638','Error saving client',lang)); }
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) { setConfirmDeleteId(id); return; }
    setConfirmDeleteId(null);
    try { await deleteClient(id); showFeedback('success', t('\u062a\u0645 \u062d\u0630\u0641 \u0627\u0644\u0639\u0645\u064a\u0644','Client deleted',lang)); }
    catch { showFeedback('error', t('\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u062d\u0630\u0641','Error deleting client',lang)); }
  };

  const getActiveContractsCount = (clientId: string) => contracts.filter(c => c.client_id === clientId && c.status === '\u0646\u0634\u0637').length;
  const confirmTarget = confirmDeleteId ? clients.find(c => c.id === confirmDeleteId) : null;
  const inp = 'block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none';

  return (
    <div className="space-y-6 p-6">
      {confirmDeleteId && (
        <div className="flex items-center gap-4 bg-red-50 border border-red-200 rounded-lg px-5 py-4 text-sm text-red-800">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span className="flex-1">{t('\u0647\u0644 \u062a\u0631\u064a\u062f \u062d\u0630\u0641','Delete',lang)} <strong>{confirmTarget?.name_ar}</strong>{t('\u061f \u0644\u0627 \u064a\u0645\u0643\u0646 \u0627\u0644\u062a\u0631\u0627\u062c\u0639.','? This cannot be undone.',lang)}</span>
          <button onClick={() => handleDelete(confirmDeleteId)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg font-medium">{t('\u062d\u0630\u0641','Delete',lang)}</button>
          <button onClick={() => setConfirmDeleteId(null)} className="text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg font-medium">{t('\u0625\u0644\u063a\u0627\u0621','Cancel',lang)}</button>
        </div>
      )}
      {feedback && (<div className={`px-4 py-3 rounded-lg text-sm border ${feedback.type==='success'?'bg-green-50 text-green-800 border-green-200':'bg-red-50 text-red-800 border-red-200'}`}>{feedback.msg}</div>)}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('\u0627\u0644\u0639\u0645\u0644\u0627\u0621','Clients',lang)}</h1>
        <button onClick={() => handleOpenModal()} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
          <Plus className="mr-2 h-4 w-4" />{t('\u0625\u0636\u0627\u0641\u0629 \u0639\u0645\u064a\u0644','Add Client',lang)}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {clients.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Users className="mx-auto h-12 w-12 text-gray-300 mb-4"/>
            <h3 className="text-sm font-medium text-gray-900">{t('\u0644\u0627 \u064a\u0648\u062c\u062f \u0639\u0645\u0644\u0627\u0621','No clients found',lang)}</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>
                {[t('\u0627\u0644\u0627\u0633\u0645','Name',lang),t('\u0627\u0644\u0646\u0648\u0639','Type',lang),t('\u0627\u0644\u0645\u0646\u062f\u0648\u0628','Representative',lang),t('\u0627\u0644\u0628\u0631\u064a\u062f','Email',lang),t('\u0627\u0644\u0647\u0627\u062a\u0641','Phone',lang),t('\u0639\u0642\u0648\u062f \u0646\u0634\u0637\u0629','Active Contracts',lang),t('\u0625\u062c\u0631\u0627\u0621\u0627\u062a','Actions',lang)].map((h,i)=>(
                  <th key={i} scope="col" className={`px-6 py-3 ${i===6?'text-left':'text-right'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map(client => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">{client.name_ar?.charAt(0)}</span>
                        <span className="text-sm font-medium text-gray-900">{client.name_ar}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.entity_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.representative_name||'-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.email||'-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.phone||'-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getActiveContractsCount(client.id)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <div className="flex items-center gap-3">
                        <button onClick={()=>handleOpenModal(client)} className="text-emerald-600 hover:text-emerald-900"><Edit2 size={18}/></button>
                        <button onClick={()=>handleDelete(client.id)} className={`transition-colors ${confirmDeleteId===client.id?'text-red-700':'text-red-400 hover:text-red-600'}`}><Trash2 size={18}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">{editingId?t('\u062a\u0639\u062f\u064a\u0644 \u0639\u0645\u064a\u0644','Edit Client',lang):t('\u0625\u0636\u0627\u0641\u0629 \u0639\u0645\u064a\u0644 \u062c\u062f\u064a\u062f','Add New Client',lang)}</h2>
              <button onClick={()=>setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1"><label className="block text-sm font-medium text-gray-700">{t('\u0627\u0644\u0627\u0633\u0645 \u0628\u0627\u0644\u0639\u0631\u0628\u064a\u0629 *','Name (Arabic) *',lang)}</label><input type="text" required value={formData.name_ar} onChange={e=>setFormData({...formData,name_ar:e.target.value})} className={inp}/></div>
                <div className="space-y-1"><label className="block text-sm font-medium text-gray-700">{t('\u0646\u0648\u0639 \u0627\u0644\u062c\u0647\u0629 *','Entity Type *',lang)}</label><select required value={formData.entity_type} onChange={e=>setFormData({...formData,entity_type:e.target.value as Client['entity_type']})} className={inp}><option value="\u0634\u0631\u0643\u0629">\u0634\u0631\u0643\u0629 (Company)</option><option value="\u062c\u0645\u0639\u064a\u0629">\u062c\u0645\u0639\u064a\u0629 (Association)</option><option value="\u062c\u0647\u0629 \u062d\u0643\u0648\u0645\u064a\u0629">\u062c\u0647\u0629 \u062d\u0643\u0648\u0645\u064a\u0629 (Government)</option><option value="\u0641\u0631\u062f">\u0641\u0631\u062f (Individual)</option></select></div>
                <div className="space-y-1"><label className="block text-sm font-medium text-gray-700">{t('\u062c\u0647\u0629 \u0627\u0644\u062a\u0631\u062e\u064a\u0635','License Authority',lang)}</label><input type="text" value={formData.license_authority} onChange={e=>setFormData({...formData,license_authority:e.target.value})} className={inp}/></div>
                <div className="space-y-1"><label className="block text-sm font-medium text-gray-700">{t('\u0631\u0642\u0645 \u0627\u0644\u062a\u0631\u062e\u064a\u0635','License No.',lang)}</label><input type="text" value={formData.license_no} onChange={e=>setFormData({...formData,license_no:e.target.value})} className={inp}/></div>
                <div className="space-y-1"><label className="block text-sm font-medium text-gray-700">{t('\u0627\u0633\u0645 \u0627\u0644\u0645\u0645\u062b\u0644','Representative Name',lang)}</label><input type="text" value={formData.representative_name} onChange={e=>setFormData({...formData,representative_name:e.target.value})} className={inp}/></div>
                <div className="space-y-1"><label className="block text-sm font-medium text-gray-700">{t('\u0635\u0641\u0629 \u0627\u0644\u0645\u0645\u062b\u0644','Representative Title',lang)}</label><input type="text" value={formData.representative_title} onChange={e=>setFormData({...formData,representative_title:e.target.value})} className={inp}/></div>
                <div className="space-y-1"><label className="block text-sm font-medium text-gray-700">{t('\u0631\u0642\u0645 \u0627\u0644\u0647\u0648\u064a\u0629','National ID',lang)}</label><input type="text" value={formData.national_id} onChange={e=>setFormData({...formData,national_id:e.target.value})} className={inp}/></div>
                <div className="space-y-1"><label className="block text-sm font-medium text-gray-700">{t('\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a','Email',lang)}</label><input type="email" value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})} className={inp}/></div>
                <div className="space-y-1"><label className="block text-sm font-medium text-gray-700">{t('\u0627\u0644\u0647\u0627\u062a\u0641','Phone',lang)}</label><input type="text" value={formData.phone} onChange={e=>setFormData({...formData,phone:e.target.value})} className={inp}/></div>
                <div className="space-y-1"><label className="block text-sm font-medium text-gray-700">{t('\u0627\u0644\u0645\u062f\u064a\u0646\u0629','City',lang)}</label><input type="text" value={formData.city} onChange={e=>setFormData({...formData,city:e.target.value})} className={inp}/></div>
                <div className="space-y-1"><label className="block text-sm font-medium text-gray-700">{t('\u0627\u0644\u0631\u0645\u0632 \u0627\u0644\u0628\u0631\u064a\u062f\u064a','Postal Code',lang)}</label><input type="text" value={formData.postal_code} onChange={e=>setFormData({...formData,postal_code:e.target.value})} className={inp}/></div>
                <div className="sm:col-span-2 space-y-1"><label className="block text-sm font-medium text-gray-700">{t('\u0627\u0644\u0639\u0646\u0648\u0627\u0646','Address',lang)}</label><input type="text" value={formData.address} onChange={e=>setFormData({...formData,address:e.target.value})} className={inp}/></div>
              </div>
              <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-gray-200">
                <button type="button" onClick={()=>setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">{t('\u0625\u0644\u063a\u0627\u0621','Cancel',lang)}</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700">{t('\u062d\u0641\u0638','Save',lang)}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
