import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw,
  MoreHorizontal,
  ChevronDown,
  Clock
} from 'lucide-react';
import { 
  BillingDocument, 
  DocumentDirection, 
  DocumentStatus, 
  DocumentType 
} from '../types';

export default function BillingListPage() {
  const { billingDocuments, counterparties, projects, loading, settings } = useApp();
  const [activeTab, setActiveTab] = useState<'AR' | 'AP' | 'IC' | 'CreditNote' | 'Aging'>('AR');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'All'>('All');
  const [isNewDropdownOpen, setIsNewDropdownOpen] = useState(false);

  const getFilteredDocuments = () => {
    return billingDocuments.filter(doc => {
      // Tab Filter
      if (activeTab === 'CreditNote') {
        if (doc.type !== DocumentType.CreditNote) return false;
      } else {
        if (doc.type === DocumentType.CreditNote) return false;
        if (activeTab === 'AR' && doc.direction !== DocumentDirection.AR) return false;
        if (activeTab === 'AP' && doc.direction !== DocumentDirection.AP) return false;
        if (activeTab === 'IC' && doc.direction !== DocumentDirection.IC) return false;
      }

      // Search Filter
      const matchesSearch = 
        (doc.documentNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.counterpartyName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status Filter
      const matchesStatus = statusFilter === 'All' || doc.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  const filteredDocs = getFilteredDocuments();

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.Paid: return 'bg-green-100 text-green-800';
      case DocumentStatus.Sent: return 'bg-blue-100 text-blue-800';
      case DocumentStatus.Issued: return 'bg-blue-50 text-blue-600';
      case DocumentStatus.Overdue: return 'bg-red-100 text-red-800';
      case DocumentStatus.Draft: return 'bg-gray-100 text-gray-800';
      case DocumentStatus.PartiallyPaid: return 'bg-yellow-100 text-yellow-800';
      case DocumentStatus.Void: return 'bg-gray-200 text-gray-500 line-through';
      case DocumentStatus.PendingApproval: return 'bg-orange-100 text-orange-800';
      case DocumentStatus.Approved: return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const handleExportCSV = () => {
    // ... existing export logic ...
    const headers = ['Document Number', 'Type', 'Status', 'Date', 'Due Date', 'Counterparty', 'Total', 'Balance'];
    const rows = filteredDocs.map(doc => [
      doc.documentNumber || 'Draft',
      doc.type,
      doc.status,
      doc.date,
      doc.dueDate,
      doc.counterpartyName,
      doc.total,
      doc.balance
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `billing_export_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderAgingReport = () => {
    const arDocs = billingDocuments.filter(d => 
      d.direction === DocumentDirection.AR && 
      d.type === DocumentType.Invoice &&
      [DocumentStatus.Sent, DocumentStatus.Issued, DocumentStatus.Overdue, DocumentStatus.PartiallyPaid].includes(d.status)
    );

    const today = new Date();
    const buckets = {
      current: [] as BillingDocument[],
      days1_30: [] as BillingDocument[],
      days31_60: [] as BillingDocument[],
      days61_90: [] as BillingDocument[],
      days90plus: [] as BillingDocument[]
    };

    arDocs.forEach(doc => {
      const dueDate = new Date(doc.dueDate);
      const diffTime = today.getTime() - dueDate.getTime();
      const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (daysOverdue <= 0) buckets.current.push(doc);
      else if (daysOverdue <= 30) buckets.days1_30.push(doc);
      else if (daysOverdue <= 60) buckets.days31_60.push(doc);
      else if (daysOverdue <= 90) buckets.days61_90.push(doc);
      else buckets.days90plus.push(doc);
    });

    const renderBucket = (title: string, docs: BillingDocument[], colorClass: string) => {
      if (docs.length === 0) return null;
      const total = docs.reduce((sum, d) => sum + d.balance, 0);
      
      return (
        <div className="mb-8 last:mb-0" key={title}>
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-medium text-gray-900">{title}</h3>
             <div className="text-sm text-gray-500">
               <span className="font-bold text-gray-900">{docs.length}</span> invoices • Total: <span className="font-bold text-gray-900">{formatCurrency(total, docs[0]?.currency || 'USD')}</span>
             </div>
          </div>
          <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Counterparty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Overdue</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                </tr>
              </thead>
              <tbody className={`bg-white divide-y divide-gray-200 ${colorClass}`}>
                {docs.map(doc => {
                  const days = Math.floor((today.getTime() - new Date(doc.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={doc.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                        <Link to={`/billing/${doc.id}`}>{doc.documentNumber}</Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doc.counterpartyName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.dueDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{days > 0 ? days : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(doc.balance, doc.currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        {renderBucket('Current (Not Due)', buckets.current, '')}
        {renderBucket('1-30 Days Overdue', buckets.days1_30, 'bg-yellow-50')}
        {renderBucket('31-60 Days Overdue', buckets.days31_60, 'bg-orange-50')}
        {renderBucket('61-90 Days Overdue', buckets.days61_90, 'bg-orange-100')}
        {renderBucket('90+ Days Overdue', buckets.days90plus, 'bg-red-50')}
        
        {arDocs.length === 0 && (
          <div className="text-center py-12 text-gray-500">No outstanding AR invoices found.</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <div className="relative">
          <button
            onClick={() => setIsNewDropdownOpen(!isNewDropdownOpen)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            New Document
            <ChevronDown className="ml-2 h-4 w-4" />
          </button>
          
          {isNewDropdownOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <Link 
                  to="/billing/new?type=AR" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsNewDropdownOpen(false)}
                >
                  New AR Invoice
                </Link>
                <Link 
                  to="/billing/new?type=AP" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsNewDropdownOpen(false)}
                >
                  New AP Bill
                </Link>
                <Link 
                  to="/billing/new?type=IC" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsNewDropdownOpen(false)}
                >
                  New Inter-Company Invoice
                </Link>
                <Link 
                  to="/billing/new?type=CreditNote" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsNewDropdownOpen(false)}
                >
                  New Credit Note
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            {[
              { id: 'AR', name: 'AR Invoices', icon: ArrowUpRight },
              { id: 'AP', name: 'AP Bills', icon: ArrowDownRight },
              { id: 'IC', name: 'Inter-Company', icon: RefreshCw },
              { id: 'CreditNote', name: 'Credit Notes', icon: FileText },
              { id: 'Aging', name: 'Aging Report', icon: Clock },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center
                  ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                <tab.icon className={`mr-2 h-5 w-5 ${activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400'}`} />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="flex flex-1 gap-4 w-full">
            <div className="relative rounded-md shadow-sm max-w-xs w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto pb-2 lg:pb-0">
              {['All', 'Draft', 'Sent', 'Paid', 'Overdue'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as any)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap
                    ${statusFilter === status 
                      ? 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-500' 
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}
                  `}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            <Download className="-ml-0.5 mr-2 h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Table */}
        {activeTab === 'Aging' ? (
          renderAgingReport()
        ) : loading.billingDocuments ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
            <p className="mt-1 text-sm text-gray-500">Create a new document to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document #</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Counterparty</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocs.map((doc) => {
                  const project = projects.find(p => p.id === doc.projectId);
                  const isOverdue = doc.status === DocumentStatus.Overdue;
                  
                  return (
                    <tr key={doc.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/billing/${doc.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                          {doc.documentNumber || 'Draft'}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(doc.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.counterpartyName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                        {project?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {formatDate(doc.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                        {formatCurrency(doc.total, doc.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {formatCurrency(doc.balance, doc.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/billing/${doc.id}`} className="text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="h-5 w-5" />
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
    </div>
  );
}
