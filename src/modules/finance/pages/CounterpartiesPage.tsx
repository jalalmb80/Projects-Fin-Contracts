import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Building2, User, Phone, Mail, AlertCircle } from 'lucide-react';
import { Counterparty, CounterpartyType } from '../types';
import { useApp } from '../context/AppContext';
import { useLang, t } from '../context/LanguageContext';
import { useToast } from '../components/ui/Toast';
import CounterpartyForm from '../components/CounterpartyForm';

export default function Counterparties() {
  const { counterparties, addCounterparty, updateCounterparty, deleteCounterparty, loading } = useApp();
  const { lang } = useLang();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSave = async (data: Omit<Counterparty, 'id' | 'createdAt'>) => {
    try {
      if (editingId) {
        await updateCounterparty(editingId, data);
        addToast('success', t('\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0637\u0631\u0641 \u0628\u0646\u062c\u0627\u062d', 'Counterparty updated', lang));
      } else {
        await addCounterparty(data);
        addToast('success', t('\u062a\u0645\u062a \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0637\u0631\u0641 \u0628\u0646\u062c\u0627\u062d', 'Counterparty added', lang));
      }
      setIsModalOpen(false);
      setEditingId(null);
    } catch (error) {
      addToast('error', t('\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u062d\u0641\u0638', 'Failed to save', lang));
    }
  };

  const handleEdit = (counterparty: Counterparty) => { setEditingId(counterparty.id); setIsModalOpen(true); };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) { setConfirmDeleteId(id); return; }
    setConfirmDeleteId(null);
    try {
      await deleteCounterparty(id);
      addToast('success', t('\u062a\u0645 \u062d\u0630\u0641 \u0627\u0644\u0637\u0631\u0641 \u0628\u0646\u062c\u0627\u062d', 'Counterparty deleted', lang));
    } catch { addToast('error', t('\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u062d\u0630\u0641', 'Failed to delete', lang)); }
  };

  const filteredCounterparties = counterparties.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBadgeColor = (type: CounterpartyType) => {
    switch (type) {
      case CounterpartyType.CUSTOMER: return 'bg-green-100 text-green-800';
      case CounterpartyType.VENDOR: return 'bg-blue-100 text-blue-800';
      case CounterpartyType.BOTH: return 'bg-purple-100 text-purple-800';
      case CounterpartyType.INTERCOMPANY: return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const typeLabel = (type: CounterpartyType) => {
    const labels: Record<CounterpartyType, [string, string]> = {
      [CounterpartyType.CUSTOMER]: ['\u0639\u0645\u064a\u0644', 'Customer'],
      [CounterpartyType.VENDOR]: ['\u0645\u0648\u0631\u0651\u062f', 'Vendor'],
      [CounterpartyType.BOTH]: ['\u0639\u0645\u064a\u0644 \u0648\u0645\u0648\u0631\u0651\u062f', 'Both'],
      [CounterpartyType.INTERCOMPANY]: ['\u062f\u0627\u062e\u0644\u064a', 'Intercompany'],
    };
    return t(labels[type][0], labels[type][1], lang);
  };

  const confirmTarget = confirmDeleteId ? counterparties.find(c => c.id === confirmDeleteId) : null;

  return (
    <div className="space-y-6">
      {confirmDeleteId && (
        <div className="flex items-center gap-4 bg-red-50 border border-red-200 rounded-lg px-5 py-4 text-sm text-red-800">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span className="flex-1">
            {t('\u0647\u0644 \u062a\u0631\u064a\u062f \u062d\u0630\u0641', 'Delete', lang)} <strong>{confirmTarget?.name}</strong>
            {t('\u061f \u0644\u0627 \u064a\u0645\u0643\u0646 \u0627\u0644\u062a\u0631\u0627\u062c\u0639.', '? This cannot be undone.', lang)}
          </span>
          <button onClick={() => handleDelete(confirmDeleteId)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg font-medium">
            {t('\u062d\u0630\u0641', 'Delete', lang)}
          </button>
          <button onClick={() => setConfirmDeleteId(null)} className="text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg font-medium">
            {t('\u0625\u0644\u063a\u0627\u0621', 'Cancel', lang)}
          </button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('\u0627\u0644\u0623\u0637\u0631\u0627\u0641 \u0648\u0627\u0644\u0645\u0648\u0631\u062f\u0648\u0646', 'Counterparties', lang)}</h1>
        <button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="btn-primary">
          <Plus className={`-ml-1 h-5 w-5 ${lang === 'ar' ? 'ml-2' : 'mr-2'}`} />
          {t('\u0637\u0631\u0641 \u062c\u062f\u064a\u062f', 'New Counterparty', lang)}
        </button>
      </div>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative rounded-md shadow-sm max-w-md">
            <div className={`absolute inset-y-0 ${lang === 'ar' ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" className={`form-input ${lang === 'ar' ? 'pr-10 text-right' : 'pl-10'}`}
              placeholder={t('\u0628\u062d\u062b \u0628\u0627\u0644\u0627\u0633\u0645 \u0623\u0648 \u0627\u0644\u0628\u0631\u064a\u062f \u0623\u0648 \u062c\u0647\u0629 \u0627\u0644\u0627\u062a\u0635\u0627\u0644...', 'Search by name, email, or contact...', lang)}
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} dir={lang === 'ar' ? 'rtl' : 'ltr'} />
          </div>
        </div>
        {loading.counterparties ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-500">{t('\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0645\u064a\u0644...', 'Loading counterparties...', lang)}</p>
          </div>
        ) : filteredCounterparties.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t('\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c.', 'No counterparties found.', lang)}</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredCounterparties.map(counterparty => (
              <li key={counterparty.id} className="hover:bg-gray-50 transition-colors">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        <span className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                          {counterparty.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className={`min-w-0 flex-1 ${lang === 'ar' ? 'pr-4' : 'pl-4'} md:grid md:grid-cols-2 md:gap-4`}>
                        <div>
                          <p className="text-sm font-medium text-indigo-600 truncate">{counterparty.name}</p>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeColor(counterparty.type)}`}>{typeLabel(counterparty.type)}</span>
                            <span className={`${lang === 'ar' ? 'mr-2' : 'ml-2'} text-gray-400 text-xs`}>{counterparty.currency} • {counterparty.paymentTermsDays} {t('\u064a\u0648\u0645', 'days', lang)}</span>
                          </div>
                        </div>
                        <div className="hidden md:block">
                          <div className="flex flex-col space-y-1 text-sm text-gray-500">
                            {counterparty.contactPerson && <div className="flex items-center"><User className={`flex-shrink-0 ${lang==='ar'?'ml-1.5':'mr-1.5'} h-4 w-4 text-gray-400`}/>{counterparty.contactPerson}</div>}
                            {counterparty.email && <div className="flex items-center"><Mail className={`flex-shrink-0 ${lang==='ar'?'ml-1.5':'mr-1.5'} h-4 w-4 text-gray-400`}/>{counterparty.email}</div>}
                            {counterparty.phone && <div className="flex items-center"><Phone className={`flex-shrink-0 ${lang==='ar'?'ml-1.5':'mr-1.5'} h-4 w-4 text-gray-400`}/>{counterparty.phone}</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleEdit(counterparty)} className="p-2 text-gray-400 hover:text-indigo-600"><Edit2 className="h-5 w-5"/></button>
                      <button onClick={() => handleDelete(counterparty.id)} className={`p-2 transition-colors ${confirmDeleteId===counterparty.id?'text-red-700':'text-gray-400 hover:text-red-600'}`}><Trash2 className="h-5 w-5"/></button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {isModalOpen && (
        <CounterpartyForm
          initialData={editingId ? counterparties.find(c => c.id === editingId) : undefined}
          onSave={handleSave}
          onCancel={() => { setIsModalOpen(false); setEditingId(null); }}
        />
      )}
    </div>
  );
}
