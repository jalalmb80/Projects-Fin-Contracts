import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Building2, User, Phone, Mail } from 'lucide-react';
import { Counterparty, CounterpartyType } from '../types';
import { useApp } from '../context/AppContext';
import CounterpartyForm from '../components/CounterpartyForm';

export default function Counterparties() {
  const { counterparties, addCounterparty, updateCounterparty, deleteCounterparty, loading } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSave = async (data: Omit<Counterparty, 'id' | 'createdAt'>) => {
    try {
      if (editingId) {
        await updateCounterparty(editingId, data);
      } else {
        await addCounterparty(data);
      }
      setIsModalOpen(false);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving counterparty:", error);
    }
  };

  const handleEdit = (counterparty: Counterparty) => {
    setEditingId(counterparty.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this counterparty?')) {
      try {
        await deleteCounterparty(id);
      } catch (error) {
        console.error("Error deleting counterparty:", error);
      }
    }
  };

  const filteredCounterparties = counterparties.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBadgeColor = (type: CounterpartyType) => {
    switch (type) {
      case CounterpartyType.CUSTOMER: return 'bg-green-100 text-green-800';
      case CounterpartyType.VENDOR: return 'bg-blue-100 text-blue-800';
      case CounterpartyType.BOTH: return 'bg-purple-100 text-purple-800';
      case CounterpartyType.INTERCOMPANY: return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Counterparties</h1>
        <button
          onClick={() => {
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          New Counterparty
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative rounded-md shadow-sm max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="form-input pl-10"
              placeholder="Search by name, email, or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading.counterparties ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-500">Loading counterparties...</p>
          </div>
        ) : filteredCounterparties.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No counterparties found.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredCounterparties.map((counterparty) => (
              <li key={counterparty.id} className="hover:bg-gray-50 transition-colors">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        <span className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                          {counterparty.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                        <div>
                          <p className="text-sm font-medium text-indigo-600 truncate">{counterparty.name}</p>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeColor(counterparty.type)}`}>
                              {counterparty.type}
                            </span>
                            <span className="ml-2 text-gray-400 text-xs">
                              {counterparty.currency} • {counterparty.paymentTermsDays} days
                            </span>
                          </div>
                        </div>
                        <div className="hidden md:block">
                          <div className="flex flex-col space-y-1 text-sm text-gray-500">
                            {counterparty.contactPerson && (
                              <div className="flex items-center">
                                <User className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                {counterparty.contactPerson}
                              </div>
                            )}
                            {counterparty.email && (
                              <div className="flex items-center">
                                <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                {counterparty.email}
                              </div>
                            )}
                            {counterparty.phone && (
                              <div className="flex items-center">
                                <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                {counterparty.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(counterparty)}
                        className="p-2 text-gray-400 hover:text-indigo-600"
                        title="Edit"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(counterparty.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isModalOpen && (
        <CounterpartyForm
          initialData={editingId ? counterparties.find(c => c.id === editingId) : undefined}
          onSave={handleSave}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}
