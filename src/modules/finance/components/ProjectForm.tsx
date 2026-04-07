import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus, ContractType, Currency, Counterparty, WBSItem, Milestone, MilestoneStatus } from '../types';
import { X, Plus, Trash2 } from 'lucide-react';
import { counterpartyService } from '../services/counterpartyService';

interface ProjectFormProps {
  initialData?: Project;
  onSave: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

export default function ProjectForm({ initialData, onSave, onCancel }: ProjectFormProps) {
  const [formData, setFormData] = useState<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    clientId: '',
    contractType: ContractType.FIXED,
    contractValue: 0,
    baseCurrency: Currency.USD,
    startDate: new Date().toISOString().split('T')[0],
    status: ProjectStatus.Planned,
    wbs: [],
    milestones: []
  });
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'wbs' | 'milestones'>('details');

  useEffect(() => {
    loadCounterparties();
    if (initialData) {
      const { id, createdAt, updatedAt, ...rest } = initialData;
      setFormData(rest);
    }
  }, [initialData]);

  const loadCounterparties = async () => {
    const data = await counterpartyService.getAll();
    setCounterparties(data);
    if (!initialData && data.length > 0) {
      setFormData(prev => ({ ...prev, clientId: data[0].id }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving project:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'contractValue' ? parseFloat(value) || 0 : value
    }));
  };

  // WBS Management
  const addWBSItem = () => {
    const newItem: WBSItem = {
      id: crypto.randomUUID(),
      name: '',
      budget: 0,
      spent: 0,
      tags: []
    };
    setFormData(prev => ({ ...prev, wbs: [...prev.wbs, newItem] }));
  };

  const updateWBSItem = (id: string, field: keyof WBSItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      wbs: prev.wbs.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const removeWBSItem = (id: string) => {
    setFormData(prev => ({ ...prev, wbs: prev.wbs.filter(item => item.id !== id) }));
  };

  // Milestone Management
  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: crypto.randomUUID(),
      projectId: '', // Will be set on save or context
      name: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      percentOfContract: 0,
      amount: 0,
      status: MilestoneStatus.Pending
    };
    setFormData(prev => ({ ...prev, milestones: [...prev.milestones, newMilestone] }));
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: any) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        // Auto-calculate amount if percent changes
        if (field === 'percentOfContract') {
          updated.amount = (formData.contractValue * (value as number)) / 100;
        }
        return updated;
      })
    }));
  };

  const removeMilestone = (id: string) => {
    setFormData(prev => ({ ...prev, milestones: prev.milestones.filter(item => item.id !== id) }));
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {initialData ? 'Edit Project' : 'New Project'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-500">
            <X size={24} />
          </button>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex px-6 space-x-8">
            {['details', 'wbs', 'milestones'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
              >
                {tab === 'wbs' ? 'WBS' : tab}
              </button>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="form-label">Project Name *</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div>
                <label htmlFor="clientId" className="form-label">Client *</label>
                <select
                  name="clientId"
                  id="clientId"
                  required
                  value={formData.clientId}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Select Client</option>
                  {counterparties.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="form-label">Status</label>
                <select
                  name="status"
                  id="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-input"
                >
                  {Object.values(ProjectStatus).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="contractType" className="form-label">Contract Type</label>
                <select
                  name="contractType"
                  id="contractType"
                  value={formData.contractType}
                  onChange={handleChange}
                  className="form-input"
                >
                  {Object.values(ContractType).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="baseCurrency" className="form-label">Currency</label>
                <select
                  name="baseCurrency"
                  id="baseCurrency"
                  value={formData.baseCurrency}
                  onChange={handleChange}
                  className="form-input"
                >
                  {Object.values(Currency).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="contractValue" className="form-label">Contract Value</label>
                <input
                  type="number"
                  name="contractValue"
                  id="contractValue"
                  min="0"
                  step="0.01"
                  value={formData.contractValue}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div>
                <label htmlFor="startDate" className="form-label">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  id="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="form-label">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  id="endDate"
                  value={formData.endDate || ''}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>
          )}

          {activeTab === 'wbs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Work Breakdown Structure</h3>
                <button
                  type="button"
                  onClick={addWBSItem}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                >
                  <Plus className="-ml-0.5 mr-2 h-4 w-4" />
                  Add Item
                </button>
              </div>
              
              {formData.wbs.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No WBS items added yet.</p>
              ) : (
                <div className="space-y-3">
                  {formData.wbs.map((item, index) => (
                    <div key={item.id} className="flex items-start space-x-3 bg-gray-50 p-3 rounded-md">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Item Name"
                            value={item.name}
                            onChange={(e) => updateWBSItem(item.id, 'name', e.target.value)}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Budget"
                            value={item.budget}
                            onChange={(e) => updateWBSItem(item.id, 'budget', parseFloat(e.target.value) || 0)}
                            className="form-input"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeWBSItem(item.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'milestones' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Milestones</h3>
                <button
                  type="button"
                  onClick={addMilestone}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                >
                  <Plus className="-ml-0.5 mr-2 h-4 w-4" />
                  Add Milestone
                </button>
              </div>

              {formData.milestones.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No milestones added yet.</p>
              ) : (
                <div className="space-y-3">
                  {formData.milestones.map((item) => (
                    <div key={item.id} className="bg-gray-50 p-3 rounded-md space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Milestone Name"
                            value={item.name}
                            onChange={(e) => updateMilestone(item.id, 'name', e.target.value)}
                            className="form-input"
                          />
                          <input
                            type="date"
                            value={item.dueDate}
                            onChange={(e) => updateMilestone(item.id, 'dueDate', e.target.value)}
                            className="form-input"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMilestone(item.id)}
                          className="ml-3 text-red-400 hover:text-red-600 p-1"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500">Percentage (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.percentOfContract}
                            onChange={(e) => updateMilestone(item.id, 'percentOfContract', parseFloat(e.target.value) || 0)}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Amount</label>
                          <input
                            type="number"
                            value={item.amount}
                            onChange={(e) => updateMilestone(item.id, 'amount', parseFloat(e.target.value) || 0)}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">Status</label>
                          <select
                            value={item.status}
                            onChange={(e) => updateMilestone(item.id, 'status', e.target.value)}
                            className="form-input"
                          >
                            {Object.values(MilestoneStatus).map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>

        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Saving...' : 'Save Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
