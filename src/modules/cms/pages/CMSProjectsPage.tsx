import React, { useState } from 'react';
import { usePlatform } from '../../../core/context/PlatformContext';
import { useContracts } from '../hooks/useContracts';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../core/firebase';

export default function CMSProjectsPage() {
  const { projects, counterparties } = usePlatform();
  const { contracts } = useContracts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    clientId: '',
    contractValue: 0,
    status: 'Active',
    startDate: new Date().toISOString().split('T')[0],
    description: ''
  });

  const handleOpenModal = (project?: any) => {
    if (project) {
      setEditingId(project.id);
      setFormData({
        name: project.name || '',
        clientId: project.clientId || '',
        contractValue: project.contractValue || 0,
        status: project.status || 'Active',
        startDate: project.startDate || new Date().toISOString().split('T')[0],
        description: project.description || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        clientId: '',
        contractValue: 0,
        status: 'Active',
        startDate: new Date().toISOString().split('T')[0],
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'projects', editingId), formData);
      } else {
        const newId = crypto.randomUUID();
        await setDoc(doc(db, 'projects', newId), {
          ...formData,
          id: newId,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteDoc(doc(db, 'projects', id));
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project');
      }
    }
  };

  const getClientName = (clientId: string) => {
    const client = counterparties.find(c => c.id === clientId);
    return client ? (client.nameAr || client.name) : 'Unknown';
  };

  const getContractCount = (projectId: string) => {
    return contracts.filter(c => c.project_id === projectId).length;
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">المشاريع (Projects)</h1>
        <button 
          onClick={() => handleOpenModal()} 
          className="flex items-center space-x-2 space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          <span>إضافة مشروع (Add Project)</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-medium">اسم المشروع (Project Name)</th>
              <th className="px-6 py-4 font-medium">العميل (Client)</th>
              <th className="px-6 py-4 font-medium">الحالة (Status)</th>
              <th className="px-6 py-4 font-medium">تاريخ البدء (Start Date)</th>
              <th className="px-6 py-4 font-medium">عدد العقود (Contracts)</th>
              <th className="px-6 py-4 font-medium text-left">إجراءات (Actions)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map(project => (
              <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{project.name}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{getClientName(project.clientId)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    project.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                    project.status === 'Completed' ? 'bg-slate-100 text-slate-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{project.startDate}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{getContractCount(project.id)}</td>
                <td className="px-6 py-4 text-left space-x-3 space-x-reverse">
                  <button onClick={() => handleOpenModal(project)} className="text-emerald-600 hover:text-emerald-700">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(project.id)} className="text-red-500 hover:text-red-600">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  لا يوجد مشاريع (No projects found)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? 'تعديل مشروع (Edit Project)' : 'إضافة مشروع جديد (Add New Project)'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium text-slate-700">اسم المشروع (Project Name)</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">العميل (Client)</label>
                  <select
                    required
                    value={formData.clientId}
                    onChange={e => setFormData({...formData, clientId: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">اختر عميلاً (Select Client)</option>
                    {counterparties.map(c => (
                      <option key={c.id} value={c.id}>{c.nameAr || c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">الحالة (Status)</label>
                  <select
                    required
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Active">نشط (Active)</option>
                    <option value="Completed">مكتمل (Completed)</option>
                    <option value="On Hold">معلق (On Hold)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">قيمة العقد (Contract Value)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.contractValue}
                    onChange={e => setFormData({...formData, contractValue: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">تاريخ البدء (Start Date)</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium text-slate-700">الوصف (Description)</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  إلغاء (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
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
