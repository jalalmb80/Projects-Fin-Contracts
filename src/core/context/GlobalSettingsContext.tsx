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

// ─── Unicode corruption detector ────────────────────────────────────────────
// If Firestore was seeded with literal \uXXXX escape sequences as text
// (i.e. the character \ followed by u and 4 hex digits) instead of
// the actual Unicode characters, we need to fix the stored data.
// This happens when another agent writes \u-escaped strings into JS string
// literals that then get JSON-serialised literally instead of decoded.
function isCorrupted(s: string): boolean {
  return /\\u[0-9a-fA-F]{4}/.test(s);
}

function fixEntity(e: PlatformEntity): PlatformEntity {
  const decode = (s: string): string => {
    if (!s || !isCorrupted(s)) return s;
    // Replace \uXXXX sequences with actual Unicode chars
    return s.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
  };
  return {
    ...e,
    name_ar:               decode(e.name_ar),
    name:                  decode(e.name),
    taxId:                 decode(e.taxId),
    cr_number:             decode(e.cr_number ?? ''),
    representative_name:   decode(e.representative_name ?? ''),
    representative_title:  decode(e.representative_title ?? ''),
    address:               decode(e.address),
    city:                  decode(e.city ?? ''),
    postal_code:           decode(e.postal_code ?? ''),
    po_box:                decode(e.po_box ?? ''),
    phone:                 decode(e.phone ?? ''),
    email:                 decode(e.email ?? ''),
    bank_name:             decode(e.bank_name ?? ''),
    bank_iban:             decode(e.bank_iban ?? ''),
    account_holder:        decode(e.account_holder ?? ''),
  };
}

function maybeFixSettings(s: GlobalSettings): { fixed: GlobalSettings; wasCorrupted: boolean } {
  const fixedEntities = s.entities.map(fixEntity);
  const wasCorrupted = JSON.stringify(fixedEntities) !== JSON.stringify(s.entities);
  return { fixed: { ...s, entities: fixedEntities }, wasCorrupted };
}
// ────────────────────────────────────────────────────────────────────────────

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
      .then(async snap => {
        if (snap.exists()) {
          const raw = snap.data() as GlobalSettings;
          const { fixed, wasCorrupted } = maybeFixSettings(raw);
          setGlobalSettings(fixed);
          // Auto-heal: if we detected corruption, overwrite the bad Firestore data
          if (wasCorrupted) {
            console.warn('[GlobalSettings] Detected corrupted \\uXXXX sequences — auto-fixing Firestore data...');
            await setDoc(doc(db, 'platform_settings', 'global'), fixed).catch(console.error);
            console.info('[GlobalSettings] Firestore data fixed successfully.');
          }
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
