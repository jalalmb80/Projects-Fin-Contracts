import React, { useState } from 'react';
import { useCMSContext } from '../context/CMSContext';
import { Plus, Edit2, Trash2, X, AlertCircle, Briefcase } from 'lucide-react';
import { ProjectStatus } from '../types';
import { useLang, t } from '../context/LanguageContext';

const PROJECT_STATUSES: ProjectStatus[] = ['مخطط', 'قيد التنفيذ', 'مكتمل', 'معلّق'];
const STATUS_COLORS: Record<ProjectStatus, string> = {
  'مخطط': 'bg-blue-100 text-blue-800',
  'قيد التنفيذ': 'bg-green-100 text-green-800',
  'مكتمل': 'bg-gray-100 text-gray-800',
  'معلّق': 'bg-amber-100 text-amber-800',
};

export default function CMSProjectsPage() {
  const { projects, clients, contracts, addProject, updateProject, deleteProject } = useCMSContext();
  const { lang } = useLang();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name_ar: '', client_id: '', amount_sar: 0, status: 'مخطط' as ProjectStatus, start_date: new Date().toISOString().split('T')[0], description: '' });

  const showFeedback = (type: 'success' | 'error', msg: string) => { setFeedback({ type, msg }); setTimeout(() => setFeedback(null), 4000); };

  const handleOpenModal = (project?: any) => {
    if (project) { setEditingId(project.id); setFormData({ name_ar: project.name_ar||project.name||'', client_id: project.client_id||project.clientId||'', amount_sar: project.amount_sar||project.contractValue||0, status: (project.status as ProjectStatus)||'مخطط', start_date: project.start_date||project.startDate||new Date().toISOString().split('T')[0], description: project.description||'' }); }
    else { setEditingId(null); setFormData({ name_ar: '', client_id: '', amount_sar: 0, status: 'مخطط', start_date: new Date().toISOString().split('T')[0], description: '' }); }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) await updateProject(editingId, formData);
      else await addProject({ ...formData, project_type: 'أخرى' });
      setIsModalOpen(false);
      showFeedback('success', editingId ? t('تم تحديث المشروع','Project updated',lang) : t('تمت إضافة المشروع','Project added',lang));
    } catch { showFeedback('error', t('حدث خطأ أثناء الحفظ','Error saving project',lang)); }
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) { setConfirmDeleteId(id); return; }
    setConfirmDeleteId(null);
    try { await deleteProject(id); showFeedback('success', t('تم حذف المشروع','Project deleted',lang)); }
    catch { showFeedback('error', t('حدث خطأ أثناء الحذف','Error deleting project',lang)); }
  };

  const getClientName = (clientId: string) => clients.find(c => c.id === clientId)?.name_ar || t('غير معروف','Unknown',lang);
  const getContractCount = (projectId: string) => contracts.filter(c => c.project_id === projectId).length;
  const confirmTarget = confirmDeleteId ? projects.find(p => p.id === confirmDeleteId) : null;
  const inp = 'block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none';

  return (
    <div className="space-y-6 p-6">
      {confirmDeleteId && (
        <div className="flex items-center gap-4 bg-red-50 border border-red-200 rounded-lg px-5 py-4 text-sm text-red-800">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span className="flex-1">{t('هل تريد حذف','Delete',lang)} <strong>{confirmTarget?.name_ar}</strong>{t('؟ لا يمكن التراجع.','? This cannot be undone.',lang)}</span>
          <button onClick={() => handleDelete(confirmDeleteId)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg font-medium">{t('حذف','Delete',lang)}</button>
          <button onClick={() => setConfirmDeleteId(null)} className="text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg font-medium">{t('إلغاء','Cancel',lang)}</button>
        </div>
      )}
      {feedback && (<div className={`px-4 py-3 rounded-lg text-sm border ${feedback.type==='success'?'bg-green-50 text-green-800 border-green-200':'bg-red-50 text-red-800 border-red-200'}`}>{feedback.msg}</div>)}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('المشاريع','Projects',lang)}</h1>
        <button onClick={() => handleOpenModal()} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
          <Plus className="mr-2 h-4 w-4" />{t('إضافة مشروع','Add Project',lang)}
        </button>
      </div>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {projects.length === 0 ? (
          <div className="p-12 text-center text-gray-500"><Briefcase className="mx-auto h-12 w-12 text-gray-300 mb-4"/><h3 className="text-sm font-medium text-gray-900">{t('لا يوجد مشاريع','No projects found',lang)}</h3></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>
                {[t('اسم المشروع','Project Name',lang),t('العميل','Client',lang),t('الحالة','Status',lang),t('تاريخ البدء','Start Date',lang),t('عدد العقود','Contracts',lang),t('إجراءات','Actions',lang)].map((h,i)=>(
                  <th key={i} scope="col" className={`px-6 py-3 ${i===5?'text-left':'text-right'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map(project => (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.name_ar}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getClientName(project.client_id)}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[project.status as ProjectStatus]||'bg-gray-100 text-gray-800'}`}>{project.status}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.start_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getContractCount(project.id)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-left"><div className="flex items-center gap-3"><button onClick={()=>handleOpenModal(project)} className="text-emerald-600 hover:text-emerald-900"><Edit2 size={18}/></button><button onClick={()=>handleDelete(project.id)} className={`transition-colors ${confirmDeleteId===project.id?'text-red-700':'text-red-400 hover:text-red-600'}`}><Trash2 size={18}/></button></div></td>
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
              <h2 className="text-lg font-medium text-gray-900">{editingId?t('تعديل مشروع','Edit Project',lang):t('إضافة مشروع جديد','Add New Project',lang)}</h2>
              <button onClick={()=>setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1"><label className="block text-sm font-medium text-gray-700">{t('اسم المشروع *','Project Name *',lang)}</label><input type="text" required value={formData.name_ar} onChange={e=>setFormData({...formData,name_ar:e.target.value})} className={inp}/></div>
                <div className="space-y-1"><label className="block text-sm font-medium text-gray-700">{t('العميل *','Client *',lang)}</label><select required value={formData.client_id} onChange={e=>setFormData({...formData,client_id:e.target.value})} className={inp}><option value="">{t('اختر عميلًا','Select Client',lang)}</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name_ar}</option>)}</select></div>
                <div className="space-y-1"><label className="block text-sm font-medium text-gray-700">{t('الحالة *','Status *',lang)}</label><select required value={formData.status} onChange={e=>setFormData({...formData,status:e.target.value as ProjectStatus})} className={inp}>{PROJECT_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
                <div className="space-y-1"><label className="block text-sm font-medium text-gray-700">{t('قيمة العقد (ر.س)','Contract Value (SAR)',lang)}</label><input type="number" min="0" value={formData.amount_sar} onChange={e=>setFormData({...formData,amount_sar:parseFloat(e.target.value)||0})} className={inp}/></div>
                <div className="space-y-1"><label className="block text-sm font-medium text-gray-700">{t('تاريخ البدء','Start Date',lang)}</label><input type="date" required value={formData.start_date} onChange={e=>setFormData({...formData,start_date:e.target.value})} className={inp}/></div>
                <div className="sm:col-span-2 space-y-1"><label className="block text-sm font-medium text-gray-700">{t('الوصف','Description',lang)}</label><textarea rows={3} value={formData.description} onChange={e=>setFormData({...formData,description:e.target.value})} className={inp}/></div>
              </div>
              <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-gray-200">
                <button type="button" onClick={()=>setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">{t('إلغاء','Cancel',lang)}</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700">{t('حفظ','Save',lang)}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
