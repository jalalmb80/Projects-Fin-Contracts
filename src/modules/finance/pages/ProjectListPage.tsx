import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLang, t, tEnum } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, ChevronRight, Briefcase, AlertCircle } from 'lucide-react';
import { Project, ProjectStatus } from '../types';
import ProjectForm from '../components/ProjectForm';
import { format, isPast, parseISO } from 'date-fns';

export default function ProjectListPage() {
  const { projects, counterparties, addProject, updateProject, loading } = useApp();
  const { lang } = useLang();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);

  const handleCreate = async (data: any) => { await addProject(data); setIsModalOpen(false); };
  const handleUpdate = async (data: any) => {
    if (editingProject) { await updateProject(editingProject.id, data); setIsModalOpen(false); setEditingProject(undefined); }
  };

  const getClientName = (clientId: string) =>
    counterparties.find(c => c.id === clientId)?.name || t('عميل غير معروف', 'Unknown Client', lang);

  const filteredProjects = projects.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getClientName(p.clientId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: ProjectStatus): string => {
    switch (status) {
      case ProjectStatus.Active:    return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200';
      case ProjectStatus.Planned:   return 'bg-blue-100 text-blue-700 ring-1 ring-blue-200';
      case ProjectStatus.OnHold:    return 'bg-amber-100 text-amber-700 ring-1 ring-amber-200';
      case ProjectStatus.Completed: return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
      case ProjectStatus.Cancelled: return 'bg-red-100 text-red-700 ring-1 ring-red-200';
      default:                      return 'bg-slate-100 text-slate-700';
    }
  };

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(amount);

  const activeCount = filteredProjects.filter(p => p.status === ProjectStatus.Active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('المشاريع', 'Projects', lang)}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {projects.length} {t('مشروع إجمالاً', 'projects total', lang)}
            {' · '}{activeCount} {t('نشط', 'active', lang)}
          </p>
        </div>
        <button
          onClick={() => { setEditingProject(undefined); setIsModalOpen(true); }}
          className="inline-flex items-center px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          {t('مشروع جديد', 'New Project', lang)}
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-slate-100 overflow-hidden">
        {/* Filter Bar */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative rounded-lg shadow-sm max-w-xs flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-white"
                placeholder={t('بحث في المشاريع أو العملاء...', 'Search projects or clients...', lang)}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="block pl-3 pr-10 py-2 text-sm border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="All">{t('جميع الحالات', 'All Statuses', lang)}</option>
                {Object.values(ProjectStatus).map(s => (
                  <option key={s} value={s}>{tEnum(s, lang)}</option>
                ))}
              </select>
            </div>
          </div>
          {filteredProjects.length !== projects.length && (
            <p className="text-xs text-slate-500 whitespace-nowrap">
              {t('عرض', 'Showing', lang)} {filteredProjects.length} {t('من', 'of', lang)} {projects.length}
            </p>
          )}
        </div>

        {loading.projects ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-2 text-sm font-semibold text-slate-900">{t('لا توجد مشاريع', 'No projects found', lang)}</h3>
            <p className="mt-1 text-sm text-slate-500">{t('ابدأ بإنشاء مشروع جديد.', 'Get started by creating a new project.', lang)}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('المشروع', 'Project', lang)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('العميل', 'Client', lang)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('قيمة العقد', 'Contract Value', lang)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('الحالة', 'Status', lang)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('صحة الميزانية', 'Budget Health', lang)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('المراحل', 'Milestones', lang)}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('تاريخ الانتهاء', 'End Date', lang)}</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">{t('عرض', 'View', lang)}</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredProjects.map(project => {
                  const totalBudget = project.wbs.reduce((s, w) => s + w.budget, 0);
                  const totalSpent  = project.wbs.reduce((s, w) => s + w.spent, 0);
                  const budgetPct   = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
                  const completedMs = project.milestones.filter(m => m.status === 'Completed' || m.status === 'Invoiced').length;
                  const isEndDateOverdue =
                    !!project.endDate &&
                    isPast(parseISO(project.endDate)) &&
                    project.status !== ProjectStatus.Completed &&
                    project.status !== ProjectStatus.Cancelled;

                  return (
                    <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                      {/* Project Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-10 w-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 font-bold text-sm">
                            {project.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{project.name}</div>
                            <div className="text-xs text-slate-500">
                              {t('بدأ في', 'Started', lang)}{' '}
                              {project.startDate ? format(new Date(project.startDate), 'MMM d, yyyy') : '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Client */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {getClientName(project.clientId)}
                      </td>
                      {/* Contract */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">
                          {formatCurrency(project.contractValue, project.baseCurrency)}
                        </div>
                        <div className="text-xs text-slate-400">{tEnum(project.contractType, lang)}</div>
                      </td>
                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(project.status)}`}>
                          {tEnum(project.status, lang)}
                        </span>
                      </td>
                      {/* Budget Health */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full max-w-[140px]">
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className={budgetPct > 100 ? 'text-rose-600 font-semibold' : 'text-slate-500'}>
                              {Math.round(budgetPct)}%
                            </span>
                            {budgetPct > 100 && (
                              <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                            )}
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                budgetPct > 100 ? 'bg-rose-500' :
                                budgetPct > 80  ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(budgetPct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      {/* Milestones */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-semibold ${
                          completedMs === project.milestones.length && project.milestones.length > 0
                            ? 'text-emerald-600'
                            : 'text-slate-700'
                        }`}>
                          {completedMs}
                        </span>
                        <span className="text-slate-400"> / {project.milestones.length}</span>
                      </td>
                      {/* End Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {project.endDate ? (
                          <span className={`inline-flex items-center gap-1 ${
                            isEndDateOverdue ? 'text-rose-600 font-medium' : 'text-slate-500'
                          }`}>
                            {isEndDateOverdue && <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />}
                            {format(parseISO(project.endDate), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      {/* View Link */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/finance/projects/${project.id}`}
                          className="text-primary-600 hover:text-primary-800 transition-colors"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {filteredProjects.length > 0 && (
                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                  <tr>
                    <td className="px-6 py-3 text-xs font-medium text-slate-500" colSpan={8}>
                      {t('عرض', 'Showing', lang)} {filteredProjects.length}{' '}
                      {t('مشروع', filteredProjects.length === 1 ? 'project' : 'projects', lang)}
                      {' · '}{activeCount} {t('نشط', 'active', lang)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ProjectForm
          initialData={editingProject}
          onSave={editingProject ? handleUpdate : handleCreate}
          onCancel={() => { setIsModalOpen(false); setEditingProject(undefined); }}
        />
      )}
    </div>
  );
}
