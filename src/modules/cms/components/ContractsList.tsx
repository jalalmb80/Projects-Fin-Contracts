import React, { useState } from 'react';
import { Contract } from '../types';
import { Plus, Search, FileText, Edit2, Trash2, AlertCircle, Filter } from 'lucide-react';
import { useLang, t } from '../context/LanguageContext';
import { useContracts } from '../hooks/useContracts';

export default function ContractsList({ contracts, clients, onEdit, onCreate }: any) {
  const { lang } = useLang();
  const { deleteContract } = useContracts();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredContracts = contracts.filter((c: Contract) => {
    const matchesSearch = c.title_ar.includes(searchTerm) || c.contract_number?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case '\u0645\u0633\u0648\u062f\u0629': return 'bg-amber-100 text-amber-800';
      case '\u0646\u0634\u0637': return 'bg-green-100 text-green-800';
      case '\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629': return 'bg-purple-100 text-purple-800';
      case '\u0645\u0648\u0642\u0651\u0639': return 'bg-blue-100 text-blue-800';
      case '\u0645\u0643\u062a\u0645\u0644': return 'bg-gray-100 text-gray-800';
      case '\u0645\u0646\u062a\u0647\u064a': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    await deleteContract(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  const getClientName = (clientId: string) => {
    const client = clients.find((c: any) => c.id === clientId);
    return client ? (client.name_ar || client.nameAr || client.name || '\u2014') : '\u2014';
  };

  const confirmTarget = confirmDeleteId ? contracts.find((c: Contract) => c.id === confirmDeleteId) : null;

  return (
    <div className="space-y-6 p-6">
      {confirmDeleteId && (
        <div className="flex items-center gap-4 bg-red-50 border border-red-200 rounded-lg px-5 py-4 text-sm text-red-800">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span className="flex-1">
            {t('\u0647\u0644 \u062a\u0631\u064a\u062f \u062d\u0630\u0641 \u0627\u0644\u0639\u0642\u062f', 'Delete contract', lang)}{' '}
            <strong>{confirmTarget?.contract_number}</strong>{' \u2014 '}{confirmTarget?.title_ar}
            {t('\u061f \u0644\u0627 \u064a\u0645\u0643\u0646 \u0627\u0644\u062a\u0631\u0627\u062c\u0639.', '? This cannot be undone.', lang)}
          </span>
          <button onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg font-medium">{t('\u062d\u0630\u0641','Delete',lang)}</button>
          <button onClick={() => setConfirmDeleteId(null)} className="text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg font-medium">{t('\u0625\u0644\u063a\u0627\u0621','Cancel',lang)}</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0639\u0642\u0648\u062f', 'Contract Management', lang)}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('\u0625\u062f\u0627\u0631\u0629 \u0648\u062a\u062a\u0628\u0639 \u062c\u0645\u064a\u0639 \u0627\u0644\u0639\u0642\u0648\u062f', 'Manage and track all contracts', lang)}</p>
        </div>
        <button onClick={onCreate} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
          <Plus className="mr-2 h-4 w-4" />
          {t('\u0639\u0642\u062f \u062c\u062f\u064a\u062f', 'New Contract', lang)}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" dir="rtl"
              placeholder={t('\u0628\u062d\u062b \u0628\u0631\u0642\u0645 \u0627\u0644\u0639\u0642\u062f \u0623\u0648 \u0627\u0644\u0639\u0646\u0648\u0627\u0646...', 'Search by contract number or title...', lang)}
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="block w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400 shrink-0" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="block border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm focus:ring-emerald-500 focus:border-emerald-500 bg-white">
              <option value="all">{t('\u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0627\u0644\u0627\u062a','All Statuses',lang)}</option>
              <option value="\u0645\u0633\u0648\u062f\u0629">{t('\u0645\u0633\u0648\u062f\u0629','Draft',lang)}</option>
              <option value="\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629">{t('\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629','In Review',lang)}</option>
              <option value="\u0645\u0648\u0642\u0651\u0639">{t('\u0645\u0648\u0642\u0651\u0639','Signed',lang)}</option>
              <option value="\u0646\u0634\u0637">{t('\u0646\u0634\u0637','Active',lang)}</option>
              <option value="\u0645\u0643\u062a\u0645\u0644">{t('\u0645\u0643\u062a\u0645\u0644','Completed',lang)}</option>
            </select>
          </div>
        </div>

        {filteredContracts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-sm font-medium text-gray-900">{t('\u0644\u0627 \u062a\u0648\u062c\u062f \u0639\u0642\u0648\u062f','No contracts found',lang)}</h3>
            <p className="mt-1 text-sm">{t('\u0623\u0646\u0634\u0626 \u0639\u0642\u062f\u064b\u0627 \u062c\u062f\u064a\u062f\u064b\u0627 \u0644\u0644\u0628\u062f\u0621','Create a new contract to get started',lang)}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[t('\u0631\u0642\u0645 \u0627\u0644\u0639\u0642\u062f','Contract No.',lang),t('\u0627\u0644\u0639\u0646\u0648\u0627\u0646','Title',lang),t('\u0627\u0644\u0639\u0645\u064a\u0644','Client',lang),t('\u0627\u0644\u062d\u0627\u0644\u0629','Status',lang),t('\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0628\u062f\u0621','Start Date',lang),t('\u0625\u062c\u0631\u0627\u0621\u0627\u062a','Actions',lang)].map((h,i)=>(
                    <th key={i} scope="col" className={`px-6 py-3 ${i===5?'text-left':'text-right'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContracts.map((c: Contract) => (
                  <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${confirmDeleteId===c.id?'bg-red-50':''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">{c.contract_number||'-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.title_ar}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getClientName(c.client_id)}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(c.status)}`}>{c.status}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.start_date||'-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <div className="flex items-center gap-3">
                        <button onClick={()=>onEdit(c.id)} className="text-emerald-600 hover:text-emerald-900"><Edit2 size={18}/></button>
                        <button onClick={()=>setConfirmDeleteId(confirmDeleteId===c.id?null:c.id)} className={`transition-colors ${confirmDeleteId===c.id?'text-red-700':'text-red-400 hover:text-red-600'}`}><Trash2 size={18}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
