import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useOffersContext } from '../context/OffersContext';
import { useSharedClients } from '../../../core/hooks/useSharedClients';
import { usePlatform } from '../../../core/context/PlatformContext';
import {
  Offer, OfferStatus, OfferLanguage, OfferCurrency, WorkflowLogEntry,
} from '../types';
import OfferCard from '../components/OfferCard';
import WorkflowBadge from '../components/WorkflowBadge';
import { generateOfferNumber } from '../utils/offerNumber';

const FILTER_STATUSES: Array<OfferStatus | 'all'> = [
  'all', 'draft', 'under_review', 'pending_approval',
  'approved', 'sent_to_client', 'won', 'lost', 'archived',
];

export default function OffersListPage() {
  const { offers, templates, loading, createOffer } = useOffersContext();
  const { clients: sharedClients } = useSharedClients();
  const { user } = usePlatform();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<OfferStatus | 'all'>('all');
  const [search,       setSearch]       = useState('');
  const [showModal,    setShowModal]    = useState(false);
  const [toast,        setToast]        = useState<string | null>(null);

  // New offer form state
  const [titleEn,    setTitleEn]    = useState('');
  const [titleAr,    setTitleAr]    = useState('');
  const [clientId,   setClientId]   = useState('');
  const [language,   setLanguage]   = useState<OfferLanguage>('en');
  const [currency,   setCurrency]   = useState<OfferCurrency>('SAR');
  const [expiryDate, setExpiryDate] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [creating,   setCreating]   = useState(false);

  const filtered = offers.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      o.offer_number.toLowerCase().includes(q) ||
      o.title_en.toLowerCase().includes(q) ||
      o.title_ar.includes(q) ||
      o.client_name.toLowerCase().includes(q)
    );
  });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleCreate() {
    if (!titleEn.trim() && !titleAr.trim()) return;
    if (!user) return;
    setCreating(true);
    try {
      const selectedTemplate = templates.find(t => t.id === templateId);
      const sections = selectedTemplate
        ? selectedTemplate.sections.map(s => ({
            id:         crypto.randomUUID(),
            type:       s.type,
            title_en:   s.title_en,
            title_ar:   s.title_ar,
            position:   s.position,
            is_fixed:   s.is_fixed,
            content:    s.default_content,
            is_visible: true,
          }))
        : [];

      const now       = new Date().toISOString();
      const offerId   = crypto.randomUUID();
      // generateOfferNumber is now async — uses runTransaction for atomicity
      const offerNumber = await generateOfferNumber();

      const initialEntry: WorkflowLogEntry = {
        id:                   crypto.randomUUID(),
        actor_name:           user.displayName ?? user.email ?? '',
        actor_email:          user.email ?? '',
        from_status:          null,
        to_status:            'draft',
        reason:               '',
        is_system_generated:  true,
        created_at:           now,
      };

      // Offer document — no notes or workflow_log fields (subcollections now)
      const offer: Omit<Offer, 'notes' | 'workflow_log'> = {
        id:                  offerId,
        offer_number:        offerNumber,
        title_en:            titleEn.trim(),
        title_ar:            titleAr.trim(),
        status:              'draft',
        language,
        client_id:           clientId,
        client_name:
          sharedClients.find(c => c.id === clientId)?.name_ar ||
          sharedClients.find(c => c.id === clientId)?.name_en ||
          clientId,
        assigned_to:         [user.uid],
        template_id:         templateId,
        template_version:    selectedTemplate?.version ?? 1,
        expiry_date:         expiryDate,
        currency,
        vat_rate:            15,
        global_discount_pct: 0,
        subtotal:            0,
        discount_amount:     0,
        vat_amount:          0,
        total_value:         0,
        sections,
        line_items:          [],
        tags:                [],
        created_by:          user.uid,
        created_at:          now,
        updated_at:          now,
      };

      await createOffer(offer as Offer, initialEntry);
      showToast(`Offer ${offerNumber} created`);
      setShowModal(false);
      resetForm();
      navigate(`/offers/builder/${offerId}`);
    } catch (err) {
      console.error('[OffersListPage] create failed:', err);
      showToast('Failed to create offer');
    } finally {
      setCreating(false);
    }
  }

  function resetForm() {
    setTitleEn(''); setTitleAr(''); setClientId('');
    setLanguage('en'); setCurrency('SAR'); setExpiryDate(''); setTemplateId('');
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Offers</h1>
          <p className="text-sm text-slate-500">{filtered.length} of {offers.length}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          <Plus size={14} /> New Offer
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search offers..."
            className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-200 w-52"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-violet-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-violet-300'
              }`}
            >
              {s === 'all' ? 'All' : (STATUS_LABELS[s as OfferStatus]?.en ?? s.replace(/_/g, ' '))}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-slate-400 text-sm">No offers found</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-3 text-sm text-violet-600 hover:underline"
          >
            Create your first offer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(o => <OfferCard key={o.id} offer={o} />)}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* Create offer modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">New Offer</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Title (EN)</label>
                <input
                  value={titleEn}
                  onChange={e => setTitleEn(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                  placeholder="Offer title"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1" dir="rtl">\u0627\u0644\u0639\u0646\u0648\u0627\u0646 (AR)</label>
                <input
                  value={titleAr}
                  onChange={e => setTitleAr(e.target.value)}
                  dir="rtl"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                  placeholder="\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0639\u0631\u0636"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Client</label>
              <select
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
              >
                <option value="">Select client (optional)</option>
                {sharedClients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name_ar || c.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Template</label>
              <select
                value={templateId}
                onChange={e => setTemplateId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
              >
                <option value="">Start blank</option>
                {templates.filter(t => t.status === 'active').map(t => (
                  <option key={t.id} value={t.id}>{t.name_en}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Language</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value as OfferLanguage)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                >
                  <option value="en">English</option>
                  <option value="ar">\u0639\u0631\u0628\u064a</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value as OfferCurrency)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                >
                  <option value="SAR">SAR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="AED">AED</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Expiry date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCreate}
                disabled={creating || (!titleEn.trim() && !titleAr.trim())}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating...' : 'Create Offer'}
              </button>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
