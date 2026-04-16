import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLang, t } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, ChevronRight, Briefcase } from 'lucide-react';
import { Project, ProjectStatus } from '../types';
import ProjectForm from '../components/ProjectForm';
import { format } from 'date-fns';

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
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          getClientName(p.clientId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.Active:    return 'bg-green-100  text-green-800';
      case ProjectStatus.Planned:   return 'bg-blue-100   text-blue-800';
      case ProjectStatus.OnHold:    return 'bg-yellow-100 text-yellow-800';
      case ProjectStatus.Completed: return 'bg-gray-100   text-gray-800';
      case ProjectStatus.Cancelled: return 'bg-red-100    text-red-800';
      default:                      return 'bg-gray-100   text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('المشاريع', 'Projects', lang)}</h1>
        <button
          onClick={() => { setEditingProject(undefined); setIsModalOpen(true); }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          {t('مشروع جديد', 'New Project', lang)}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-4">
          <div className="relative rounded-md shadow-sm max-w-md flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder={t('البحث عن مشاريع أو عملاء...', 'Search projects or clients...', lang)}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-400 mr-2" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="All">{t('جميع الحالات', 'All Statuses', lang)}</option>
              {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {loading.projects ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('لا توجد مشاريع', 'No projects found', lang)}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('ابدأ بإنشاء مشروع جديد.', 'Get started by creating a new project.', lang)}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[t('المشروع','Project',lang), t('العميل','Client',lang), t('العقد','Contract',lang), t('الحالة','Status',lang), t('صحة الميزانية','Budget Health',lang), t('المراحل','Milestones',lang)].map(h => (
                    <th key={h} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">{t('عرض','View',lang)}</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.map(project => {
                  const totalBudget = project.wbs.reduce((s, w) => s + w.budget, 0);
                  const totalSpent  = project.wbs.reduce((s, w) => s + w.spent, 0);
                  const budgetPct   = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
                  const completedMs = project.milestones.filter(m => m.status === 'Completed' || m.status === 'Invoiced').length;
                  return (
                    <tr key={project.id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold">
                            {project.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{project.name}</div>
                            <div className="text-xs text-gray-500">{t('بدأ في', 'Started', lang)} {format(new Date(project.startDate), 'MMM d, yyyy')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getClientName(project.clientId)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(project.contractValue, project.baseCurrency)}</div>
                        <div className="text-xs text-gray-500">{project.contractType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(project.status)}`}>{project.status}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap align-middle">
                        <div className="w-full max-w-[140px]">
                          <div className="flex justify-between text-xs mb-1"><span>{Math.round(budgetPct)}%</span></div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${budgetPct > 100 ? 'bg-red-500' : budgetPct > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(budgetPct, 100)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {completedMs} / {project.milestones.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/finance/projects/${project.id}`} className="text-indigo-600 hover:text-indigo-900">
                          <ChevronRight className="h-5 w-5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
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
