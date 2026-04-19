import React, { useState, useRef, useEffect } from 'react';
import { Contract, WorkflowEvent } from '../types';
import {
  Plus, Search, FileText, Edit2, Trash2, AlertCircle,
  Filter, MoreVertical, Eye, FileDown, RefreshCw, X,
} from 'lucide-react';
import { useLang, t } from '../context/LanguageContext';
import { useContracts } from '../hooks/useContracts';
import { useSettings } from '../context/SettingsContext';
import { exportContractToPdf } from '../utils/exportPdf';
import { ContractPreviewPortal } from './ContractPreviewPortal';
import WorkflowTransitionModal from './WorkflowTransitionModal';

interface Props {
  contracts: Contract[];
  clients: any[];
  onEdit: (id: string) => void;
  onCreate: () => void;
}

// ─── KebabMenu ───────────────────────────────────────────────────────────────
// The dropdown is rendered with position:fixed so it escapes overflow:hidden
// containers (table card wrapper, overflow-x-auto scroll wrapper).
interface KebabMenuProps {
  contract: Contract;
  onEdit: () => void;
  onPreview: () => void;
  onDownload: () => void;
  onChangeStatus: () => void;
  onDelete: () => void;
  isDownloading: boolean;
}

function KebabMenu({
  contract, onEdit, onPreview, onDownload, onChangeStatus, onDelete, isDownloading,
}: KebabMenuProps) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Position the fixed menu relative to the trigger button
  const openMenu = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        // align menu's right edge with button's right edge (RTL-friendly)
        right: window.innerWidth - rect.right,
        zIndex: 9999,
      });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    const kh = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', kh);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', kh);
    };
  }, [open]);

  const item = (icon: React.ReactNode, label: string, onClick: () => void, cls = '') => (
    <button
      onClick={() => { setOpen(false); onClick(); }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors text-right ${cls}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={openMenu}
        className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        title={t('المزيد من الإجراءات', 'More actions', lang)}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div
          ref={menuRef}
          className="w-52 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
          style={menuStyle}
        >
          {item(<Edit2 size={15} className="text-emerald-600" />, t('تعديل العقد', 'Edit Contract', lang), onEdit)}
          <div className="border-t border-gray-100" />
          {item(<Eye size={15} className="text-blue-600" />, t('معاينة العقد', 'Preview Contract', lang), onPreview)}
          {item(
            isDownloading
              ? <span className="w-[15px] h-[15px] border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin inline-block" />
              : <FileDown size={15} className="text-purple-600" />,
            isDownloading
              ? t('جارٍ التحميل...', 'Downloading...', lang)
              : t('تحميل PDF', 'Download PDF', lang),
            onDownload,
          )}
          <div className="border-t border-gray-100" />
          {item(
            <RefreshCw size={15} className="text-amber-600" />,
            t('تغيير الحالة', 'Change Status', lang),
            onChangeStatus,
          )}
          <div className="border-t border-gray-100" />
          {item(
            <Trash2 size={15} className="text-red-500" />,
            t('حذف العقد', 'Delete Contract', lang),
            onDelete,
            'text-red-600',
          )}
        </div>
      )}
    </div>
  );
}

// ─── ContractsList ────────────────────────────────────────────────────────────
export default function ContractsList({ contracts, clients, onEdit, onCreate }: Props) {
  const { lang } = useLang();
  const { deleteContract, addWorkflowEvent } = useContracts();
  const { contractStatuses } = useSettings();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [previewContract, setPreviewContract] = useState<Contract | null>(null);

  // Workflow transition modal
  const [pendingTransition, setPendingTransition] = useState<{
    contract: Contract;
    newStatus: string;
  } | null>(null);

  // Status picker — also rendered fixed to escape overflow clipping
  const [statusPicker, setStatusPicker] = useState<{
    contract: Contract;
    style: React.CSSProperties;
  } | null>(null);
  const statusPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!statusPicker) return;
    const handler = (e: MouseEvent) => {
      if (statusPickerRef.current && !statusPickerRef.current.contains(e.target as Node))
        setStatusPicker(null);
    };
    const kh = (e: KeyboardEvent) => { if (e.key === 'Escape') setStatusPicker(null); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', kh);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', kh);
    };
  }, [statusPicker]);

  const openStatusPicker = (contract: Contract, triggerEl: HTMLElement) => {
    const rect = triggerEl.getBoundingClientRect();
    setStatusPicker({
      contract,
      style: {
        position: 'fixed',
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
        zIndex: 9999,
      },
    });
  };

  const filteredContracts = contracts.filter((c: Contract) => {
    const matchesSearch = c.title_ar.includes(searchTerm) || c.contract_number?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const cfg = contractStatuses.find(s => s.label === status);
    if (!cfg) return 'bg-gray-100 text-gray-800';
    const colorMap: Record<string, string> = {
      gray: 'bg-gray-100 text-gray-800',
      yellow: 'bg-amber-100 text-amber-800',
      blue: 'bg-blue-100 text-blue-800',
      emerald: 'bg-emerald-100 text-emerald-800',
      green: 'bg-green-100 text-green-800',
      teal: 'bg-teal-100 text-teal-800',
      orange: 'bg-orange-100 text-orange-800',
      red: 'bg-red-100 text-red-800',
      purple: 'bg-purple-100 text-purple-800',
    };
    return colorMap[cfg.color ?? 'gray'] ?? 'bg-gray-100 text-gray-800';
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    await deleteContract(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  const getClientName = (clientId: string) => {
    const client = clients.find((c: any) => c.id === clientId);
    return client ? (client.name_ar || client.nameAr || client.name || '—') : '—';
  };

  const handleDownload = async (contract: Contract) => {
    setDownloadingId(contract.id);
    setPreviewContract({ ...contract, _downloadMode: true } as any);
  };

  const handlePreviewReady = async (contract: Contract, mode: 'download' | 'preview') => {
    if (mode === 'download') {
      const san = (n: string) => n.replace(/[\/\\?%*:|"<>]/g, '-').trim();
      try {
        await exportContractToPdf('contract-preview-list', {
          filename: san(`${contract.contract_number}-${contract.title_ar}.pdf`),
        });
      } catch (e) {
        console.error('[ContractsList] PDF export failed:', e);
      } finally {
        setDownloadingId(null);
        setPreviewContract(null);
      }
    }
  };

  const handleStatusPickerSelect = (contract: Contract, newStatus: string) => {
    setStatusPicker(null);
    if (newStatus === contract.status) return;
    setPendingTransition({ contract, newStatus });
  };

  const handleTransitionConfirm = async (event: WorkflowEvent) => {
    if (!pendingTransition) return;
    await addWorkflowEvent(pendingTransition.contract.id, event, pendingTransition.newStatus);
    setPendingTransition(null);
  };

  const confirmTarget = confirmDeleteId
    ? contracts.find((c: Contract) => c.id === confirmDeleteId)
    : null;

  const badgeColorMap: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700 ring-gray-300',
    yellow: 'bg-amber-100 text-amber-800 ring-amber-300',
    blue: 'bg-blue-100 text-blue-800 ring-blue-300',
    emerald: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
    green: 'bg-green-100 text-green-800 ring-green-300',
    teal: 'bg-teal-100 text-teal-800 ring-teal-300',
    orange: 'bg-orange-100 text-orange-800 ring-orange-300',
    red: 'bg-red-100 text-red-800 ring-red-300',
    purple: 'bg-purple-100 text-purple-800 ring-purple-300',
  };

  return (
    <div className="space-y-6 p-6">
      {/* ── Delete confirm banner ── */}
      {confirmDeleteId && (
        <div className="flex items-center gap-4 bg-red-50 border border-red-200 rounded-lg px-5 py-4 text-sm text-red-800">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span className="flex-1">
            {t('هل تريد حذف العقد', 'Delete contract', lang)}{' '}
            <strong>{confirmTarget?.contract_number}</strong>{' — '}{confirmTarget?.title_ar}
            {t('؟ لا يمكن التراجع.', '? This cannot be undone.', lang)}
          </span>
          <button onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg font-medium">
            {t('حذف', 'Delete', lang)}
          </button>
          <button onClick={() => setConfirmDeleteId(null)} className="text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg font-medium">
            {t('إلغاء', 'Cancel', lang)}
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('إدارة العقود', 'Contract Management', lang)}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('إدارة وتتبع جميع العقود', 'Manage and track all contracts', lang)}</p>
        </div>
        <button onClick={onCreate} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
          <Plus className="mr-2 h-4 w-4" />
          {t('عقد جديد', 'New Contract', lang)}
        </button>
      </div>

      {/* ── Table card ──
           NOTE: overflow-hidden removed — it was clipping the fixed-positioned
           KebabMenu dropdown and status picker when few rows were visible.
           Border-radius is preserved via rounded-lg on the wrapper. */}
      <div className="bg-white shadow rounded-lg">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text" dir="rtl"
              placeholder={t('بحث برقم العقد أو العنوان...', 'Search by contract number or title...', lang)}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="block w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="block border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              <option value="all">{t('جميع الحالات', 'All Statuses', lang)}</option>
              {contractStatuses.map(s => (
                <option key={s.id} value={s.label}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Empty state */}
        {filteredContracts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-sm font-medium text-gray-900">{t('لا توجد عقود', 'No contracts found', lang)}</h3>
            <p className="mt-1 text-sm">{t('أنشئ عقدًا جديدًا للبدء', 'Create a new contract to get started', lang)}</p>
          </div>
        ) : (
          // overflow-x-auto kept for horizontal scroll on narrow viewports,
          // but dropdowns escape it via position:fixed.
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    t('رقم العقد', 'Contract No.', lang),
                    t('العنوان', 'Title', lang),
                    t('العميل', 'Client', lang),
                    t('الحالة', 'Status', lang),
                    t('تاريخ البدء', 'Start Date', lang),
                    t('إجراءات', 'Actions', lang),
                  ].map((h, i) => (
                    <th key={i} scope="col" className={`px-6 py-3 ${i === 5 ? 'text-center' : 'text-right'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContracts.map((c: Contract) => (
                  <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${confirmDeleteId === c.id ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">{c.contract_number || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.title_ar}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getClientName(c.client_id)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.start_date || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEdit(c.id)}
                          className="p-1.5 rounded-md text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                          title={t('تعديل', 'Edit', lang)}
                        >
                          <Edit2 size={15} />
                        </button>

                        <KebabMenu
                          contract={c}
                          onEdit={() => onEdit(c.id)}
                          onPreview={() => setPreviewContract(c)}
                          onDownload={() => handleDownload(c)}
                          onChangeStatus={() => {
                            // We need the trigger element to position the picker;
                            // KebabMenu already closed itself, so we open the picker
                            // via a small timeout to let the DOM settle.
                            setTimeout(() => {
                              const btn = document.querySelector(
                                `[data-status-btn="${c.id}"]`
                              ) as HTMLElement | null;
                              if (btn) openStatusPicker(c, btn);
                            }, 0);
                          }}
                          onDelete={() => setConfirmDeleteId(confirmDeleteId === c.id ? null : c.id)}
                          isDownloading={downloadingId === c.id}
                        />

                        {/* Hidden anchor element used to position the status picker */}
                        <span data-status-btn={c.id} className="sr-only" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Status picker (fixed, escapes overflow clipping) ── */}
      {statusPicker && (
        <div
          ref={statusPickerRef}
          className="w-56 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
          style={statusPicker.style}
        >
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t('اختر الحالة الجديدة', 'Select new status', lang)}
            </span>
            <button onClick={() => setStatusPicker(null)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
          <div className="py-1 max-h-64 overflow-y-auto">
            {contractStatuses.map((s) => {
              const isCurrent = s.label === statusPicker.contract.status;
              const badgeCls = badgeColorMap[s.color ?? 'gray'] ?? badgeColorMap.gray;
              return (
                <button
                  key={s.id}
                  disabled={isCurrent}
                  onClick={() => handleStatusPickerSelect(statusPicker.contract, s.label)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-right transition-colors ${
                    isCurrent ? 'bg-gray-50 cursor-default' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${badgeCls}`}>
                    {s.label}{s.is_win ? ' 🏆' : ''}
                  </span>
                  {isCurrent && (
                    <span className="mr-auto text-xs text-gray-400">{t('الحالية', 'current', lang)}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Workflow transition modal ── */}
      {pendingTransition && (
        <WorkflowTransitionModal
          contractId={pendingTransition.contract.id}
          fromStatus={pendingTransition.contract.status}
          toStatus={pendingTransition.newStatus}
          onConfirm={handleTransitionConfirm}
          onCancel={() => setPendingTransition(null)}
        />
      )}

      {/* ── Preview / download modal ── */}
      {previewContract && (
        <ContractPreviewPortal
          contract={previewContract}
          clients={clients}
          downloadMode={(previewContract as any)._downloadMode === true}
          onClose={() => { setPreviewContract(null); setDownloadingId(null); }}
          onReady={(mode) => handlePreviewReady(previewContract, mode)}
        />
      )}
    </div>
  );
}
