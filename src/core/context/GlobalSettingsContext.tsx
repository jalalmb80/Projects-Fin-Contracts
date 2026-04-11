import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { usePlatform } from './PlatformContext';
import {
  GlobalSettings,
  PlatformEntity,
  DEFAULT_GLOBAL_SETTINGS,
  DEFAULT_PLATFORM_ENTITY,
} from '../types/globalSettings';

interface GlobalSettingsContextType {
  globalSettings: GlobalSettings;
  globalSettingsLoading: boolean;
  updateGlobalSettings: (s: GlobalSettings) => Promise<void>;
  getDefaultEntity: () => PlatformEntity;
  getEntityById: (id: string) => PlatformEntity | undefined;
}

const GlobalSettingsContext = createContext<GlobalSettingsContextType>({
  globalSettings: DEFAULT_GLOBAL_SETTINGS,
  globalSettingsLoading: true,
  updateGlobalSettings: async () => {},
  getDefaultEntity: () => DEFAULT_PLATFORM_ENTITY,
  getEntityById: () => undefined,
});

export function GlobalSettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = usePlatform();
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(DEFAULT_GLOBAL_SETTINGS);
  const [globalSettingsLoading, setGlobalSettingsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setGlobalSettingsLoading(false);
      return;
    }
    getDoc(doc(db, 'platform_settings', 'global'))
      .then(snap => {
        if (snap.exists()) {
          setGlobalSettings(snap.data() as GlobalSettings);
        } else {
          // Seed defaults on first load
          setDoc(doc(db, 'platform_settings', 'global'), DEFAULT_GLOBAL_SETTINGS).catch(console.error);
        }
      })
      .catch(err => console.error('[GlobalSettingsContext] load error:', err))
      .finally(() => setGlobalSettingsLoading(false));
  }, [user]);

  const updateGlobalSettings = async (s: GlobalSettings) => {
    setGlobalSettings(s);
    await setDoc(doc(db, 'platform_settings', 'global'), s);
  };

  const getDefaultEntity = (): PlatformEntity =>
    globalSettings.entities.find(e => e.is_default) ||
    globalSettings.entities[0] ||
    DEFAULT_PLATFORM_ENTITY;

  const getEntityById = (id: string): PlatformEntity | undefined =>
    globalSettings.entities.find(e => e.id === id);

  return (
    <GlobalSettingsContext.Provider
      value={{ globalSettings, globalSettingsLoading, updateGlobalSettings, getDefaultEntity, getEntityById }}
    >
      {children}
    </GlobalSettingsContext.Provider>
  );
}

export const useGlobalSettings = () => useContext(GlobalSettingsContext);
