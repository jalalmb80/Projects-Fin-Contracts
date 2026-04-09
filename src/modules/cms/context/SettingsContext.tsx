import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../core/firebase';
import { AppSettings, PartyOneEntity } from '../types';
import { usePlatform } from '../../../core/context/PlatformContext';

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
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSettingsLoading(false);
      return;
    }
    getDoc(doc(db, 'cms_settings', 'entities'))
      .then(snap => {
        if (snap.exists()) {
          setSettingsState(snap.data() as AppSettings);
        }
      })
      .catch(err => console.error('[SettingsContext] load error:', err))
      .finally(() => setSettingsLoading(false));
  }, [user]);

  const setSettings = async (s: AppSettings) => {
    setSettingsState(s);
    await setDoc(doc(db, 'cms_settings', 'entities'), s);
  };

  const getDefaultEntity = (): PartyOneEntity =>
    settings.entities.find(e => e.is_default) || settings.entities[0] || DEFAULT_ENTITY;

  const getEntityById = (id: string): PartyOneEntity | undefined =>
    settings.entities.find(e => e.id === id);

  return (
    <SettingsContext.Provider value={{ settings, settingsLoading, setSettings, getDefaultEntity, getEntityById }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
