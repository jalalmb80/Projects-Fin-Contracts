import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLang, t, tEnum } from '../context/LanguageContext';
import { ProjectStatus, MilestoneStatus, DocumentDirection, DocumentStatus, Milestone, BudgetCategory } from '../types';
import { Briefcase, DollarSign, CheckCircle, FileText, Plus, Edit2, Trash2, ChevronLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';

const TABS = [
  { key: 'overview'   as const, ar: 'نظرة عامة', en: 'Overview'   },
  { key: 'milestones' as const, ar: 'المراحل',   en: 'Milestones' },
  { key: 'budget'     as const, ar: 'الميزانية', en: 'Budget'      },
  { key: 'documents'  as const, ar: 'المستندات', en: 'Documents'   },
];
type TabKey = typeof TABS[number]['key'];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addToast } = useToast();
  const { lang } = useLang();
  const { projects, counterparties, billingDocuments, budgetCategories, completeMilestone, addMilestone, updateMilestone, deleteMilestone, addBudgetCategory, updateBudgetCategory, deleteBudgetCategory, formatMoney, loading } = useApp();

  const [activeTab,                  setActiveTab]                  = useState<TabKey>('overview');
  const [isMilestoneModalOpen,       setIsMilestoneModalOpen]       = useState(false);
  const [editingMilestone,           setEditingMilestone]           = useState<Milestone | null>(null);
  const [milestoneForm,              setMilestoneForm]              = useState<Partial<Milestone>>({});
  const [isDeleteMilestoneDialogOpen,setIsDeleteMilestoneDialogOpen]= useState(false);
  const [milestoneToDelete,          setMilestoneToDelete]          = useState<string | null>(null);
  const [completingMilestoneId,      setCompletingMilestoneId]      = useState<string | null>(null);
  const [isBudgetModalOpen,          setIsBudgetModalOpen]          = useState(false);
  const [editingBudgetCategory,      setEditingBudgetCategory]      = useState<BudgetCategory | null>(null);
  const [budgetForm,                 setBudgetForm]                 = useState<Partial<BudgetCategory>>({});
  const [isDeleteBudgetDialogOpen,   setIsDeleteBudgetDialogOpen]   = useState(false);
  const [budgetCategoryToDelete,     setBudgetCategoryToDelete]     = useState<string | null>(null);

  if (loading.projects) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div></div>;

  const project = projects.find(p => p.id === id);
  if (!project) return (
    <div className="text-center py-12">
      <Briefcase className="mx-auto h-12 w-12 text-slate-300 mb-4" />
      <h2 className="text-2xl font-bold text-gray-900">{t('المشروع غير موجود', 'Project not found', lang)}</h2>
      <Link to="/finance/projects" className="mt-4 inline-block text-indigo-600 hover:text-indigo-500">{t('العودة إلى المشاريع', 'Back to Projects', lang)}</Link>
    </div>
  );

  const client                  = counterparties.find(c => c.id === project.clientId);
  const projectDocs             = billingDocuments.filter(d => d.projectId === project.id);
  const projectBudgetCategories = budgetCategories.filter(c => c.projectId === project.id);
  const totalBudget             = projectBudgetCategories.reduce((s, c) => s + c.planned, 0);
  const totalSpent              = projectBudgetCategories.reduce((s, c) => s + c.actual,  0);
  const budgetProgress          = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const completedMilestones     = project.milestones.filter(m => m.status === MilestoneStatus.Completed || m.status === MilestoneStatus.Invoiced).length;
  const milestoneProgress       = project.milestones.length > 0 ? (completedMilestones / project.milestones.length) * 100 : 0;
  const fmt    = (amount: number) => formatMoney(amount, project.baseCurrency);
  const fmtDoc = (amount: number, currency: string) => formatMoney(amount, currency as any);

  const getStatusColor = (s: ProjectStatus) => ({ Active: 'bg-green-100 text-green-800', Planned: 'bg-blue-100 text-blue-800', OnHold: 'bg-yellow-100 text-yellow-800', Completed: 'bg-gray-100 text-gray-800', Cancelled: 'bg-red-100 text-red-800' }[s] ?? 'bg-gray-100 text-gray-800');
  const getMSColor    = (s: MilestoneStatus) => ({ Completed: 'bg-green-100 text-green-800', Invoiced: 'bg-purple-100 text-purple-800', InProgress: 'bg-blue-100 text-blue-800' }[s] ?? 'bg-gray-100 text-gray-800');

  const handleOpenMilestoneModal = (milestone?: Milestone) => {
    if (milestone) { setEditingMilestone(milestone); setMilestoneForm(milestone); }
    else { setEditingMilestone(null); setMilestoneForm({ name: '', description: '', dueDate: '', percentOfContract: 0, amount: 0, status: MilestoneStatus.Pending }); }
    setIsMilestoneModalOpen(true);
  };
  const handleSaveMilestone = async () => {
    if (!milestoneForm.name) return;
    const used = project.milestones.filter(m => m.id !== editingMilestone?.id).reduce((s, m) => s + m.percentOfContract, 0);
    if (used + (milestoneForm.percentOfContract || 0) > 100) { addToast('error', t('لا يمكن أن يتجاوز مجموع نسب المراحل 100%', 'Total milestone percentage cannot exceed 100%', lang)); return; }
    try {
      if (editingMilestone) await updateMilestone(project.id, editingMilestone.id, milestoneForm);
      else await addMilestone(project.id, milestoneForm as Omit<Milestone, 'id' | 'projectId'>);
      setIsMilestoneModalOpen(false);
    } catch (e) { console.error(e); }
  };
  const handleDeleteMilestone = async () => { if (milestoneToDelete) { await deleteMilestone(project.id, milestoneToDelete); setIsDeleteMilestoneDialogOpen(false); setMilestoneToDelete(null); } };
  const handleCompleteMilestone = async (milestoneId: string) => {
    setCompletingMilestoneId(milestoneId);
    try { await completeMilestone(project.id, milestoneId); }
    catch (e) { console.error(e); addToast('error', t('فشل', 'Failed', lang)); }
    finally { setCompletingMilestoneId(null); }
  };
  const handleMilestonePercentChange = (p: number) => setMilestoneForm(prev => ({ ...prev, percentOfContract: p, amount: (p / 100) * project.contractValue }));
  const handleOpenBudgetModal = (cat?: BudgetCategory) => {
    if (cat) { setEditingBudgetCategory(cat); setBudgetForm(cat); }
    else { setEditingBudgetCategory(null); setBudgetForm({ name: '', planned: 0, actual: 0, notes: '' }); }
    setIsBudgetModalOpen(true);
  };
  const handleSaveBudgetCategory = async () => {
    if (!budgetForm.name) return;
    try {
      if (editingBudgetCategory) await updateBudgetCategory(editingBudgetCategory.id, budgetForm);
      else await addBudgetCategory({ ...budgetForm, projectId: project.id } as Omit<BudgetCategory, 'id'>);
      setIsBudgetModalOpen(false);
    } catch (e) { console.error(e); }
  };
  const handleDeleteBudgetCategory = async () => { if (budgetCategoryToDelete) { await deleteBudgetCategory(budgetCategoryToDelete); setIsDeleteBudgetDialogOpen(false); setBudgetCategoryToDelete(null); } };

  const inputCls = 'mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm';
  const btnPrimary = 'w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none';

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start space-x-4">
            <Link to="/finance/projects" className="mt-1 text-gray-400 hover:text-gray-500"><ChevronLeft className="h-6 w-6" /></Link>
            <div>
              <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>{tEnum(project.status, lang)}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">{t('العميل', 'Client', lang)}: <span className="font-medium text-gray-900">{client?.name || t('غير معروف', 'Unknown', lang)}</span> · {t('نوع العقد', 'Contract', lang)}: <span className="font-medium text-gray-900">{tEnum(project.contractType, lang)}</span></p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">{t('قيمة العقد', 'Contract Value', lang)}</p>
            <p className="text-xl font-bold text-gray-900">{fmt(project.contractValue)}</p>
          </div>
        </div>
        <div className="mt-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {TABS.map(({ key, ar, en }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === key ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                {t(ar, en, lang)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3"><DollarSign className="h-6 w-6 text-indigo-600" /></div>
                  <div className="ml-5 w-0 flex-1"><dt className="text-sm font-medium text-gray-500 truncate">{t('نسبة استهلاك الميزانية', 'Budget Consumed', lang)}</dt><dd className="text-2xl font-semibold text-gray-900">{Math.round(budgetProgress)}%</dd></div>
                </div>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${budgetProgress > 100 ? 'bg-red-500' : budgetProgress > 80 ? 'bg-yellow-500' : 'bg-indigo-600'}`} style={{ width: `${Math.min(budgetProgress, 100)}%` }} />
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3"><CheckCircle className="h-6 w-6 text-green-600" /></div>
                  <div className="ml-5 w-0 flex-1"><dt className="text-sm font-medium text-gray-500 truncate">{t('المراحل المكتملة', 'Milestones Completed', lang)}</dt><dd className="text-2xl font-semibold text-gray-900">{completedMilestones} / {project.milestones.length}</dd></div>
                </div>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(milestoneProgress, 100)}%` }} /></div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3"><FileText className="h-6 w-6 text-blue-600" /></div>
                  <div className="ml-5 w-0 flex-1"><dt className="text-sm font-medium text-gray-500 truncate">{t('الفواتير الصادرة', 'Invoices Issued', lang)}</dt><dd className="text-2xl font-semibold text-gray-900">{projectDocs.filter(d => d.direction === DocumentDirection.AR && d.status !== DocumentStatus.Draft).length}</dd></div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3 bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200"><h3 className="text-lg font-medium leading-6 text-gray-900">{t('تفصيل الميزانية (WBS)', 'Budget Breakdown (WBS)', lang)}</h3></div>
              <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50"><tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('الفئة', 'Category', lang)}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('المخطط', 'Planned', lang)}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('الفعلي', 'Actual', lang)}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('الفارق', 'Variance', lang)}</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('التقدم', 'Progress', lang)}</th>
                </tr></thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projectBudgetCategories.map(item => { const v = item.planned - item.actual; const p = item.planned > 0 ? (item.actual / item.planned) * 100 : 0; return (
                    <tr key={item.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-500">{fmt(item.planned)}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-500">{fmt(item.actual)}</td>
                      <td className={`px-6 py-4 text-sm text-right font-medium ${v < 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(v)}</td>
                      <td className="px-6 py-4 align-middle"><div className="w-full bg-gray-200 rounded-full h-2.5"><div className={`h-2.5 rounded-full ${p > 100 ? 'bg-red-600' : p > 80 ? 'bg-yellow-500' : 'bg-green-600'}`} style={{ width: `${Math.min(p, 100)}%` }} /></div></td>
                    </tr>
                  ); })}
                  {projectBudgetCategories.length === 0 && <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">{t('لا توجد فئات ميزانية.', 'No budget categories defined.', lang)}</td></tr>}
                </tbody>
              </table></div>
            </div>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium leading-6 text-gray-900">{t('مراحل المشروع', 'Project Milestones', lang)}</h3>
              <button onClick={() => handleOpenMilestoneModal()} className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                <Plus className="-ml-0.5 mr-2 h-4 w-4" />{t('إضافة مرحلة', 'Add Milestone', lang)}
              </button>
            </div>
            <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('الاسم', 'Name', lang)}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('تاريخ الاستحقاق', 'Due Date', lang)}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('المبلغ', 'Amount', lang)}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('% من العقد', '% of Contract', lang)}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('الحالة', 'Status', lang)}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('الإجراءات', 'Actions', lang)}</th>
              </tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {project.milestones.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-indigo-600">{m.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{m.dueDate ? format(new Date(m.dueDate), 'MMM d, yyyy') : '—'}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">{fmt(m.amount)}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-500">{m.percentOfContract}%</td>
                    <td className="px-6 py-4 text-center"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getMSColor(m.status)}`}>{tEnum(m.status, lang)}</span></td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end items-center space-x-3">
                        {(m.status === MilestoneStatus.Pending || m.status === MilestoneStatus.InProgress) && (
                          <button onClick={() => handleCompleteMilestone(m.id)} disabled={completingMilestoneId === m.id}
                            className="inline-flex items-center text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 disabled:opacity-50">
                            {completingMilestoneId === m.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                            {t('اعتبارها مكتملة', 'Mark Complete', lang)}
                          </button>
                        )}
                        {m.status === MilestoneStatus.Invoiced && m.linkedInvoiceId && (<Link to={`/finance/billing/${m.linkedInvoiceId}`} className="text-indigo-600 hover:text-indigo-900"><FileText className="h-4 w-4" /></Link>)}
                        <button onClick={() => handleOpenMilestoneModal(m)} className="text-gray-400 hover:text-gray-600"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => { setMilestoneToDelete(m.id); setIsDeleteMilestoneDialogOpen(true); }} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {project.milestones.length === 0 && <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">{t('لا توجد مراحل.', 'No milestones found.', lang)}</td></tr>}
              </tbody>
            </table></div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium leading-6 text-gray-900">{t('ميزانية المشروع', 'Project Budget', lang)}</h3>
              <button onClick={() => handleOpenBudgetModal()} className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                <Plus className="-ml-0.5 mr-2 h-4 w-4" />{t('إضافة فئة', 'Add Category', lang)}
              </button>
            </div>
            <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('الفئة', 'Category', lang)}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('المخطط', 'Planned', lang)}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('الفعلي', 'Actual', lang)}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('الفارق', 'Variance', lang)}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('نسبة الاستخدام', '% Used', lang)}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('الإجراءات', 'Actions', lang)}</th>
              </tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projectBudgetCategories.map(item => { const v = item.planned - item.actual; const p = item.planned > 0 ? (item.actual / item.planned) * 100 : 0; return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{item.name}</div>{item.notes && <div className="text-xs text-gray-500">{item.notes}</div>}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-500">{fmt(item.planned)}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-500">{fmt(item.actual)}</td>
                    <td className={`px-6 py-4 text-sm text-right font-medium ${v < 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(v)}</td>
                    <td className="px-6 py-4 align-middle">
                      <div className="w-full bg-gray-200 rounded-full h-2.5"><div className={`h-2.5 rounded-full ${p >= 100 ? 'bg-red-600' : p >= 80 ? 'bg-yellow-500' : 'bg-green-600'}`} style={{ width: `${Math.min(p, 100)}%` }} /></div>
                      <div className="text-xs text-center mt-1 text-gray-500">{Math.round(p)}%</div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => handleOpenBudgetModal(item)} className="text-indigo-600 hover:text-indigo-900"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => { setBudgetCategoryToDelete(item.id); setIsDeleteBudgetDialogOpen(true); }} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ); })}
                {projectBudgetCategories.length > 0 && (
                  <tr className="bg-gray-50 font-medium">
                    <td className="px-6 py-4 text-sm text-gray-900">{t('المجموع', 'Total', lang)}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">{fmt(totalBudget)}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">{fmt(totalSpent)}</td>
                    <td className={`px-6 py-4 text-sm text-right ${totalBudget - totalSpent < 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(totalBudget - totalSpent)}</td>
                    <td /><td />
                  </tr>
                )}
                {projectBudgetCategories.length === 0 && <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">{t('لا توجد فئات ميزانية.', 'No budget categories found.', lang)}</td></tr>}
              </tbody>
            </table></div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200"><h3 className="text-lg font-medium leading-6 text-gray-900">{t('المستندات ذات الصلة', 'Related Documents', lang)}</h3></div>
            {projectDocs.length === 0 ? <div className="p-6 text-center text-gray-500">{t('لا توجد مستندات.', 'No documents found.', lang)}</div> : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50"><tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('الرقم', 'Number', lang)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('النوع', 'Type', lang)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('التاريخ', 'Date', lang)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('الحالة', 'Status', lang)}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('المبلغ', 'Amount', lang)}</th>
                  <th className="relative px-6 py-3"><span className="sr-only">{t('عرض', 'View', lang)}</span></th>
                </tr></thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projectDocs.map(doc => (
                    <tr key={doc.id}>
                      <td className="px-6 py-4 text-sm font-medium text-indigo-600">{doc.documentNumber || t('مسودة', 'Draft', lang)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{tEnum(doc.type, lang)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{doc.date ? format(new Date(doc.date), 'MMM d, yyyy') : '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${doc.status === DocumentStatus.Paid ? 'bg-green-100 text-green-800' : doc.status === DocumentStatus.Overdue ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{tEnum(doc.status, lang)}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">{fmtDoc(doc.total, doc.currency)}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium"><Link to={`/finance/billing/${doc.id}`} className="text-indigo-600 hover:text-indigo-900">{t('عرض', 'View', lang)}</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={isMilestoneModalOpen} onClose={() => setIsMilestoneModalOpen(false)} title={editingMilestone ? t('تعديل المرحلة', 'Edit Milestone', lang) : t('إضافة مرحلة', 'Add Milestone', lang)}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700">{t('الاسم', 'Name', lang)}</label><input type="text" required value={milestoneForm.name || ''} onChange={e => setMilestoneForm({ ...milestoneForm, name: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-sm font-medium text-gray-700">{t('الوصف', 'Description', lang)}</label><textarea rows={3} value={milestoneForm.description || ''} onChange={e => setMilestoneForm({ ...milestoneForm, description: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-sm font-medium text-gray-700">{t('تاريخ الاستحقاق', 'Due Date', lang)}</label><input type="date" required value={milestoneForm.dueDate || ''} onChange={e => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })} className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700">{t('% من العقد', '% of Contract', lang)}</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input type="number" min="0" max="100" value={milestoneForm.percentOfContract || 0} onChange={e => handleMilestonePercentChange(parseFloat(e.target.value) || 0)} className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-8 sm:text-sm border-gray-300 rounded-md" />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">%</span></div>
              </div></div>
            <div><label className="block text-sm font-medium text-gray-700">{t('المبلغ', 'Amount', lang)}</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">{project.baseCurrency}</span></div>
                <input type="number" value={milestoneForm.amount || 0} onChange={e => setMilestoneForm({ ...milestoneForm, amount: parseFloat(e.target.value) || 0 })} className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md" />
              </div></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700">{t('الحالة', 'Status', lang)}</label>
            <select value={milestoneForm.status || MilestoneStatus.Pending} onChange={e => setMilestoneForm({ ...milestoneForm, status: e.target.value as MilestoneStatus })} className={inputCls}>
              {Object.values(MilestoneStatus).map(s => <option key={s} value={s}>{tEnum(s, lang)}</option>)}
            </select></div>
          <div className="pt-4"><button onClick={handleSaveMilestone} className={btnPrimary}>{t('حفظ المرحلة', 'Save Milestone', lang)}</button></div>
        </div>
      </Modal>
      <ConfirmDialog isOpen={isDeleteMilestoneDialogOpen} onClose={() => setIsDeleteMilestoneDialogOpen(false)} onConfirm={handleDeleteMilestone} title={t('حذف المرحلة', 'Delete Milestone', lang)} message={t('هل أنت متأكد؟', 'Are you sure?', lang)} />

      <Modal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} title={editingBudgetCategory ? t('تعديل فئة الميزانية', 'Edit Budget Category', lang) : t('إضافة فئة ميزانية', 'Add Budget Category', lang)}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700">{t('اسم الفئة', 'Category Name', lang)}</label><input type="text" required value={budgetForm.name || ''} onChange={e => setBudgetForm({ ...budgetForm, name: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-sm font-medium text-gray-700">{t('المبلغ المخطط', 'Planned Amount', lang)}</label>
            <div className="mt-1 relative rounded-md shadow-sm"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">{project.baseCurrency}</span></div><input type="number" value={budgetForm.planned || 0} onChange={e => setBudgetForm({ ...budgetForm, planned: parseFloat(e.target.value) || 0 })} className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md" /></div></div>
          <div><label className="block text-sm font-medium text-gray-700">{t('المبلغ الفعلي', 'Actual Amount', lang)}</label>
            <div className="mt-1 relative rounded-md shadow-sm"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">{project.baseCurrency}</span></div><input type="number" min="0" value={budgetForm.actual || 0} onChange={e => setBudgetForm({ ...budgetForm, actual: parseFloat(e.target.value) || 0 })} className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md" /></div></div>
          <div><label className="block text-sm font-medium text-gray-700">{t('ملاحظات (اختياري)', 'Notes (Optional)', lang)}</label><textarea rows={3} value={budgetForm.notes || ''} onChange={e => setBudgetForm({ ...budgetForm, notes: e.target.value })} className={inputCls} /></div>
          <div className="pt-4"><button onClick={handleSaveBudgetCategory} className={btnPrimary}>{t('حفظ الفئة', 'Save Category', lang)}</button></div>
        </div>
      </Modal>
      <ConfirmDialog isOpen={isDeleteBudgetDialogOpen} onClose={() => setIsDeleteBudgetDialogOpen(false)} onConfirm={handleDeleteBudgetCategory} title={t('حذف فئة الميزانية', 'Delete Budget Category', lang)} message={t('هل أنت متأكد؟', 'Are you sure?', lang)} />
    </div>
  );
}
