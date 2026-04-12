import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../core/firebase';
import { AppSettings, PartyOneEntity } from '../types';
import { usePlatform } from '../../../core/context/PlatformContext';
import { useGlobalSettings } from '../../../core/context/GlobalSettingsContext';

// Fallback entity used only before GlobalSettings loads
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
};

interface SettingsContextType {
  settings: AppSettings;
  settingsLoading: boolean;
  setSettings: (s: AppSettings) => Promise<void>;
  getDefaultEntity: () => PartyOneEntity;
  getEntityById: (id: string) => PartyOneEntity | undefined;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  settingsLoading: true,
  setSettings: async () => {},
  getDefaultEntity: () => DEFAULT_ENTITY,
  getEntityById: () => undefined,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = usePlatform();
  // Entities are sourced from GlobalSettings — the single source of truth since design
  // unification. logo_base64, colors, bank details all live in platform_settings/global.
  const { globalSettings, globalSettingsLoading } = useGlobalSettings();
  const [vatRate, setVatRate] = useState(15);
  const [cmsLoading, setCmsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCmsLoading(false);
      return;
    }
    // Load CMS-only config (VAT rate). Try new path first, fall back to legacy path.
    getDoc(doc(db, 'cms_settings', 'config'))
      .then(async snap => {
        if (snap.exists()) {
          setVatRate(snap.data().default_vat_rate ?? 15);
        } else {
          // Legacy backward-compat: old code stored full settings under 'entities' doc
          const legacySnap = await getDoc(doc(db, 'cms_settings', 'entities'));
          if (legacySnap.exists()) {
            setVatRate(legacySnap.data().default_vat_rate ?? 15);
          }
        }
      })
      .catch(err => console.error('[SettingsContext] load error:', err))
      .finally(() => setCmsLoading(false));
  }, [user]);

  // PlatformEntity is a superset of PartyOneEntity — safe structural cast.
  const entities = globalSettings.entities as unknown as PartyOneEntity[];

  const settings: AppSettings = {
    entities: entities.length > 0 ? entities : [DEFAULT_ENTITY],
    default_vat_rate: vatRate,
  };

  const setSettings = async (s: AppSettings) => {
    // Only persist CMS-specific settings (VAT rate).
    // Entity data is managed via Platform Settings → GlobalSettingsPage.
    setVatRate(s.default_vat_rate);
    await setDoc(doc(db, 'cms_settings', 'config'), { default_vat_rate: s.default_vat_rate });
  };

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
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
