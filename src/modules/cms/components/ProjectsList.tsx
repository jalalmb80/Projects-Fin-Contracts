import React, { useState } from 'react';
import { Plus, Search, Filter, MoreVertical, Briefcase, X, CheckCircle2 } from 'lucide-react';
import { Project, Client, ProjectType, ProjectStatus } from '../types';

interface ProjectsListProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  clients: Client[];
}

export default function ProjectsList({ projects, setProjects, clients }: ProjectsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name_ar: '',
    project_type: 'تطوير منصة',
    client_id: '',
    amount_sar: 0,
    status: 'مخطط',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name_ar : 'غير معروف';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'مكتمل':
        return 'bg-emerald-100 text-emerald-800';
      case 'قيد التنفيذ':
        return 'bg-blue-100 text-blue-800';
      case 'مخطط':
        return 'bg-amber-100 text-amber-800';
      case 'معلّق':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getClientName(project.client_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addProject = () => {
    setError('');
    setSuccess('');
    if (!newProject.name_ar?.trim()) {
      setError('يرجى إدخال اسم المشروع');
      return;
    }
    if (!newProject.client_id) {
      setError('يرجى اختيار العميل');
      return;
    }
    if (!newProject.project_type) {
      setError('يرجى اختيار نوع المشروع');
      return;
    }
    if (!newProject.amount_sar || Number(newProject.amount_sar) <= 0) {
      setError('يرجى إدخال قيمة صحيحة للمشروع');
      return;
    }

    const projectToAdd: Project = {
      ...(newProject as Project),
      id: Date.now().toString(),
      amount_sar: Number(newProject.amount_sar),
      status: newProject.status || 'مخطط',
    };

    setProjects((prev: Project[]) => [projectToAdd, ...prev]);

    setNewProject({
      name_ar: '',
      project_type: 'تطوير منصة',
      client_id: '',
      amount_sar: 0,
      status: 'مخطط',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
    });

    setSuccess('تم إضافة المشروع بنجاح');
    setShowForm(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">المشاريع</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>مشروع جديد</span>
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-800">إضافة مشروع جديد</h2>
              <button 
                onClick={() => {
                  setShowForm(false);
                  setError('');
                  setNewProject({
                    name_ar: '',
                    project_type: 'تطوير منصة',
                    client_id: '',
                    amount_sar: 0,
                    status: 'مخطط',
                    description: '',
                    start_date: new Date().toISOString().split('T')[0],
                  });
                }} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">اسم المشروع <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newProject.name_ar}
                    onChange={(e) => setNewProject({...newProject, name_ar: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="أدخل اسم المشروع"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">العميل <span className="text-red-500">*</span></label>
                  <select
                    value={newProject.client_id}
                    onChange={(e) => setNewProject({...newProject, client_id: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">اختر العميل</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name_ar}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">نوع المشروع <span className="text-red-500">*</span></label>
                  <select
                    value={newProject.project_type}
                    onChange={(e) => setNewProject({...newProject, project_type: e.target.value as ProjectType})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="تطوير منصة">تطوير منصة</option>
                    <option value="تطوير تطبيق">تطوير تطبيق</option>
                    <option value="موقع إلكتروني">موقع إلكتروني</option>
                    <option value="اشتراك سنوي">اشتراك سنوي</option>
                    <option value="تهيئة وتشغيل">تهيئة وتشغيل</option>
                    <option value="استشارات">استشارات</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">القيمة (ر.س) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="0"
                    value={newProject.amount_sar || ''}
                    onChange={(e) => setNewProject({...newProject, amount_sar: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">الحالة</label>
                  <select
                    value={newProject.status}
                    onChange={(e) => setNewProject({...newProject, status: e.target.value as ProjectStatus})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="مخطط">مخطط</option>
                    <option value="قيد التنفيذ">قيد التنفيذ</option>
                    <option value="مكتمل">مكتمل</option>
                    <option value="معلّق">معلّق</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">تاريخ البداية</label>
                  <input
                    type="date"
                    value={newProject.start_date}
                    onChange={(e) => setNewProject({...newProject, start_date: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-left"
                    dir="ltr"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">وصف المشروع</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                    placeholder="أدخل وصفاً مختصراً للمشروع..."
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-xl sticky bottom-0">
              <button
                onClick={() => {
                  setShowForm(false);
                  setError('');
                  setNewProject({
                    name_ar: '',
                    project_type: 'تطوير منصة',
                    client_id: '',
                    amount_sar: 0,
                    status: 'مخطط',
                    description: '',
                    start_date: new Date().toISOString().split('T')[0],
                  });
                }}
                className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={addProject}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
              >
                إضافة المشروع
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="البحث في المشاريع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <button className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <span>تصفية</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-600 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">اسم المشروع</th>
                <th className="px-6 py-4 font-medium">النوع</th>
                <th className="px-6 py-4 font-medium">العميل</th>
                <th className="px-6 py-4 font-medium">القيمة</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
                <th className="px-6 py-4 font-medium">تاريخ البداية</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{project.name_ar}</p>
                        {project.description && (
                          <p className="text-sm text-slate-500 truncate max-w-xs">{project.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{project.project_type}</td>
                  <td className="px-6 py-4 text-slate-600">{getClientName(project.client_id)}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {project.amount_sar.toLocaleString('ar-SA')} ر.س
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600" dir="ltr">
                    {project.start_date || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredProjects.length === 0 && projects.length > 0 && (
            <div className="p-8 text-center text-slate-500">
              لا توجد مشاريع مطابقة للبحث
            </div>
          )}
          
          {projects.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">لا توجد مشاريع</h3>
              <p className="text-slate-500 mb-6 max-w-md">لم تقم بإضافة أي مشاريع بعد. أضف مشروعك الأول للبدء في إدارته وربطه بالعقود.</p>
              <button 
                onClick={() => setShowForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>إضافة مشروع جديد</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
