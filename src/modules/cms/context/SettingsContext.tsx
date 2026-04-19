import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../core/firebase';
import {
  AppSettings,
  PartyOneEntity,
  ContractStatusConfig,
  DEFAULT_CONTRACT_STATUSES,
  DEFAULT_CONTRACT_TYPES,
  DEFAULT_WORKFLOW_ROLES,
} from '../types';
import { usePlatform } from '../../../core/context/PlatformContext';
import { useGlobalSettings } from '../../../core/context/GlobalSettingsContext';

const DEFAULT_ENTITY: PartyOneEntity = {
  id: 'e1',
  name_ar: 'شركة دراية الذكية للتقنية',
  cr_number: '2051235281',
  representative_name: 'براء المنجد',
  representative_title: 'المدير العام',
  address: 'طريق الظهران – حي القصور',
  city: 'الخبر',
  postal_code: '31952',
  po_box: '',
  phone: '0138655355',
  email: 'baraa@dirayaah.com',
  logo_base64: undefined,
  primary_color: '#059669',
  secondary_color: '#f0fdf4',
  accent_color: '#064e3b',
  bank_iban: 'SA865134841770007',
  bank_name: 'بنك البلاد',
  account_holder: 'شركة دراية الذكية لتقنية المعلومات',
  is_default: true,
};

const DEFAULT_SETTINGS: AppSettings = {
  entities: [DEFAULT_ENTITY],
  default_vat_rate: 15,
  contract_statuses: DEFAULT_CONTRACT_STATUSES,
  contract_types: DEFAULT_CONTRACT_TYPES,
  workflow_roles: DEFAULT_WORKFLOW_ROLES,
};

interface SettingsContextType {
  settings: AppSettings;
  settingsLoading: boolean;
  setSettings: (s: AppSettings) => Promise<void>;
  getDefaultEntity: () => PartyOneEntity;
  getEntityById: (id: string) => PartyOneEntity | undefined;
  // Contract config helpers
  contractStatuses: ContractStatusConfig[];
  contractTypes: string[];
  winStatuses: string[];
  loseStatuses: string[];
  updateContractStatuses: (statuses: ContractStatusConfig[]) => Promise<void>;
  updateContractTypes: (types: string[]) => Promise<void>;
  // Workflow
  workflowRoles: string[];
  updateWorkflowRoles: (roles: string[]) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  settingsLoading: true,
  setSettings: async () => {},
  getDefaultEntity: () => DEFAULT_ENTITY,
  getEntityById: () => undefined,
  contractStatuses: DEFAULT_CONTRACT_STATUSES,
  contractTypes: DEFAULT_CONTRACT_TYPES,
  winStatuses:  DEFAULT_CONTRACT_STATUSES.filter(s => s.is_win).map(s => s.label),
  loseStatuses: DEFAULT_CONTRACT_STATUSES.filter(s => s.is_lose).map(s => s.label),
  updateContractStatuses: async () => {},
  updateContractTypes: async () => {},
  workflowRoles: DEFAULT_WORKFLOW_ROLES,
  updateWorkflowRoles: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = usePlatform();
  const { globalSettings, globalSettingsLoading } = useGlobalSettings();
  const [vatRate, setVatRate] = useState(15);
  const [contractStatuses, setContractStatuses] = useState<ContractStatusConfig[]>(DEFAULT_CONTRACT_STATUSES);
  const [contractTypes, setContractTypes] = useState<string[]>(DEFAULT_CONTRACT_TYPES);
  const [workflowRoles, setWorkflowRoles] = useState<string[]>(DEFAULT_WORKFLOW_ROLES);
  const [cmsLoading, setCmsLoading] = useState(true);

  useEffect(() => {
    if (!user) { setCmsLoading(false); return; }

    getDoc(doc(db, 'cms_settings', 'config'))
      .then(async snap => {
        if (snap.exists()) {
          const data = snap.data();
          setVatRate(data.default_vat_rate ?? 15);

          if (Array.isArray(data.contract_statuses) && data.contract_statuses.length > 0) {
            setContractStatuses(
              data.contract_statuses.map((s: ContractStatusConfig) => ({
                ...s,
                is_lose: s.is_lose ?? false,
              }))
            );
          }

          if (Array.isArray(data.contract_types) && data.contract_types.length > 0)
            setContractTypes(data.contract_types);

          if (Array.isArray(data.workflow_roles) && data.workflow_roles.length > 0)
            setWorkflowRoles(data.workflow_roles);
        } else {
          const legacySnap = await getDoc(doc(db, 'cms_settings', 'entities'));
          if (legacySnap.exists()) setVatRate(legacySnap.data().default_vat_rate ?? 15);
        }
      })
      .catch(err => console.error('[SettingsContext] load error:', err))
      .finally(() => setCmsLoading(false));
  }, [user]);

  const persistConfig = async (patch: Record<string, unknown>) => {
    await setDoc(doc(db, 'cms_settings', 'config'), patch, { merge: true });
  };

  const entities = globalSettings.entities as unknown as PartyOneEntity[];

  const settings: AppSettings = {
    entities: entities.length > 0 ? entities : [DEFAULT_ENTITY],
    default_vat_rate: vatRate,
    contract_statuses: contractStatuses,
    contract_types: contractTypes,
    workflow_roles: workflowRoles,
  };

  const setSettings = async (s: AppSettings) => {
    setVatRate(s.default_vat_rate);
    await persistConfig({ default_vat_rate: s.default_vat_rate });
  };

  const updateContractStatuses = async (statuses: ContractStatusConfig[]) => {
    setContractStatuses(statuses);
    await persistConfig({ contract_statuses: statuses });
  };

  const updateContractTypes = async (types: string[]) => {
    setContractTypes(types);
    await persistConfig({ contract_types: types });
  };

  const updateWorkflowRoles = async (roles: string[]) => {
    setWorkflowRoles(roles);
    await persistConfig({ workflow_roles: roles });
  };

  const winStatuses  = contractStatuses.filter(s => s.is_win).map(s => s.label);
  const loseStatuses = contractStatuses.filter(s => s.is_lose).map(s => s.label);

  const getDefaultEntity = (): PartyOneEntity =>
    settings.entities.find(e => e.is_default) || settings.entities[0] || DEFAULT_ENTITY;

  const getEntityById = (id: string): PartyOneEntity | undefined =>
    settings.entities.find(e => e.id === id);

  return (
    <SettingsContext.Provider value={{
      settings,
      settingsLoading: globalSettingsLoading || cmsLoading,
      setSettings,
      getDefaultEntity,
      getEntityById,
      contractStatuses,
      contractTypes,
      winStatuses,
      loseStatuses,
      updateContractStatuses,
      updateContractTypes,
      workflowRoles,
      updateWorkflowRoles,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
