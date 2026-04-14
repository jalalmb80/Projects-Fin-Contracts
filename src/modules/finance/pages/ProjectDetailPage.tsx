import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  ProjectStatus, 
  MilestoneStatus, 
  DocumentDirection, 
  DocumentStatus,
  Milestone,
  BudgetCategory
} from '../types';
import { 
  Briefcase, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  Plus, 
  Edit2, 
  Trash2,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/Toast';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addToast } = useToast();
  const { 
    projects, 
    counterparties, 
    billingDocuments, 
    budgetCategories,
    completeMilestone,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    addBudgetCategory,
    updateBudgetCategory,
    deleteBudgetCategory,
    loading 
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'budget' | 'documents'>('overview');
  
  // Milestone State
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [milestoneForm, setMilestoneForm] = useState<Partial<Milestone>>({});
  const [isDeleteMilestoneDialogOpen, setIsDeleteMilestoneDialogOpen] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState<string | null>(null);
  const [completingMilestoneId, setCompletingMilestoneId] = useState<string | null>(null);

  // Budget State
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudgetCategory, setEditingBudgetCategory] = useState<BudgetCategory | null>(null);
  const [budgetForm, setBudgetForm] = useState<Partial<BudgetCategory>>({});
  const [isDeleteBudgetDialogOpen, setIsDeleteBudgetDialogOpen] = useState(false);
  const [budgetCategoryToDelete, setBudgetCategoryToDelete] = useState<string | null>(null);

  if (loading.projects) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const project = projects.find(p => p.id === id);

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Project not found</h2>
        <Link to="/finance/projects" className="mt-4 text-indigo-600 hover:text-indigo-500">
          Back to Projects
        </Link>
      </div>
    );
  }

  const client = counterparties.find(c => c.id === project.clientId);
  const projectDocs = billingDocuments.filter(d => d.projectId === project.id);
  const projectBudgetCategories = budgetCategories.filter(c => c.projectId === project.id);

  // Calculate Budget Metrics
  const totalBudget = projectBudgetCategories.reduce((sum, c) => sum + c.planned, 0);
  const totalSpent = projectBudgetCategories.reduce((sum, c) => sum + c.actual, 0);
  const budgetProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Calculate Milestone Metrics
  const completedMilestones = project.milestones.filter(m => m.status === MilestoneStatus.Completed || m.status === MilestoneStatus.Invoiced).length;
  const totalMilestones = project.milestones.length;
  const milestoneProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.Active: return 'bg-green-100 text-green-800';
      case ProjectStatus.Planned: return 'bg-blue-100 text-blue-800';
      case ProjectStatus.OnHold: return 'bg-yellow-100 text-yellow-800';
      case ProjectStatus.Completed: return 'bg-gray-100 text-gray-800';
      case ProjectStatus.Cancelled: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: project.baseCurrency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // --- Milestone Handlers ---

  const handleOpenMilestoneModal = (milestone?: Milestone) => {
    if (milestone) {
      setEditingMilestone(milestone);
      setMilestoneForm(milestone);
    } else {
      setEditingMilestone(null);
      setMilestoneForm({
        name: '',
        description: '',
        dueDate: '',
        percentOfContract: 0,
        amount: 0,
        status: MilestoneStatus.Pending
      });
    }
    setIsMilestoneModalOpen(true);
  };

  const handleSaveMilestone = async () => {
    if (!milestoneForm.name) return;

    // Validate total percentage if needed, but for now just save
    // Ideally we check if sum of percentages <= 100, but user said "validates", 
    // I'll add a simple check if it's a new milestone or editing percentage.
    const currentTotalPercent = project.milestones
      .filter(m => m.id !== editingMilestone?.id)
      .reduce((sum, m) => sum + m.percentOfContract, 0);
    
    if (currentTotalPercent + (milestoneForm.percentOfContract || 0) > 100) {
      addToast('error', 'Total milestone percentage cannot exceed 100%');
      return;
    }

    try {
      if (editingMilestone) {
        await updateMilestone(project.id, editingMilestone.id, milestoneForm);
      } else {
        await addMilestone(project.id, milestoneForm as Omit<Milestone, 'id' | 'projectId'>);
      }
      setIsMilestoneModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteMilestone = async () => {
    if (milestoneToDelete) {
      await deleteMilestone(project.id, milestoneToDelete);
      setIsDeleteMilestoneDialogOpen(false);
      setMilestoneToDelete(null);
    }
  };

  const handleCompleteMilestone = async (milestoneId: string) => {
    setCompletingMilestoneId(milestoneId);
    try {
      await completeMilestone(project.id, milestoneId);
    } catch (error) {
      console.error(error);
      addToast('error', 'Failed to complete milestone');
    } finally {
      setCompletingMilestoneId(null);
    }
  };

  const handleMilestonePercentChange = (percent: number) => {
    const amount = (percent / 100) * project.contractValue;
    setMilestoneForm(prev => ({ ...prev, percentOfContract: percent, amount }));
  };

  // --- Budget Handlers ---

  const handleOpenBudgetModal = (category?: BudgetCategory) => {
    if (category) {
      setEditingBudgetCategory(category);
      setBudgetForm(category);
    } else {
      setEditingBudgetCategory(null);
      setBudgetForm({
        name: '',
        planned: 0,
        actual: 0,
        notes: ''
      });
    }
    setIsBudgetModalOpen(true);
  };

  const handleSaveBudgetCategory = async () => {
    if (!budgetForm.name) return;

    try {
      if (editingBudgetCategory) {
        await updateBudgetCategory(editingBudgetCategory.id, budgetForm);
      } else {
        await addBudgetCategory({ ...budgetForm, projectId: project.id } as Omit<BudgetCategory, 'id'>);
      }
      setIsBudgetModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteBudgetCategory = async () => {
    if (budgetCategoryToDelete) {
      await deleteBudgetCategory(budgetCategoryToDelete);
      setIsDeleteBudgetDialogOpen(false);
      setBudgetCategoryToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start space-x-4">
            <Link to="/finance/projects" className="mt-1 text-gray-400 hover:text-gray-500">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Client: <span className="font-medium text-gray-900">{client?.name || 'Unknown'}</span> • 
                Contract: <span className="font-medium text-gray-900">{project.contractType}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Contract Value</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(project.contractValue)}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['Overview', 'Milestones', 'Budget', 'Documents'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase() as any)}
                className={`
                  whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.toLowerCase()
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Metrics Cards */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                    <DollarSign className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">Budget Consumed</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{Math.round(budgetProgress)}%</div>
                    </dd>
                  </div>
                </div>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${Math.min(budgetProgress, 100)}%` }}></div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">Milestones Completed</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{completedMilestones} / {totalMilestones}</div>
                    </dd>
                  </div>
                </div>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(milestoneProgress, 100)}%` }}></div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">Invoices Issued</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {projectDocs.filter(d => d.direction === DocumentDirection.AR && d.status !== DocumentStatus.Draft).length}
                      </div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* WBS Summary Table */}
            <div className="lg:col-span-3 bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Budget Breakdown (WBS)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Planned</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projectBudgetCategories.map((item) => {
                      const variance = item.planned - item.actual;
                      const percent = item.planned > 0 ? (item.actual / item.planned) * 100 : 0;
                      
                      return (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{formatCurrency(item.planned)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{formatCurrency(item.actual)}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(variance)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap align-middle">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${percent > 100 ? 'bg-red-600' : percent > 80 ? 'bg-yellow-500' : 'bg-green-600'}`} 
                                style={{ width: `${Math.min(percent, 100)}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {projectBudgetCategories.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          No budget categories defined. Go to the Budget tab to add items.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Milestones Tab */}
        {activeTab === 'milestones' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Project Milestones</h3>
              <button 
                onClick={() => handleOpenMilestoneModal()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
              >
                <Plus className="-ml-0.5 mr-2 h-4 w-4" />
                Add Milestone
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Contract</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {project.milestones.map((milestone) => (
                    <tr key={milestone.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{milestone.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {milestone.dueDate ? format(new Date(milestone.dueDate), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(milestone.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{milestone.percentOfContract}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${milestone.status === MilestoneStatus.Completed ? 'bg-green-100 text-green-800' : 
                            milestone.status === MilestoneStatus.Invoiced ? 'bg-purple-100 text-purple-800' : 
                            milestone.status === MilestoneStatus.InProgress ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'}`}>
                          {milestone.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center space-x-3">
                          {(milestone.status === MilestoneStatus.Pending || milestone.status === MilestoneStatus.InProgress) && (
                            <button 
                              onClick={() => handleCompleteMilestone(milestone.id)}
                              disabled={completingMilestoneId === milestone.id}
                              className="inline-flex items-center text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 disabled:opacity-50"
                            >
                              {completingMilestoneId === milestone.id ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              )}
                              Mark Complete
                            </button>
                          )}
                          
                          {milestone.status === MilestoneStatus.Invoiced && milestone.linkedInvoiceId && (
                            <Link 
                              to={`/finance/billing/${milestone.linkedInvoiceId}`}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="View Invoice"
                            >
                              <FileText className="h-4 w-4" />
                            </Link>
                          )}

                          <button 
                            onClick={() => handleOpenMilestoneModal(milestone)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          
                          <button 
                            onClick={() => {
                              setMilestoneToDelete(milestone.id);
                              setIsDeleteMilestoneDialogOpen(true);
                            }}
                            className="text-red-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {project.milestones.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No milestones found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Budget Tab */}
        {activeTab === 'budget' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Project Budget</h3>
              <button 
                onClick={() => handleOpenBudgetModal()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
              >
                <Plus className="-ml-0.5 mr-2 h-4 w-4" />
                Add Category
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Planned</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">% Used</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projectBudgetCategories.map((item) => {
                    const variance = item.planned - item.actual;
                    const percent = item.planned > 0 ? (item.actual / item.planned) * 100 : 0;
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          {item.notes && <div className="text-xs text-gray-500">{item.notes}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{formatCurrency(item.planned)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{formatCurrency(item.actual)}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(variance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap align-middle">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${percent >= 100 ? 'bg-red-600' : percent >= 80 ? 'bg-yellow-500' : 'bg-green-600'}`} 
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-center mt-1 text-gray-500">{Math.round(percent)}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={() => handleOpenBudgetModal(item)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setBudgetCategoryToDelete(item.id);
                                setIsDeleteBudgetDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Totals Row */}
                  {projectBudgetCategories.length > 0 && (
                    <tr className="bg-gray-50 font-medium">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Total</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(totalBudget)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(totalSpent)}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${totalBudget - totalSpent < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(totalBudget - totalSpent)}
                      </td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  )}
                  {projectBudgetCategories.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No budget categories found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Related Documents</h3>
            </div>
            {projectDocs.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No documents found for this project.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="relative px-6 py-3"><span className="sr-only">View</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projectDocs.map((doc) => (
                    <tr key={doc.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                        {doc.documentNumber || 'Draft'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.date ? format(new Date(doc.date), 'MMM d, yyyy') : '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${doc.status === DocumentStatus.Paid ? 'bg-green-100 text-green-800' : 
                            doc.status === DocumentStatus.Overdue ? 'bg-red-100 text-red-800' : 
                            'bg-gray-100 text-gray-800'}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(doc.total)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/finance/billing/${doc.id}`} className="text-indigo-600 hover:text-indigo-900">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Milestone Modal */}
      <Modal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        title={editingMilestone ? "Edit Milestone" : "Add Milestone"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              value={milestoneForm.name || ''}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={3}
              value={milestoneForm.description || ''}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date</label>
            <input
              type="date"
              required
              value={milestoneForm.dueDate || ''}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">% of Contract</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={milestoneForm.percentOfContract || 0}
                  onChange={(e) => handleMilestonePercentChange(parseFloat(e.target.value) || 0)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-8 sm:text-sm border-gray-300 rounded-md"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  value={milestoneForm.amount || 0}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, amount: parseFloat(e.target.value) || 0 })}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={milestoneForm.status || MilestoneStatus.Pending}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, status: e.target.value as MilestoneStatus })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {Object.values(MilestoneStatus).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="pt-4">
            <button
              onClick={handleSaveMilestone}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
            >
              Save Milestone
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteMilestoneDialogOpen}
        onClose={() => setIsDeleteMilestoneDialogOpen(false)}
        onConfirm={handleDeleteMilestone}
        title="Delete Milestone"
        message="Are you sure you want to delete this milestone?"
      />

      {/* Budget Modal */}
      <Modal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        title={editingBudgetCategory ? "Edit Budget Category" : "Add Budget Category"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category Name</label>
            <input
              type="text"
              required
              value={budgetForm.name || ''}
              onChange={(e) => setBudgetForm({ ...budgetForm, name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Planned Amount</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                value={budgetForm.planned || 0}
                onChange={(e) => setBudgetForm({ ...budgetForm, planned: parseFloat(e.target.value) || 0 })}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Actual Amount</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                min="0"
                value={budgetForm.actual || 0}
                onChange={(e) => setBudgetForm({ ...budgetForm, actual: parseFloat(e.target.value) || 0 })}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
            <textarea
              rows={3}
              value={budgetForm.notes || ''}
              onChange={(e) => setBudgetForm({ ...budgetForm, notes: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="pt-4">
            <button
              onClick={handleSaveBudgetCategory}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
            >
              Save Category
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteBudgetDialogOpen}
        onClose={() => setIsDeleteBudgetDialogOpen(false)}
        onConfirm={handleDeleteBudgetCategory}
        title="Delete Budget Category"
        message="Are you sure you want to delete this budget category?"
      />
    </div>
  );
}
